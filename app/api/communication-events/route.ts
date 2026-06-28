import { NextResponse } from "next/server";
import { consumeIncomingMessage } from "@/lib/communication-event-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventType = String(body.eventType ?? "incoming_message");
    if (eventType !== "incoming_message") {
      return NextResponse.json({ error: "Bu endpoint şu an incoming_message eventini işler." }, { status: 400 });
    }

    const lineId = String(body.lineId ?? "");
    const providerType = String(body.providerType ?? "");
    const providerMessageId = String(body.providerMessageId ?? "");
    const fromPhone = String(body.fromPhone ?? "");
    const messageText = String(body.messageText ?? "").trim();

    if (!lineId || !providerType || !providerMessageId || !fromPhone || !messageText) {
      return NextResponse.json({ error: "lineId, providerType, providerMessageId, fromPhone ve messageText zorunlu." }, { status: 400 });
    }

    const result = await consumeIncomingMessage({
      lineId,
      providerType,
      providerMessageId,
      fromPhone,
      messageText,
      raw: body
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Communication event işlenemedi." }, { status: 500 });
  }
}
