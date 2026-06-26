import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { whatsappSessionManager } from "@/lib/whatsapp/session-manager";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lineId = searchParams.get("lineId") ?? "";
  const where = lineId ? { lineId } : {};
  const logs = await prisma.whatsAppSessionLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log.id,
      lineId: log.lineId,
      eventType: log.eventType,
      status: log.status,
      details: log.details ?? undefined,
      createdAt: log.createdAt.toISOString()
    }))
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action ?? "");
    const lineId = String(body.lineId ?? "");
    const operatorId = String(body.operatorId ?? "") || null;

    if (!lineId) return NextResponse.json({ error: "Hat ID zorunlu." }, { status: 400 });

    const result =
      action === "start"
        ? await whatsappSessionManager.start(lineId, operatorId)
        : action === "stop"
          ? await whatsappSessionManager.stop(lineId, operatorId)
          : action === "reconnect"
            ? await whatsappSessionManager.reconnect(lineId, operatorId)
            : action === "health"
              ? await whatsappSessionManager.healthCheck(lineId)
              : null;

    if (!result) return NextResponse.json({ error: "Geçersiz session aksiyonu." }, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Session işlemi tamamlanamadı." }, { status: 500 });
  }
}
