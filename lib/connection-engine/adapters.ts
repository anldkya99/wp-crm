import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import type { ConnectionActionResult, ConnectionLine, ConnectionProviderType, ProviderAdapter, SendMessageInput, SendMessageResult } from "@/lib/connection-engine/types";

class ManualAdapter implements ProviderAdapter {
  providerType: ConnectionProviderType = "manual";
  capabilities = ["send_message"] as ProviderAdapter["capabilities"];

  async requestQr(line: ConnectionLine): Promise<ConnectionActionResult> {
    return { lineId: line.id, providerType: "manual", status: "connected", qr: null, message: "Manual provider QR gerektirmez." };
  }

  async start(line: ConnectionLine): Promise<ConnectionActionResult> {
    return { lineId: line.id, providerType: "manual", status: "connected", qr: null, message: "Manual provider sistem ici gonderim icin hazir." };
  }

  async stop(line: ConnectionLine): Promise<ConnectionActionResult> {
    return { lineId: line.id, providerType: "manual", status: "disconnected", qr: null, message: "Manual provider session kapatildi." };
  }

  async reconnect(line: ConnectionLine): Promise<ConnectionActionResult> {
    return this.start(line);
  }

  async healthCheck(line: ConnectionLine): Promise<ConnectionActionResult> {
    return { lineId: line.id, providerType: "manual", status: "connected", qr: null, message: "Manual provider saglikli." };
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
    return { lineId: line.id, providerType: this.providerType, status: "disconnected", qr: null, message: `${this.providerType} provider session kapatildi.` };
  }

  async reconnect(line: ConnectionLine): Promise<ConnectionActionResult> {
    return this.unavailable(line, "reconnecting");
  }

  async healthCheck(line: ConnectionLine): Promise<ConnectionActionResult> {
    return this.unavailable(line, "disconnected");
  }

  async sendMessage(): Promise<SendMessageResult> {
    throw new Error(`${this.providerType} provider adapter henuz yapilandirilmadi. Fake/mock gonderim yapilmadi.`);
  }

  private unavailable(line: ConnectionLine, status: string): ConnectionActionResult {
    return {
      lineId: line.id,
      providerType: this.providerType,
      status,
      qr: null,
      message: `${this.providerType} provider adapter henuz yapilandirilmadi. Fake/mock baglanti uretilmedi.`
    };
  }
}

type BaileysRuntime = {
  sock: any;
  qr?: string | null;
  status: string;
  sessionPath: string;
};

const baileysSessions = new Map<string, BaileysRuntime>();

class WhatsAppBaileysAdapter implements ProviderAdapter {
  providerType: ConnectionProviderType = "whatsapp_baileys";
  capabilities = ["qr_auth", "session_restore", "reconnect"] as ProviderAdapter["capabilities"];

  async requestQr(line: ConnectionLine): Promise<ConnectionActionResult> {
    return this.start(line);
  }

