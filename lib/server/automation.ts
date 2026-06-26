import { prisma } from "@/lib/prisma";

type AutoTaskSource = "Manuel" | "Otomatik Sistem" | "Karar Motoru" | "Talep" | "Sesli Yanıt" | "Üye Aktivitesi";
type DecisionType = "CREATE_TASK" | "FOLLOW_UP_TASK" | "SKIP" | "DUPLICATE" | "AUTO_COMPLETE_EXISTING_TASK" | "WAIT" | "ERROR";
type QuestionAnswer = { question: string; answer: string };
type AutomationDecision = {
  memberId: string;
  operatorId?: string | null;
  ruleKey: string;
  ruleName: string;
  decisionType: DecisionType;
  actionType?: "MESSAGE_DRAFT" | "CALL_REMINDER" | "REQUEST_CHECK" | "VOICE_FOLLOWUP" | "NOTE_REVIEW";
  reason: string;
  nextStep?: string;
  messageDraft?: string;
  questionAnswers: QuestionAnswer[];
  taskTitle?: string;
  source?: AutoTaskSource;
  sourceReferenceId?: string;
  dueAt?: Date;
  openTaskId?: string;
  referenceType?: string;
  referenceId?: string;
};

type AutoTaskInput = {
  contactId: string;
  title: string;
  source: AutoTaskSource;
  sourceReferenceId: string;
  dueAt?: Date;
  createdBy?: string | null;
  ruleKey?: string;
  reason?: string;
  questionAnswers?: QuestionAnswer[];
};

const WELCOME_TASK = "İlk karşılama mesajı gönder";
const WELCOME_FOLLOW_UP_TASK = "Karşılama sonrası dönüş kontrolü yap";
const NEEDS_ANALYSIS_TASK = "Üyeye ihtiyaç analizi yap";
const REACTIVATION_TASK = "Yeniden aktiflik mesajı gönder";
const STATUS_CHECK_TASK = "Üyeye güncel durum sor";
const OPEN_REQUEST_FOLLOW_UP_TASK = "Açık talep takibi yap";
const REQUEST_CONTROL_TASK = "Talep durumunu kontrol et";
const SATISFACTION_TASK = "Memnuniyet kontrolü yap";
const VOICE_FOLLOW_UP_TASK = "Sesli mesaj dönüş kontrolü yap";

export async function automationEnabled(key: string) {
  const settings = await prisma.automationRuleSetting.findMany();
  return isAutomationEnabled(settings, key);
}

export async function createAutomaticTaskOnce(input: AutoTaskInput) {
  void input;
  return null;
}

