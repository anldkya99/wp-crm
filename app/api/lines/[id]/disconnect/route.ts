import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { connectionEngine } from "@/lib/connection-engine/engine";
import { serializeCommunicationLine, serializeCommunicationSession } from "@/lib/server/serializers";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const operatorId = String(body.operatorId ?? "") || null;
    const result = await connectionEngine.stop(id, operatorId);
    const payload = await linePayload(id);
    return NextResponse.json({ ...payload, result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "WhatsApp bağlantısı kesilemedi." }, { status: 500 });
  }
}

async function linePayload(lineId: string) {
  const [line, session] = await Promise.all([
    prisma.communicationLine.findUnique({ where: { id: lineId } }),
    prisma.communicationSession.findUnique({ where: { lineId } })
  ]);
  if (!line) throw new Error("İletişim hattı bulunamadı.");
  return {
    line: serializeCommunicationLine(line),
    session: session ? serializeCommunicationSession(session) : null
  };
}
