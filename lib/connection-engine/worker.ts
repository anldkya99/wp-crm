import { prisma } from "@/lib/prisma";
import { connectionEngine } from "@/lib/connection-engine/engine";
import { processSendQueue } from "@/lib/communication-event-engine";

export type ConnectionWorkerResult = {
  checked: number;
  reconnected: number;
  failed: number;
  skipped: number;
  queueChecked: number;
  queueSent: number;
  queueFailed: number;
};

export async function runConnectionHealthWorker(): Promise<ConnectionWorkerResult> {
  const result: ConnectionWorkerResult = { checked: 0, reconnected: 0, failed: 0, skipped: 0, queueChecked: 0, queueSent: 0, queueFailed: 0 };
  const lines = await prisma.communicationLine.findMany({
    where: { status: { notIn: ["blocked", "archived", "replacement_pending", "passive"] } },
    orderBy: { updatedAt: "asc" }
  });

  for (const line of lines) {
    result.checked += 1;
    try {
      const health = await connectionEngine.healthCheck(line.id);
      if (health.status === "disconnected") {
        await connectionEngine.reconnect(line.id);
        result.reconnected += 1;
      }
    } catch (error) {
      result.failed += 1;
      await prisma.connectionActivityLog.create({
        data: {
          lineId: line.id,
          providerType: line.providerType,
          eventType: "WORKER_HEALTH_CHECK_FAILED",
          status: "failed",
          details: error instanceof Error ? error.message : "Connection worker hatası."
        }
      });
    }
  }

  if (lines.length === 0) result.skipped += 1;
  const queue = await processSendQueue();
  result.queueChecked = queue.checked;
  result.queueSent = queue.sent;
  result.queueFailed = queue.failed;
  return result;
}
