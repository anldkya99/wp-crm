import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeVoiceTemplate } from "@/lib/server/serializers";

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();

  if (!title || !content) {
    return NextResponse.json({ error: "Şablon adı ve metin zorunlu." }, { status: 400 });
  }

  const template = await prisma.voiceTemplate.create({
    data: { title, content, isActive: true }
  });

  return NextResponse.json({ template: serializeVoiceTemplate(template) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "");

  if (!id) {
    return NextResponse.json({ error: "Şablon id zorunlu." }, { status: 400 });
  }

  const template = await prisma.voiceTemplate.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: String(body.title ?? "").trim() } : {}),
      ...(body.content !== undefined ? { content: String(body.content ?? "").trim() } : {}),
      ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {})
    }
  });

  return NextResponse.json({ template: serializeVoiceTemplate(template) });
}
