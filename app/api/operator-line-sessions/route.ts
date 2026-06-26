import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeOperatorLineSession } from "@/lib/server/serializers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const operatorId = String(body.operatorId ?? "");
    const lineId = String(body.lineId ?? "");
    const slotNumber = Number(body.slotNumber ?? 0);

    if (!operatorId || !lineId || slotNumber < 1 || slotNumber > 5) {
      return NextResponse.json({ error: "Operatör, hat ve 1-5 arası slot zorunlu." }, { status: 400 });
    }

    const usedLine = await prisma.operatorLineSession.findFirst({
      where: {
        lineId,
        isActive: true,
        NOT: { operatorId, slotNumber }
      }
    });
    if (usedLine) {
      return NextResponse.json({ error: "Bu iletişim hattı başka bir oturumda kullanılmaktadır." }, { status: 409 });
    }

    const session = await prisma.operatorLineSession.upsert({
      where: { operatorId_slotNumber: { operatorId, slotNumber } },
      update: { lineId, isActive: true, openedAt: new Date(), lastUsedAt: new Date() },
      create: { operatorId, lineId, slotNumber, isActive: true, openedAt: new Date(), lastUsedAt: new Date() }
    });

    return NextResponse.json({ session: serializeOperatorLineSession(session), message: "Oturum slotu kaydedildi." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Oturum kaydedilemedi." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id ?? "");
    const session = id
      ? await prisma.operatorLineSession.update({ where: { id }, data: { lastUsedAt: new Date(), openedAt: new Date(), isActive: true } })
      : await prisma.operatorLineSession.update({
          where: { operatorId_slotNumber: { operatorId: String(body.operatorId ?? ""), slotNumber: Number(body.slotNumber ?? 0) } },
          data: { lastUsedAt: new Date(), openedAt: new Date(), isActive: true }
        });

    const usedLine = await prisma.operatorLineSession.findFirst({
      where: { lineId: session.lineId, isActive: true, id: { not: session.id } }
    });
    if (usedLine) {
      await prisma.operatorLineSession.update({ where: { id: session.id }, data: { isActive: false } });
      return NextResponse.json({ error: "Bu iletişim hattı başka bir oturumda kullanılmaktadır." }, { status: 409 });
    }

    return NextResponse.json({ session: serializeOperatorLineSession(session) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Oturum güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id ?? "");
    const operatorId = String(body.operatorId ?? "");
    const slotNumber = Number(body.slotNumber ?? 0);

    const session = id
      ? await prisma.operatorLineSession.update({ where: { id }, data: { isActive: false, lastUsedAt: new Date() } })
      : await prisma.operatorLineSession.update({
          where: { operatorId_slotNumber: { operatorId, slotNumber } },
          data: { isActive: false, lastUsedAt: new Date() }
        });

    return NextResponse.json({ session: serializeOperatorLineSession(session), message: "Oturum kapatıldı." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Oturum kapatılamadı." }, { status: 500 });
  }
}
