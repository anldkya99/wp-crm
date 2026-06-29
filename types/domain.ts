export type RequestStatus = "Yeni" | "İşlemde" | "Beklemede" | "Tamamlandı" | "Kapatıldı";
export type ConversationStatus = "Yeni" | "İşlemde" | "Cevaplandı" | "Kapandı";
export type Role = "Admin" | "Takım Lideri" | "Operatör";
export type RequestType = "Bonus" | "Nakit hediye" | "Düzeltme alt/üst" | "Bahis detayı";

export type Contact = {
  id: string;
  name: string;
  phone: string;
  gender: string;
  note?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  nationalId?: string;
  memberStatus: "Aktif" | "Pasif" | "Riskli" | "VIP";
  source: "WhatsApp" | "Chat" | "Manuel" | "Bot" | "Diğer";
  isRegistered: boolean;
  ownerOperatorId?: string;
  ownershipStatus: "active" | "passive" | "pool" | "blocked";
  assignedAt?: string;
  lastContactAt?: string;
  assignedByAdminId?: string;
  ownershipNotes?: string;
  tags: MemberTag[];
  createdAt: string;
  updatedAt: string;
};

export type ContactOwnershipRequest = {
  id: string;
  contactId: string;
  customerPhone: string;
  requestedByOperatorId?: string;
  currentOwnerOperatorId?: string;
  status: "pending" | "approved" | "rejected" | "pooled" | "blocked";
  note?: string;
  decisionNote?: string;
  decidedByAdminId?: string;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type MemberTag = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
};

