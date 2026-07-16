import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPermissionResolver } from "@/lib/platform/permission-engine";
import { provisionCompany, ProvisioningError, type CompanyProvisioningRequest } from "@/lib/platform/provisioning-engine";
import { verifyPlatformSessionToken } from "@/lib/platform/server-session";
import { platformSessionCookieName } from "@/lib/platform/session-cookie";

async function getProvisioningResolver() {
  const cookieStore = await cookies();
  const claims = verifyPlatformSessionToken(cookieStore.get(platformSessionCookieName)?.value);
  return {
    claims,
    resolver: createPermissionResolver({
      userId: claims?.userId,
      platformRole: claims?.platformRole
    })
  };
}

export async function POST(request: Request) {
  const { claims, resolver } = await getProvisioningResolver();
  if (!resolver.canAccessModule("OP_CEO") || !resolver.canManageCompany()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Omit<CompanyProvisioningRequest, "actorId">;
    const result = await prisma.$transaction((tx) =>
      provisionCompany(tx, {
        ...body,
        actorId: claims?.userId
      })
    );

    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    if (error instanceof ProvisioningError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "Company provisioning failed.", code: "TRANSACTION_FAILURE" }, { status: 500 });
  }
}
