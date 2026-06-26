import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeContact, serializeContactOwnershipRequest } from "@/lib/server/serializers";

export async function POST(request: Request) {
  const body = await request.json();
  const contactId = String(body.contactId ?? "");
  const requestedById = String(body.requestedByOperatorId ?? body.operatorId ?? "") || null;
  const note = String(body.note ?? "").trim();

  if (!contactId || !requestedById) {
    return NextResponse.json({ error: "Müşteri ve operatör bilgisi zorunlu." }, { status: 400 });
  }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });

  const existing = await prisma.contactOwnershipRequest.findFirst({
    where: { contactId, requestedById, status: "pending" },
    orderBy: { createdAt: "desc" }
  });
  if (existing) return NextResponse.json({ request: serializeContactOwnershipRequest(existing) });

  const ownershipRequest = await prisma.$transaction(async (tx) => {
    const created = await tx.contactOwnershipRequest.create({
      data: {
        contactId,
        customerPhone: contact.phone,
        requestedById,
        currentOwnerId: contact.ownerOperatorId,
        note
      }
    });
    await tx.timelineEvent.create({
      data: {
        memberId: contactId,
        operatorId: requestedById,
        eventType: "OWNERSHIP_PERMISSION_REQUESTED",
        eventTitle: "İletişim izin talebi açıldı",
        eventDescription: note || `${contact.phone} için admin izni istendi.`,
        referenceType: "ownership_request",
        referenceId: created.id
      }
    });
    return created;
  });

  return NextResponse.json({ request: serializeContactOwnershipRequest(ownershipRequest) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "");
  const action = String(body.action ?? "");
  const decidedByAdminId = String(body.decidedByAdminId ?? body.adminId ?? "") || null;
  const decisionNote = String(body.decisionNote ?? "").trim();

  if (!action || !decidedByAdminId) {
    return NextResponse.json({ error: "Talep, karar ve admin bilgisi zorunlu." }, { status: 400 });
  }

  if (action === "direct_transfer") {
    const contactId = String(body.contactId ?? "");
    const newOperatorId = String(body.newOperatorId ?? "");
    if (!contactId || !newOperatorId) {
      return NextResponse.json({ error: "Üye ve yeni operatör zorunlu." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const contact = await tx.contact.findUniqueOrThrow({ where: { id: contactId } });
      const operator = await tx.user.findUniqueOrThrow({ where: { id: newOperatorId } });
      const now = new Date();
      const updatedContact = await tx.contact.update({
        where: { id: contact.id },
        data: {
          ownerOperatorId: operator.id,
          ownershipStatus: "active",
          assignedAt: now,
          assignedByAdminId: decidedByAdminId,
          ownershipNotes: decisionNote || null
        }
      });
      await tx.timelineEvent.create({
        data: {
          memberId: contact.id,
          operatorId: decidedByAdminId,
          eventType: "OWNERSHIP_DIRECT_TRANSFER",
          eventTitle: "Üye operatöre devredildi",
          eventDescription: `${contact.phone} numaralı üye ${operator.name} operatörüne devredildi.${decisionNote ? ` Not: ${decisionNote}` : ""}`,
          referenceType: "contact",
          referenceId: contact.id
        }
      });
      if (Boolean(body.sendInfo) && String(body.infoMessage ?? "").trim()) {
        await tx.timelineEvent.create({
          data: {
            memberId: contact.id,
            operatorId: decidedByAdminId,
            eventType: "OWNERSHIP_TRANSFER_INFO_DRAFTED",
            eventTitle: "Transfer bilgilendirme taslağı hazırlandı",
            eventDescription: String(body.infoMessage).trim(),
            referenceType: "contact",
            referenceId: contact.id
          }
        });
      }
      return updatedContact;
    });

    return NextResponse.json({ contact: serializeContact(result), message: "Üye yeni operatöre devredildi." });
  }

  if (!id) {
    return NextResponse.json({ error: "Talep ID zorunlu." }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const ownershipRequest = await tx.contactOwnershipRequest.findUniqueOrThrow({ where: { id } });
    const contact = await tx.contact.findUniqueOrThrow({ where: { id: ownershipRequest.contactId } });
    const now = new Date();
    let status = "pending";
    let contactData: Record<string, unknown> = {};
    let eventTitle = "";
    let eventDescription = "";

    if (action === "approve") {
      status = "approved";
      contactData = {
        ownerOperatorId: ownershipRequest.requestedById,
        ownershipStatus: "active",
        assignedAt: now,
        assignedByAdminId: decidedByAdminId,
        ownershipNotes: decisionNote || null
      };
      eventTitle = "Müşteri devredildi";
      eventDescription = `Müşteri ${contact.phone}, yeni operatöre devredildi.`;
    } else if (action === "reject") {
      status = "rejected";
      eventTitle = "İletişim izin talebi reddedildi";
      eventDescription = `Müşteri ${contact.phone} mevcut operatörde bırakıldı.`;
    } else if (action === "pool") {
      status = "pooled";
      contactData = {
        ownerOperatorId: null,
        ownershipStatus: "pool",
        assignedByAdminId: decidedByAdminId,
        ownershipNotes: decisionNote || null
      };
      eventTitle = "Müşteri havuza alındı";
      eventDescription = `Müşteri ${contact.phone} operatörlerden kaldırıldı ve havuza alındı.`;
    } else if (action === "block") {
      status = "blocked";
      contactData = {
        ownershipStatus: "blocked",
        memberStatus: "Riskli",
        assignedByAdminId: decidedByAdminId,
        ownershipNotes: decisionNote || null
      };
      eventTitle = "Müşteri bloke edildi";
      eventDescription = `Müşteri ${contact.phone} riskli/blokeli olarak işaretlendi.`;
    } else {
      throw new Error("Geçersiz karar.");
    }

    const updatedContact = Object.keys(contactData).length
      ? await tx.contact.update({ where: { id: contact.id }, data: contactData })
      : contact;
    const updatedRequest = await tx.contactOwnershipRequest.update({
      where: { id },
      data: { status, decisionNote: decisionNote || null, decidedById: decidedByAdminId, decidedAt: now }
    });
    await tx.timelineEvent.create({
      data: {
        memberId: contact.id,
        operatorId: decidedByAdminId,
        eventType: `OWNERSHIP_${status.toUpperCase()}`,
        eventTitle,
        eventDescription,
        referenceType: "ownership_request",
        referenceId: id
      }
    });
    return { contact: updatedContact, request: updatedRequest };
  });

  return NextResponse.json({
    contact: serializeContact(result.contact),
    request: serializeContactOwnershipRequest(result.request)
  });
}
