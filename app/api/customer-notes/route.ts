import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCustomerNote } from "@/lib/server/serializers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const contactId = String(body.contactId ?? "");
    const noteText = String(body.noteText ?? "").trim();
    const createdBy = body.createdBy ? String(body.createdBy) : null;

    if (!contactId) {
      return NextResponse.json({ error: "Müşteri seçimi zorunlu." }, { status: 400 });
    }
    if (!noteText) {
      return NextResponse.json({ error: "Not metni zorunlu." }, { status: 400 });
    }

    const note = await prisma.$transaction(async (tx) => {
      const created = await tx.customerNote.create({
        data: { contactId, noteText, createdBy },
        include: { creator: { select: { name: true } } }
      });
      await tx.timelineEvent.create({
        data: {
          memberId: contactId,
          operatorId: createdBy,
          eventType: "NOTE_ADDED",
          eventTitle: "Not eklendi",
          eventDescription: noteText.slice(0, 240),
          referenceType: "customer_note",
          referenceId: created.id,
          createdAt: created.createdAt
        }
      });
      return created;
    });

    return NextResponse.json({ note: serializeCustomerNote(note), message: "Müşteri notu kaydedildi." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Müşteri notu kaydedilemedi." }, { status: 500 });
  }
}
