import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTtsUsageLog } from "@/lib/server/serializers";

const maxVoiceTextLength = Number(process.env.TTS_MAX_TEXT_CHARS ?? 600);

type TtsProvider = "openai" | "elevenlabs" | "azure";
type TtsResult = {
  audio: Buffer;
  provider: TtsProvider;
  model: string;
  voice: string;
};

export async function POST(request: Request) {
  let text = "";
  let operatorId: string | null = null;
  let memberId: string | null = null;
  try {
    const body = await request.json();
    text = String(body.text ?? "").trim();
    operatorId = String(body.operatorId ?? "") || null;
    memberId = String(body.memberId ?? "") || null;

    if (!text) {
      return NextResponse.json({ error: "Ses oluşturmak için metin yazın." }, { status: 400 });
    }
    if (text.length > maxVoiceTextLength) {
      throw new Error(`Sesli yanıt metni ${maxVoiceTextLength} karakteri geçmemeli.`);
    }
    const durationSeconds = estimateAudioDurationSeconds(text);
    const maxDurationSeconds = Number(process.env.TTS_MAX_AUDIO_SECONDS ?? 120);
    if (Number.isFinite(maxDurationSeconds) && durationSeconds > maxDurationSeconds) {
      throw new Error(`Tahmini ses süresi ${maxDurationSeconds} saniye limitini geçiyor.`);
    }

    await enforceLimits(operatorId);

    const result = await synthesizeSpeech(text);
    const fileName = `voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`;
    const publicDir = path.join(process.cwd(), "public", "generated-audio");
    await mkdir(publicDir, { recursive: true });
    await writeFile(path.join(publicDir, fileName), result.audio);

    const audioUrl = `/generated-audio/${fileName}`;
    const estimatedCostUsd = estimateCostUsd(result.provider, text.length);

    const log = await prisma.ttsUsageLog.create({
      data: {
        operatorId,
        memberId,
        messageText: text,
        characterCount: text.length,
        estimatedTokenCount: estimateTokenCount(text),
        audioDurationSeconds: durationSeconds,
        provider: result.provider,
        model: result.model,
        voice: result.voice,
        audioFileUrl: audioUrl,
        audioFileSizeBytes: result.audio.byteLength,
        fileSizeBytes: result.audio.byteLength,
        status: "created",
        estimatedCostUsd
      }
    });

    if (memberId) {
      await prisma.timelineEvent.create({
        data: {
          memberId,
          operatorId,
          eventType: "VOICE_CREATED",
          eventTitle: "Ses oluşturuldu",
          eventDescription: text.slice(0, 240),
          referenceType: "tts_usage_log",
          referenceId: log.id
        }
      });
    }

    return NextResponse.json({
      audioUrl,
      provider: result.provider,
      model: result.model,
      voice: result.voice,
      text,
      usageLog: serializeTtsUsageLog(log)
    });
  } catch (error) {
    if (text) {
      await logFailedTts(text, operatorId, memberId, error instanceof Error ? error.message : "Ses oluşturulamadı.").catch(() => undefined);
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ses oluşturulamadı." }, { status: 500 });
  }
}

async function enforceLimits(operatorId: string | null) {
  const globalLimit = Number(process.env.TTS_DAILY_GLOBAL_LIMIT ?? 1000);
  const todayStart = startOfLocalDay();
  const totalToday = await prisma.ttsUsageLog.count({
    where: { createdAt: { gte: todayStart }, status: { not: "failed" } }
  });

  if (Number.isFinite(globalLimit) && globalLimit >= 0 && totalToday >= globalLimit) {
    throw new Error(`Günlük toplam TTS limiti doldu. Limit: ${globalLimit}.`);
  }

  if (!operatorId) return;

  const operator = await prisma.user.findUnique({ where: { id: operatorId }, select: { ttsDailyLimit: true } });
  const limit = operator?.ttsDailyLimit ?? Number(process.env.TTS_OPERATOR_DAILY_LIMIT ?? 50);
  const todayCount = await prisma.ttsUsageLog.count({
    where: {
      operatorId,
      createdAt: { gte: todayStart },
      status: { not: "failed" }
    }
  });

  if (todayCount >= limit) {
    throw new Error(`Günlük ses oluşturma limitiniz doldu. Limit: ${limit}. Admin limiti artırabilir.`);
  }
}

async function logFailedTts(text: string, operatorId: string | null, memberId: string | null, errorMessage: string) {
  const log = await prisma.ttsUsageLog.create({
    data: {
      operatorId,
      memberId,
      messageText: text,
      characterCount: text.length,
      estimatedTokenCount: estimateTokenCount(text),
      audioDurationSeconds: 0,
      provider: selectedProviderName(),
      model: selectedProviderModel(),
      voice: selectedProviderVoice(),
      audioFileUrl: "",
      audioFileSizeBytes: 0,
      fileSizeBytes: 0,
      status: "failed",
      estimatedCostUsd: 0,
      errorMessage
    }
  });
  if (memberId) {
    await prisma.timelineEvent.create({
      data: {
        memberId,
        operatorId,
        eventType: "VOICE_FAILED",
        eventTitle: "Ses gönderimi başarısız oldu",
        eventDescription: errorMessage,
        referenceType: "tts_usage_log",
        referenceId: log.id
      }
    });
  }
}

async function synthesizeSpeech(text: string): Promise<TtsResult> {
  if (process.env.OPENAI_API_KEY) return openAiTts(text);
  if (process.env.ELEVENLABS_API_KEY) return elevenLabsTts(text);
  if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) return azureTts(text);
  throw new Error("Gerçek TTS sağlayıcısı ayarlı değil. OPENAI_API_KEY, ELEVENLABS_API_KEY veya AZURE_SPEECH_KEY/AZURE_SPEECH_REGION tanımlayın.");
}

