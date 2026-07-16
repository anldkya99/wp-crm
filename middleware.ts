import { NextRequest, NextResponse } from "next/server";
import { canAccessOpCeoRoutes } from "@/lib/platform/permissions";
import { platformSessionCookieName, platformSessionMaxAgeSeconds } from "@/lib/platform/session-cookie";
import type { PlatformRole } from "@/types/domain";

type MiddlewareSessionClaims = {
  platformRole?: PlatformRole;
  issuedAt?: number;
};

function sessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SESSION_SECRET or NEXTAUTH_SECRET is required in production.");
  return "operation-pact-local-dev-session-secret";
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function base64UrlToText(value: string) {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

async function verifySignature(payload: string, signature: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  const actual = base64UrlToBytes(signature);
  if (actual.length !== expected.length) return false;

  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= expected[index] ^ actual[index];
  }
  return diff === 0;
}

async function getPlatformClaims(request: NextRequest) {
  const token = request.cookies.get(platformSessionCookieName)?.value;
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !(await verifySignature(payload, signature))) return null;

  try {
    const claims = JSON.parse(base64UrlToText(payload)) as MiddlewareSessionClaims;
    if (!claims.issuedAt || Date.now() - claims.issuedAt > platformSessionMaxAgeSeconds * 1000) return null;
    return claims;
  } catch {
    return null;
  }
}

function unauthorized(request: NextRequest) {
  const acceptsJson = request.headers.get("accept")?.includes("application/json");
  if (acceptsJson) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return new NextResponse("Unauthorized", {
    status: 403,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}

export async function middleware(request: NextRequest) {
  const claims = await getPlatformClaims(request);
  if (!canAccessOpCeoRoutes(claims?.platformRole)) return unauthorized(request);

  return NextResponse.next();
}

export const config = {
  matcher: ["/opceo/:path*"]
};
