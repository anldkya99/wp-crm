import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const intervalMs = Number(process.env.CONNECTION_SERVICE_INTERVAL_MS ?? 15000);
let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    const lines = await prisma.communicationLine.findMany({
      where: { status: { notIn: ["blocked", "archived", "replacement_pending", "passive"] } },
      orderBy: { updatedAt: "asc" }
    });

    for (const line of lines) {
      await prisma.communicationSession.upsert({
        where: { lineId: line.id },
        create: {
          lineId: line.id,
          providerType: line.providerType,
          sessionStatus: line.providerType === "manual" ? "connected" : line.status === "connected" ? "connected" : "disconnected",
          lastHealthCheckAt: new Date(),
          sessionKey: `${line.providerType}:${line.id}`
        },
        update: {
          providerType: line.providerType,
          lastHealthCheckAt: new Date()
        }
      });
      await prisma.connectionActivityLog.create({
        data: {
          lineId: line.id,
          providerType: line.providerType,
          eventType: "SERVICE_HEARTBEAT",
          status: line.status,
          details: "Persistent Connection Service heartbeat."
        }
      });
    }

    await processQueue();
  } catch (error) {
    console.error("[connection-service] tick failed", error);
  } finally {
    running = false;
  }
}

async function processQueue() {
  const items = await prisma.messageSendQueue.findMany({
    where: {
      status: { in: ["queued", "retry"] },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
      scheduledAt: { lte: new Date() }
    },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    take: 25,
    include: { line: true }
  });

  for (const item of items) {
    try {
      if (item.line.providerType !== "manual") {
        throw new Error("Persistent service real provider send worker is prepared; provider socket handoff will be enabled in the next sprint.");
      }
      const providerMessageId = `manual-service-${item.lineId}-${Date.now()}`;
      await prisma.messageSendQueue.update({
        where: { id: item.id },
        data: { status: "sent", providerMessageId, sentAt: new Date(), lastError: null }
      });
      if (item.messageId) {
        await prisma.message.update({
          where: { id: item.messageId },
          data: { providerType: item.providerType, providerMessageId, status: "SENT" }
        });
      }
    } catch (error) {
      const attempt = item.attemptCount + 1;
      const failed = attempt >= item.maxAttempts;
      await prisma.messageSendQueue.update({
        where: { id: item.id },
        data: {
          status: failed ? "failed" : "retry",
          attemptCount: { increment: 1 },
          lastError: error instanceof Error ? error.message : "Persistent service queue error.",
          nextAttemptAt: failed ? null : nextRetryAt(attempt)
        }
      });
    }
  }
}

function nextRetryAt(attempt) {
  const base = Math.min(15 * 60_000, 30_000 * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * 20_000);
  return new Date(Date.now() + base + jitter);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

console.log(`[connection-service] started. interval=${intervalMs}ms`);
await tick();
setInterval(() => void tick(), intervalMs);