export async function runAutomationEngine({ dryRun = false, operatorId = null }: { dryRun?: boolean; operatorId?: string | null } = {}) {
  void dryRun;
  const settings = await prisma.automationRuleSetting.findMany();
  const result = {
    checkedMemberCount: 0,
    createdCount: 0,
    skippedCount: 0,
    duplicateCount: 0,
    autoCompletedCount: 0,
    waitCount: 0,
    errorCount: 0,
    errors: [] as string[],
    lastRunAt: new Date().toISOString(),
    decisions: [] as AutomationDecision[]
  };

  if (!isAutomationEnabled(settings, "engine_enabled")) {
    result.skippedCount += 1;
    return result;
  }

  const decisions = await collectDecisions(settings, operatorId);
  result.decisions = decisions;
  result.checkedMemberCount = new Set(decisions.map((decision) => decision.memberId)).size;

  for (const decision of decisions) {
    try {
      if (decision.decisionType === "CREATE_TASK" || decision.decisionType === "FOLLOW_UP_TASK") {
        result.createdCount += 1;
      } else if (decision.decisionType === "AUTO_COMPLETE_EXISTING_TASK") {
        result.autoCompletedCount += 1;
      } else if (decision.decisionType === "DUPLICATE") {
        result.duplicateCount += 1;
      } else if (decision.decisionType === "WAIT") {
        result.waitCount += 1;
      } else {
        result.skippedCount += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Otomatik karar motoru hatası.";
      result.errorCount += 1;
      result.errors.push(message);
      if (!dryRun && decision.decisionType === "ERROR") {
        await logDecision({
          ...decision,
          decisionType: "ERROR",
          reason: message
        });
      }
    }
  }

  return result;
}

async function collectDecisions(settings: { key: string; enabled: boolean; value: string | null }[], operatorId: string | null) {
  const decisions: AutomationDecision[] = [];
  if (isAutomationEnabled(settings, "new_member_task")) decisions.push(...await newMemberDecisions(operatorId));
  if (isAutomationEnabled(settings, "inactive_member_task")) decisions.push(...await inactiveMemberDecisions(settings, operatorId));
  if (isAutomationEnabled(settings, "request_control_task")) decisions.push(...await requestDecisions(operatorId));
  if (isAutomationEnabled(settings, "voice_followup_task")) decisions.push(...await voiceDecisions(operatorId));
  return filterIgnoredDecisions(decisions);
}

async function filterIgnoredDecisions(decisions: AutomationDecision[]) {
  if (decisions.length === 0) return decisions;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const logs = await prisma.automationDecisionLog.findMany({
    where: {
      decisionType: "SKIP",
      reason: { startsWith: "Operatör öneriyi yoksaydı" },
      createdAt: { gte: since }
    },
    select: { memberId: true, ruleKey: true, referenceType: true, referenceId: true }
  });
  const ignoredKeys = new Set(logs.map((log) => decisionIdentity(log.memberId ?? "", log.ruleKey, log.referenceType ?? "", log.referenceId ?? "")));
  return decisions.filter((item) => !ignoredKeys.has(decisionIdentity(item.memberId, item.ruleKey, item.referenceType ?? "", item.referenceId ?? "")));
}

async function newMemberDecisions(operatorId: string | null) {
  const today = startOfLocalDay(new Date());
  const contacts = await prisma.contact.findMany({
    where: { isRegistered: true, createdAt: { gte: today } },
    include: { conversations: { include: { messages: true } }, dailyTasks: true }
  });

  return contacts.flatMap((contact): AutomationDecision[] => {
    const messages = contact.conversations.flatMap((conversation) => conversation.messages);
    const firstWelcomeMessage = messages
      .filter((message) => message.senderType === "OPERATOR" && message.createdAt >= contact.createdAt)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    const sentWelcome = Boolean(firstWelcomeMessage);
    const repliedAfterWelcome = firstWelcomeMessage
      ? messages.some((message) => message.senderType === "CUSTOMER" && message.createdAt > firstWelcomeMessage.createdAt)
      : false;
    const welcomeOpen = openTask(contact.dailyTasks, WELCOME_TASK, `new-member-${contact.id}`);
    const welcomeFollowUpOpen = openTask(contact.dailyTasks, WELCOME_FOLLOW_UP_TASK, `welcome-followup-${contact.id}`);
    const needsAnalysisOpen = openTask(contact.dailyTasks, NEEDS_ANALYSIS_TASK, `needs-analysis-${contact.id}`);
    const needsAnalysisDone = completedTask(contact.dailyTasks, NEEDS_ANALYSIS_TASK, `needs-analysis-${contact.id}`);
    const decisions: AutomationDecision[] = [];
    const baseQuestions = [
      qa("Üye yeni mi?", "Evet"),
      qa("Karşılama mesajı atıldı mı?", sentWelcome ? "Evet" : "Hayır"),
      qa("Karşılama sonrası üye cevap verdi mi?", repliedAfterWelcome ? "Evet" : "Hayır"),
      qa("İhtiyaç analizi tamamlandı mı?", needsAnalysisDone ? "Evet" : "Hayır")
    ];

    if (sentWelcome && welcomeOpen) {
      decisions.push(decision(contact.id, operatorId, "new_member_task", "Yeni Üye", "AUTO_COMPLETE_EXISTING_TASK", "Karşılama mesajı atıldığı için ilk karşılama görevi otomatik tamamlanmalı.", baseQuestions, {
        openTaskId: welcomeOpen.id,
        nextStep: repliedAfterWelcome ? NEEDS_ANALYSIS_TASK : WELCOME_FOLLOW_UP_TASK
      }));
    }

    if (!sentWelcome) {
      decisions.push(taskDecision(contact.id, operatorId, "new_member_task", "Yeni Üye", "CREATE_TASK", WELCOME_TASK, "Yeni üye için ilk aksiyon henüz alınmamış.", "İlk karşılama mesajını gönder.", baseQuestions, "Karar Motoru", `new-member-${contact.id}`, "contact", contact.id, Boolean(welcomeOpen), "MESSAGE_DRAFT", "Merhaba {hitap}, aramıza hoş geldiniz. Size nasıl yardımcı olabiliriz?"));
      return decisions;
    }

    if (!repliedAfterWelcome) {
      decisions.push(taskDecision(contact.id, operatorId, "new_member_task", "Yeni Üye", "FOLLOW_UP_TASK", WELCOME_FOLLOW_UP_TASK, "Karşılama mesajı gönderilmiş ama üye henüz dönüş yapmamış.", "Karşılama sonrası dönüş kontrolü yap.", baseQuestions, "Karar Motoru", `welcome-followup-${contact.id}`, "contact", contact.id, Boolean(welcomeFollowUpOpen), "MESSAGE_DRAFT", "Merhaba {hitap}, önceki bilgilendirmemizle ilgili size yardımcı olabileceğimiz bir konu var mı?"));
      return decisions;
    }

    if (!needsAnalysisDone) {
      decisions.push(taskDecision(contact.id, operatorId, "new_member_task", "Yeni Üye", "FOLLOW_UP_TASK", NEEDS_ANALYSIS_TASK, "Üye karşılama sonrası dönüş yaptı; sıradaki operasyon adımı ihtiyaç analizi.", "Üyeye ihtiyaç analizi yap.", baseQuestions, "Karar Motoru", `needs-analysis-${contact.id}`, "contact", contact.id, Boolean(needsAnalysisOpen), "MESSAGE_DRAFT", "{hitap}, size daha doğru yardımcı olabilmemiz için hangi konuda destek almak istediğinizi öğrenebilir miyim?"));
      return decisions;
    }

    decisions.push(decision(contact.id, operatorId, "new_member_task", "Yeni Üye", "SKIP", "Karşılama ve ihtiyaç analizi akışı tamamlanmış.", baseQuestions, {
      nextStep: "Yeni üye akışında bekleyen adım yok."
    }));
    return decisions;
  });
}

async function inactiveMemberDecisions(settings: { key: string; value: string | null }[], operatorId: string | null) {
  const days = Number(settings.find((item) => item.key === "inactive_member_task")?.value ?? 3);
  const safeDays = Math.max(1, days);
  const cutoff = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);
  const today = startOfLocalDay(new Date());
  const contacts = await prisma.contact.findMany({
    where: { isRegistered: true },
    include: { conversations: { include: { messages: true } }, dailyTasks: true, requests: true }
  });

  return contacts.flatMap((contact): AutomationDecision[] => {
    const messages = contact.conversations.flatMap((conversation) => conversation.messages);
    const lastCustomerReply = messages
      .filter((message) => message.senderType === "CUSTOMER")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    const repliedRecently = Boolean(lastCustomerReply && lastCustomerReply.createdAt > cutoff);
    const passive = contact.memberStatus === "Pasif";
    const openRequests = contact.requests.filter((request) => request.status !== "COMPLETED" && request.status !== "CLOSED");
    const reactivationOpen = openTask(contact.dailyTasks, REACTIVATION_TASK, `inactive-${dateKey(today)}`);
    const statusCheckOpen = openTask(contact.dailyTasks, STATUS_CHECK_TASK, `status-check-${dateKey(today)}`);
    const requestFollowUpOpen = openTask(contact.dailyTasks, OPEN_REQUEST_FOLLOW_UP_TASK, `open-request-${dateKey(today)}`);
    const decisions: AutomationDecision[] = [];
    const questions = [
      qa(`Üye son ${safeDays} gün içinde cevap verdi mi?`, repliedRecently ? "Evet" : "Hayır"),
      qa("Üye pasif mi?", passive ? "Evet" : "Hayır"),
      qa("Açık talebi var mı?", openRequests.length > 0 ? "Evet" : "Hayır")
    ];

    if (repliedRecently && reactivationOpen) {
      decisions.push(decision(contact.id, operatorId, "inactive_member_task", "Pasif Üye", "AUTO_COMPLETE_EXISTING_TASK", "Üye dönüş yaptığı için pasif takip görevi otomatik tamamlanmalı.", questions, {
        openTaskId: reactivationOpen.id,
        nextStep: openRequests.length > 0 ? OPEN_REQUEST_FOLLOW_UP_TASK : STATUS_CHECK_TASK
      }));
    }

    if (!repliedRecently && !passive) {
      decisions.push(taskDecision(contact.id, operatorId, "inactive_member_task", "Pasif Üye", "CREATE_TASK", REACTIVATION_TASK, "Üye son dönemde cevap vermediği için aktiflik aksiyonu gerekli.", "Yeniden aktiflik mesajı gönder.", questions, "Karar Motoru", `inactive-${dateKey(today)}`, "contact", contact.id, Boolean(reactivationOpen), "MESSAGE_DRAFT", "Merhaba {hitap}, uzun süredir görüşemedik. Sizin için güncel fırsatları kontrol etmek ister misiniz?"));
      return decisions;
    }

    if (!repliedRecently && passive) {
      decisions.push(taskDecision(contact.id, operatorId, "inactive_member_task", "Pasif Üye", "FOLLOW_UP_TASK", REACTIVATION_TASK, "Üye pasif görünse de son dönemde dönüş yok; kontrollü aktiflik aksiyonu öneriliyor.", "Pasif üyeye yeniden aktiflik mesajı gönder.", questions, "Karar Motoru", `inactive-${dateKey(today)}`, "contact", contact.id, Boolean(reactivationOpen), "MESSAGE_DRAFT", "Merhaba {hitap}, uzun süredir görüşemedik. Sizin için güncel fırsatları kontrol etmek ister misiniz?"));
      return decisions;
    }

    if (openRequests.length > 0) {
      decisions.push(taskDecision(contact.id, operatorId, "inactive_member_task", "Pasif Üye", "FOLLOW_UP_TASK", OPEN_REQUEST_FOLLOW_UP_TASK, "Üye dönüş yapmış ve açık talebi var; talep takibi aksiyonu gerekli.", "Açık talep takibi yap.", questions, "Karar Motoru", `open-request-${dateKey(today)}`, "contact", contact.id, Boolean(requestFollowUpOpen), "REQUEST_CHECK", "{hitap}, talebinizle ilgili süreci kontrol ediyorum. Kısa süre içinde size bilgi vereceğim."));
      return decisions;
    }

    decisions.push(taskDecision(contact.id, operatorId, "inactive_member_task", "Pasif Üye", "FOLLOW_UP_TASK", STATUS_CHECK_TASK, "Üye son dönemde cevap verdi ancak açık talebi yok; sıradaki takip güncel durum kontrolü.", "Üyeye güncel durum sor.", questions, "Karar Motoru", `status-check-${dateKey(today)}`, "contact", contact.id, Boolean(statusCheckOpen), "MESSAGE_DRAFT", "Merhaba {hitap}, bugün size yardımcı olabileceğimiz güncel bir konu var mı?"));
    return decisions;
  });
}

