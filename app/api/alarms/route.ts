import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeAlarm } from "@/lib/server/serializers";

export async function POST(request: Request) {
  const body = await request.json();
  const alarmDate = String(body.alarmDate ?? "");
  const alarmTime = String(body.alarmTime ?? "");
  const note = String(body.note ?? "").trim();
  const createdBy = String(body.createdBy ?? "") || null;
  const scheduledAt = new Date(`${alarmDate}T${alarmTime || "00:00"}:00`);

  if (!alarmDate || !alarmTime || !note || Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Alarm tarihi, saati ve notu zorunlu." }, { status: 400 });
  }

  const alarm = await prisma.alarm.create({
    data: { scheduledAt, note, createdBy }
  });

  return NextResponse.json({ alarm: serializeAlarm(alarm) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "");
  const action = String(body.action ?? "");

  if (!id) {
    return NextResponse.json({ error: "Alarm id zorunlu." }, { status: 400 });
  }

  const data =
    action === "snooze"
      ? { status: "SNOOZED" as const, scheduledAt: new Date(Date.now() + 10 * 60 * 1000) }
      : action === "complete"
        ? { status: "COMPLETED" as const }
        : { status: "CLOSED" as const };

  const alarm = await prisma.alarm.update({
    where: { id },
    data
  });

  return NextResponse.json({ alarm: serializeAlarm(alarm) });
}
