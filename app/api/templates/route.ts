import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTemplate } from "@/lib/server/serializers";

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const hashtag = normalizeHashtag(String(body.hashtag ?? title));
  const content = String(body.content ?? "").trim();
  const isActive = Boolean(body.isActive ?? true);
  const isPinned = Boolean(body.isPinned ?? false);

  if (!title || !content) {
    return NextResponse.json({ error: "Şablon adı ve içeriği zorunlu." }, { status: 400 });
  }

  const template = await prisma.messageTemplate.create({
    data: { title, hashtag, content, isActive, isPinned }
  });

  return NextResponse.json({ template: serializeTemplate(template) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "");

  if (!id) {
    return NextResponse.json({ error: "Şablon id zorunlu." }, { status: 400 });
  }

  const data: {
    title?: string;
    hashtag?: string;
    content?: string;
    isActive?: boolean;
    isPinned?: boolean;
  } = {};

  if ("title" in body) data.title = String(body.title ?? "").trim();
  if ("hashtag" in body) data.hashtag = normalizeHashtag(String(body.hashtag ?? data.title ?? ""));
  if ("content" in body) data.content = String(body.content ?? "").trim();
  if ("isActive" in body) data.isActive = Boolean(body.isActive);
  if ("isPinned" in body) data.isPinned = Boolean(body.isPinned);

  if ((data.title !== undefined && !data.title) || (data.content !== undefined && !data.content)) {
    return NextResponse.json({ error: "Şablon adı ve içeriği zorunlu." }, { status: 400 });
  }

  const template = await prisma.messageTemplate.update({
    where: { id },
    data
  });

  return NextResponse.json({ template: serializeTemplate(template) });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "");

  if (!id) {
    return NextResponse.json({ error: "Şablon id zorunlu." }, { status: 400 });
  }

  await prisma.messageTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

function normalizeHashtag(value: string) {
  return value.trim().replace(/^#+/, "");
}
