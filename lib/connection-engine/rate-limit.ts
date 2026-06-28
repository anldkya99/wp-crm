import { prisma } from "@/lib/prisma";

export type RateLimitDecision = {
  allowed: boolean;
  reason?: string;
};

const DEFAULT_DAILY_LINE_LIMIT = 500;
const DEFAULT_RECENT_DUPLICATE_WINDOW_MINUTES = 10;

export async function checkMessagePolicy(lineId: string, messageText: string): Promise<RateLimitDecision> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyCount = await prisma.message.count({
    where: {
      lineId,
      senderType: "OPERATOR",
      createdAt: { gte: today }
    }
  });
  if (dailyCount >= DEFAULT_DAILY_LINE_LIMIT) {
    return { allowed: false, reason: `Hat günlük mesaj limiti aşıldı (${DEFAULT_DAILY_LINE_LIMIT}).` };
  }

  const duplicateSince = new Date(Date.now() - DEFAULT_RECENT_DUPLICATE_WINDOW_MINUTES * 60 * 1000);
  const recentDuplicate = await prisma.message.findFirst({
    where: {
      lineId,
      senderType: "OPERATOR",
      messageText,
      createdAt: { gte: duplicateSince }
    },
    select: { id: true }
  });
  if (recentDuplicate) {
    return { allowed: false, reason: "Aynı metin kısa süre içinde bu hat üzerinden tekrar gönderilemez." };
  }

  return { allowed: true };
}
