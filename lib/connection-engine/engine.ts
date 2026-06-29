import { prisma } from "@/lib/prisma";
import { getProviderAdapter, normalizeProviderType } from "@/lib/connection-engine/adapters";
import { checkMessagePolicy } from "@/lib/connection-engine/rate-limit";
import type { ConnectionActionResult, ConnectionLine, ConnectionSessionStatus, SendMessageInput } from "@/lib/connection-engine/types";

type RuntimeSession = {
  lineId: string;
  providerType: string;
  status: string;
  qr?: string | null;
  startedAt: Date;
  lastHealthCheckAt?: Date;
};

const globalConnectionState = globalThis as unknown as {
  connectionRuntimeSessions?: Map<string, RuntimeSession>;
};

const runtimeSessions = globalConnectionState.connectionRuntimeSessions ?? new Map<string, RuntimeSession>();
globalConnectionState.connectionRuntimeSessions = runtimeSessions;

export const connectionEngine = {
  async requestQr(lineId: string, operatorId?: string | null) {
    const line = await getLine(lineId);
    ensureManageableLine(line);
    const adapter = getProviderAdapter(line.providerType);
    await upsertSession(line, "qr_requested", { qrCode: null, lastError: null });
    await log(line, "QR_REQUESTED", "qr_requested", "QR oluşturma istendi.");
    const result = await adapter.requestQr(line);
    await applyResult(line, result, operatorId);
    return result;
  },

  async start(lineId: string, operatorId?: string | null) {
    const line = await getLine(lineId);
    ensureManageableLine(line);
    const adapter = getProviderAdapter(line.providerType);
    await upsertSession(line, "connecting", { lastError: null });
    await updateLine(lineId, { status: "connecting" });
    await log(line, "SESSION_STARTED", "connecting", `${line.name} session başlatılıyor.`);
    const result = await adapter.start(line);
    await applyResult(line, result, operatorId);
    return result;
  },

  async stop(lineId: string, operatorId?: string | null) {
    const line = await getLine(lineId);
    runtimeSessions.delete(lineId);
    const adapter = getProviderAdapter(line.providerType);
    const result = await adapter.stop(line);
    await upsertSession(line, normalizeSessionStatus(result.status), {
      disconnectedAt: new Date(),
      qrCode: null
    });
    const nextLineStatus = line.status === "blocked" || line.status === "archived" ? line.status : "disconnected";
    await updateLine(lineId, { status: nextLineStatus, connectionStatus: "disconnected", lastDisconnectedAt: new Date(), isDefault: false, isActiveOperationLine: false });
    await log(line, "SESSION_DISCONNECTED", nextLineStatus, result.message);
    await logTimeline(lineId, operatorId, "LINE_DISCONNECTED", "Hat bağlantısı koptu", `${line.name} oturumu kapatıldı.`);
    return { ...result, status: nextLineStatus };
  },

  async reconnect(lineId: string, operatorId?: string | null) {
    const line = await getLine(lineId);
    await incrementReconnect(line);
    await log(line, "RECONNECT_STARTED", "reconnecting", "Reconnect politikası tetiklendi.");
    const result = await this.start(lineId, operatorId);
    await log(line, result.status === "connected" ? "RECONNECT_SUCCESS" : "RECONNECT_FAILED", String(result.status), result.message);
    return result;
  },

  async healthCheck(lineId: string) {
    const line = await getLine(lineId);
    const adapter = getProviderAdapter(line.providerType);
    const result = await adapter.healthCheck(line);
    await upsertSession(line, normalizeSessionStatus(result.status), { lastHealthCheckAt: new Date(), lastError: result.status === "connected" ? null : result.message });
    await applyLineHealth(line, result);
    await log(line, result.status === "connected" ? "HEALTH_CHECK_OK" : "HEALTH_CHECK_FAILED", String(result.status), result.message);
    return result;
  },

  async sendMessage(input: SendMessageInput) {
    const policy = await checkMessagePolicy(input.line.id, input.messageText);
    if (!policy.allowed) {
      await log(input.line, "MESSAGE_SEND_BLOCKED", input.line.status, policy.reason);
      throw new Error(policy.reason ?? "Mesaj gönderim politikası nedeniyle engellendi.");
    }

    const adapter = getProviderAdapter(input.line.providerType);
    const session = await prisma.communicationSession.findUnique({ where: { lineId: input.line.id } });
    if (input.line.providerType !== "manual" && session?.sessionStatus !== "connected") {
      await log(input.line, "MESSAGE_SEND_FAILED", session?.sessionStatus ?? input.line.status, "Provider session connected değil.");
      throw new Error("Gerçek provider session connected değil. Önce bağlantıyı tamamlayın.");
    }

    const result = await adapter.sendMessage(input);
    await log(input.line, "MESSAGE_SEND_REQUESTED", "sent", `${input.recipient} için gönderim provider'a iletildi.`);
    return result;
  }
};

async function getLine(lineId: string): Promise<ConnectionLine> {
  const line = await prisma.communicationLine.findUnique({ where: { id: lineId } });
  if (!line) throw new Error("İletişim hattı bulunamadı.");
  return line;
}