  async start(line: ConnectionLine): Promise<ConnectionActionResult> {
    disableWsNativeAddons();
    const baileys = await import("@whiskeysockets/baileys");
    const makeWASocket = (baileys.default ?? (baileys as any).makeWASocket) as any;
    const useMultiFileAuthState = (baileys as any).useMultiFileAuthState;
    const fetchLatestBaileysVersion = (baileys as any).fetchLatestBaileysVersion;
    const Browsers = (baileys as any).Browsers;
    const sessionPath = whatsappSessionPath(line.id);
    await fs.mkdir(sessionPath, { recursive: true });

    const previous = baileysSessions.get(line.id);
    if (previous) {
      await previous.sock?.end?.().catch?.(() => undefined);
      baileysSessions.delete(line.id);
    }

    const authState = await useMultiFileAuthState(sessionPath);
    baileysDiagnosticLog("start", {
      lineId: line.id,
      providerType: line.providerType,
      sessionPath,
      hasCredsMe: Boolean(authState.state?.creds?.me),
      credsMeId: authState.state?.creds?.me?.id ?? null,
      hasRegistrationId: typeof authState.state?.creds?.registrationId === "number"
    });
    const version = fetchLatestBaileysVersion
      ? await fetchLatestBaileysVersion().then((result: { version?: number[] }) => result.version).catch(() => undefined)
      : undefined;
    const browser = Browsers?.windows?.("Chrome") ?? ["Windows", "Chrome", "10.0"];
    const sock = makeWASocket({
      auth: authState.state,
      printQRInTerminal: false,
      browser,
      version
    });
    baileysDiagnosticLog("socket_created", { lineId: line.id, version, browser });
    sock.ev.on("creds.update", (credsUpdate: any) => {
      baileysDiagnosticLog("creds.update", {
        lineId: line.id,
        hasMe: Boolean(credsUpdate?.me),
        meId: credsUpdate?.me?.id ?? null,
        hasAccount: Boolean(credsUpdate?.account),
        hasSignalIdentities: Boolean(credsUpdate?.signalIdentities)
      });
      return authState.saveCreds(credsUpdate);
    });

    const runtime: BaileysRuntime = { sock, qr: null, status: "connecting", sessionPath };
    baileysSessions.set(line.id, runtime);
    await persistBaileysState(line, "connecting", null, sessionPath, "Baileys baglantisi baslatildi.");

    return await new Promise<ConnectionActionResult>((resolve) => {
      let settled = false;
      const finish = (result: ConnectionActionResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(result);
      };
      const timeout = setTimeout(() => {
        finish({
          lineId: line.id,
          providerType: this.providerType,
          status: runtime.qr ? "qr_generated" : "connecting",
          qr: runtime.qr ?? null,
          sessionPath,
          message: runtime.qr ? "Baileys QR uretildi." : "Baileys baglantisi baslatildi, QR bekleniyor."
        });
      }, 5000);

      sock.ev.on("connection.update", async (update: any) => {
        baileysDiagnosticLog("connection.update", summarizeConnectionUpdate(line.id, update));
        if (update.qr) {
          runtime.qr = update.qr;
          runtime.status = "qr_generated";
          await safePersistBaileysState(line, "qr_generated", update.qr, sessionPath, "Baileys QR uretildi.");
          finish({ lineId: line.id, providerType: this.providerType, status: "qr_generated", qr: update.qr, sessionPath, message: "Baileys QR uretildi." });
        }

        if (update.connection === "open") {
          runtime.status = "connected";
          runtime.qr = null;
          await safePersistBaileysState(line, "connected", null, sessionPath, "Baileys WhatsApp baglantisi kuruldu.");
          finish({ lineId: line.id, providerType: this.providerType, status: "connected", qr: null, sessionPath, message: "Baileys WhatsApp baglantisi kuruldu." });
        }

        if (update.connection === "close") {
          const statusCode = getBaileysDisconnectStatusCode(update);
          const reason = update.lastDisconnect?.error?.message ?? "Baileys baglantisi kapandi.";
          baileysDiagnosticLog("connection.close", { lineId: line.id, statusCode, reason, error: summarizeBaileysError(update.lastDisconnect?.error) });
          if (statusCode === 515) {
            runtime.status = "connecting";
            runtime.qr = null;
            await safePersistBaileysState(line, "connecting", null, sessionPath, "Baileys restart required; session yeniden baslatiliyor.");
            setTimeout(() => {
              void (async () => {
                try {
                  await this.start(line);
                } catch (error) {
                  console.error("[baileys] restart after 515 failed", { lineId: line.id, error: error instanceof Error ? error.message : String(error) });
                }
              })();
            }, 1000);
            return;
          }
          runtime.status = "disconnected";
          await safePersistBaileysState(line, "disconnected", null, sessionPath, reason);
        }
      });
    });
  }

  async stop(line: ConnectionLine): Promise<ConnectionActionResult> {
    const runtime = baileysSessions.get(line.id);
    await runtime?.sock?.logout?.().catch?.(() => undefined);
    baileysSessions.delete(line.id);
    const sessionPath = runtime?.sessionPath ?? whatsappSessionPath(line.id);
    await persistBaileysState(line, "disconnected", null, sessionPath, "Baileys session kapatildi.");
    return { lineId: line.id, providerType: this.providerType, status: "disconnected", qr: null, sessionPath, message: "Baileys session kapatildi." };
  }

  async reconnect(line: ConnectionLine): Promise<ConnectionActionResult> {
    await this.stop(line).catch(() => undefined);
    return this.start(line);
  }

  async healthCheck(line: ConnectionLine): Promise<ConnectionActionResult> {
    const runtime = baileysSessions.get(line.id);
    if (!runtime) {
      return { lineId: line.id, providerType: this.providerType, status: "disconnected", qr: null, sessionPath: whatsappSessionPath(line.id), message: "Baileys runtime session bulunamadi." };
    }
    return { lineId: line.id, providerType: this.providerType, status: runtime.status, qr: runtime.qr ?? null, sessionPath: runtime.sessionPath, message: `Baileys session durumu: ${runtime.status}` };
  }

  async sendMessage(): Promise<SendMessageResult> {
    throw new Error("Bu surumde gercek WhatsApp mesaj gonderimi kapali. Sadece QR, session ve baglanti durumu aktif.");
  }
}

const manualAdapter = new ManualAdapter();
function baileysDiagnosticLog(event: string, details: Record<string, unknown>) {
  console.info(`[baileys:diagnostic] ${event}`, details);
}

