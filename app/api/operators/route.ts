import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/server/password";
import { serializeOperator } from "@/lib/server/serializers";
import { toUserRole, toUserStatus } from "@/lib/status";

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const role = toUserRole(String(body.role ?? "Operatör"));
  const status = toUserStatus(String(body.status ?? "Aktif"));
  const teamLeadId = String(body.teamLeadId ?? "").trim() || null;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Ad, e-posta ve şifre zorunlu." }, { status: 400 });
  }

  const operator = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role,
      status,
      teamLeadId: role === "OPERATOR" ? teamLeadId : null
    }
  });

  return NextResponse.json({ operator: serializeOperator(operator) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "");

  if (!id) {
    return NextResponse.json({ error: "Operatör id zorunlu." }, { status: 400 });
  }

  const data: {
    ttsDailyLimit?: number;
    role?: ReturnType<typeof toUserRole>;
    status?: ReturnType<typeof toUserStatus>;
    teamLeadId?: string | null;
  } = {};

  if ("ttsDailyLimit" in body) {
    const ttsDailyLimit = Number(body.ttsDailyLimit ?? 0);
    if (!Number.isFinite(ttsDailyLimit) || ttsDailyLimit < 0) {
      return NextResponse.json({ error: "TTS limiti geçerli bir sayı olmalı." }, { status: 400 });
    }
    data.ttsDailyLimit = Math.floor(ttsDailyLimit);
  }
  if ("role" in body) data.role = toUserRole(String(body.role ?? "Operatör"));
  if ("status" in body) data.status = toUserStatus(String(body.status ?? "Aktif"));
  if ("teamLeadId" in body) data.teamLeadId = String(body.teamLeadId ?? "").trim() || null;
  if (data.role && data.role !== "OPERATOR") data.teamLeadId = null;

  const operator = await prisma.user.update({
    where: { id },
    data
  });

  return NextResponse.json({ operator: serializeOperator(operator) });
}
