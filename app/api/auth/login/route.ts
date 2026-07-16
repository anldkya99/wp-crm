import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { platformSessionCookieName, platformSessionMaxAgeSeconds } from "@/lib/platform/session-token";
import { createPlatformSessionToken } from "@/lib/platform/server-session";
import { createPermissionResolver } from "@/lib/platform/permission-engine";
import { normalizePlatformRole, userRoleLabels } from "@/lib/status";
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

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: userRoleLabels[user.role],
    platformRole: normalizePlatformRole(user.platformRole, user.role)
  };
  const permissionResolver = createPermissionResolver({
    userId: sessionUser.id,
    platformRole: sessionUser.platformRole,
    companyId: user.companyId
  });
  const redirectTo = permissionResolver.canAccessModule("OP_CEO") ? "/opceo/panel" : null;

  const response = NextResponse.json({
    redirectTo,
    user: {
      id: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email,
      role: sessionUser.role,
      platformRole: sessionUser.platformRole
    }
  });

  response.cookies.set({
    name: platformSessionCookieName,
    value: createPlatformSessionToken({
      userId: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.role,
      platformRole: sessionUser.platformRole,
      issuedAt: Date.now()
    }),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: platformSessionMaxAgeSeconds
  });

  return response;
}