function summarizeConnectionUpdate(lineId: string, update: any) {
  const error = update?.lastDisconnect?.error;
  return {
    lineId,
    connection: update?.connection ?? null,
    receivedPendingNotifications: update?.receivedPendingNotifications ?? null,
    qr: update?.qr ?? null,
    lastDisconnect: update?.lastDisconnect ? {
      date: update.lastDisconnect.date ?? null,
      error: summarizeBaileysError(error)
    } : null,
    lastDisconnectError: summarizeBaileysError(error),
    lastDisconnectErrorOutput: error?.output ?? null,
    lastDisconnectErrorData: error?.data ?? null,
    statusCode: getBaileysDisconnectStatusCode(update),
    stack: error?.stack ?? null,
    disconnectReason: getBaileysDisconnectReason(update),
    isNewLogin: update?.isNewLogin ?? null,
    isOnline: update?.isOnline ?? null
  };
}

function summarizeBaileysError(error: any) {
  if (!error) return null;
  return {
    name: error?.name ?? null,
    message: error?.message ?? null,
    stack: error?.stack ?? null,
    statusCode: error?.output?.statusCode ?? error?.statusCode ?? error?.data?.statusCode ?? null,
    output: error?.output ?? null,
    data: error?.data ?? null,
    raw: error
  };
}

function getBaileysDisconnectStatusCode(update: any) {
  return update?.lastDisconnect?.error?.output?.statusCode ?? update?.lastDisconnect?.error?.statusCode ?? update?.lastDisconnect?.error?.data?.statusCode;
}

function getBaileysDisconnectReason(update: any) {
  return update?.lastDisconnect?.error?.output?.payload?.reason ?? update?.lastDisconnect?.error?.data?.reason ?? update?.lastDisconnect?.error?.reason ?? null;
}
function disableWsNativeAddons() {
  process.env.WS_NO_BUFFER_UTIL = "1";
  process.env.WS_NO_UTF_8_VALIDATE = "1";
}

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

function whatsappSessionPath(lineId: string) {
  return path.join(process.cwd(), ".connection-sessions", "whatsapp_baileys", lineId);
}

async function persistBaileysState(line: ConnectionLine, status: string, qr: string | null, sessionPath: string, message: string) {
  const now = new Date();
  const sessionStatus = status === "qr_generated" ? "qr_generated" : status === "connected" ? "connected" : status === "connecting" ? "connecting" : "disconnected";
  const lineStatus = status === "qr_generated" ? "qr_waiting" : status === "connected" ? "connected" : status === "connecting" ? "connecting" : "disconnected";
  const connectionStatus = status === "qr_generated" ? "qr_pending" : status === "connected" ? "connected" : status === "connecting" ? "connecting" : "disconnected";

  await prisma.communicationSession.upsert({
    where: { lineId: line.id },
    create: {
      lineId: line.id,
      providerType: "whatsapp_baileys",
      sessionStatus,
      qrCode: qr,
      lastQrAt: qr ? now : null,
      connectedAt: status === "connected" ? now : null,
      disconnectedAt: status === "disconnected" ? now : null,
      lastError: status === "disconnected" ? message : null,
      sessionStoragePath: sessionPath,
      sessionKey: `whatsapp_baileys:${line.id}`
    },
    update: {
      providerType: "whatsapp_baileys",
      sessionStatus,
      qrCode: qr,
      lastQrAt: qr ? now : undefined,
      connectedAt: status === "connected" ? now : undefined,
      disconnectedAt: status === "disconnected" ? now : undefined,
      lastError: status === "connected" || status === "qr_generated" || status === "connecting" ? null : message,
      sessionStoragePath: sessionPath
    }
  });

  await prisma.communicationLine.update({
    where: { id: line.id },
    data: {
      status: lineStatus,
      connectionStatus,
      sessionPath,
      qrUpdatedAt: qr ? now : undefined,
      lastConnectedAt: status === "connected" ? now : undefined,
      lastDisconnectedAt: status === "disconnected" ? now : undefined,
      lastError: status === "connected" || status === "qr_generated" || status === "connecting" ? null : message,
      isDefault: status === "disconnected" ? false : line.isDefault,
      isActiveOperationLine: status === "connected" && line.isDefault
    }
  });

  await prisma.connectionActivityLog.create({
    data: {
      lineId: line.id,
      providerType: "whatsapp_baileys",
      eventType: status === "qr_generated" ? "QR_GENERATED" : status === "connected" ? "SESSION_CONNECTED" : status === "connecting" ? "SESSION_STARTED" : "SESSION_DISCONNECTED",
      status: connectionStatus,
      details: message
    }
  });
}

async function safePersistBaileysState(line: ConnectionLine, status: string, qr: string | null, sessionPath: string, message: string) {
  try {
    await persistBaileysState(line, status, qr, sessionPath, message);
  } catch (error) {
    console.error("[baileys] state persist failed", {
      lineId: line.id,
      status,
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
