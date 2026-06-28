import path from "path";
import type { ConnectionActionResult, ConnectionLine, ConnectionProviderType, ProviderAdapter, SendMessageInput, SendMessageResult } from "@/lib/connection-engine/types";

class ManualAdapter implements ProviderAdapter {
  providerType: ConnectionProviderType = "manual";
  capabilities = ["send_message"] as ProviderAdapter["capabilities"];

  async requestQr(line: ConnectionLine): Promise<ConnectionActionResult> {
    return { lineId: line.id, providerType: "manual", status: "connected", qr: null, message: "Manual provider QR gerektirmez." };
  }

  async start(line: ConnectionLine): Promise<ConnectionActionResult> {
    return { lineId: line.id, providerType: "manual", status: "connected", qr: null, message: "Manual provider sistem içi gönderim için hazır." };
  }

  async stop(line: ConnectionLine): Promise<ConnectionActionResult> {
    return { lineId: line.id, providerType: "manual", status: "disconnected", qr: null, message: "Manual provider session kapatıldı." };
  }

  async reconnect(line: ConnectionLine): Promise<ConnectionActionResult> {
    return this.start(line);
  }

  async healthCheck(line: ConnectionLine): Promise<ConnectionActionResult> {
    return { lineId: line.id, providerType: "manual", status: "connected", qr: null, message: "Manual provider sağlıklı." };
  }

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    return { providerMessageId: `manual-${input.line.id}-${Date.now()}` };
  }
}

class MissingAdapter implements ProviderAdapter {
  constructor(public providerType: ConnectionProviderType) {}
  capabilities = [] as ProviderAdapter["capabilities"];

  async requestQr(line: ConnectionLine): Promise<ConnectionActionResult> {
    return this.unavailable(line, "qr_requested");
  }

  async start(line: ConnectionLine): Promise<ConnectionActionResult> {
    return this.unavailable(line, "disconnected");
  }

  async stop(line: ConnectionLine): Promise<ConnectionActionResult> {
    return { lineId: line.id, providerType: this.providerType, status: "disconnected", qr: null, message: `${this.providerType} provider session kapatıldı.` };
  }

  async reconnect(line: ConnectionLine): Promise<ConnectionActionResult> {
    return this.unavailable(line, "reconnecting");
  }

  async healthCheck(line: ConnectionLine): Promise<ConnectionActionResult> {
    return this.unavailable(line, "disconnected");
  }

  async sendMessage(): Promise<SendMessageResult> {
    throw new Error(`${this.providerType} provider adapter henüz yapılandırılmadı. Fake/mock gönderim yapılmadı.`);
  }

  private unavailable(line: ConnectionLine, status: string): ConnectionActionResult {
    return {
      lineId: line.id,
      providerType: this.providerType,
      status,
      qr: null,
      message: `${this.providerType} provider adapter henüz yapılandırılmadı. Fake/mock bağlantı üretilmedi.`
    };
  }
}

type BaileysRuntime = {
  sock: any;
  qr?: string | null;
  status: string;
};

const baileysSessions = new Map<string, BaileysRuntime>();

class WhatsAppBaileysAdapter implements ProviderAdapter {
  providerType: ConnectionProviderType = "whatsapp_baileys";
  capabilities = ["send_message", "receive_message", "qr_auth", "session_restore", "reconnect", "delivery_status", "read_status"] as ProviderAdapter["capabilities"];

  async requestQr(line: ConnectionLine): Promise<ConnectionActionResult> {
    return this.start(line);
  }