async function requestDecisions(operatorId: string | null) {
  const requests = await prisma.request.findMany({
    include: { contact: { include: { dailyTasks: true } } }
  });
  const now = Date.now();
  return requests.flatMap((request): AutomationDecision[] => {
    const open = request.status !== "COMPLETED" && request.status !== "CLOSED";
    const olderThan30 = now - request.createdAt.getTime() >= 30 * 60 * 1000;
    const olderThan2h = now - request.updatedAt.getTime() >= 120 * 60 * 1000;
    const controlOpen = openTask(request.contact.dailyTasks, REQUEST_CONTROL_TASK, request.id);
    const satisfactionOpen = openTask(request.contact.dailyTasks, SATISFACTION_TASK, `completed-${request.id}`);
    const satisfactionDone = completedTask(request.contact.dailyTasks, SATISFACTION_TASK, `completed-${request.id}`);

    const controlQuestions = [
      qa("Üyenin açık talebi var mı?", open ? "Evet" : "Hayır"),
      qa("Talep 30 dakikadan uzun süredir bekliyor mu?", olderThan30 ? "Evet" : "Hayır"),
      qa("Aynı talep için açık kontrol görevi var mı?", controlOpen ? "Evet" : "Hayır")
    ];
    const control = !open
      ? decision(request.contactId, request.createdBy ?? operatorId, "request_control_task", "Talep Kontrol", "SKIP", "Talep açık değil; kontrol görevi gerçekten gereksiz.", controlQuestions, { referenceType: "request", referenceId: request.id, nextStep: "Talep tamamlandıysa memnuniyet akışı kontrol edilir." })
      : !olderThan30
        ? decision(request.contactId, request.createdBy ?? operatorId, "request_control_task", "Talep Kontrol", "WAIT", "Talep henüz 30 dakikayı doldurmadı.", controlQuestions, { referenceType: "request", referenceId: request.id, nextStep: "30 dakika dolunca talep kontrol görevi önerilecek." })
        : taskDecision(request.contactId, request.createdBy ?? operatorId, "request_control_task", "Talep Kontrol", "CREATE_TASK", REQUEST_CONTROL_TASK, "Açık talep 30 dakikadan uzun süredir bekliyor.", "Talep durumunu kontrol et.", controlQuestions, "Karar Motoru", request.id, "request", request.id, Boolean(controlOpen), "REQUEST_CHECK", "{hitap}, talebinizle ilgili süreci kontrol ediyorum. Kısa süre içinde size bilgi vereceğim.");

    const satisfactionQuestions = [
      qa("Talep tamamlandı mı?", request.status === "COMPLETED" ? "Evet" : "Hayır"),
      qa("Tamamlanma üzerinden 2 saat geçti mi?", olderThan2h ? "Evet" : "Hayır"),
      qa("Memnuniyet kontrolü yapıldı mı?", satisfactionDone ? "Evet" : "Hayır"),
      qa("Açık memnuniyet görevi var mı?", satisfactionOpen ? "Evet" : "Hayır")
    ];
    const satisfaction = request.status !== "COMPLETED"
      ? decision(request.contactId, request.createdBy ?? operatorId, "request_completed_followup", "Memnuniyet", "WAIT", "Talep henüz tamamlanmadı; memnuniyet akışı için beklenmeli.", satisfactionQuestions, { referenceType: "request", referenceId: request.id, nextStep: "Talep tamamlanınca memnuniyet kontrolü değerlendirilecek." })
      : !olderThan2h
        ? decision(request.contactId, request.createdBy ?? operatorId, "request_completed_followup", "Memnuniyet", "WAIT", "Talep tamamlandı ama 2 saatlik süre dolmadı.", satisfactionQuestions, { referenceType: "request", referenceId: request.id, nextStep: "2 saat dolunca memnuniyet görevi önerilecek." })
        : satisfactionDone
          ? decision(request.contactId, request.createdBy ?? operatorId, "request_completed_followup", "Memnuniyet", "SKIP", "Memnuniyet kontrolü tamamlanmış; bu akışta yeni görev yok.", satisfactionQuestions, { referenceType: "request", referenceId: request.id, nextStep: "Memnuniyet akışı tamamlandı." })
          : taskDecision(request.contactId, request.createdBy ?? operatorId, "request_completed_followup", "Memnuniyet", "FOLLOW_UP_TASK", SATISFACTION_TASK, "Tamamlanan talep sonrası memnuniyet kontrolü gerekli.", "Memnuniyet kontrolü yap.", satisfactionQuestions, "Karar Motoru", `completed-${request.id}`, "request", request.id, Boolean(satisfactionOpen), "MESSAGE_DRAFT", "{hitap}, işleminiz tamamlandı. Süreçle ilgili memnuniyetinizi kontrol etmek istedik.");
    return [control, satisfaction];
  });
}

