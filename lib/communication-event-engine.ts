import { prisma } from "@/lib/prisma";
import { connectionEngine } from "@/lib/connection-engine/engine";

type IncomingMessageEvent = {
  lineId: string;
  providerType: string;
  providerMessageId: string;
  fromPhone: string;
  messageText: string;
  receivedAt?: Date;
  raw?: unknown;
};

export async function consumeIncomingMessage(event: IncomingMessageEvent) {
  const existing = await prisma.message.findFirst({
    where: { providerType: event.providerType, providerMessageId: event.providerMessageId }
  });
  if (existing) return { messageId: existing.id, duplicate: true };

  const now = event.receivedAt ?? new Date();
  const phone = normalizePhone(event.fromPhone);

  const result = await prisma.$transaction(async (tx) => {
    const contact =
      (await tx.contact.findUnique({ where: { phone } })) ??
      (await tx.contact.create({
        data: {
          name: phone,
          phone,
          gender: "Belirtilmedi",
          source: event.providerType.startsWith("whatsapp") ? "WhatsApp" : "Diğer",
          isRegistered: true
        }
      }));

    const conversation =
      (await tx.conversation.findFirst({ where: { contactId: contact.id, lineId: event.lineId, isArchived: false } })) ??
      (await tx.conversation.create({
        data: {
          contactId: contact.id,
          lineId: event.lineId,
          status: "NEW",
          lastMessageAt: now
        }
      }));

    const message = await tx.message.create({
      data: {
        conversationId: conversation.id,
        lineId: event.lineId,
        providerType: event.providerType,
        providerMessageId: event.providerMessageId,
        senderType: "CUSTOMER",
        messageText: event.messageText,
        status: "DELIVERED",
        createdAt: now
      }
    });

    await tx.conversation.update({
      where: { id: conversation.id },
      data: { status: "NEW", lastMessageAt: now }
    });
    await tx.contact.update({
      where: { id: contact.id },
      data: { lastContactAt: now }
    });
    await tx.communicationEvent.create({
      data: {
        lineId: event.lineId,
        providerType: event.providerType,
        eventType: "incoming_message",
        providerMessageId: event.providerMessageId,
        contactPhone: phone,
        payloadJson: safeJson(event.raw ?? event),
        status: "processed",
        processedAt: now
      }
    });
    await tx.timelineEvent.create({
      data: {
        memberId: contact.id,
        eventType: "MESSAGE_RECEIVED",
        eventTitle: "Mesaj alındı",
        eventDescription: event.messageText.slice(0, 240),
        referenceType: "message",
        referenceId: message.id,
        createdAt: now
      }
    });

    return { messageId: message.id, conversationId: conversation.id, contactId: contact.id };
  });

  return { ...result, duplicate: false };
}

export async function enqueueOutgoingMessage(input: {
  messageId?: string;
  lineId: string;
  providerType: string;
  recipientPhone: string;
  messageText: string;
}) {
  return prisma.messageSendQueue.create({
    data: {
      messageId: input.messageId,
      lineId: input.lineId,
      providerType: input.providerType,
      recipientPhone: input.recipientPhone,
      messageText: input.messageText,
      status: "queued",
      priority: 5,
      scheduledAt: new Date(),
      nextAttemptAt: new Date()
    }
  });
}

export async function processSendQueue(limit = 20) {
  const items = await prisma.messageSendQueue.findMany({
    where: {
      status: { in: ["queued", "retry"] },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }]
    },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    take: limit,
    include: { line: true }
  });

  let sent = 0;
  let failed = 0;
  for (const item of items) {
    try {
      await prisma.messageSendQueue.update({
        where: { id: item.id },
        data: { status: "sending", attemptCount: { increment: 1 } }
      });
      const result = await connectionEngine.sendMessage({
        line: item.line,
        recipient: item.recipientPhone,
        messageText: item.messageText
      });
      await prisma.messageSendQueue.update({
        where: { id: item.id },
        data: { status: "sent", providerMessageId: result.providerMessageId, sentAt: new Date(), lastError: null }
      });
      if (item.messageId) {
        await prisma.message.update({
          where: { id: item.messageId },
          data: { providerMessageId: result.providerMessageId, providerType: item.providerType, status: "SENT" }
        });
      }
      sent += 1;
    } catch (error) {
      const nextStatus = item.attemptCount + 1 >= item.maxAttempts ? "failed" : "retry";
      await prisma.messageSendQueue.update({
        where: { id: item.id },
        data: {
          status: nextStatus,
          lastError: error instanceof Error ? error.message : "Queue gönderim hatası.",
          nextAttemptAt: nextStatus === "retry" ? nextRetryAt(item.attemptCount + 1) : null,
          lockedAt: null
        }
      });
      failed += 1;
    }
  }

  return { checked: items.length, sent, failed };
}

function nextRetryAt(attempt: number) {
  const base = Math.min(15 * 60_000, 30_000 * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * 20_000);
  return new Date(Date.now() + base + jitter);
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return phone.trim();
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+9${digits}`;
  return `+${digits}`;
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return "{}";
  }
}
