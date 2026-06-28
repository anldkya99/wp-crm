import { NextResponse } from "next/server";
import { connectionEngine } from "@/lib/connection-engine/engine";
import { prisma } from "@/lib/prisma";
import { serializeConversation, serializeMessage } from "@/lib/server/serializers";

export async function POST(request: Request) {
  const body = await request.json();
  const conversationId = String(body.conversationId ?? "");
  const contactId = String(body.contactId ?? "");
  const messageText = String(body.messageText ?? "").trim();
  const createdBy = String(body.createdBy ?? "") || null;
  const canOverrideOwnership = isOwnershipAdmin(body.operatorRole);
  const incoming = Boolean(body.incoming);
  const requestedLineId = String(body.lineId ?? "");
  const guidance = body.guidance && typeof body.guidance === "object" ? body.guidance as Record<string, unknown> : null;

  if ((!conversationId && !contactId) || !messageText) {
    return NextResponse.json({ error: "Konuşma veya kişi ve mesaj metni zorunlu." }, { status: 400 });
  }

  const activeLine = incoming
    ? null
    : requestedLineId
      ? await prisma.communicationLine.findUnique({ where: { id: requestedLineId } })
      : await prisma.communicationLine.findFirst({ where: { isDefault: true } });

  if (!incoming && (!activeLine || !canSendWithLine(activeLine.status))) {
    return NextResponse.json({ error: activeLine ? "Aktif operasyon hattı gönderime uygun değil. Yeni aktif hat seçin." : "Aktif operasyon hattı yok. Mesaj göndermek için önce hat seçin." }, { status: 400 });
  }

  let targetPhone = "";
  let queuedSendId: string | null = null;
  let providerMessageId: string | null = null;

  if (!incoming) {
    const targetConversation = conversationId ? await prisma.conversation.findUnique({ where: { id: conversationId } }) : null;
    const targetContactId = targetConversation?.contactId ?? contactId;
    const contact = targetContactId ? await prisma.contact.findUnique({ where: { id: targetContactId } }) : null;
    if (!canOverrideOwnership && contact?.ownershipStatus === "blocked") {
      return NextResponse.json({ error: "Bu müşteri blokeli. İletişim için admin izni gerekir." }, { status: 403 });
    }
    if (!canOverrideOwnership && contact?.ownerOperatorId && createdBy && contact.ownerOperatorId !== createdBy) {
      return NextResponse.json({ error: "Bu müşteri farklı bir operatöre ait. Devam etmek için admininizden iletişim izni alın." }, { status: 403 });
    }
    targetPhone = contact?.phone ?? "";
  }

  if (!incoming && activeLine) {
    const queued = await prisma.messageSendQueue.create({
      data: {
        lineId: activeLine.id,
        providerType: activeLine.providerType,
        recipientPhone: targetPhone,
        messageText,
        status: "sending",
        attemptCount: 1
      }
    });
    queuedSendId = queued.id;
    try {
      const sendResult = await connectionEngine.sendMessage({ line: activeLine, recipient: targetPhone, messageText });
      providerMessageId = sendResult.providerMessageId;
      await prisma.messageSendQueue.update({
        where: { id: queuedSendId },
        data: { status: "sent", providerMessageId, sentAt: new Date(), lastError: null }
      });
    } catch (error) {
      await prisma.messageSendQueue.update({
        where: { id: queuedSendId },
        data: { status: "failed", lastError: error instanceof Error ? error.message : "Provider gönderimi tamamlanamadı." }
      });
      return NextResponse.json({ error: error instanceof Error ? error.message : "Provider gönderimi tamamlanamadı." }, { status: 502 });
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const conversation = conversationId
      ? await tx.conversation.findUniqueOrThrow({ where: { id: conversationId } })
      : await tx.conversation.create({
          data: {
            contactId,
            lineId: incoming ? null : activeLine?.id ?? null,
            assignedOperatorId: incoming ? null : createdBy,
            status: "NEW",
            lastMessageAt: new Date()
          }
        });

    const message = await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderType: incoming ? "CUSTOMER" : "OPERATOR",
        lineId: incoming ? null : activeLine?.id ?? null,
        providerType: incoming ? null : activeLine?.providerType ?? null,
        providerMessageId,
        messageText,
        status: incoming ? "DELIVERED" : "SENT",
        createdBy: incoming ? null : createdBy
      }
    });

    if (queuedSendId) {
      await tx.messageSendQueue.update({
        where: { id: queuedSendId },
        data: { messageId: message.id }
      });
    }

    const updatedConversation = await tx.conversation.update({
      where: { id: conversation.id },
      data: {
        lineId: conversation.lineId ?? (incoming ? undefined : activeLine?.id ?? undefined),
        status: incoming ? "NEW" : "ANSWERED",
        lastMessageAt: message.createdAt,
        assignedOperatorId: incoming ? undefined : createdBy
      },
      include: { messages: { select: { senderType: true, status: true } } }
    });

    await tx.contact.update({
      where: { id: conversation.contactId },
      data: { lastContactAt: message.createdAt }
    });

    const voiceUsageLogId = parseVoiceUsageLogId(messageText);
    if (!incoming && voiceUsageLogId) {
      await tx.ttsUsageLog.update({
        where: { id: voiceUsageLogId },
        data: {
          status: "sent",
          messageId: message.id,
          sentAt: message.createdAt
        }
      });
    }

    if (!incoming && activeLine) {
      await tx.communicationLine.update({
        where: { id: activeLine.id },
        data: { lastMessageAt: message.createdAt }
      });
    }

    await tx.communicationEvent.create({
      data: {
        lineId: incoming ? null : activeLine?.id ?? null,
        providerType: incoming ? "manual" : activeLine?.providerType ?? "manual",
        eventType: incoming ? "incoming_message" : "outgoing_message",
        providerMessageId,
        payloadJson: JSON.stringify({ messageId: message.id, conversationId: conversation.id }),
        status: "processed",
        processedAt: message.createdAt
      }
    });

    await tx.timelineEvent.create({
      data: {
        memberId: conversation.contactId,
        operatorId: incoming ? null : createdBy,
        eventType: incoming ? "MESSAGE_RECEIVED" : voiceUsageLogId ? "VOICE_SENT" : "MESSAGE_SENT",
        eventTitle: incoming ? "Mesaj alındı" : voiceUsageLogId ? "Sesli mesaj gönderildi" : "Mesaj gönderildi",
        eventDescription: voiceUsageLogId ? "Sesli yanıt üyeye gönderildi." : messageText.slice(0, 240),
        referenceType: voiceUsageLogId ? "tts_usage_log" : "message",
        referenceId: voiceUsageLogId || message.id,
        createdAt: message.createdAt
      }
    });

    if (!incoming && activeLine) {
      await tx.timelineEvent.create({
        data: {
          memberId: conversation.contactId,
          operatorId: createdBy,
          eventType: "MESSAGE_LINE_USED",
          eventTitle: "Mesaj aktif hat üzerinden gönderildi",
          eventDescription: `Hat: ${activeLine.name}`,
          referenceType: "communication_line",
          referenceId: activeLine.id,
          createdAt: message.createdAt
        }
      });
    }

    if (!incoming && guidance) {
      await tx.timelineEvent.create({
        data: {
          memberId: conversation.contactId,
          operatorId: createdBy,
          eventType: "GUIDANCE_MESSAGE_SENT",
          eventTitle: "Önerilen mesaj gönderildi",
          eventDescription: messageText.slice(0, 240),
          referenceType: String(guidance.referenceType ?? "message"),
          referenceId: String(guidance.referenceId ?? message.id),
          createdAt: message.createdAt
        }
      });
    }

    return { message, conversation: updatedConversation };
  });

  return NextResponse.json({
    message: serializeMessage(result.message),
    conversation: serializeConversation(result.conversation)
  });
}

function canSendWithLine(status: string) {
  return status === "active" || status === "connected";
}

function parseVoiceUsageLogId(messageText: string) {
  if (!messageText.startsWith("[VOICE]")) return "";
  try {
    const payload = JSON.parse(messageText.slice("[VOICE]".length)) as { usageLogId?: string };
    return payload.usageLogId ?? "";
  } catch {
    return "";
  }
}

function isOwnershipAdmin(value: unknown) {
  const role = String(value ?? "");
  return role === "Admin" || role === "COO";
}