export type RequestItem = {
  id: string;
  contactId: string;
  amount: string;
  status: RequestStatus;
  note: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  nationalId?: string;
  phone?: string;
  gender?: string;
  requestType: RequestType;
  bonusAmount?: string;
  bonusDescription?: string;
  giftAmount?: string;
  giftDescription?: string;
  correctionDirection?: string;
  correctionAmount?: string;
  correctionDescription?: string;
  betId?: string;
  gameName?: string;
  betDescription?: string;
  commandText?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type Conversation = {
  id: string;
  contactId: string;
  lineId?: string;
  assignedOperatorId?: string;
  status: ConversationStatus;
  isArchived: boolean;
  isMuted: boolean;
  unread: boolean;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  lineId?: string;
  providerType?: string;
  providerMessageId?: string;
  senderType: "customer" | "operator" | "system";
  messageText: string;
  status: "sent" | "delivered" | "read";
  createdBy?: string;
  createdAt: string;
};

export type CommunicationLine = {
  id: string;
  name: string;
  phoneNumber: string;
  countryCode: string;
  providerType: "whatsapp_baileys" | "whatsapp_web_js" | "whatsapp_web" | "whatsapp_cloud_api" | "cloud_api" | "telegram_bot" | "telegram_user" | "live_chat" | "email" | "sms" | "manual";
  status: "active" | "passive" | "connecting" | "blocked" | "disconnected" | "qr_waiting" | "connected" | "replacement_pending" | "archived";
  connectionStatus?: "disconnected" | "qr_pending" | "connecting" | "connected" | "error";
  sessionPath?: string;
  qrUpdatedAt?: string;
  lastDisconnectedAt?: string;
  lastError?: string;
  isActiveOperationLine?: boolean;
  isDefault: boolean;
  lastConnectedAt?: string;
  lastMessageAt?: string;
  blockedAt?: string;
  replacementOfLineId?: string;
  replacedByLineId?: string;
  archivedAt?: string;
  assignedOperatorId?: string;
  assignedAt?: string;
  assignedByAdminId?: string;
  assignmentNote?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type WhatsAppSessionLog = {
  id: string;
  lineId: string;
  eventType: string;
  status: string;
  details?: string;
  createdAt: string;
};

export type CommunicationSession = {
  id: string;
  lineId: string;
  providerType: string;
  sessionStatus: string;
  qrCode?: string;
  lastQrAt?: string;
  connectedAt?: string;
  disconnectedAt?: string;
  lastHealthCheckAt?: string;
  reconnectAttemptCount: number;
  lastError?: string;
  sessionStoragePath?: string;
  sessionKey?: string;
  createdAt: string;
  updatedAt: string;
};

export type OperatorLineSession = {
  id: string;
  operatorId: string;
  lineId: string;
  slotNumber: number;
  isActive: boolean;
  openedAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageTemplate = {
  id: string;
  title: string;
  hashtag: string;
  content: string;
  isActive: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VoiceTemplate = {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Operator = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "Aktif" | "Pasif";
  ttsDailyLimit: number;
  teamLeadId?: string;
  lastActiveAt: string;
};

export type TtsUsageLog = {
  id: string;
  operatorId?: string;
  memberId?: string;
  messageId?: string;
  messageText: string;
  characterCount: number;
  estimatedTokenCount: number;
  audioDurationSeconds: number;
  provider: "openai" | "elevenlabs" | "azure";
  model: string;
  voice: string;
  audioFileUrl: string;
  audioFileSizeBytes: number;
  fileSizeBytes: number;
  status: "created" | "sent" | "failed";
  estimatedCostUsd: string;
  errorMessage?: string;
  createdAt: string;
  sentAt?: string;
};

export type DailyTask = {
  id: string;
  contactId: string;
  title: string;
  note: string;
  notes: TaskNote[];
  taskDate: string;
  dueAt?: string;
  status: "Bekliyor" | "Tamamlandı";
  source: "Manuel" | "Otomatik Sistem" | "Karar Motoru" | "Talep" | "Sesli Yanıt" | "Üye Aktivitesi";
  sourceReferenceId?: string;
  automationRuleKey?: string;
  automationReason?: string;
  automationQuestions?: AutomationQuestionAnswer[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskNote = {
  id: string;
  taskId: string;
  noteText: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
};

export type CustomerNote = {
  id: string;
  contactId: string;
  noteText: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
};

export type TimelineEvent = {
  id: string;
  memberId?: string;
  operatorId?: string;
  operatorName?: string;
  eventType: string;
  eventTitle: string;
  eventDescription?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
};

export type AutomationRuleSetting = {
  id: string;
  key: string;
  enabled: boolean;
  value?: string;
  updatedAt: string;
};

export type AutomationTaskLog = {
  id: string;
  ruleKey: string;
  memberId?: string;
  taskId?: string;
  taskTitle: string;
  status: "created" | "skipped" | "duplicate" | "error" | "test";
  explanation?: string;
  createdAt: string;
};

export type AutomationQuestionAnswer = {
  question: string;
  answer: string;
};

export type AutomationDecisionLog = {
  id: string;
  memberId?: string;
  operatorId?: string;
  ruleKey: string;
  decisionType: "CREATE_TASK" | "FOLLOW_UP_TASK" | "SKIP" | "DUPLICATE" | "AUTO_COMPLETE_EXISTING_TASK" | "WAIT" | "ERROR";
  actionType?: "MESSAGE_DRAFT" | "CALL_REMINDER" | "REQUEST_CHECK" | "VOICE_FOLLOWUP" | "NOTE_REVIEW";
  reason: string;
  nextStep?: string;
  messageDraft?: string;
  questionAnswers: AutomationQuestionAnswer[];
  createdTaskId?: string;
  completedTaskId?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
};

export type AlarmItem = {
  id: string;
  scheduledAt: string;
  note: string;
  status: "Bekliyor" | "Ertelendi" | "Tamamlandı" | "Kapatıldı";
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AppData = {
  contacts: Contact[];
  requests: RequestItem[];
  conversations: Conversation[];
  messages: Message[];
  templates: MessageTemplate[];
  voiceTemplates: VoiceTemplate[];
  communicationLines: CommunicationLine[];
  communicationSessions?: CommunicationSession[];
  whatsappSessionLogs?: WhatsAppSessionLog[];
  operatorLineSessions: OperatorLineSession[];
  ownershipRequests: ContactOwnershipRequest[];
  memberTags: MemberTag[];
  automationSettings: AutomationRuleSetting[];
  automationLogs: AutomationTaskLog[];
  automationDecisionLogs: AutomationDecisionLog[];
  operators: Operator[];
  ttsUsageLogs: TtsUsageLog[];
  tasks: DailyTask[];
  customerNotes: CustomerNote[];
  timelineEvents: TimelineEvent[];
  alarms: AlarmItem[];
};
