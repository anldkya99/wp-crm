import { createHmac, timingSafeEqual } from "crypto";
import type { PlatformSessionClaims } from "@/lib/platform/session-token";
import { decodePlatformSessionPayload, encodePlatformSessionPayload } from "@/lib/platform/session-token";

function sessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SESSION_SECRET or NEXTAUTH_SECRET is required in production.");
  return "operation-pact-local-dev-session-secret";
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createPlatformSessionToken(claims: PlatformSessionClaims) {
  const payload = encodePlatformSessionPayload(claims);
  return `${payload}.${sign(payload)}`;
}

export function verifyPlatformSessionToken(token: string | undefined) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  return decodePlatformSessionPayload(payload);
}