  async start(line: ConnectionLine): Promise<ConnectionActionResult> {
    const baileys = await import("@whiskeysockets/baileys");
    const makeWASocket = (baileys.default ?? (baileys as any).makeWASocket) as any;
    const useMultiFileAuthState = (baileys as any).useMultiFileAuthState;
    const sessionPath = path.join(process.cwd(), ".connection-sessions", "whatsapp_baileys", line.id);
    const authState = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
      auth: authState.state,
      printQRInTerminal: false,
      browser: ["WP CRM", "Chrome", "12"]
    });
    sock.ev.on("creds.update", authState.saveCreds);

    const runtime: BaileysRuntime = { sock, qr: null, status: "connecting" };
    baileysSessions.set(line.id, runtime);

    return await new Promise<ConnectionActionResult>((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ lineId: line.id, providerType: this.providerType, status: runtime.qr ? "qr_generated" : "connecting", qr: runtime.qr ?? null, message: runtime.qr ? "Baileys QR üretildi." : "Baileys bağlantısı başlatıldı, QR bekleniyor." });
      }, 5000);

      sock.ev.on("connection.update", (update: any) => {
        if (update.qr) {
          runtime.qr = update.qr;
          runtime.status = "qr_generated";
          clearTimeout(timeout);
          resolve({ lineId: line.id, providerType: this.providerType, status: "qr_generated", qr: update.qr, message: "Baileys QR üretildi." });
        }
        if (update.connection === "open") {
          runtime.status = "connected";
          clearTimeout(timeout);
          resolve({ lineId: line.id, providerType: this.providerType, status: "connected", qr: null, message: "Baileys WhatsApp bağlantısı kuruldu." });
        }
        if (update.connection === "close") {
          runtime.status = "disconnected";
        }
      });
    });
  }

  async stop(line: ConnectionLine): Promise<ConnectionActionResult> {
    const runtime = baileysSessions.get(line.id);
    await runtime?.sock?.logout?.().catch?.(() => undefined);
    baileysSessions.delete(line.id);
    return { lineId: line.id, providerType: this.providerType, status: "disconnected", qr: null, message: "Baileys session kapatıldı." };
  }

  async reconnect(line: ConnectionLine): Promise<ConnectionActionResult> {
    await this.stop(line).catch(() => undefined);
    return this.start(line);
  }

  async healthCheck(line: ConnectionLine): Promise<ConnectionActionResult> {
    const runtime = baileysSessions.get(line.id);
    if (!runtime) return { lineId: line.id, providerType: this.providerType, status: "disconnected", qr: null, message: "Baileys runtime session bulunamadı." };
    return { lineId: line.id, providerType: this.providerType, status: runtime.status, qr: runtime.qr ?? null, message: `Baileys session durumu: ${runtime.status}` };
  }

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const runtime = baileysSessions.get(input.line.id);
    if (!runtime || runtime.status !== "connected") throw new Error("Baileys session connected değil.");
    const jid = normalizeWhatsAppJid(input.recipient);
    const result = await runtime.sock.sendMessage(jid, { text: input.messageText });
    return { providerMessageId: result?.key?.id ?? `baileys-${Date.now()}` };
  }
}

const manualAdapter = new ManualAdapter();
const baileysAdapter = new WhatsAppBaileysAdapter();

export function getProviderAdapter(providerType: string): ProviderAdapter {
  const normalized = normalizeProviderType(providerType);
  if (normalized === "manual") return manualAdapter;
  if (normalized === "whatsapp_baileys") return baileysAdapter;
  return new MissingAdapter(normalized);
}

export function normalizeProviderType(providerType: string): ConnectionProviderType {
  if (
    providerType === "manual" ||
    providerType === "whatsapp_baileys" ||
    providerType === "whatsapp_web_js" ||
    providerType === "whatsapp_web" ||
    providerType === "whatsapp_cloud_api" ||
    providerType === "cloud_api" ||
    providerType === "telegram_bot" ||
    providerType === "telegram_user" ||
    providerType === "live_chat" ||
    providerType === "email" ||
    providerType === "sms"
  ) return providerType;
  return "manual";
}

function normalizeWhatsAppJid(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("90") ? digits : digits.startsWith("0") ? `9${digits}` : digits;
  return `${normalized}@s.whatsapp.net`;
}
