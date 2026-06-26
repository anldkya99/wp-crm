import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeContact } from "@/lib/server/serializers";
import { formatName } from "@/lib/name";
import { automationEnabled, createAutomaticTaskOnce } from "@/lib/server/automation";

export async function POST(request: Request) {
  const body = await request.json();
  const data = contactPayload(body);
  const operatorId = String(body.operatorId ?? body.createdBy ?? "") || null;
  const canOverrideOwnership = isOwnershipAdmin(body.operatorRole);

  if (!data.name || !data.phone) {
    return NextResponse.json({ error: "Ad ve telefon zorunlu." }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(data.phone);
  const existingByNormalized = await findContactByNormalizedPhone(normalizedPhone);
  const ownershipConflict = !canOverrideOwnership && ownershipConflictFor(existingByNormalized, operatorId);
  if (ownershipConflict) {
    await prisma.timelineEvent.create({
      data: {
        memberId: existingByNormalized?.id,
        operatorId,
        eventType: "OWNERSHIP_CONFLICT",
        eventTitle: "Aynı numara farklı operatör tarafından girildi",
        eventDescription: `${data.phone} için admin izni gerekli.`,
        referenceType: "contact",
        referenceId: existingByNormalized?.id
      }
    });
    return NextResponse.json({
      error: "Bu müşteriyle daha önce farklı bir operatör tarafından iletişime geçildi. Devam etmek için admininizden iletişim izni alın.",
      conflict: {
        contactId: existingByNormalized?.id,
        phone: existingByNormalized?.phone,
        currentOwnerOperatorId: existingByNormalized?.ownerOperatorId
      }
    }, { status: 409 });
  }

  const existingContact = existingByNormalized ?? await prisma.contact.findUnique({ where: { phone: data.phone } });
  const ownershipData = existingContact?.ownerOperatorId
    ? {}
    : {
      ownerOperatorId: operatorId,
      ownershipStatus: operatorId ? "active" : "pool",
      assignedAt: operatorId ? new Date() : null,
      lastContactAt: new Date()
    };
  const contact = await prisma.contact.upsert({
    where: { phone: existingContact?.phone ?? data.phone },
    update: { ...data, ...ownershipData, isRegistered: true },
    create: { ...data, ...ownershipData, isRegistered: true }
  });
  await prisma.timelineEvent.create({
    data: {
      memberId: contact.id,
      operatorId,
      eventType: existingContact ? "MEMBER_UPDATED" : "MEMBER_CREATED",
      eventTitle: existingContact ? "Üye güncellendi" : "Üye oluşturuldu",
      eventDescription: `${contact.name} | ${contact.phone}`,
      referenceType: "contact",
      referenceId: contact.id
    }
  });
  if (!existingContact && await automationEnabled("new_member_task")) {
    await createAutomaticTaskOnce({
      contactId: contact.id,
      title: "İlk karşılama mesajı gönder",
      source: "Otomatik Sistem",
      sourceReferenceId: `new-member-${contact.id}`,
      createdBy: operatorId
    });
  }

  return NextResponse.json({ contact: serializeContact(contact) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "");
  const data = contactPayload(body);
  const operatorId = String(body.operatorId ?? body.createdBy ?? "") || null;
  const canOverrideOwnership = isOwnershipAdmin(body.operatorRole);

  if (!id || !data.name || !data.phone) {
    return NextResponse.json({ error: "Kişi id, ad ve telefon zorunlu." }, { status: 400 });
  }

  const previous = await prisma.contact.findUnique({ where: { id } });
  const normalizedPhone = normalizePhone(data.phone);
  const existingByNormalized = await findContactByNormalizedPhone(normalizedPhone);
  if (existingByNormalized && existingByNormalized.id !== id) {
    return NextResponse.json({ error: "Bu telefon numarası başka bir üye kaydıyla eşleşiyor." }, { status: 409 });
  }
  const ownershipConflict = !canOverrideOwnership && ownershipConflictFor(previous, operatorId);
  if (ownershipConflict) {
    return NextResponse.json({
      error: "Bu müşteriyle daha önce farklı bir operatör tarafından iletişime geçildi. Devam etmek için admininizden iletişim izni alın.",
      conflict: {
        contactId: previous?.id,
        phone: previous?.phone,
        currentOwnerOperatorId: previous?.ownerOperatorId
      }
    }, { status: 409 });
  }
  const contact = await prisma.contact.update({
    where: { id },
    data: { ...data, isRegistered: true }
  });
  const statusChanged = previous?.memberStatus !== contact.memberStatus;
  await prisma.timelineEvent.create({
    data: {
      memberId: contact.id,
      operatorId,
      eventType: statusChanged ? "MEMBER_STATUS_CHANGED" : "MEMBER_UPDATED",
      eventTitle: statusChanged ? "Üye durumu değiştirildi" : "Üye güncellendi",
      eventDescription: statusChanged ? `${previous?.memberStatus ?? "-"} → ${contact.memberStatus}` : `${contact.name} | ${contact.phone}`,
      referenceType: "contact",
      referenceId: contact.id
    }
  });

  return NextResponse.json({ contact: serializeContact(contact) });
}

async function findContactByNormalizedPhone(normalizedPhone: string) {
  if (!normalizedPhone) return null;
  const contacts = await prisma.contact.findMany();
  return contacts.find((contact) => normalizePhone(contact.phone) === normalizedPhone) ?? null;
}

function ownershipConflictFor(contact: { ownerOperatorId?: string | null; ownershipStatus?: string | null } | null, operatorId: string | null) {
  if (!contact || !operatorId) return false;
  if (contact.ownershipStatus === "blocked") return true;
  if (contact.ownershipStatus === "pool") return false;
  return Boolean(contact.ownerOperatorId && contact.ownerOperatorId !== operatorId);
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) return digits.slice(1);
  return digits;
}

function isOwnershipAdmin(value: unknown) {
  const role = String(value ?? "");
  return role === "Admin" || role === "COO";
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "");
  const operatorId = String(body.operatorId ?? body.createdBy ?? "") || null;

  if (!id) {
    return NextResponse.json({ error: "Kişi id zorunlu." }, { status: 400 });
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: { isRegistered: false, memberStatus: "Pasif" }
  });
  await prisma.timelineEvent.create({
    data: {
      memberId: contact.id,
      operatorId,
      eventType: "MEMBER_DEACTIVATED",
      eventTitle: "Üye pasifleştirildi",
      eventDescription: `${contact.name} | ${contact.phone}`,
      referenceType: "contact",
      referenceId: contact.id
    }
  });

  return NextResponse.json({ contact: serializeContact(contact) });
}

