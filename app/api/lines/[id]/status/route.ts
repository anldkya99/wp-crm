import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCommunicationLine, serializeCommunicationSession } from "@/lib/server/serializers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const [line, session] = await Promise.all([
      prisma.communicationLine.findUnique({ where: { id } }),
      prisma.communicationSession.findUnique({ where: { lineId: id } })
    ]);
    if (!line) return NextResponse.json({ error: "İletişim hattı bulunamadı." }, { status: 404 });
    return NextResponse.json({
      line: serializeCommunicationLine(line),
      session: session ? serializeCommunicationSession(session) : null
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Hat durumu alınamadı." }, { status: 500 });
  }
}
