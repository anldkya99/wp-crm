import { prisma } from "@/lib/prisma";

export async function getProviderHealthSummary() {
  const [lines, sessions, queue] = await Promise.all([
    prisma.communicationLine.findMany(),
    prisma.communicationSession.findMany(),
    prisma.messageSendQueue.groupBy({
      by: ["providerType", "status"],
      _count: { _all: true }
    })
  ]);

  const providers = Array.from(new Set([...lines.map((line) => line.providerType), "telegram_bot", "email", "sms", "live_chat"]));
  return providers.map((providerType) => {
    const providerLines = lines.filter((line) => line.providerType === providerType);
    const providerSessions = sessions.filter((session) => session.providerType === providerType);
    const connected = providerSessions.filter((session) => session.sessionStatus === "connected").length;
    const pendingQueue = queue
      .filter((item) => item.providerType === providerType && ["queued", "retry", "sending"].includes(item.status))
      .reduce((sum, item) => sum + item._count._all, 0);
    const failedQueue = queue
      .filter((item) => item.providerType === providerType && item.status === "failed")
      .reduce((sum, item) => sum + item._count._all, 0);
    const latestSession = providerSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
    return {
      providerType,
      lineCount: providerLines.length,
      activeLineCount: providerLines.filter((line) => line.status === "active" || line.status === "connected").length,
      connectedSessionCount: connected,
      pendingQueue,
      failedQueue,
      lastHeartbeatAt: latestSession?.lastHealthCheckAt?.toISOString(),
      reconnectAttemptCount: providerSessions.reduce((sum, session) => sum + session.reconnectAttemptCount, 0),
      lastError: latestSession?.lastError ?? undefined
    };
  });
}
