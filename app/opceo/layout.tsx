import { cookies } from "next/headers";
import { forbidden } from "next/navigation";
import type { ReactNode } from "react";
import { OpCeoShell } from "@/app/opceo/_components/opceo-shell";
import { createPermissionResolver } from "@/lib/platform/permission-engine";
import { getAuthorizedOpCeoNavigation } from "@/lib/platform/opceo-navigation";
import { verifyPlatformSessionToken } from "@/lib/platform/server-session";
import { platformSessionCookieName } from "@/lib/platform/session-cookie";

export default async function OpCeoLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const claims = verifyPlatformSessionToken(cookieStore.get(platformSessionCookieName)?.value);
  const resolver = createPermissionResolver({
    userId: claims?.userId,
    platformRole: claims?.platformRole
  });

  if (!resolver.canAccessModule("OP_CEO")) forbidden();

  return <OpCeoShell navigation={getAuthorizedOpCeoNavigation(resolver)}>{children}</OpCeoShell>;
}
