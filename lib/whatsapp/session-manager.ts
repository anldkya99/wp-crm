import { prisma } from "@/lib/prisma";

type SessionActionResult = {
  lineId: string;
  status: string;
  qr?: string | null;
  message: string;
};

type LineRecord = {
  id: string;
  name: string;
  phoneNumber: string;
  providerType: string;
  status: string;
};

type RuntimeSession = {
  lineId: string;
  status: string;
  qr?: string | null;
  startedAt: Date;
  lastHealthCheckAt?: Date;
};

const globalSessionState = globalThis as unknown as {
  whatsappRuntimeSessions?: Map<string, RuntimeSession>;
};

const runtimeSessions = globalSessionState.whatsappRuntimeSessions ?? new Map<string, RuntimeSession>();
globalSessionState.whatsappRuntimeSessions = runtimeSessions;

export const whatsappSessionManager = {
  async start(lineId: string, operatorId?: string | null): Promise<SessionActionResult> {
    const line = await getLine(lineId);
    ensureManageableLine(line);

    await updateLine(lineId, { status: "connecting" });
    await logSession(lineId, "SESSION_STARTED", "connecting", `${line.name} oturumu başlatılıyor.`);

    if (line.providerType === "manual") {
      runtimeSessions.set(lineId, { lineId, status: "connected", startedAt: new Date() });
      await updateLine(lineId, { status: "connected", lastConnectedAt: new Date(), blockedAt: null });
      await logSession(lineId, "SESSION_CONNECTED", "connected", "Manual hat sistem içi gönderim için hazır.");
      await logTimeline(lineId, operatorId, "LINE_CONNECTED", "Hat tekrar bağlandı", `${line.name} session manager tarafından connected yapıldı.`);
      return { lineId, status: "connected", qr: null, message: "Manual hat session manager tarafından hazırlandı." };
    }

    runtimeSessions.set(lineId, { lineId, status: "disconnected", startedAt: new Date() });
    await updateLine(lineId, { status: "disconnected" });
    await logSession(lineId, "SESSION_PROVIDER_MISSING", "failed", providerMissingMessage(line.providerType));
    return { lineId, status: "disconnected", qr: null, message: providerMissingMessage(line.providerType) };
  },

  async stop(lineId: string, operatorId?: string | null): Promise<SessionActionResult> {
    const line = await getLine(lineId);
    runtimeSessions.delete(lineId);
    const nextStatus = line.status === "blocked" || line.status === "archived" ? line.status : "disconnected";
    await updateLine(lineId, { status: nextStatus, isDefault: false });
    await logSession(lineId, "SESSION_DISCONNECTED", nextStatus, `${line.name} oturumu kapatıldı.`);
    await logTimeline(lineId, operatorId, "LINE_DISCONNECTED", "Hat bağlantısı koptu", `${line.name} oturumu kapatıldı.`);
    return { lineId, status: nextStatus, qr: null, message: "Session kapatıldı." };
  },

  async reconnect(lineId: string, operatorId?: string | null): Promise<SessionActionResult> {
    await logSession(lineId, "RECONNECT_ATTEMPT", "connecting", "Yeniden bağlantı denemesi başlatıldı.");
    const result = await this.start(lineId, operatorId);
    await logSession(lineId, result.status === "connected" ? "RECONNECT_SUCCESS" : "RECONNECT_FAILED", result.status, result.message);
    return result;
  },

  async healthCheck(lineId: string): Promise<SessionActionResult> {
    const line = await getLine(lineId);
    const runtime = runtimeSessions.get(lineId);
    const now = new Date();

    if (line.status === "blocked" || line.status === "archived" || line.status === "replacement_pending") {
      await logSession(lineId, "HEALTH_CHECK", line.status, "Hat gönderim dışı durumda.");
      return { lineId, status: line.status, qr: null, message: "Hat gönderim dışı durumda." };
    }

    if (line.providerType === "manual") {
      runtimeSessions.set(lineId, { lineId, status: "connected", startedAt: runtime?.startedAt ?? now, lastHealthCheckAt: now });
      await updateLine(lineId, { status: "connected", lastConnectedAt: now });
      await logSession(lineId, "HEALTH_CHECK", "connected", "Manual hat sağlıklı.");
      return { lineId, status: "connected", qr: null, message: "Hat sağlıklı." };
    }

    if (!runtime || runtime.status !== "connected") {
      await updateLine(lineId, { status: "disconnected", isDefault: false });
      await logSession(lineId, "HEALTH_CHECK_FAILED", "disconnected", providerMissingMessage(line.providerType));
      return { lineId, status: "disconnected", qr: null, message: providerMissingMessage(line.providerType) };
    }

    runtime.lastHealthCheckAt = now;
    await updateLine(lineId, { status: "connected", lastConnectedAt: now });
    await logSession(lineId, "HEALTH_CHECK", "connected", "Provider runtime session aktif.");
    return { lineId, status: "connected", qr: runtime.qr ?? null, message: "Hat sağlıklı." };
  },

  async sendMessage(line: LineRecord, phone: string, messageText: string) {
    if (line.providerType === "manual") {
      return { providerMessageId: `manual-${line.id}-${Date.now()}` };
    }
    const runtime = runtimeSessions.get(line.id);
    if (!runtime || runtime.status !== "connected") {
      await logSession(line.id, "SEND_BLOCKED", line.status, "Provider session bağlı değil.");
      throw new Error("Gerçek WhatsApp session bağlı değil. Önce hattı bağlayın.");
    }
    await logSession(line.id, "SEND_REQUESTED", "connected", `${phone} numarasına gönderim provider'a iletildi. ${messageText.slice(0, 120)}`);
    throw new Error("Gerçek WhatsApp provider adapter henüz yapılandırılmadı.");
  }
};

async function getLine(lineId: string) {
  const line = await prisma.communicationLine.findUnique({ where: { id: lineId } });
  if (!line) throw new Error("İletişim hattı bulunamadı.");
  return line;
}

function ensureManageableLine(line: LineRecord) {
  if (line.status === "blocked") throw new Error("Blokeli hat için session başlatılamaz.");
  if (line.status === "archived") throw new Error("Arşivdeki hat için session başlatılamaz.");
  if (line.status === "replacement_pending") throw new Error("Değişim bekleyen hat için önce replacement akışını tamamlayın.");
}

async function updateLine(lineId: string, data: Record<string, unknown>) {
  await prisma.communicationLine.update({ where: { id: lineId }, data });
}

async function logSession(lineId: string, eventType: string, status: string, details?: string) {
  await prisma.whatsAppSessionLog.create({
    data: { lineId, eventType, status, details }
  });
}

async function logTimeline(lineId: string, operatorId: string | null | undefined, eventType: string, eventTitle: string, eventDescription: string) {
  await prisma.timelineEvent.create({
    data: {
      operatorId: operatorId || null,
      eventType,
      eventTitle,
      eventDescription,
      referenceType: "communication_line",
      referenceId: lineId
    }
  });
}

function providerMissingMessage(providerType: string) {
  return `${providerType} için gerçek WhatsApp provider adapter yapılandırılmadı. Fake/mock bağlantı üretilmedi.`;
}