async function voiceDecisions(operatorId: string | null) {
  const logs = await prisma.ttsUsageLog.findMany({
    where: { status: "sent", memberId: { not: null } },
    include: {
      member: {
        include: {
          dailyTasks: true,
          conversations: { include: { messages: true } }
        }
      }
    }
  });
  const now = Date.now();
  return logs.map((log): AutomationDecision => {
    const memberId = log.memberId ?? "";
    const sentAt = log.sentAt ?? log.createdAt;
    const olderThan2h = now - sentAt.getTime() >= 120 * 60 * 1000;
    const repliedAfterVoice = log.member?.conversations.some((conversation) =>
      conversation.messages.some((message) => message.senderType === "CUSTOMER" && message.createdAt > sentAt)
    ) ?? false;
    const openVoiceTask = log.member ? openTask(log.member.dailyTasks, VOICE_FOLLOW_UP_TASK, log.id) : undefined;
    const questions = [
      qa("Sesli mesaj gönderildi mi?", "Evet"),
      qa("Üye sesli mesajdan sonra cevap verdi mi?", repliedAfterVoice ? "Evet" : "Hayır"),
      qa("Sesli mesaj üzerinden 2 saat geçti mi?", olderThan2h ? "Evet" : "Hayır"),
      qa("Açık sesli mesaj takip görevi var mı?", openVoiceTask ? "Evet" : "Hayır")
    ];
    if (repliedAfterVoice && openVoiceTask) return decision(memberId, log.operatorId ?? operatorId, "voice_followup_task", "Sesli Mesaj Takip", "AUTO_COMPLETE_EXISTING_TASK", "Üye sesli mesajdan sonra dönüş yaptığı için görev otomatik tamamlanmalı.", questions, { openTaskId: openVoiceTask.id, referenceType: "tts_usage_log", referenceId: log.id, nextStep: "Sesli takip akışı kapatılır." });
    if (repliedAfterVoice) return decision(memberId, log.operatorId ?? operatorId, "voice_followup_task", "Sesli Mesaj Takip", "SKIP", "Üye sesli mesajdan sonra cevap verdi; bu özel takip görevi gerçekten gereksiz.", questions, { referenceType: "tts_usage_log", referenceId: log.id, nextStep: "Gerekirse genel durum takibi pasif üye akışından üretilecek." });
    if (!olderThan2h) return decision(memberId, log.operatorId ?? operatorId, "voice_followup_task", "Sesli Mesaj Takip", "WAIT", "Sesli mesaj sonrası 2 saatlik süre dolmadı.", questions, { referenceType: "tts_usage_log", referenceId: log.id, nextStep: "2 saat dolunca dönüş kontrolü yapılacak." });
    return taskDecision(memberId, log.operatorId ?? operatorId, "voice_followup_task", "Sesli Mesaj Takip", "FOLLOW_UP_TASK", VOICE_FOLLOW_UP_TASK, "Sesli mesaj gönderildi ve üye dönüş yapmadı.", "Sesli mesaj dönüş kontrolü yap.", questions, "Karar Motoru", log.id, "tts_usage_log", log.id, Boolean(openVoiceTask), "VOICE_FOLLOWUP", "{hitap}, size kısa bir sesli bilgilendirme iletmiştik. Kontrol etme fırsatınız oldu mu?");
  });
}

