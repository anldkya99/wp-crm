import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeConversation, serializeContact, serializeMessage } from "@/lib/server/serializers";

export async function POST(request: Request) {
  const body = await request.json();
  const contactId = String(body.contactId ?? "");
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const gender = String(body.gender ?? "Belirtilmedi").trim();
  const assignedOperatorId = String(body.assignedOperatorId ?? "") || null;

  if (!contactId && (!name || !phone)) {
    return NextResponse.json({ error: "Konuşma için müşteri seçin veya yeni müşteri bilgisi girin." }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const contact = contactId
      ? await tx.contact.findUniqueOrThrow({ where: { id: contactId } })
      : await tx.contact.upsert({
          where: { phone },
          update: { name, gender, isRegistered: true },
          create: { name, phone, gender, isRegistered: true }
        });

    const conversation = await tx.conversation.create({
      data: {
        contactId: contact.id,
        assignedOperatorId,
        status: "NEW",
        lastMessageAt: new Date()
      },
      include: { messages: { select: { senderType: true, status: true } } }
    });

    const message = await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "SYSTEM",
        messageText: "Yeni konuşma oluşturuldu.",
        status: "SENT",
        createdBy: assignedOperatorId
      }
    });

    return { contact, conversation, message };
  });

  return NextResponse.json(
    {
      contact: serializeContact(result.contact),
      conversation: serializeConversation(result.conversation),
      message: serializeMessage(result.message)
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "");

  if (!id) {
    return NextResponse.json({ error: "Konuşma id zorunlu." }, { status: 400 });
  }

  const data: { isArchived?: boolean; isMuted?: boolean } = {};
  if ("isArchived" in body) data.isArchived = Boolean(body.isArchived);
  if ("isMuted" in body) data.isMuted = Boolean(body.isMuted);

  const conversation = await prisma.conversation.update({
    where: { id },
    data,
    include: { messages: { select: { senderType: true, status: true } } }
  });

  return NextResponse.json({ conversation: serializeConversation(conversation) });
}