function ensureManageableLine(line: ConnectionLine) {
  if (line.status === "blocked") throw new Error("Blokeli hat için session başlatılamaz.");
  if (line.status === "archived") throw new Error("Arşivdeki hat için session başlatılamaz.");
  if (line.status === "replacement_pending") throw new Error("Değişim bekleyen hat için önce replacement akışını tamamlayın.");
}

async function applyResult(line: ConnectionLine, result: ConnectionActionResult, operatorId?: string | null) {
  const status = normalizeSessionStatus(result.status);
  const now = new Date();
  runtimeSessions.set(line.id, { lineId: line.id, providerType: line.providerType, status, qr: result.qr ?? null, startedAt: now });
  await upsertSession(line, status, {
    qrCode: result.qr ?? null,
    lastQrAt: result.qr ? now : undefined,
    connectedAt: status === "connected" ? now : undefined,
    disconnectedAt: status === "disconnected" || status === "failed" ? now : undefined,
    lastError: status === "connected" || status === "qr_generated" || status === "connecting" ? null : result.message,
    sessionStoragePath: result.sessionPath ?? undefined
  });
  await applyLineHealth(line, result);
  await log(line, status === "connected" ? "SESSION_CONNECTED" : status === "qr_generated" ? "QR_GENERATED" : "PROVIDER_STATUS", status, result.message);
  if (status === "connected") {
    await logTimeline(line.id, operatorId, "LINE_CONNECTED", "Hat tekrar bağlandı", `${line.name} bağlantısı hazır.`);
  }
}

async function applyLineHealth(line: ConnectionLine, result: ConnectionActionResult) {
  const status = normalizeSessionStatus(result.status);
  if (status === "connected") {
    await updateLine(line.id, { status: "connected", connectionStatus: "connected", sessionPath: result.sessionPath ?? undefined, lastConnectedAt: new Date(), lastError: null, blockedAt: null });
    return;
  }
  if (status === "qr_requested" || status === "qr_generated") {
    await updateLine(line.id, { status: "qr_waiting", connectionStatus: "qr_pending", sessionPath: result.sessionPath ?? undefined, qrUpdatedAt: result.qr ? new Date() : undefined, lastError: null, isDefault: false, isActiveOperationLine: false });
    return;
  }
  if (status === "connecting" || status === "reconnecting") {
    await updateLine(line.id, { status: "connecting", connectionStatus: "connecting", sessionPath: result.sessionPath ?? undefined, lastError: null });
    return;
  }
  if (line.status !== "blocked" && line.status !== "archived" && line.status !== "replacement_pending") {
    await updateLine(line.id, { status: "disconnected", connectionStatus: "error", sessionPath: result.sessionPath ?? undefined, lastDisconnectedAt: new Date(), lastError: result.message, isDefault: false, isActiveOperationLine: false });
  }
}

async function upsertSession(line: ConnectionLine, sessionStatus: string, data: Record<string, unknown> = {}) {
  await prisma.communicationSession.upsert({
    where: { lineId: line.id },
    create: {
      lineId: line.id,
      providerType: normalizeProviderType(line.providerType),
      sessionStatus,
      sessionKey: `${normalizeProviderType(line.providerType)}:${line.id}`,
      ...data
    },
    update: {
      providerType: normalizeProviderType(line.providerType),
      sessionStatus,
      ...data
    }
  });
}

async function incrementReconnect(line: ConnectionLine) {
  await prisma.communicationSession.upsert({
    where: { lineId: line.id },
    create: {
      lineId: line.id,
      providerType: normalizeProviderType(line.providerType),
      sessionStatus: "reconnecting",
      reconnectAttemptCount: 1,
      sessionKey: `${normalizeProviderType(line.providerType)}:${line.id}`
    },
    update: {
      sessionStatus: "reconnecting",
      reconnectAttemptCount: { increment: 1 }
    }
  });
}

async function updateLine(lineId: string, data: Record<string, unknown>) {
  await prisma.communicationLine.update({ where: { id: lineId }, data });
}

async function log(line: ConnectionLine, eventType: string, status: string, details?: string) {
  await prisma.connectionActivityLog.create({
    data: {
      lineId: line.id,
      providerType: normalizeProviderType(line.providerType),
      eventType,
      status,
      details
    }
  });
  if (line.providerType === "manual" || line.providerType === "whatsapp_baileys" || line.providerType === "whatsapp_web" || line.providerType === "cloud_api" || line.providerType === "whatsapp_cloud_api") {
    await prisma.whatsAppSessionLog.create({
      data: { lineId: line.id, eventType, status, details }
    });
  }
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

function normalizeSessionStatus(status: string): ConnectionSessionStatus {
  if (
    status === "qr_requested" ||
    status === "qr_generated" ||
    status === "qr_scanned" ||
    status === "connecting" ||
    status === "connected" ||
    status === "disconnected" ||
    status === "reconnecting" ||
    status === "blocked" ||
    status === "archived" ||
    status === "failed"
  ) return status;
  return status === "active" ? "connected" : "disconnected";
}
