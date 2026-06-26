import type { AlarmItem, AutomationDecisionLog, AutomationQuestionAnswer, AutomationRuleSetting, AutomationTaskLog, CommunicationLine, Contact, ContactOwnershipRequest, Conversation, CustomerNote, DailyTask, MemberTag, Message, MessageTemplate, Operator, OperatorLineSession, RequestItem, RequestType, TimelineEvent, TtsUsageLog, VoiceTemplate } from "@/types/domain";
import { conversationStatusLabels, requestStatusLabels, userRoleLabels, userStatusLabels } from "@/lib/status";

type DbContact = {
  id: string;
  name: string;
  phone: string;
  gender: string | null;
  note?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  nationalId?: string | null;
  memberStatus?: string | null;
  source?: string | null;
  isRegistered?: boolean;
  ownerOperatorId?: string | null;
  ownershipStatus?: string | null;
  assignedAt?: Date | null;
  lastContactAt?: Date | null;
  assignedByAdminId?: string | null;
  ownershipNotes?: string | null;
  tagRelations?: { tag: DbMemberTag }[];
  createdAt: Date;
  updatedAt: Date;
};

type DbContactOwnershipRequest = {
  id: string;
  contactId: string;
  customerPhone: string;
  requestedById: string | null;
  currentOwnerId: string | null;
  status: string;
  note: string | null;
  decisionNote: string | null;
  decidedById: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type DbMemberTag = {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
};

type DbRequest = {
  id: string;
  contactId: string;
  amount: unknown;
  status: keyof typeof requestStatusLabels;
  note: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  nationalId?: string | null;
  phone?: string | null;
  gender?: string | null;
  requestType?: string | null;
  bonusAmount?: unknown | null;
  bonusDescription?: string | null;
  giftAmount?: unknown | null;
  giftDescription?: string | null;
  correctionDirection?: string | null;
  correctionAmount?: unknown | null;
  correctionDescription?: string | null;
  betId?: string | null;
  gameName?: string | null;
  betDescription?: string | null;
  commandText?: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DbConversation = {
  id: string;
  contactId: string;
  lineId?: string | null;
  assignedOperatorId: string | null;
  status: keyof typeof conversationStatusLabels;
  isArchived?: boolean;
  isMuted?: boolean;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: { senderType: "CUSTOMER" | "OPERATOR" | "SYSTEM"; status: string }[];
};

type DbMessage = {
  id: string;
  conversationId: string;
  lineId?: string | null;
  senderType: "CUSTOMER" | "OPERATOR" | "SYSTEM";
  messageText: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  createdBy: string | null;
  createdAt: Date;
};

type DbCommunicationLine = {
  id: string;
  name: string;
  phoneNumber: string;
  countryCode: string;
  providerType: string;
  status: string;
  isDefault: boolean;
  lastConnectedAt?: Date | null;
  lastMessageAt?: Date | null;
  blockedAt?: Date | null;
  replacementOfLineId?: string | null;
  replacedByLineId?: string | null;
  archivedAt?: Date | null;
  assignedOperatorId?: string | null;
  assignedAt?: Date | null;
  assignedByAdminId?: string | null;
  assignmentNote?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DbOperatorLineSession = {
  id: string;
  operatorId: string;
  lineId: string;
  slotNumber: number;
  isActive: boolean;
  openedAt?: Date | null;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type DbTemplate = {
  id: string;
  title: string;
  hashtag?: string;
  content: string;
  isActive: boolean;
  isPinned?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type DbVoiceTemplate = {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type DbOperator = {
  id: string;
  name: string;
  email: string;
  role: keyof typeof userRoleLabels;
  status: keyof typeof userStatusLabels;
  ttsDailyLimit?: number;
  teamLeadId?: string | null;
  createdAt: Date;
};

type DbTtsUsageLog = {
  id: string;
  operatorId: string | null;
  memberId: string | null;
  messageId?: string | null;
  messageText: string;
  characterCount: number;
  estimatedTokenCount: number;
  audioDurationSeconds: number;
  provider: string;
  model: string;
  voice: string;
  audioFileUrl: string;
  audioFileSizeBytes: number;
  fileSizeBytes?: number;
  status?: string;
  estimatedCostUsd: unknown;
  errorMessage?: string | null;
  createdAt: Date;
  sentAt?: Date | null;
};

type DbTask = {
  id: string;
  contactId: string;
  title: string;
  note: string | null;
  taskDate: Date;
  dueAt?: Date | null;
  status: "PENDING" | "COMPLETED";
  source?: string | null;
  sourceReferenceId?: string | null;
  automationRuleKey?: string | null;
  automationReason?: string | null;
  automationQuestionsJson?: unknown;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  notes?: {
    id: string;
    taskId: string;
    noteText: string;
    createdBy: string | null;
    createdAt: Date;
    creator?: { name: string } | null;
  }[];
};

type DbCustomerNote = {
  id: string;
  contactId: string;
  noteText: string;
  createdBy: string | null;
  createdAt: Date;
  creator?: { name: string } | null;
};

type DbTimelineEvent = {
  id: string;
  memberId: string | null;
  operatorId: string | null;
  eventType: string;
  eventTitle: string;
  eventDescription: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: Date;
  operator?: { name: string } | null;
};

type DbAlarm = {
  id: string;
  scheduledAt: Date;
  note: string;
  status: "PENDING" | "SNOOZED" | "COMPLETED" | "CLOSED";
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DbAutomationSetting = {
  id: string;
  key: string;
  enabled: boolean;
  value: string | null;
  updatedAt: Date;
};

type DbAutomationTaskLog = {
  id: string;
  ruleKey: string;
  memberId: string | null;
  taskId: string | null;
  taskTitle: string;
  status: string;
  explanation: string | null;
  createdAt: Date;
};

type DbAutomationDecisionLog = {
  id: string;
  memberId: string | null;
  operatorId: string | null;
  ruleKey: string;
  decisionType: string;
  reason: string;
  questionAnswersJson: unknown;
  createdTaskId: string | null;
  completedTaskId: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: Date;
};

export function serializeContact(contact: DbContact): Contact {
  const parts = contact.name.trim().split(/\s+/).filter(Boolean);
  return {
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    gender: contact.gender ?? "Belirtilmedi",
    note: contact.note ?? "",
    firstName: contact.firstName ?? parts[0] ?? "",
    lastName: contact.lastName ?? parts.slice(1).join(" "),
    username: contact.username ?? undefined,
    nationalId: contact.nationalId ?? undefined,
    memberStatus: normalizeMemberStatus(contact.memberStatus),
    source: normalizeMemberSource(contact.source),
    isRegistered: contact.isRegistered ?? true,
    ownerOperatorId: contact.ownerOperatorId ?? undefined,
    ownershipStatus: normalizeOwnershipStatus(contact.ownershipStatus),
    assignedAt: contact.assignedAt?.toISOString(),
    lastContactAt: contact.lastContactAt?.toISOString(),
    assignedByAdminId: contact.assignedByAdminId ?? undefined,
    ownershipNotes: contact.ownershipNotes ?? undefined,
    tags: contact.tagRelations?.map((relation) => serializeMemberTag(relation.tag)) ?? [],
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString()
  };
}

export function serializeContactOwnershipRequest(request: DbContactOwnershipRequest): ContactOwnershipRequest {
  return {
    id: request.id,
    contactId: request.contactId,
    customerPhone: request.customerPhone,
    requestedByOperatorId: request.requestedById ?? undefined,
    currentOwnerOperatorId: request.currentOwnerId ?? undefined,
    status: normalizeOwnershipRequestStatus(request.status),
    note: request.note ?? undefined,
    decisionNote: request.decisionNote ?? undefined,
    decidedByAdminId: request.decidedById ?? undefined,
    decidedAt: request.decidedAt?.toISOString(),
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString()
  };
}

export function serializeMemberTag(tag: DbMemberTag): MemberTag {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt.toISOString()
  };
}

export function serializeRequest(request: DbRequest): RequestItem {
  return {
    id: request.id,
    contactId: request.contactId,
    amount: String(request.amount),
    status: requestStatusLabels[request.status],
    note: request.note ?? "",
    firstName: request.firstName ?? undefined,
    lastName: request.lastName ?? undefined,
    username: request.username ?? undefined,
    nationalId: request.nationalId ?? undefined,
    phone: request.phone ?? undefined,
    gender: request.gender ?? undefined,
    requestType: normalizeRequestType(request.requestType),
    bonusAmount: optionalString(request.bonusAmount),
    bonusDescription: request.bonusDescription ?? undefined,
    giftAmount: optionalString(request.giftAmount),
    giftDescription: request.giftDescription ?? undefined,
    correctionDirection: request.correctionDirection ?? undefined,
    correctionAmount: optionalString(request.correctionAmount),
    correctionDescription: request.correctionDescription ?? undefined,
    betId: request.betId ?? undefined,
    gameName: request.gameName ?? undefined,
    betDescription: request.betDescription ?? undefined,
    commandText: request.commandText ?? undefined,
    createdBy: request.createdBy ?? "",
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString()
  };
}

function optionalString(value: unknown | null | undefined) {
  if (value === null || value === undefined) return undefined;
  return String(value);
}

function normalizeRequestType(value?: string | null): RequestType {
  if (value === "Nakit hediye" || value === "Düzeltme alt/üst" || value === "Bahis detayı" || value === "Bonus") return value;
  return "Bonus";
}

export function serializeConversation(conversation: DbConversation): Conversation {
  const unread = conversation.messages?.some((message) => message.senderType === "CUSTOMER" && message.status !== "READ") ?? false;
  return {
    id: conversation.id,
    contactId: conversation.contactId,
    lineId: conversation.lineId ?? undefined,
    assignedOperatorId: conversation.assignedOperatorId ?? undefined,
    status: conversationStatusLabels[conversation.status],
    isArchived: conversation.isArchived ?? false,
    isMuted: conversation.isMuted ?? false,
    unread,
    lastMessageAt: (conversation.lastMessageAt ?? conversation.createdAt).toISOString(),
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString()
  };
}

export function serializeMessage(message: DbMessage): Message {
  return {
    id: message.id,
    conversationId: message.conversationId,
    lineId: message.lineId ?? undefined,
    senderType: message.senderType.toLowerCase() as Message["senderType"],
    messageText: message.messageText,
    status: message.status.toLowerCase() as Message["status"],
    createdBy: message.createdBy ?? undefined,
    createdAt: message.createdAt.toISOString()
  };
}

export function serializeCommunicationLine(line: DbCommunicationLine): CommunicationLine {
  return {
    id: line.id,
    name: line.name,
    phoneNumber: line.phoneNumber,
    countryCode: line.countryCode,
    providerType: normalizeProviderType(line.providerType),
    status: normalizeLineStatus(line.status),
    isDefault: line.isDefault,
    lastConnectedAt: line.lastConnectedAt?.toISOString(),
    lastMessageAt: line.lastMessageAt?.toISOString(),
    blockedAt: line.blockedAt?.toISOString(),
    replacementOfLineId: line.replacementOfLineId ?? undefined,
    replacedByLineId: line.replacedByLineId ?? undefined,
    archivedAt: line.archivedAt?.toISOString(),
    assignedOperatorId: line.assignedOperatorId ?? undefined,
    assignedAt: line.assignedAt?.toISOString(),
    assignedByAdminId: line.assignedByAdminId ?? undefined,
    assignmentNote: line.assignmentNote ?? undefined,
    notes: line.notes ?? undefined,
    createdAt: line.createdAt.toISOString(),
    updatedAt: line.updatedAt.toISOString()
  };
}

export function serializeOperatorLineSession(session: DbOperatorLineSession): OperatorLineSession {
  return {
    id: session.id,
    operatorId: session.operatorId,
    lineId: session.lineId,
    slotNumber: session.slotNumber,
    isActive: session.isActive,
    openedAt: session.openedAt?.toISOString(),
    lastUsedAt: session.lastUsedAt?.toISOString(),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString()
  };
}

export function serializeTemplate(template: DbTemplate): MessageTemplate {
  return {
    id: template.id,
    title: template.title,
    hashtag: template.hashtag ?? template.title,
    content: template.content,
    isActive: template.isActive,
    isPinned: template.isPinned ?? false,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString()
  };
}

export function serializeVoiceTemplate(template: DbVoiceTemplate): VoiceTemplate {
  return {
    id: template.id,
    title: template.title,
    content: template.content,
    isActive: template.isActive,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString()
  };
}

export function serializeOperator(operator: DbOperator): Operator {
  return {
    id: operator.id,
    name: operator.name,
    email: operator.email,
    role: userRoleLabels[operator.role],
    status: userStatusLabels[operator.status],
    ttsDailyLimit: operator.ttsDailyLimit ?? 50,
    teamLeadId: operator.teamLeadId ?? undefined,
    lastActiveAt: operator.createdAt.toISOString()
  };
}

export function serializeTtsUsageLog(log: DbTtsUsageLog): TtsUsageLog {
  return {
    id: log.id,
    operatorId: log.operatorId ?? undefined,
    memberId: log.memberId ?? undefined,
    messageId: log.messageId ?? undefined,
    messageText: log.messageText,
    characterCount: log.characterCount,
    estimatedTokenCount: log.estimatedTokenCount,
    audioDurationSeconds: log.audioDurationSeconds,
    provider: normalizeTtsProvider(log.provider),
    model: log.model,
    voice: log.voice,
    audioFileUrl: log.audioFileUrl,
    audioFileSizeBytes: log.audioFileSizeBytes,
    fileSizeBytes: log.fileSizeBytes ?? log.audioFileSizeBytes,
    status: normalizeTtsStatus(log.status),
    estimatedCostUsd: String(log.estimatedCostUsd),
    errorMessage: log.errorMessage ?? undefined,
    createdAt: log.createdAt.toISOString(),
    sentAt: log.sentAt?.toISOString()
  };
}

export function serializeTask(task: DbTask): DailyTask {
  return {
    id: task.id,
    contactId: task.contactId,
    title: task.title,
    note: task.note ?? "",
    notes: task.notes?.map((note) => ({
      id: note.id,
      taskId: note.taskId,
      noteText: note.noteText,
      createdBy: note.createdBy ?? undefined,
      createdByName: note.creator?.name,
      createdAt: note.createdAt.toISOString()
    })) ?? [],
    taskDate: task.taskDate.toISOString().slice(0, 10),
    dueAt: task.dueAt?.toISOString(),
    status: task.status === "COMPLETED" ? "Tamamlandı" : "Bekliyor",
    source: normalizeTaskSource(task.source),
    sourceReferenceId: task.sourceReferenceId ?? undefined,
    automationRuleKey: task.automationRuleKey ?? undefined,
    automationReason: task.automationReason ?? undefined,
    automationQuestions: normalizeQuestionAnswers(task.automationQuestionsJson),
    createdBy: task.createdBy ?? undefined,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString()
  };
}

export function serializeCustomerNote(note: DbCustomerNote): CustomerNote {
  return {
    id: note.id,
    contactId: note.contactId,
    noteText: note.noteText,
    createdBy: note.createdBy ?? undefined,
    createdByName: note.creator?.name,
    createdAt: note.createdAt.toISOString()
  };
}

export function serializeTimelineEvent(event: DbTimelineEvent): TimelineEvent {
  return {
    id: event.id,
    memberId: event.memberId ?? undefined,
    operatorId: event.operatorId ?? undefined,
    operatorName: event.operator?.name,
    eventType: event.eventType,
    eventTitle: event.eventTitle,
    eventDescription: event.eventDescription ?? undefined,
    referenceType: event.referenceType ?? undefined,
    referenceId: event.referenceId ?? undefined,
    createdAt: event.createdAt.toISOString()
  };
}

export function serializeAutomationSetting(setting: DbAutomationSetting): AutomationRuleSetting {
  return {
    id: setting.id,
    key: setting.key,
    enabled: setting.enabled,
    value: setting.value ?? undefined,
    updatedAt: setting.updatedAt.toISOString()
  };
}

export function serializeAutomationTaskLog(log: DbAutomationTaskLog): AutomationTaskLog {
  return {
    id: log.id,
    ruleKey: log.ruleKey,
    memberId: log.memberId ?? undefined,
    taskId: log.taskId ?? undefined,
    taskTitle: log.taskTitle,
    status: normalizeAutomationLogStatus(log.status),
    explanation: log.explanation ?? undefined,
    createdAt: log.createdAt.toISOString()
  };
}

export function serializeAutomationDecisionLog(log: DbAutomationDecisionLog): AutomationDecisionLog {
  return {
    id: log.id,
    memberId: log.memberId ?? undefined,
    operatorId: log.operatorId ?? undefined,
    ruleKey: log.ruleKey,
    decisionType: normalizeDecisionType(log.decisionType),
    reason: log.reason,
    questionAnswers: normalizeQuestionAnswers(log.questionAnswersJson),
    createdTaskId: log.createdTaskId ?? undefined,
    completedTaskId: log.completedTaskId ?? undefined,
    referenceType: log.referenceType ?? undefined,
    referenceId: log.referenceId ?? undefined,
    createdAt: log.createdAt.toISOString()
  };
}

export function serializeAlarm(alarm: DbAlarm): AlarmItem {
  const statusMap = {
    PENDING: "Bekliyor",
    SNOOZED: "Ertelendi",
    COMPLETED: "Tamamlandı",
    CLOSED: "Kapatıldı"
  } as const;
  return {
    id: alarm.id,
    scheduledAt: alarm.scheduledAt.toISOString(),
    note: alarm.note,
    status: statusMap[alarm.status],
    createdBy: alarm.createdBy ?? undefined,
    createdAt: alarm.createdAt.toISOString(),
    updatedAt: alarm.updatedAt.toISOString()
  };
}

function normalizeMemberStatus(value?: string | null): Contact["memberStatus"] {
  if (value === "Pasif" || value === "Riskli" || value === "VIP" || value === "Aktif") return value;
  return "Aktif";
}

function normalizeMemberSource(value?: string | null): Contact["source"] {
  if (value === "WhatsApp" || value === "Chat" || value === "Bot" || value === "Diğer" || value === "Manuel") return value;
  return "Manuel";
}

function normalizeOwnershipStatus(value?: string | null): Contact["ownershipStatus"] {
  if (value === "active" || value === "passive" || value === "pool" || value === "blocked") return value;
  return "pool";
}

function normalizeOwnershipRequestStatus(value: string): ContactOwnershipRequest["status"] {
  if (value === "pending" || value === "approved" || value === "rejected" || value === "pooled" || value === "blocked") return value;
  return "pending";
}

function normalizeTaskSource(value?: string | null): DailyTask["source"] {
  if (value === "Otomatik Sistem" || value === "Karar Motoru" || value === "Talep" || value === "Sesli Yanıt" || value === "Üye Aktivitesi" || value === "Manuel") return value;
  return "Manuel";
}

function normalizeAutomationLogStatus(value: string): AutomationTaskLog["status"] {
  if (value === "created" || value === "skipped" || value === "duplicate" || value === "error" || value === "test") return value;
  return "skipped";
}

function normalizeDecisionType(value: string): AutomationDecisionLog["decisionType"] {
  if (value === "CREATE_TASK" || value === "FOLLOW_UP_TASK" || value === "SKIP" || value === "DUPLICATE" || value === "AUTO_COMPLETE_EXISTING_TASK" || value === "WAIT" || value === "ERROR") return value;
  return "SKIP";
}

function normalizeProviderType(value: string): CommunicationLine["providerType"] {
  if (value === "whatsapp_web" || value === "cloud_api" || value === "manual") return value;
  return "manual";
}

function normalizeLineStatus(value: string): CommunicationLine["status"] {
  if (value === "active" || value === "passive" || value === "connecting" || value === "blocked" || value === "disconnected" || value === "qr_waiting" || value === "connected" || value === "replacement_pending" || value === "archived") return value;
  return "passive";
}

function normalizeQuestionAnswers(value: unknown): AutomationQuestionAnswer[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        question: String(record.question ?? ""),
        answer: String(record.answer ?? "")
      };
    })
    .filter((item): item is AutomationQuestionAnswer => Boolean(item?.question));
}

function normalizeTtsProvider(value: string): TtsUsageLog["provider"] {
  if (value === "elevenlabs" || value === "azure" || value === "openai") return value;
  return "openai";
}

function normalizeTtsStatus(value?: string): TtsUsageLog["status"] {
  if (value === "sent" || value === "failed" || value === "created") return value;
  return "created";
}
