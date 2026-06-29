import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { connectionEngine } from "@/lib/connection-engine/engine";
import { serializeCommunicationLine, serializeCommunicationSession } from "@/lib/server/serializers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    return NextResponse.json(await qrPayload(id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "QR bilgisi alınamadı." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const operatorId = String(body.operatorId ?? "") || null;
    const result = await connectionEngine.requestQr(id, operatorId);
    return NextResponse.json({ ...(await qrPayload(id)), result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "QR oluşturulamadı." }, { status: 500 });
  }
}

async function qrPayload(lineId: string) {
  const [line, session] = await Promise.all([
    prisma.communicationLine.findUnique({ where: { id: lineId } }),
    prisma.communicationSession.findUnique({ where: { lineId } })
  ]);
  if (!line) throw new Error("İletişim hattı bulunamadı.");
  const qr = session?.qrCode ?? null;
  return {
    line: serializeCommunicationLine(line),
    session: session ? serializeCommunicationSession(session) : null,
    qr,
    hasQr: Boolean(qr),
    qrUpdatedAt: session?.lastQrAt?.toISOString() ?? line.qrUpdatedAt?.toISOString() ?? null,
    status: line.connectionStatus ?? (session?.sessionStatus === "qr_generated" ? "qr_pending" : session?.sessionStatus ?? "disconnected")
  };
}
