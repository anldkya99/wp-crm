import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTask } from "@/lib/server/serializers";

const taskInclude = {
  notes: {
    orderBy: { createdAt: "desc" as const },
    include: { creator: { select: { name: true } } }
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action ?? "");
    const memberId = String(body.memberId ?? "");
    const operatorId = String(body.operatorId ?? "") || null;
    const ruleKey = String(body.ruleKey ?? "operator_guidance");
    const ruleName = String(body.ruleName ?? "Operatör Yönlendirme");
    const taskTitle = String(body.taskTitle ?? "Operatör yönlendirme görevi").trim();
    const reason = String(body.reason ?? "").trim();
    const messageDraft = String(body.messageDraft ?? "").trim();
    const referenceType = String(body.referenceType ?? "") || null;
    const referenceId = String(body.referenceId ?? "") || null;
    const questionAnswers = Array.isArray(body.questionAnswers) ? body.questionAnswers : [];

    if (!memberId) {
      return NextResponse.json({ error: "Üye bilgisi zorunlu." }, { status: 400 });
    }

    if (action === "CREATE_TASK") {
      const task = await prisma.$transaction(async (tx) => {
        const existing = await tx.dailyTask.findFirst({
          where: {
            contactId: memberId,
            title: taskTitle,
            status: "PENDING",
            source: "Karar Motoru",
            sourceReferenceId: referenceId
          },
          include: taskInclude
        });
        if (existing) return existing;

        const created = await tx.dailyTask.create({
          data: {
            contactId: memberId,
            title: taskTitle,
            note: reason || null,
            taskDate: startOfToday(),
            dueAt: new Date(),
            source: "Karar Motoru",
            sourceReferenceId: referenceId,
            automationRuleKey: ruleKey,
            automationReason: reason,
            automationQuestionsJson: questionAnswers,
            createdBy: operatorId
          },
          include: taskInclude
        });
        await tx.timelineEvent.create({
          data: {
            memberId,
            operatorId,
            eventType: "GUIDANCE_TASK_CREATED",
            eventTitle: "Operatör öneriyi göreve çevirdi",
            eventDescription: `${taskTitle}${reason ? ` - ${reason}` : ""}`.slice(0, 240),
            referenceType: "task",
            referenceId: created.id,
            createdAt: created.createdAt
          }
        });
        await tx.automationDecisionLog.create({
          data: {
            memberId,
            operatorId,
            ruleKey,
            decisionType: "CREATE_TASK",
            reason: `Operatör öneriyi göreve çevirdi: ${reason || taskTitle}`,
            questionAnswersJson: questionAnswers,
            createdTaskId: created.id,
            referenceType,
            referenceId
          }
        });
        return created;
      });
      return NextResponse.json({ task: serializeTask(task), message: "Öneri göreve çevrildi." });
    }

    if (action === "IGNORE") {
      await prisma.$transaction(async (tx) => {
        await tx.automationDecisionLog.create({
          data: {
            memberId,
            operatorId,
            ruleKey,
            decisionType: "SKIP",
            reason: `Operatör öneriyi yoksaydı: ${reason || taskTitle}`,
            questionAnswersJson: questionAnswers,
            referenceType,
            referenceId
          }
        });
        await tx.timelineEvent.create({
          data: {
            memberId,
            operatorId,
            eventType: "GUIDANCE_IGNORED",
            eventTitle: "Operatör öneriyi yoksaydı",
            eventDescription: (reason || taskTitle).slice(0, 240),
            referenceType,
            referenceId
          }
        });
      });
      return NextResponse.json({ message: "Öneri 24 saat boyunca gizlendi." });
    }

    const eventMap: Record<string, { type: string; title: string }> = {
      DRAFT_USED: { type: "GUIDANCE_DRAFT_USED", title: "Operatör öneriyi sohbet taslağına çevirdi" },
      VOICE_DRAFT_USED: { type: "GUIDANCE_VOICE_DRAFT_USED", title: "Operatör öneriyi sesli yanıt taslağına çevirdi" },
      SUGGESTION_CREATED: { type: "GUIDANCE_CREATED", title: "Otomatik öneri oluşturuldu" },
      SUGGESTED_MESSAGE_SENT: { type: "GUIDANCE_MESSAGE_SENT", title: "Önerilen mesaj gönderildi" }
    };
    const event = eventMap[action];
    if (!event) {
      return NextResponse.json({ error: "Geçersiz aksiyon." }, { status: 400 });
    }

    await prisma.timelineEvent.create({
      data: {
        memberId,
        operatorId,
        eventType: event.type,
        eventTitle: event.title,
        eventDescription: (messageDraft || reason || taskTitle).slice(0, 240),
        referenceType,
        referenceId
      }
    });
    return NextResponse.json({ message: "Aksiyon kaydedildi." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Aksiyon kaydedilemedi." }, { status: 500 });
  }
}

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}