async function createTaskFromDecision(decision: AutomationDecision) {
  if (!decision.taskTitle || !decision.source || !decision.sourceReferenceId) throw new Error("Görev oluşturma bilgisi eksik.");
  const openTask = await findOpenAutomaticTask(decision.memberId, decision.taskTitle, decision.source, decision.sourceReferenceId);
  if (openTask) return openTask;
  const taskDate = startOfLocalDay(decision.dueAt ?? new Date());
  const task = await prisma.dailyTask.create({
    data: {
      contactId: decision.memberId,
      title: decision.taskTitle,
      taskDate,
      dueAt: decision.dueAt ?? new Date(),
      source: decision.source,
      sourceReferenceId: decision.sourceReferenceId,
      automationRuleKey: decision.ruleKey,
      automationReason: decision.reason,
      automationQuestionsJson: decision.questionAnswers,
      createdBy: decision.operatorId ?? null
    }
  });
  await prisma.timelineEvent.create({
    data: {
      memberId: decision.memberId,
      operatorId: decision.operatorId ?? null,
      eventType: "AUTO_TASK_CREATED",
      eventTitle: "Otomatik görev oluşturuldu",
      eventDescription: decision.reason,
      referenceType: "task",
      referenceId: task.id,
      createdAt: task.createdAt
    }
  });
  return task;
}

