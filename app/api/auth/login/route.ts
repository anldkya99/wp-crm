import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { userRoleLabels } from "@/lib/status";
import { verifyPassword } from "@/lib/server/password";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre zorunlu." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE" || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Giriş bilgileri hatalı." }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: userRoleLabels[user.role]
    }
  });
}
