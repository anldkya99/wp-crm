import { NextResponse } from "next/server";
import type { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeTask } from "@/lib/server/serializers";

const taskInclude = {
  notes: {
    orderBy: { createdAt: "desc" as const },
    include: { creator: { select: { name: true } } }
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const scope = searchParams.get("scope");
  const selectedDate = parseTaskDate(dateParam ?? "");

  const where =
    scope === "today"
      ? { taskDate: selectedDate }
      : scope === "past"
        ? { taskDate: { lt: selectedDate } }
        : dateParam
          ? { taskDate: selectedDate }
          : {};

  const tasks = await prisma.dailyTask.findMany({
    where,
    orderBy: [{ taskDate: "desc" }, { createdAt: "desc" }],
    include: taskInclude
  });

  return NextResponse.json({
    tasks: tasks.map(serializeTask),
    overduePendingTaskCount: tasks.filter((task) => task.taskDate < selectedDate && task.status === "PENDING").length
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const contactIds: string[] = Array.isArray(body.contactIds) ? body.contactIds.filter(Boolean).map(String) : [];
    const taskDate = parseTaskDate(String(body.taskDate ?? ""));
    const dueAt = body.dueAt ? new Date(String(body.dueAt)) : null;
    const source = normalizeTaskSource(body.source);
    const sourceReferenceId = String(body.sourceReferenceId ?? "").trim() || null;
    const createdBy = body.createdBy ? String(body.createdBy) : null;

    if (!title) {
      return NextResponse.json({ message: "Görev başlığı zorunlu." }, { status: 400 });
    }
    if (contactIds.length === 0) {
      return NextResponse.json({ message: "En az bir kişi seçilmeli." }, { status: 400 });
    }

    const existingTasks = await prisma.dailyTask.findMany({
      where: { title, taskDate, contactId: { in: contactIds }, source },
      select: { contactId: true }
    });
    const existingContactIds = new Set(existingTasks.map((task) => task.contactId));
    const newContactIds = contactIds.filter((contactId) => !existingContactIds.has(contactId));

    if (newContactIds.length === 0) {
      return NextResponse.json({ tasks: [], message: "Bu görev seçilen kişiler için bugün zaten kayıtlı." }, { status: 200 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const rows = [];
      for (const contactId of newContactIds) {
        const task = await tx.dailyTask.create({
          data: { title, contactId, taskDate, dueAt, source, sourceReferenceId, createdBy },
          include: taskInclude
        });
        await tx.timelineEvent.create({
          data: {
            memberId: contactId,
            operatorId: createdBy,
            eventType: "TASK_CREATED",
            eventTitle: "Görev oluşturuldu",
            eventDescription: title,
            referenceType: "task",
            referenceId: task.id,
            createdAt: task.createdAt
          }
        });
        rows.push(task);
      }
      return rows;
    });

    return NextResponse.json({
      tasks: created.map(serializeTask),
      skippedCount: contactIds.length - newContactIds.length,
      message: created.length > 0 ? "Görev kaydedildi." : "Yeni görev oluşturulmadı."
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Görev kaydedilemedi." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id ?? "");
    const noteText = String(body.note ?? "").trim();
    const createdBy = body.createdBy ? String(body.createdBy) : null;
    const status = parseStatus(body.status);

    if (!id) {
      return NextResponse.json({ message: "Görev ID zorunlu." }, { status: 400 });
    }
    if (!status && !noteText) {
      return NextResponse.json({ message: "Güncellenecek görev bilgisi bulunamadı." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const previousTask = await tx.dailyTask.findUnique({ where: { id } });
      if (!previousTask) throw new Error("Görev bulunamadı.");
      if (noteText) {
        const note = await tx.taskNote.create({
          data: { taskId: id, noteText, createdBy }
        });
        await tx.timelineEvent.create({
          data: {
            memberId: previousTask.contactId,
            operatorId: createdBy,
            eventType: "TASK_NOTE_ADDED",
            eventTitle: "Görev notu eklendi",
            eventDescription: noteText.slice(0, 240),
            referenceType: "task_note",
            referenceId: note.id,
            createdAt: note.createdAt
          }
        });
      }
      const updatedTask = await tx.dailyTask.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(noteText ? { note: noteText } : {})
        }
      });
      if (status && status !== previousTask.status) {
        await tx.timelineEvent.create({
          data: {
            memberId: previousTask.contactId,
            operatorId: createdBy,
            eventType: status === "COMPLETED" && updatedTask.source !== "Manuel" ? "AUTO_TASK_COMPLETED" : status === "COMPLETED" ? "TASK_COMPLETED" : "TASK_REOPENED",
            eventTitle: status === "COMPLETED" ? "Görev tamamlandı" : "Görev beklemeye alındı",
            eventDescription: updatedTask.title,
            referenceType: "task",
            referenceId: updatedTask.id,
            createdAt: updatedTask.updatedAt
          }
        });
      } else if (!status && noteText) {
        await tx.timelineEvent.create({
          data: {
            memberId: previousTask.contactId,
            operatorId: createdBy,
            eventType: "TASK_UPDATED",
            eventTitle: "Görev güncellendi",
            eventDescription: updatedTask.title,
            referenceType: "task",
            referenceId: updatedTask.id,
            createdAt: updatedTask.updatedAt
          }
        });
      }
    });

    const task = await prisma.dailyTask.findUnique({
      where: { id },
      include: taskInclude
    });

    if (!task) {
      return NextResponse.json({ message: "Görev bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ task: serializeTask(task), message: "Görev güncellendi." });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Görev güncellenemedi." }, { status: 500 });
  }
}

function parseTaskDate(value: string) {
  if (!value) return startOfToday();
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? startOfToday() : date;
}

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function parseStatus(value: unknown): TaskStatus | undefined {
  if (value === "PENDING" || value === "COMPLETED") return value;
  return undefined;
}

function normalizeTaskSource(value: unknown) {
  const source = String(value ?? "Manuel").trim();
  if (source === "Otomatik Sistem" || source === "Karar Motoru" || source === "Talep" || source === "Sesli Yanıt" || source === "Üye Aktivitesi") return source;
  return "Manuel";
}
