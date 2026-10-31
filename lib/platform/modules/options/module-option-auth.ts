import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createPermissionResolver } from "@/lib/platform/permission-engine";
import { platformSessionCookieName } from "@/lib/platform/session-cookie";
import { verifyPlatformSessionToken } from "@/lib/platform/server-session";
import type { ModuleOptionActorContext } from "@/lib/platform/modules/options/module-option-context";

export async function resolveModuleOptionActorContext(): Promise<ModuleOptionActorContext | null> {
  const cookieStore = await cookies();
  const claims = verifyPlatformSessionToken(cookieStore.get(platformSessionCookieName)?.value);
  if (!claims?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: claims.userId },
    select: { id: true, platformRole: true, companyId: true, status: true }
  });
  if (!user || user.status !== "ACTIVE") return null;

  return {
    actorId: user.id,
    resolver: createPermissionResolver({
      userId: user.id,
      platformRole: user.platformRole,
      companyId: user.companyId
    })
  };
}
