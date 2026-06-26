import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeAutomationSetting } from "@/lib/server/serializers";

export async function PATCH(request: Request) {
  const body = await request.json();
  const key = String(body.key ?? "");
  const enabled = Boolean(body.enabled);
  const value = body.value === undefined ? undefined : String(body.value ?? "");

  if (!key) {
    return NextResponse.json({ error: "Ayar anahtarı zorunlu." }, { status: 400 });
  }

  const setting = await prisma.automationRuleSetting.upsert({
    where: { key },
    update: { enabled, ...(value !== undefined ? { value } : {}) },
    create: { key, enabled, value: value ?? null }
  });

  return NextResponse.json({ setting: serializeAutomationSetting(setting) });
}