async function openAiTts(text: string): Promise<TtsResult> {
  const model = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
  const voice = process.env.OPENAI_TTS_VOICE ?? "coral";
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      response_format: "mp3",
      instructions: "Türkçe konuş. Doğal, samimi, kadın müşteri temsilcisi tonunda oku. Noktalama işaretlerinde kısa ve doğal duraklamalar yap."
    })
  });

  if (!response.ok) throw new Error(await providerError("OpenAI TTS", response));
  return { audio: Buffer.from(await response.arrayBuffer()), provider: "openai", model, voice };
}

async function elevenLabsTts(text: string): Promise<TtsResult> {
  const voice = process.env.ELEVENLABS_VOICE_ID;
  if (!voice) throw new Error("ElevenLabs için ELEVENLABS_VOICE_ID tanımlanmalı.");
  const model = process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
      "Content-Type": "application/json",
      Accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true }
    })
  });

  if (!response.ok) throw new Error(await providerError("ElevenLabs TTS", response));
  return { audio: Buffer.from(await response.arrayBuffer()), provider: "elevenlabs", model, voice };
}

async function azureTts(text: string): Promise<TtsResult> {
  const region = process.env.AZURE_SPEECH_REGION;
  const voice = process.env.AZURE_SPEECH_VOICE ?? "tr-TR-EmelNeural";
  const model = "azure-speech";
  const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY ?? "",
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "wp-crm-tts"
    },
    body: [
      '<speak version="1.0" xml:lang="tr-TR">',
      `<voice xml:lang="tr-TR" name="${escapeXml(voice)}">`,
      `<prosody rate="0%" pitch="0%">${escapeXml(text)}</prosody>`,
      "</voice>",
      "</speak>"
    ].join("")
  });

  if (!response.ok) throw new Error(await providerError("Azure Speech", response));
  return { audio: Buffer.from(await response.arrayBuffer()), provider: "azure", model, voice };
}

async function providerError(name: string, response: Response) {
  const detail = await response.text().catch(() => "");
  return `${name} ses oluşturamadı. (${response.status}) ${detail.slice(0, 300)}`;
}

function estimateTokenCount(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function estimateAudioDurationSeconds(text: string) {
  return Math.max(1, Math.round((text.length / 13) * 10) / 10);
}

function estimateCostUsd(provider: TtsProvider, characterCount: number) {
  const perThousandChars = provider === "openai" ? 0.015 : provider === "elevenlabs" ? 0.03 : 0.016;
  return Number(((characterCount / 1000) * perThousandChars).toFixed(6));
}

function selectedProviderName(): TtsProvider {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) return "azure";
  return "openai";
}

function selectedProviderModel() {
  const provider = selectedProviderName();
  if (provider === "openai") return process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
  if (provider === "elevenlabs") return process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";
  return "azure-speech";
}

function selectedProviderVoice() {
  const provider = selectedProviderName();
  if (provider === "openai") return process.env.OPENAI_TTS_VOICE ?? "coral";
  if (provider === "elevenlabs") return process.env.ELEVENLABS_VOICE_ID ?? "";
  return process.env.AZURE_SPEECH_VOICE ?? "tr-TR-EmelNeural";
}

function startOfLocalDay() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
