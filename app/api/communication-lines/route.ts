import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCommunicationLine } from "@/lib/server/serializers";

const statuses = new Set(["active", "passive", "connecting", "blocked", "disconnected", "qr_waiting", "connected", "replacement_pending", "archived"]);
const providerTypes = new Set(["whatsapp_web", "cloud_api", "manual"]);

export async function GET() {
  const lines = await prisma.communicationLine.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
  });
  return NextResponse.json({ lines: lines.map(serializeCommunicationLine) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const phoneNumber = String(body.phoneNumber ?? "").trim();
    const countryCode = String(body.countryCode ?? "+90").trim() || "+90";
    const providerType = normalizeProvider(body.providerType);
    const status = normalizeStatus(body.status);
    const notes = String(body.notes ?? "").trim() || null;
    const isDefault = Boolean(body.isDefault);
    const operatorId = String(body.operatorId ?? "") || null;
    const assignedOperatorId = String(body.assignedOperatorId ?? "") || null;
    const assignmentNote = String(body.assignmentNote ?? "").trim() || null;

    if (!name || !phoneNumber) {
      return NextResponse.json({ error: "Hat adı ve telefon zorunlu." }, { status: 400 });
    }

    const line = await prisma.$transaction(async (tx) => {
      if (isDefault) await tx.communicationLine.updateMany({ data: { isDefault: false, status: "passive" } });
      const created = await tx.communicationLine.create({
        data: {
          name,
          phoneNumber,
          countryCode,
          providerType,
          status: isDefault ? "active" : status,
          isDefault,
          notes,
          lastConnectedAt: isConnectedStatus(isDefault ? "active" : status) ? new Date() : null,
          blockedAt: status === "blocked" ? new Date() : null,
          assignedOperatorId,
          assignedAt: assignedOperatorId ? new Date() : null,
          assignedByAdminId: assignedOperatorId ? operatorId : null,
          assignmentNote
        }
      });
      await tx.timelineEvent.create({
        data: {
          operatorId,
          eventType: "LINE_CREATED",
          eventTitle: "Yeni iletişim hattı eklendi",
          eventDescription: `${created.name} - ${created.phoneNumber}`,
          referenceType: "communication_line",
          referenceId: created.id
        }
      });
      if (isDefault) {
        await tx.timelineEvent.create({
          data: {
            operatorId,
            eventType: "LINE_ACTIVE_CHANGED",
            eventTitle: "Aktif operasyon hattı değiştirildi",
            eventDescription: `${created.name} aktif hat yapıldı.`,
            referenceType: "communication_line",
            referenceId: created.id
          }
        });
      }
      return created;
    });

    return NextResponse.json({ line: serializeCommunicationLine(line), message: "Hat kaydedildi." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Hat kaydedilemedi." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id ?? "");
    const operatorId = String(body.operatorId ?? "") || null;
    const makeDefault = Boolean(body.makeDefault);
    const replaceWithLineId = String(body.replaceWithLineId ?? "");

    if (!id) return NextResponse.json({ error: "Hat ID zorunlu." }, { status: 400 });

    const line = await prisma.$transaction(async (tx) => {
      const current = await tx.communicationLine.findUnique({ where: { id } });
      if (!current) throw new Error("Hat bulunamadı.");

      if (makeDefault) {
        await tx.communicationLine.updateMany({ where: { id: { not: id } }, data: { isDefault: false, status: "passive" } });
        const updated = await tx.communicationLine.update({
          where: { id },
          data: { isDefault: true, status: "active", lastConnectedAt: new Date(), blockedAt: null }
        });
        await tx.timelineEvent.create({
          data: {
            operatorId,
            eventType: "LINE_ACTIVE_CHANGED",
            eventTitle: "Aktif operasyon hattı değiştirildi",
            eventDescription: `${updated.name} aktif hat yapıldı.`,
            referenceType: "communication_line",
            referenceId: updated.id
          }
        });
        return updated;
      }

      if (replaceWithLineId) {
        const replacement = await tx.communicationLine.findUnique({ where: { id: replaceWithLineId } });
        if (!replacement) throw new Error("Yeni hat bulunamadı.");
        await tx.communicationLine.updateMany({ where: { id: { not: replaceWithLineId } }, data: { isDefault: false } });
        const archivedOld = await tx.communicationLine.update({
          where: { id },
          data: {
            status: current.status === "blocked" ? "blocked" : "archived",
            isDefault: false,
            replacedByLineId: replacement.id,
            archivedAt: new Date()
          }
        });
        const updatedReplacement = await tx.communicationLine.update({
          where: { id: replacement.id },
          data: {
            status: "active",
            isDefault: true,
            replacementOfLineId: current.id,
            lastConnectedAt: new Date(),
            blockedAt: null
          }
        });
        await tx.conversation.updateMany({ where: { lineId: current.id }, data: { lineId: replacement.id } });
        await tx.timelineEvent.create({
          data: {
            operatorId,
            eventType: "LINE_REPLACED",
            eventTitle: "Hat değiştirildi",
            eventDescription: `${archivedOld.name} hattı ${updatedReplacement.name} hattı ile değiştirildi. Yeni gönderimler ${updatedReplacement.name} üzerinden yapılacak.`,
            referenceType: "communication_line",
            referenceId: updatedReplacement.id
          }
        });
        return updatedReplacement;
      }

      const data: {
        name?: string;
        phoneNumber?: string;
        countryCode?: string;
        providerType?: string;
        status?: string;
        isDefault?: boolean;
        notes?: string | null;
        lastConnectedAt?: Date | null;
        blockedAt?: Date | null;
        assignedOperatorId?: string | null;
        assignedAt?: Date | null;
        assignedByAdminId?: string | null;
        assignmentNote?: string | null;
      } = {};
      if ("name" in body) data.name = String(body.name ?? "").trim();
      if ("phoneNumber" in body) data.phoneNumber = String(body.phoneNumber ?? "").trim();
      if ("countryCode" in body) data.countryCode = String(body.countryCode ?? "+90").trim() || "+90";
      if ("providerType" in body) data.providerType = normalizeProvider(body.providerType);
      if ("status" in body) {
        const nextStatus = normalizeStatus(body.status);
        data.status = nextStatus;
        if (nextStatus === "blocked") data.blockedAt = new Date();
        if (isConnectedStatus(nextStatus)) data.lastConnectedAt = new Date();
        if (nextStatus === "blocked" || nextStatus === "disconnected" || nextStatus === "passive" || nextStatus === "replacement_pending" || nextStatus === "archived") data.isDefault = false;
      }
      if ("notes" in body) data.notes = String(body.notes ?? "").trim() || null;
      if ("assignedOperatorId" in body) {
        const nextOperatorId = String(body.assignedOperatorId ?? "") || null;
        data.assignedOperatorId = nextOperatorId;
        data.assignedAt = nextOperatorId ? new Date() : null;
        data.assignedByAdminId = nextOperatorId ? operatorId : null;
      }
      if ("assignmentNote" in body) data.assignmentNote = String(body.assignmentNote ?? "").trim() || null;

      const updated = await tx.communicationLine.update({ where: { id }, data });
      if ("assignedOperatorId" in body) {
        await tx.timelineEvent.create({
          data: {
            operatorId,
            eventType: "LINE_ASSIGNED",
            eventTitle: "Hat operatöre atandı",
            eventDescription: updated.assignedOperatorId ? `${updated.name} hattı operatöre atandı.` : `${updated.name} hattının operatör ataması kaldırıldı.`,
            referenceType: "communication_line",
            referenceId: updated.id
          }
        });
      }
      if (data.status) {
        await tx.timelineEvent.create({
          data: {
            operatorId,
            eventType: data.status === "blocked" ? "LINE_BLOCKED" : data.status === "disconnected" ? "LINE_DISCONNECTED" : isConnectedStatus(data.status) ? "LINE_CONNECTED" : "LINE_UPDATED",
            eventTitle: data.status === "blocked" ? "Hat kapandı / bloke oldu" : data.status === "disconnected" ? "Hat bağlantısı koptu" : isConnectedStatus(data.status) ? "Hat tekrar bağlandı" : "Hat güncellendi",
            eventDescription: `${updated.name} durumu: ${updated.status}`,
            referenceType: "communication_line",
            referenceId: updated.id
          }
        });
      }
      return updated;
    });

    return NextResponse.json({ line: serializeCommunicationLine(line), message: "Hat güncellendi." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Hat güncellenemedi." }, { status: 500 });
  }
}

function normalizeProvider(value: unknown) {
  const provider = String(value ?? "manual");
  return providerTypes.has(provider) ? provider : "manual";
}

function normalizeStatus(value: unknown) {
  const status = String(value ?? "passive");
  return statuses.has(status) ? status : "passive";
}

function isConnectedStatus(status: string) {
  return status === "active" || status === "connected";
}