function contactPayload(body: Record<string, unknown>) {
  const firstName = formatName(String(body.firstName ?? ""));
  const lastName = formatName(String(body.lastName ?? ""));
  const legacyName = formatName(String(body.name ?? ""));
  const name = formatName(`${firstName} ${lastName}`.trim()) || legacyName;

  return {
    name,
    firstName: firstName || name.split(/\s+/)[0] || null,
    lastName: lastName || name.split(/\s+/).slice(1).join(" ") || null,
    username: stringOrNull(body.username),
    nationalId: stringOrNull(body.nationalId),
    phone: String(body.phone ?? "").trim(),
    gender: String(body.gender ?? "Belirtilmedi").trim(),
    note: String(body.note ?? "").trim(),
    memberStatus: normalizeMemberStatus(body.memberStatus),
    source: normalizeMemberSource(body.source)
  };
}

function stringOrNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeMemberStatus(value: unknown) {
  const status = String(value ?? "Aktif").trim();
  if (status === "Pasif" || status === "Riskli" || status === "VIP") return status;
  return "Aktif";
}

function normalizeMemberSource(value: unknown) {
  const source = String(value ?? "Manuel").trim();
  if (source === "WhatsApp" || source === "Chat" || source === "Bot" || source === "Diğer") return source;
  return "Manuel";
}
