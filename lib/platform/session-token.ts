import type { PlatformRole, Role } from "@/types/domain";
export { platformSessionCookieName, platformSessionMaxAgeSeconds } from "@/lib/platform/session-cookie";

export type PlatformSessionClaims = {
  userId: string;
  email: string;
  role: Role;
  platformRole: PlatformRole;
  issuedAt: number;
};

export function encodePlatformSessionPayload(claims: PlatformSessionClaims) {
  return Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
}

export function decodePlatformSessionPayload(payload: string): PlatformSessionClaims | null {
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<PlatformSessionClaims>;
    if (!claims.userId || !claims.email || !claims.role || !claims.platformRole || !claims.issuedAt) return null;
    return claims as PlatformSessionClaims;
  } catch {
    return null;
  }
}