async function completeTaskFromDecision(decision: AutomationDecision, taskId: string) {
  const task = await prisma.dailyTask.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      automationReason: decision.reason,
      automationQuestionsJson: decision.questionAnswers
    }
  });
  await prisma.timelineEvent.create({
    data: {
      memberId: task.contactId,
      operatorId: decision.operatorId ?? null,
      eventType: "AUTO_TASK_COMPLETED",
      eventTitle: "Otomatik görev tamamlandı",
      eventDescription: decision.reason,
      referenceType: "task",
      referenceId: task.id,
      createdAt: task.updatedAt
    }
  });
  return task;
}

async function logDecision(decision: AutomationDecision & { createdTaskId?: string; completedTaskId?: string }) {
  await prisma.automationDecisionLog.create({
    data: {
      memberId: decision.memberId,
      operatorId: decision.operatorId ?? null,
      ruleKey: decision.ruleKey,
      decisionType: decision.decisionType,
      reason: decision.reason,
      questionAnswersJson: decision.questionAnswers,
      createdTaskId: decision.createdTaskId ?? null,
      completedTaskId: decision.completedTaskId ?? null,
      referenceType: decision.referenceType ?? null,
      referenceId: decision.referenceId ?? null
    }
  });
  await prisma.automationTaskLog.create({
    data: {
      ruleKey: decision.ruleKey,
      memberId: decision.memberId,
      taskId: decision.createdTaskId ?? decision.completedTaskId ?? null,
      taskTitle: decision.taskTitle ?? "Otomatik karar",
      status: decision.decisionType === "ERROR" ? "error" : "created",
      explanation: decision.reason
    }
  });
}

