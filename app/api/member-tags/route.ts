import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeContact } from "@/lib/server/serializers";

const contactInclude = { tagRelations: { include: { tag: true } } };

export async function POST(request: Request) {
  const body = await request.json();
  const memberId = String(body.memberId ?? "");
  const tagId = String(body.tagId ?? "");
  const operatorId = String(body.operatorId ?? "") || null;

  if (!memberId || !tagId) {
    return NextResponse.json({ error: "Üye ve etiket seçimi zorunlu." }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const tag = await tx.memberTag.findUniqueOrThrow({ where: { id: tagId } });
    await tx.memberTagRelation.upsert({
      where: { memberId_tagId: { memberId, tagId } },
      update: {},
      create: { memberId, tagId }
    });
    await tx.timelineEvent.create({
      data: {
        memberId,
        operatorId,
        eventType: "TAG_ADDED",
        eventTitle: "Etiket eklendi",
        eventDescription: tag.name,
        referenceType: "member_tag",
        referenceId: tagId
      }
    });
    return tx.contact.findUniqueOrThrow({ where: { id: memberId }, include: contactInclude });
  });

  return NextResponse.json({ contact: serializeContact(result) });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const memberId = String(body.memberId ?? "");
  const tagId = String(body.tagId ?? "");
  const operatorId = String(body.operatorId ?? "") || null;

  if (!memberId || !tagId) {
    return NextResponse.json({ error: "Üye ve etiket seçimi zorunlu." }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const tag = await tx.memberTag.findUniqueOrThrow({ where: { id: tagId } });
    await tx.memberTagRelation.deleteMany({ where: { memberId, tagId } });
    await tx.timelineEvent.create({
      data: {
        memberId,
        operatorId,
        eventType: "TAG_REMOVED",
        eventTitle: "Etiket kaldırıldı",
        eventDescription: tag.name,
        referenceType: "member_tag",
        referenceId: tagId
      }
    });
    return tx.contact.findUniqueOrThrow({ where: { id: memberId }, include: contactInclude });
  });

  return NextResponse.json({ contact: serializeContact(result) });
}
