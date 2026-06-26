import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toRequestStatus } from "@/lib/status";
import { formatName } from "@/lib/name";
import { serializeConversation, serializeContact, serializeMessage, serializeRequest } from "@/lib/server/serializers";
import { automationEnabled, createAutomaticTaskOnce, minutesFromNow } from "@/lib/server/automation";

export async function POST(request: Request) {
  const body = await request.json();
  const firstName = formatName(String(body.firstName ?? body.name ?? ""));
  const lastName = formatName(String(body.lastName ?? ""));
  const name = formatName(`${firstName} ${lastName}`.trim());
  const username = stringOrNull(body.username);
  const nationalId = stringOrNull(body.nationalId);
  const phone = String(body.phone ?? "").trim();
  const gender = String(body.gender ?? "Belirtilmedi").trim();
  const amount = Number(body.amount ?? 0);
  const note = String(body.note ?? "");
  const requestType = normalizeRequestType(body.requestType);
  const betId = String(body.betId ?? "").trim();
  const gameName = String(body.gameName ?? "").trim();
  const createdBy = String(body.createdBy ?? "") || null;
  const startConversation = Boolean(body.startConversation);

  if (!firstName || !phone) {
    return NextResponse.json({ error: "Ad ve telefon zorunlu." }, { status: 400 });
  }
  if (requestType === "Bahis detayı" && (!betId || !gameName)) {
    return NextResponse.json({ error: "Bahis detayı için Bahis ID ve Oyun ismi zorunlu." }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const contact = await tx.contact.upsert({
      where: { phone },
      update: { name, gender },
      create: { name, phone, gender }
    });

    const requestRow = await tx.request.create({
      data: {
        contactId: contact.id,
        amount: Number.isFinite(amount) ? amount : 0,
        status: "WAITING",
        note,
        firstName,
        lastName: lastName || null,
        username,
        nationalId,
        phone,
        gender,
        requestType,
        bonusAmount: toNullableNumber(body.bonusAmount),
        bonusDescription: stringOrNull(body.bonusDescription),
        giftAmount: toNullableNumber(body.giftAmount),
        giftDescription: stringOrNull(body.giftDescription),
        correctionDirection: stringOrNull(body.correctionDirection),
        correctionAmount: toNullableNumber(body.correctionAmount),
        correctionDescription: stringOrNull(body.correctionDescription),
        betId: betId || null,
        gameName: gameName || null,
        betDescription: stringOrNull(body.betDescription),
        commandText: stringOrNull(body.commandText),
        createdBy
      }
    });

    await tx.timelineEvent.create({
      data: {
        memberId: contact.id,
        operatorId: createdBy,
        eventType: "REQUEST_CREATED",
        eventTitle: "Talep oluşturuldu",
        eventDescription: `Tür: ${requestType}`,
        referenceType: "request",
        referenceId: requestRow.id,
        createdAt: requestRow.createdAt
      }
    });

    if (!startConversation) {
      return { contact, requestRow, conversation: null, message: null };
    }

    const conversation =
      (await tx.conversation.findFirst({ where: { contactId: contact.id, status: { not: "CLOSED" } } })) ??
      (await tx.conversation.create({
        data: {
          contactId: contact.id,
          assignedOperatorId: createdBy,
          status: "NEW",
          lastMessageAt: new Date()
        }
      }));

    const message = await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "SYSTEM",
        messageText: "Talep kaydı üzerinden konuşma başlatıldı.",
        status: "SENT",
        createdBy
      }
    });

    const updatedConversation = await tx.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: message.createdAt },
      include: { messages: { select: { senderType: true, status: true } } }
    });

    return { contact, requestRow, conversation: updatedConversation, message };
  });

  if (await automationEnabled("request_control_task")) {
    await createAutomaticTaskOnce({
      contactId: result.contact.id,
      title: "Talep durumunu kontrol et",
      source: "Talep",
      sourceReferenceId: result.requestRow.id,
      dueAt: minutesFromNow(30),
      createdBy
    });
  }

  return NextResponse.json(
    {
      contact: serializeContact(result.contact),
      request: serializeRequest(result.requestRow),
      conversation: result.conversation ? serializeConversation(result.conversation) : null,
      message: result.message ? serializeMessage(result.message) : null
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "");
  const data: { status?: ReturnType<typeof toRequestStatus>; note?: string } = {};

  if (!id) {
    return NextResponse.json({ error: "Talep id zorunlu." }, { status: 400 });
  }

  if ("status" in body) data.status = toRequestStatus(body.status ?? "Yeni");
  if ("note" in body) data.note = String(body.note ?? "");

  const requestRow = await prisma.$transaction(async (tx) => {
    const previous = await tx.request.findUnique({ where: { id } });
    if (!previous) throw new Error("Talep bulunamadı.");
    const updated = await tx.request.update({
      where: { id },
      data
    });
    if (data.status && data.status !== previous.status) {
      await tx.timelineEvent.create({
        data: {
          memberId: updated.contactId,
          operatorId: String(body.createdBy ?? "") || null,
          eventType: requestTimelineEventType(data.status),
          eventTitle: requestTimelineEventTitle(data.status),
          eventDescription: `Tür: ${updated.requestType}`,
          referenceType: "request",
          referenceId: updated.id,
          createdAt: updated.updatedAt
        }
      });
    }
    return updated;
  });

  if (requestRow.status === "COMPLETED" && await automationEnabled("request_control_task")) {
    await createAutomaticTaskOnce({
      contactId: requestRow.contactId,
      title: "Memnuniyet kontrolü yap",
      source: "Talep",
      sourceReferenceId: `completed-${requestRow.id}`,
      dueAt: minutesFromNow(120),
      createdBy: String(body.createdBy ?? "") || null
    });
  }

  return NextResponse.json({ request: serializeRequest(requestRow) });
}

function normalizeRequestType(value: unknown) {
  const requestType = String(value ?? "Bonus").trim();
  if (requestType === "Nakit hediye" || requestType === "Düzeltme alt/üst" || requestType === "Bahis detayı") return requestType;
  return "Bonus";
}

function toNullableNumber(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const numberValue = Number(raw.replace(",", "."));
  return Number.isFinite(numberValue) ? numberValue : null;
}

function stringOrNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function requestTimelineEventType(status: ReturnType<typeof toRequestStatus>) {
  if (status === "WAITING") return "REQUEST_WAITING";
  if (status === "COMPLETED") return "REQUEST_COMPLETED";
  if (status === "NEW" || status === "IN_PROGRESS") return "REQUEST_REOPENED";
  return "REQUEST_UPDATED";
}

function requestTimelineEventTitle(status: ReturnType<typeof toRequestStatus>) {
  if (status === "WAITING") return "Talep beklemeye alındı";
  if (status === "COMPLETED") return "Talep tamamlandı";
  if (status === "NEW" || status === "IN_PROGRESS") return "Talep geri açıldı";
  return "Talep güncellendi";
}