async function findOpenAutomaticTask(contactId: string, title: string, source: AutoTaskSource, sourceReferenceId: string) {
  return prisma.dailyTask.findFirst({
    where: {
      contactId,
      title,
      status: "PENDING",
      source,
      sourceReferenceId
    }
  });
}

function taskDecision(
  memberId: string,
  operatorId: string | null | undefined,
  ruleKey: string,
  ruleName: string,
  decisionType: "CREATE_TASK" | "FOLLOW_UP_TASK",
  taskTitle: string,
  reason: string,
  nextStep: string,
  questionAnswers: QuestionAnswer[],
  source: AutoTaskSource,
  sourceReferenceId: string,
  referenceType: string,
  referenceId: string,
  hasOpenTask: boolean,
  actionType: AutomationDecision["actionType"],
  messageDraft: string
) {
  if (hasOpenTask) {
    return decision(memberId, operatorId, ruleKey, ruleName, "DUPLICATE", "Aynı önerilen açık görev zaten var.", questionAnswers, {
      actionType,
      taskTitle,
      source,
      sourceReferenceId,
      referenceType,
      referenceId,
      nextStep,
      messageDraft
    });
  }
  return decision(memberId, operatorId, ruleKey, ruleName, decisionType, reason, questionAnswers, {
    actionType,
    taskTitle,
    source,
    sourceReferenceId,
    dueAt: new Date(),
    referenceType,
    referenceId,
    nextStep,
    messageDraft
  });
}

function decision(memberId: string, operatorId: string | null | undefined, ruleKey: string, ruleName: string, decisionType: DecisionType, reason: string, questionAnswers: QuestionAnswer[], extra: Partial<AutomationDecision> = {}): AutomationDecision {
  return { memberId, operatorId, ruleKey, ruleName, decisionType, reason, questionAnswers, ...extra };
}

function decisionIdentity(memberId: string, ruleKey: string, referenceType: string, referenceId: string) {
  return `${memberId}:${ruleKey}:${referenceType}:${referenceId}`;
}

function openTask<T extends { id: string; title: string; status: unknown; sourceReferenceId: string | null }>(tasks: T[], title: string, sourceReferenceId: string) {
  return tasks.find((task) => task.title === title && task.sourceReferenceId === sourceReferenceId && task.status === "PENDING");
}

function completedTask(tasks: { title: string; status: unknown; sourceReferenceId: string | null }[], title: string, sourceReferenceId: string) {
  return tasks.some((task) => task.title === title && task.sourceReferenceId === sourceReferenceId && task.status === "COMPLETED");
}

function qa(question: string, answer: string): QuestionAnswer {
  return { question, answer };
}

function isAutomationEnabled(settings: { key: string; enabled: boolean }[], key: string) {
  const engine = settings.find((item) => item.key === "engine_enabled");
  if (key !== "engine_enabled" && engine && !engine.enabled) return false;
  return settings.find((item) => item.key === key)?.enabled ?? true;
}

export function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function startOfLocalDay(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
