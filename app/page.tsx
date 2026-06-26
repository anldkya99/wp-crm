"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Archive,
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Copy,
  LifeBuoy,
  LogOut,
  MessageCircle,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  Trash2,
  Volume2,
  VolumeX,
  UserRound,
  UsersRound
} from "lucide-react";
import clsx from "clsx";
import { formatCurrency, formatDate } from "@/lib/format";
import { systemGuideLastUpdate, systemGuideSections, systemPrinciples } from "@/lib/system-guide";
import type { AppData, Contact, MessageTemplate, RequestItem, RequestStatus, RequestType, SessionUser } from "@/types/domain";

const emptyData: AppData = {
  contacts: [],
  requests: [],
  conversations: [],
  messages: [],
  templates: [],
  voiceTemplates: [],
  communicationLines: [],
  operatorLineSessions: [],
  ownershipRequests: [],
  memberTags: [],
  automationSettings: [],
  automationLogs: [],
  automationDecisionLogs: [],
  operators: [],
  ttsUsageLogs: [],
  tasks: [],
  customerNotes: [],
  timelineEvents: [],
  alarms: []
};

const menu = [
  { key: "Dashboard", icon: BarChart3 },
  { key: "Talepler", icon: ClipboardList },
  { key: "Mesajlar", icon: MessageCircle },
  { key: "Üyeler", icon: UserRound },
  { key: "Hazır Cevaplar", icon: LifeBuoy },
  { key: "İletişim Hatları", icon: MessageCircle },
  { key: "Operatörler", icon: UsersRound },
  { key: "Operasyon Performansı", icon: BarChart3 },
  { key: "Ayarlar", icon: Settings }
] as const;

const requestStatuses: RequestStatus[] = ["Yeni", "İşlemde", "Beklemede", "Tamamlandı", "Kapatıldı"];
const requestTypes: RequestType[] = ["Bonus", "Nakit hediye", "Düzeltme alt/üst", "Bahis detayı"];
const defaultTaskTitles = [
  "Bugün tanışma mesajı ilet",
  "Bugün bonus tanımla",
  "Bugün tekrar aktiflik için yaz",
  "Bugün yaşadığı sorunu öğren",
  "Bugün memnuniyet kontrolü yap",
  "Bugün çekim durumunu sor",
  "Bugün özel kampanya ilet"
];
const newTaskOption = "+ Yeni görev ekle";
const statusTone: Record<string, string> = {
  Yeni: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  İşlemde: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  Beklemede: "border-coral/30 bg-coral/10 text-red-200",
  Tamamlandı: "border-mint/30 bg-mint/10 text-emerald-200",
  Kapatıldı: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  Cevaplandı: "border-mint/30 bg-mint/10 text-emerald-200",
  Kapandı: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  Aktif: "border-mint/30 bg-mint/10 text-emerald-200",
  Pasif: "border-slate-500/40 bg-slate-500/10 text-slate-300"
};
const lineStatusLabels: Record<string, string> = {
  active: "Aktif",
  passive: "Pasif",
  connecting: "Bağlanıyor",
  blocked: "Bloke",
  disconnected: "Bağlantı koptu",
  qr_waiting: "QR bekliyor",
  connected: "Bağlı",
  replacement_pending: "Değişim bekliyor",
  archived: "Arşiv"
};

type ActiveMenu = (typeof menu)[number]["key"];
type MessageSubMenu = "Tüm Mesajlar" | "Numara Kaydet" | "Sohbet Deposu";
type SettingsSubTab = "Genel" | "Sistem Kılavuzu";
type MemberDetailTab = "Genel Bilgiler" | "Notlar" | "Talepler" | "Görevler" | "Mesajlar" | "Zaman Çizelgesi";
type TimelineFilter = "Tümü" | "Mesajlar" | "Sesli Yanıtlar" | "Görevler" | "Talepler" | "Notlar" | "Üye İşlemleri";
type AutomationLogFilter = "Tümü" | "Oluşturuldu" | "Hata" | "Zaten var";
type AutomationLogDateMode = "Bugün" | "Dün" | "Son 7 gün" | "Özel tarih";
type TaskArchiveFilter = "Bugün" | "Dün" | "Son 7 Gün" | "Son 30 Gün" | "Tarih Aralığı Seç";
type AutomationDecisionResult = {
  memberId: string;
  ruleKey: string;
  ruleName: string;
  decisionType: "CREATE_TASK" | "FOLLOW_UP_TASK" | "SKIP" | "DUPLICATE" | "AUTO_COMPLETE_EXISTING_TASK" | "WAIT" | "ERROR";
  actionType?: "MESSAGE_DRAFT" | "CALL_REMINDER" | "REQUEST_CHECK" | "VOICE_FOLLOWUP" | "NOTE_REVIEW";
  reason: string;
  nextStep?: string;
  taskTitle?: string;
  messageDraft?: string;
  sourceReferenceId?: string;
  referenceType?: string;
  referenceId?: string;
  questionAnswers: Array<{ question: string; answer: string }>;
};
type TaskGroup = {
  contactId: string;
  total: number;
  pending: number;
  completed: number;
  sources: string[];
  tasks: AppData["tasks"];
  latestTaskTitle: string;
  latestTaskAt: string;
};
type TaskDateGroup = {
  dateKey: string;
  groups: TaskGroup[];
};

const emptyRequest = {
  firstName: "",
  lastName: "",
  username: "",
  nationalId: "",
  phone: "",
  gender: "Belirtilmedi",
  amount: "",
  note: "",
  requestType: "Bonus" as RequestType,
  bonusAmount: "",
  bonusDescription: "",
  giftAmount: "",
  giftDescription: "",
  correctionDirection: "Alt",
  correctionAmount: "",
  correctionDescription: "",
  betId: "",
  gameName: "",
  betDescription: ""
};

export default function Home() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [active, setActive] = useState<ActiveMenu>("Dashboard");
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messageSubMenu, setMessageSubMenu] = useState<MessageSubMenu>("Tüm Mesajlar");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [sessionLineId, setSessionLineId] = useState("");
  const [sessionSlotModal, setSessionSlotModal] = useState<number | null>(null);
  const [sessionLineSelect, setSessionLineSelect] = useState("");
  const [conversationMenuOpen, setConversationMenuOpen] = useState(false);
  const [archiveDetailId, setArchiveDetailId] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [draft, setDraft] = useState("");
  const [pendingSuggestion, setPendingSuggestion] = useState<AutomationDecisionResult | null>(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState("");
  const [voiceTemplateTitle, setVoiceTemplateTitle] = useState("");
  const [voiceAudioUrl, setVoiceAudioUrl] = useState("");
  const [voiceUsageLogId, setVoiceUsageLogId] = useState("");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [requestForm, setRequestForm] = useState(emptyRequest);
  const [contactForm, setContactForm] = useState({ firstName: "", lastName: "", username: "", nationalId: "", name: "", phone: "", gender: "Belirtilmedi", note: "", memberStatus: "Aktif", source: "Manuel" });
  const [ownershipConflict, setOwnershipConflict] = useState<{ contactId: string; phone: string; currentOwnerOperatorId?: string; message: string } | null>(null);
  const [ownershipRequestNote, setOwnershipRequestNote] = useState("");
  const [memberTransferForm, setMemberTransferForm] = useState({ contactId: "", operatorId: "", reason: "Hat değişimi", note: "", sendInfo: false, message: "Merhaba {hitap}, operasyon süreciniz yeni sorumlu operatörümüz tarafından takip edilecektir." });
  const [memberDetailId, setMemberDetailId] = useState("");
  const [memberDetailTab, setMemberDetailTab] = useState<MemberDetailTab>("Genel Bilgiler");
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("Tümü");
  const [automationResult, setAutomationResult] = useState<null | {
    checkedMemberCount: number;
    createdCount: number;
    skippedCount: number;
    duplicateCount: number;
    autoCompletedCount: number;
    waitCount: number;
    errorCount: number;
    errors: string[];
    lastRunAt: string;
    message?: string;
    decisions?: AutomationDecisionResult[];
  }>(null);
  const [automationLoading, setAutomationLoading] = useState(false);
  const [automationLogFilter, setAutomationLogFilter] = useState<AutomationLogFilter>("Oluşturuldu");
  const [automationLogDateMode, setAutomationLogDateMode] = useState<AutomationLogDateMode>("Bugün");
  const [automationLogDate, setAutomationLogDate] = useState(() => dateInputValue(new Date()));
  const [memberStatusFilter, setMemberStatusFilter] = useState("Tümü");
  const [memberGenderFilter, setMemberGenderFilter] = useState("Tümü");
  const [memberTagFilter, setMemberTagFilter] = useState("Tüm üyeler");
  const [memberSort, setMemberSort] = useState("Son görüşme");
  const [editingContactId, setEditingContactId] = useState("");
  const [preview, setPreview] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState("");
  const [templateForm, setTemplateForm] = useState({ title: "", hashtag: "", content: "", isActive: true, isPinned: false });
  const [operatorForm, setOperatorForm] = useState({ name: "", email: "", password: "", role: "Operatör", status: "Aktif", teamLeadId: "" });
  const [editingLineId, setEditingLineId] = useState("");
  const [lineForm, setLineForm] = useState({ name: "", phoneNumber: "", countryCode: "+90", providerType: "manual", status: "passive", isDefault: false, assignedOperatorId: "", assignmentNote: "", notes: "" });
  const [query, setQuery] = useState("");
  const [guideQuery, setGuideQuery] = useState("");
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>("Genel");
  const [messageLineFilter, setMessageLineFilter] = useState("Tüm Hatlar");
  const [now, setNow] = useState(new Date());
  const [taskCenterOpen, setTaskCenterOpen] = useState(false);
  const [taskAssistantOpen, setTaskAssistantOpen] = useState(false);
  const [alarmCenterOpen, setAlarmCenterOpen] = useState(false);
  const [activeAlarmId, setActiveAlarmId] = useState("");
  const [taskForm, setTaskForm] = useState({ title: defaultTaskTitles[0], customTitle: "", contactIds: [] as string[] });
  const [taskSearch, setTaskSearch] = useState("");
  const [taskFeedback, setTaskFeedback] = useState({ type: "", message: "" });
  const [customTaskTitles, setCustomTaskTitles] = useState<string[]>([]);
  const [taskCenterTab, setTaskCenterTab] = useState<"Bugünkü Görevler" | "Geçmiş Görevler">("Bugünkü Görevler");
  const [taskArchiveFilter, setTaskArchiveFilter] = useState<TaskArchiveFilter>("Bugün");
  const [taskArchiveStartDate, setTaskArchiveStartDate] = useState(() => dateInputValue(new Date()));
  const [taskArchiveEndDate, setTaskArchiveEndDate] = useState(() => dateInputValue(new Date()));
  const [taskDetailContactId, setTaskDetailContactId] = useState("");
  const [taskDetailDateKey, setTaskDetailDateKey] = useState("");
  const [taskNoteDrafts, setTaskNoteDrafts] = useState<Record<string, string>>({});
  const [pendingGuidanceTaskId, setPendingGuidanceTaskId] = useState("");
  const [performanceTab, setPerformanceTab] = useState<"Genel Performans" | "Görev Performansı" | "Talep Performansı" | "TTS Performansı">("Genel Performans");
  const [customerNoteDraft, setCustomerNoteDraft] = useState("");
  const [memberNoteDraft, setMemberNoteDraft] = useState("");
  const [timelineContactId, setTimelineContactId] = useState("");
  const [alarmForm, setAlarmForm] = useState({ alarmDate: dateInputValue(new Date()), alarmTime: timeInputValue(new Date()), note: "" });
  const [requestDetailId, setRequestDetailId] = useState("");
  const [requestDetailForm, setRequestDetailForm] = useState({ status: "Yeni" as RequestStatus, note: "" });
  const [requestListTab, setRequestListTab] = useState<"Bugünkü Talepler" | "Geçmiş Talepler">("Bugünkü Talepler");
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const activeContactIdRef = useRef("");

  async function loadData(nextConversationId?: string, nextContactId?: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/app", { cache: "no-store" });
      if (!response.ok) throw new Error("Veriler alınamadı.");
      const payload = (await response.json()) as AppData;
      setData(payload);
      const nextConversation = nextConversationId ? payload.conversations.find((item) => item.id === nextConversationId) : undefined;
      const fallbackContactId = payload.contacts.find((contact) => contact.isRegistered)?.id ?? payload.contacts[0]?.id ?? "";
      const contactId = nextContactId ?? nextConversation?.contactId ?? (selectedContactId || fallbackContactId);
      const conversationId =
        nextConversationId ??
        payload.conversations.find((conversation) => conversation.contactId === contactId)?.id ??
        "";
      activeContactIdRef.current = contactId;
      setSelectedContactId(contactId);
      setSelectedConversationId(conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = window.sessionStorage.getItem("whatsapp-ops-user");
    if (stored) setUser(JSON.parse(stored));
    const params = new URLSearchParams(window.location.search);
    setSessionLineId(params.get("sessionLineId") ?? "");
  }, []);

  useEffect(() => {
    if (user) void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user && !canUseMenu(active, user)) setActive("Dashboard");
  }, [active, user]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isAdmin = user?.role === "Admin";
  const isTeamLead = user?.role === "Takım Lideri";
  const canManageOperationRules = isAdmin || String(user?.role ?? "") === "COO";
  const canManageOwnership = isAdmin || String(user?.role ?? "") === "COO";
  const canManageTtsCosts = isAdmin;
  const canDistributeTasks = isAdmin || isTeamLead;
  const canArchiveChats = isAdmin;
  const scopedData = useMemo(() => user ? scopeAppDataForUser(data, user) : data, [data, user]);
  const visibleMenu = useMemo(() => menu.filter((item) => canUseMenu(item.key, user)), [user]);
  const visibleOperators = scopedData.operators;

  const selectedConversation =
    scopedData.conversations.find((item) => item.id === selectedConversationId && !item.isArchived) ??
    scopedData.conversations.find((item) => item.contactId === selectedContactId && !item.isArchived);
  const selectedContact = selectedContactId ? contactById(scopedData, selectedContactId) : selectedConversation ? contactById(scopedData, selectedConversation.contactId) : undefined;
  const requestDetail = scopedData.requests.find((request) => request.id === requestDetailId);
  const requestDetailContact = requestDetail ? contactById(scopedData, requestDetail.contactId) : undefined;
  const selectedMessages = selectedConversation
    ? scopedData.messages.filter((message) => message.conversationId === selectedConversation.id)
    : [];
  const selectedMessageItems = useMemo(() => buildMessageItems(selectedMessages), [selectedMessages]);
  const todayTasks = useMemo(
    () => scopedData.tasks.filter((task) => isSameLocalDay(task.taskDate, now)),
    [scopedData.tasks, now]
  );
  const pastTasks = useMemo(
    () => scopedData.tasks.filter((task) => dateKey(task.taskDate) < dateInputValue(now)),
    [scopedData.tasks, now]
  );
  const pendingTodayTasks = useMemo(
    () => todayTasks.filter((task) => task.status === "Bekliyor"),
    [todayTasks]
  );
  const completedTodayTasks = useMemo(
    () => todayTasks.filter((task) => task.status === "Tamamlandı"),
    [todayTasks]
  );
  const overduePendingTaskCount = useMemo(
    () => pastTasks.filter((task) => task.status === "Bekliyor").length,
    [pastTasks]
  );
  const overduePendingTasks = useMemo(
    () => pastTasks.filter((task) => task.status === "Bekliyor"),
    [pastTasks]
  );
  const taskArchiveTasks = useMemo(
    () => scopedData.tasks.filter((task) => isTaskInArchiveRange(task, taskArchiveFilter, taskArchiveStartDate, taskArchiveEndDate, now)),
    [scopedData.tasks, taskArchiveEndDate, taskArchiveFilter, taskArchiveStartDate, now]
  );
  const taskDetailContact = taskDetailContactId ? contactById(scopedData, taskDetailContactId) : undefined;
  const taskDetailTasks = scopedData.tasks.filter((task) => task.contactId === taskDetailContactId && dateKey(task.taskDate) === taskDetailDateKey);
  const taskGroups = useMemo(() => groupTasksByContact(todayTasks), [todayTasks]);
  const selectedCustomerNotes = useMemo(
    () => selectedContact ? scopedData.customerNotes.filter((note) => note.contactId === selectedContact.id) : [],
    [scopedData.customerNotes, selectedContact]
  );
  const selectedCustomerTimeline = useMemo(
    () => selectedContact ? buildCustomerTimeline(scopedData, selectedContact) : [],
    [scopedData, selectedContact]
  );
  const timelineContact = timelineContactId ? contactById(scopedData, timelineContactId) : undefined;
  const timelineEvents = useMemo(
    () => timelineContact ? buildCustomerTimeline(scopedData, timelineContact) : [],
    [scopedData, timelineContact]
  );
  const operationSummary = useMemo(() => getOperationSummary(scopedData, now, overduePendingTaskCount), [scopedData, now, overduePendingTaskCount]);
  const operationScore = useMemo(
    () => calculateOperationScore(operationSummary, todayTasks),
    [operationSummary, todayTasks]
  );
  const operationScoreDetails = useMemo(
    () => buildOperationScoreDetails(operationSummary, todayTasks),
    [operationSummary, todayTasks]
  );
  const defaultLine = useMemo(() => scopedData.communicationLines.find((line) => line.isDefault), [scopedData.communicationLines]);
  const activeLine = useMemo(
    () => scopedData.communicationLines.find((line) => line.id === sessionLineId) ?? defaultLine,
    [defaultLine, scopedData.communicationLines, sessionLineId]
  );
  const userLineSessions = useMemo(
    () => user ? scopedData.operatorLineSessions.filter((session) => session.operatorId === user.id && session.isActive) : [],
    [scopedData.operatorLineSessions, user]
  );
  const assignedLineIds = useMemo(
    () => new Set(scopedData.operatorLineSessions.filter((session) => session.isActive).map((session) => session.lineId)),
    [scopedData.operatorLineSessions]
  );
  const availableSessionLines = useMemo(
    () => scopedData.communicationLines.filter((line) => !assignedLineIds.has(line.id)),
    [assignedLineIds, scopedData.communicationLines]
  );
  const performanceRows = useMemo(() => buildPerformanceRows(scopedData, now), [scopedData, now]);
  const ttsUsageSummary = useMemo(() => buildTtsUsageSummary(scopedData, now), [scopedData, now]);
  const todayRequests = useMemo(
    () => scopedData.requests.filter((request) => isSameLocalDay(request.createdAt, now)),
    [scopedData.requests, now]
  );
  const pastOpenRequests = useMemo(
    () => scopedData.requests.filter((request) => dateKey(request.createdAt) < dateInputValue(now) && request.status !== "Tamamlandı" && request.status !== "Kapatıldı"),
    [scopedData.requests, now]
  );
  const activeAlarm = useMemo(
    () => data.alarms.find((alarm) => alarm.id === activeAlarmId),
    [activeAlarmId, data.alarms]
  );
  const registeredContacts = useMemo(
    () =>
      scopedData.contacts.filter((contact) => contact.isRegistered),
    [scopedData]
  );
  const recentRegisteredContacts = useMemo(
    () => [...registeredContacts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [registeredContacts]
  );
  const sortedContacts = useMemo(
    () => [...registeredContacts].sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [registeredContacts]
  );
  const filteredMembers = useMemo(
    () =>
      [...registeredContacts]
        .filter((contact) => memberStatusFilter === "Tümü" || contact.memberStatus === memberStatusFilter)
        .filter((contact) => memberGenderFilter === "Tümü" || contact.gender === memberGenderFilter)
        .filter((contact) => memberTagFilter === "Tüm üyeler" || contact.tags.some((tag) => tag.name === memberTagFilter))
        .sort((a, b) => {
          if (memberSort === "Son görüşme") {
            return getMemberLastConversation(scopedData, b.id).getTime() - getMemberLastConversation(scopedData, a.id).getTime();
          }
          return memberDisplayName(a).localeCompare(memberDisplayName(b), "tr");
        }),
    [scopedData, memberGenderFilter, memberSort, memberStatusFilter, memberTagFilter, registeredContacts]
  );
  const memberDetail = memberDetailId ? contactById(scopedData, memberDetailId) : undefined;
  const memberDetailConversations = memberDetail ? scopedData.conversations.filter((conversation) => conversation.contactId === memberDetail.id) : [];
  const memberDetailMessages = memberDetailConversations.length > 0
    ? scopedData.messages.filter((message) => memberDetailConversations.some((conversation) => conversation.id === message.conversationId))
    : [];
  const memberDetailRequests = memberDetail ? scopedData.requests.filter((request) => request.contactId === memberDetail.id) : [];
  const memberDetailTasks = memberDetail ? scopedData.tasks.filter((task) => task.contactId === memberDetail.id) : [];
  const memberDetailNotes = memberDetail ? scopedData.customerNotes.filter((note) => note.contactId === memberDetail.id) : [];
  const memberDetailTimeline = useMemo(
    () => memberDetail ? buildMemberTimeline(scopedData, memberDetail, timelineFilter).slice(0, 100) : [],
    [memberDetail, scopedData, timelineFilter]
  );
  const memberDetailLastConversation = [...memberDetailConversations].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())[0];
  const activeConversations = useMemo(
    () => scopedData.conversations.filter((conversation) => !conversation.isArchived),
    [scopedData.conversations]
  );
  const archivedConversations = useMemo(
    () => scopedData.conversations.filter((conversation) => conversation.isArchived),
    [scopedData.conversations]
  );
  const archiveDetailConversation = archivedConversations.find((conversation) => conversation.id === archiveDetailId);
  const archiveDetailContact = archiveDetailConversation ? contactById(scopedData, archiveDetailConversation.contactId) : undefined;
  const archiveDetailMessages = archiveDetailConversation
    ? scopedData.messages.filter((message) => message.conversationId === archiveDetailConversation.id)
    : [];
  const messageContacts = useMemo(
    () =>
      [...scopedData.contacts]
        .filter((contact) => {
          const activeConversation = activeConversations.find((conversation) => conversation.contactId === contact.id);
          if (messageLineFilter !== "Tüm Hatlar" && activeConversation?.lineId !== messageLineFilter) return false;
          const hasActiveConversation = Boolean(activeConversation);
          const hasAnyConversation = scopedData.conversations.some((conversation) => conversation.contactId === contact.id);
          return hasActiveConversation || (contact.isRegistered && !hasAnyConversation);
        })
        .sort((a, b) => contactDisplayName(a).localeCompare(contactDisplayName(b), "tr")),
    [activeConversations, messageLineFilter, scopedData.contacts, scopedData.conversations]
  );
  const taskTitleOptions = useMemo(
    () => [...defaultTaskTitles, ...customTaskTitles, newTaskOption],
    [customTaskTitles]
  );
  const selectedTaskContacts = useMemo(
    () => taskForm.contactIds.map((id) => contactById(scopedData, id)).filter(Boolean) as Contact[],
    [scopedData, taskForm.contactIds]
  );
  const filteredTaskContacts = useMemo(() => {
    const term = taskSearch.trim().toLocaleLowerCase("tr-TR");
    const normalizedTerm = normalizePhone(taskSearch);
    return sortedContacts
      .filter((contact) => {
        if (!term) return true;
        const textMatch = `${contact.name} ${contact.phone}`.toLocaleLowerCase("tr-TR").includes(term);
        const phoneMatch = normalizedTerm ? normalizePhone(contact.phone).includes(normalizedTerm) : false;
        return textMatch || phoneMatch;
      })
      .slice(0, term ? 25 : 10);
  }, [sortedContacts, taskSearch]);
  const templateSearchTerm = draft.startsWith("#") ? draft.slice(1).trim().toLocaleLowerCase("tr-TR") : "";
  const templateSearchResults = useMemo(() => {
    if (!draft.startsWith("#")) return [];
    return data.templates
      .filter((template) => template.isActive)
      .filter((template) => {
        const searchable = `${template.hashtag || template.title} ${template.title}`.toLocaleLowerCase("tr-TR");
        return searchable.includes(templateSearchTerm);
      })
      .slice(0, 8);
  }, [data.templates, draft, templateSearchTerm]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: "end" });
  }, [selectedConversationId, selectedMessages.length]);

  useEffect(() => {
    setConversationMenuOpen(false);
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (messageSubMenu !== "Tüm Mesajlar") setConversationMenuOpen(false);
  }, [messageSubMenu]);

  useEffect(() => {
    if (selectedContact?.id) activeContactIdRef.current = selectedContact.id;
  }, [selectedContact?.id]);

  const metrics = useMemo(() => {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    return [
      { label: "Toplam Talep", value: scopedData.requests.length },
      { label: "Bekleyen Mesaj", value: scopedData.conversations.filter((c) => c.unread).length },
      { label: "Cevaplanan Mesaj", value: scopedData.conversations.filter((c) => c.status === "Cevaplandı").length },
      { label: "Son 24 Saat Konuşma", value: scopedData.conversations.filter((c) => new Date(c.lastMessageAt).getTime() > since).length }
    ];
  }, [scopedData]);
  const automationSummary = useMemo(() => getAutomationSummary(scopedData, now), [scopedData, now]);
  const ownershipSummary = useMemo(() => getOwnershipSummary(scopedData, now), [scopedData, now]);
  const filteredAutomationLogs = useMemo(
    () => data.automationLogs
      .filter((log) => automationLogInRange(log.createdAt, automationLogDateMode, automationLogDate, now))
      .filter((log) => automationLogFilter === "Tümü" || automationLogLabel(log.status) === automationLogFilter)
      .slice(0, 50),
    [automationLogDate, automationLogDateMode, automationLogFilter, data.automationLogs, now]
  );
  const guidanceTasks = useMemo(
    () => pendingTodayTasks
      .map((task) => ({ task, contact: contactById(scopedData, task.contactId), urgency: guidanceTaskUrgency(task, contactById(scopedData, task.contactId)) }))
      .sort((a, b) => {
        const priority = guidanceUrgencyPriority(b.urgency) - guidanceUrgencyPriority(a.urgency);
        if (priority !== 0) return priority;
        return new Date(a.task.createdAt).getTime() - new Date(b.task.createdAt).getTime();
      }),
    [pendingTodayTasks, scopedData]
  );

  useEffect(() => {
    const dueAlarm = data.alarms.find((alarm) => {
      if (alarm.status !== "Bekliyor" && alarm.status !== "Ertelendi") return false;
      return new Date(alarm.scheduledAt).getTime() <= now.getTime();
    });
    if (dueAlarm && activeAlarmId !== dueAlarm.id) setActiveAlarmId(dueAlarm.id);
  }, [activeAlarmId, data.alarms, now]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm)
    });
    const payload = await response.json();
    if (!response.ok) {
      setLoginError(payload.error ?? "Giriş başarısız.");
      return;
    }
    setUser(payload.user);
    window.sessionStorage.setItem("whatsapp-ops-user", JSON.stringify(payload.user));
  }

  async function saveRequest(startConversation: boolean) {
    const commandText = requestCommandFromForm(requestForm);
    const payload = await postJson("/api/requests", { ...requestForm, commandText, startConversation, createdBy: user?.id });
    if (!payload) return;
    setRequestForm(emptyRequest);
    setPreview("");
    await loadData(payload.conversation?.id);
    if (payload.conversation?.id) setActive("Mesajlar");
  }

  function openRequestDetail(request: RequestItem) {
    setRequestDetailId(request.id);
    setRequestDetailForm({ status: request.status, note: request.note });
  }

  function openMessageForRequest(request: RequestItem) {
    const conversation = scopedData.conversations.find((item) => item.contactId === request.contactId);
    activeContactIdRef.current = request.contactId;
    setSelectedContactId(request.contactId);
    setSelectedConversationId(conversation?.id ?? "");
    setMessageSubMenu("Tüm Mesajlar");
    setActive("Mesajlar");
    setRequestDetailId("");
  }

  async function updateRequestDetail() {
    if (!requestDetail) return;
    const payload = await patchJson("/api/requests", { id: requestDetail.id, ...requestDetailForm, createdBy: user?.id });
    if (!payload) return;
    await loadData();
  }

  async function copyBonusCommand() {
    if (!requestDetail || !requestDetailContact) return;
    const command = requestCommand(requestDetail, requestDetailContact);
    await navigator.clipboard.writeText(command);
  }

  function previewRequestMessage() {
    const fakeContact: Contact = {
      id: "preview",
      name: requestFullNameFromForm(requestForm),
      phone: requestForm.phone,
      gender: requestForm.gender,
      memberStatus: "Aktif",
      source: "Manuel",
      isRegistered: true,
      ownershipStatus: "pool",
      tags: [],
      createdAt: "",
      updatedAt: ""
    };
    const fakeRequest: RequestItem = {
      id: "preview",
      contactId: "preview",
      amount: requestForm.amount,
      status: "Beklemede",
      note: requestForm.note,
      firstName: requestForm.firstName,
      lastName: requestForm.lastName,
      username: requestForm.username,
      nationalId: requestForm.nationalId,
      phone: requestForm.phone,
      gender: requestForm.gender,
      requestType: requestForm.requestType,
      bonusAmount: requestForm.bonusAmount,
      bonusDescription: requestForm.bonusDescription,
      giftAmount: requestForm.giftAmount,
      giftDescription: requestForm.giftDescription,
      correctionDirection: requestForm.correctionDirection,
      correctionAmount: requestForm.correctionAmount,
      correctionDescription: requestForm.correctionDescription,
      betId: requestForm.betId,
      gameName: requestForm.gameName,
      betDescription: requestForm.betDescription,
      createdBy: user?.id ?? "",
      createdAt: "",
      updatedAt: ""
    };
    setPreview(requestCommand(fakeRequest, fakeContact));
  }

  function applyMemberToRequestForm(nextForm: typeof emptyRequest) {
    const member = findMatchingMember(scopedData.contacts, nextForm);
    if (!member) return nextForm;
    return {
      ...nextForm,
      firstName: member.firstName || getFirstName(member),
      lastName: member.lastName || getLastName(member),
      username: member.username ?? nextForm.username,
      nationalId: member.nationalId ?? nextForm.nationalId,
      phone: member.phone,
      gender: member.gender
    };
  }

  async function sendMessage() {
    const text = draft;
    if (!selectedContact || !text.trim()) return;
    const payload = await postJson("/api/messages", {
      conversationId: selectedConversation?.id,
      contactId: selectedContact.id,
      messageText: text,
      incoming: false,
      createdBy: user?.id,
      operatorRole: user?.role,
      lineId: selectedConversation?.lineId || activeLine?.id,
      guidance: pendingSuggestion ? guidancePayload(pendingSuggestion) : undefined
    });
    if (!payload) return;
    if (pendingGuidanceTaskId) {
      await patchJson("/api/tasks", { id: pendingGuidanceTaskId, status: "COMPLETED", createdBy: user?.id });
    }
    setDraft("");
    setPendingSuggestion(null);
    setPendingGuidanceTaskId("");
    await loadData(payload.conversation?.id, selectedContact.id);
  }

  async function generateVoiceReply() {
    setVoiceError("");
    const renderedText = renderVoiceTemplate(voiceDraft, selectedContact, selectedContact ? latestRequestForContact(data, selectedContact.id) : undefined);
    if (!renderedText.trim()) {
      setVoiceError("Ses oluşturmak için metin yazın.");
      return;
    }
    if (renderedText.length > 600) {
      setVoiceError("Sesli yanıt metni 600 karakteri geçmemeli.");
      return;
    }
    setVoiceLoading(true);
    try {
      const response = await fetch("/api/voice-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: renderedText, voice: "female", language: "tr", operatorId: user?.id, memberId: selectedContact?.id })
      });
      const payload = await response.json();
      if (!response.ok) {
        setVoiceError(payload.error ?? "Ses oluşturulamadı.");
        return;
      }
      setVoiceAudioUrl(payload.audioUrl);
      setVoiceUsageLogId(payload.usageLog?.id ?? "");
      setVoiceDraft(renderedText);
      if (payload.usageLog) {
        setData((current) => ({ ...current, ttsUsageLogs: [payload.usageLog, ...current.ttsUsageLogs] }));
      }
    } finally {
      setVoiceLoading(false);
    }
  }

  async function saveVoiceTemplate() {
    setVoiceError("");
    if (!voiceTemplateTitle.trim() || !voiceDraft.trim()) {
      setVoiceError("Şablon adı ve metin zorunlu.");
      return;
    }
    const payload = await postJson("/api/voice-templates", { title: voiceTemplateTitle, content: voiceDraft });
    if (!payload) return;
    setVoiceTemplateTitle("");
    await loadData(selectedConversation?.id, selectedContact?.id);
  }

  async function sendVoiceReply() {
    if (!selectedContact || !voiceAudioUrl || !voiceDraft.trim()) return;
    const payload = await postJson("/api/messages", {
      conversationId: selectedConversation?.id,
      contactId: selectedContact.id,
      messageText: voiceMessagePayload(voiceDraft, voiceAudioUrl, voiceUsageLogId, user?.name),
      incoming: false,
      createdBy: user?.id,
      operatorRole: user?.role,
      lineId: selectedConversation?.lineId || activeLine?.id
    });
    if (!payload) return;
    setVoiceModalOpen(false);
    setVoiceDraft("");
    setVoiceAudioUrl("");
    setVoiceUsageLogId("");
    setVoiceError("");
    await loadData(payload.conversation?.id, selectedContact.id);
  }

  async function setConversationArchived(conversationId: string, isArchived: boolean) {
    if (!canArchiveChats) {
      setError("Sohbeti depoya taşıma yetkisi sadece Admin rolünde.");
      return;
    }
    const payload = await patchJson("/api/conversations", { id: conversationId, isArchived });
    if (!payload) return;
    if (selectedConversationId === conversationId && isArchived) {
      setSelectedConversationId("");
    }
    if (!isArchived && archiveDetailId === conversationId) {
      setArchiveDetailId("");
    }
    setConversationMenuOpen(false);
    await loadData();
  }

  async function toggleConversationMuted(conversationId: string, isMuted: boolean) {
    const payload = await patchJson("/api/conversations", { id: conversationId, isMuted });
    if (!payload) return;
    setConversationMenuOpen(false);
    await loadData(conversationId);
  }

  async function saveContact() {
    setOwnershipConflict(null);
    setError("");
    const response = await fetch("/api/contacts", {
      method: editingContactId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingContactId ? { id: editingContactId, ...contactForm, operatorId: user?.id, operatorRole: user?.role } : { ...contactForm, operatorId: user?.id, operatorRole: user?.role })
    });
    const payload = await response.json();
    if (!response.ok) {
      if (response.status === 409 && payload.conflict?.contactId) {
        setOwnershipConflict({
          contactId: payload.conflict.contactId,
          phone: payload.conflict.phone ?? contactForm.phone,
          currentOwnerOperatorId: payload.conflict.currentOwnerOperatorId,
          message: payload.error ?? "Bu müşteri için admin izni gerekli."
        });
        setError("");
        return;
      }
      setError(payload.error ?? "İşlem tamamlanamadı.");
      return;
    }
    if (!payload) return;
    setEditingContactId("");
    setOwnershipRequestNote("");
    setContactForm(emptyContactForm());
    activeContactIdRef.current = payload.contact?.id ?? "";
    await loadData(undefined, payload.contact?.id);
  }

  async function requestOwnershipPermission() {
    if (!ownershipConflict) return;
    const payload = await postJson("/api/ownership-requests", {
      contactId: ownershipConflict.contactId,
      requestedByOperatorId: user?.id,
      note: ownershipRequestNote
    });
    if (!payload) return;
    setTaskFeedback({ type: "success", message: "İletişim izin talebi admin onayına gönderildi." });
    setOwnershipConflict(null);
    setOwnershipRequestNote("");
    await loadData();
  }

  async function decideOwnershipRequest(requestId: string, action: "approve" | "reject" | "pool" | "block") {
    if (!canManageOwnership) return;
    const decisionNote = window.prompt("Karar notu (opsiyonel)") ?? "";
    const payload = await patchJson("/api/ownership-requests", {
      id: requestId,
      action,
      decidedByAdminId: user?.id,
      decisionNote
    });
    if (!payload) return;
    await loadData();
  }

  async function transferMemberOwnership() {
    if (!canManageOwnership) return;
    if (!memberTransferForm.contactId || !memberTransferForm.operatorId) {
      setError("Üye ve yeni operatör seçilmelidir.");
      return;
    }
    const payload = await patchJson("/api/ownership-requests", {
      action: "direct_transfer",
      contactId: memberTransferForm.contactId,
      newOperatorId: memberTransferForm.operatorId,
      decidedByAdminId: user?.id,
      decisionNote: `${memberTransferForm.reason}${memberTransferForm.note ? ` - ${memberTransferForm.note}` : ""}`,
      sendInfo: memberTransferForm.sendInfo,
      infoMessage: memberTransferForm.message
    });
    if (!payload) return;
    setTaskFeedback({ type: "success", message: "Üye yeni operatöre devredildi." });
    setMemberTransferForm({ contactId: "", operatorId: "", reason: "Hat değişimi", note: "", sendInfo: false, message: "Merhaba {hitap}, operasyon süreciniz yeni sorumlu operatörümüz tarafından takip edilecektir." });
    await loadData();
  }

  function editContact(contact: Contact) {
    setEditingContactId(contact.id);
    setContactForm({
      firstName: contact.firstName ?? getFirstName(contact),
      lastName: contact.lastName ?? getLastName(contact),
      username: contact.username ?? "",
      nationalId: contact.nationalId ?? "",
      name: contact.name,
      phone: contact.phone,
      gender: contact.gender,
      note: contact.note ?? "",
      memberStatus: contact.memberStatus,
      source: contact.source
    });
  }

  function cancelContactEdit() {
    setEditingContactId("");
    setOwnershipConflict(null);
    setOwnershipRequestNote("");
    setContactForm(emptyContactForm());
  }

  async function deleteContact(contact: Contact) {
    if (!window.confirm(`${contact.name} rehber kaydından kaldırılsın mı? Sohbet geçmişi silinmeyecek.`)) return;
    const payload = await deleteJson("/api/contacts", { id: contact.id, operatorId: user?.id });
    if (!payload) return;
    if (editingContactId === contact.id) cancelContactEdit();
    const nextContactId = selectedContactId === contact.id ? "" : selectedContactId;
    await loadData(undefined, nextContactId);
  }

  async function toggleMemberStatus(contact: Contact) {
    const payload = await patchJson("/api/contacts", {
      id: contact.id,
      firstName: contact.firstName ?? getFirstName(contact),
      lastName: contact.lastName ?? getLastName(contact),
      username: contact.username ?? "",
      nationalId: contact.nationalId ?? "",
      name: contact.name,
      phone: contact.phone,
      gender: contact.gender,
      note: contact.note ?? "",
      memberStatus: contact.memberStatus === "Pasif" ? "Aktif" : "Pasif",
      source: contact.source,
      operatorId: user?.id
    });
    if (!payload) return;
    await loadData(undefined, contact.id);
  }

  async function addMemberTag(contactId: string, tagId: string) {
    if (!tagId) return;
    const payload = await postJson("/api/member-tags", { memberId: contactId, tagId, operatorId: user?.id });
    if (!payload) return;
    await loadData(undefined, contactId);
  }

  async function removeMemberTag(contactId: string, tagId: string) {
    const payload = await deleteJson("/api/member-tags", { memberId: contactId, tagId, operatorId: user?.id });
    if (!payload) return;
    await loadData(undefined, contactId);
  }

  async function updateAutomationSetting(key: string, enabled: boolean, value?: string) {
    if (!canManageOperationRules) return;
    const payload = await patchJson("/api/automation-settings", { key, enabled, value });
    if (!payload) return;
    await loadData();
  }

  async function runAutomation(dryRun: boolean) {
    if (!canManageOperationRules) return;
    setAutomationLoading(true);
    setAutomationResult(null);
    try {
      const payload = await postJson("/api/automation-run", { dryRun, operatorId: user?.id });
      if (payload) {
        setAutomationResult(payload);
        if (!dryRun && Array.isArray(payload.decisions)) {
          await Promise.all(
            (payload.decisions as AutomationDecisionResult[])
              .filter((decision) => canCreateGuidanceTask(decision))
              .slice(0, 20)
              .map((decision) => postJson("/api/automation-actions", { action: "SUGGESTION_CREATED", operatorId: user?.id, ...guidancePayload(decision) }))
          );
          await loadData();
        }
      }
    } finally {
      setAutomationLoading(false);
    }
  }

  async function useGuidanceDraft(decision: AutomationDecisionResult) {
    const contact = contactById(scopedData, decision.memberId);
    if (!contact) return;
    const nextDraft = renderGuidanceDraft(decision, contact, latestRequestForContact(data, contact.id));
    if (draft.trim() && !window.confirm("Mevcut yazıyı önerilen taslakla değiştirmek ister misiniz?")) return;
    const conversation = scopedData.conversations.find((item) => item.contactId === contact.id && !item.isArchived);
    activeContactIdRef.current = contact.id;
    setSelectedContactId(contact.id);
    setSelectedConversationId(conversation?.id ?? "");
    setMessageSubMenu("Tüm Mesajlar");
    setActive("Mesajlar");
    setDraft(nextDraft);
    setPendingSuggestion(decision);
    await postJson("/api/automation-actions", { action: "DRAFT_USED", operatorId: user?.id, ...guidancePayload(decision), messageDraft: nextDraft });
  }

  async function useGuidanceVoice(decision: AutomationDecisionResult) {
    const contact = contactById(scopedData, decision.memberId);
    if (!contact) return;
    const nextDraft = renderGuidanceDraft(decision, contact, latestRequestForContact(data, contact.id));
    const conversation = scopedData.conversations.find((item) => item.contactId === contact.id && !item.isArchived);
    activeContactIdRef.current = contact.id;
    setSelectedContactId(contact.id);
    setSelectedConversationId(conversation?.id ?? "");
    setMessageSubMenu("Tüm Mesajlar");
    setActive("Mesajlar");
    setVoiceDraft(nextDraft);
    setVoiceAudioUrl("");
    setVoiceUsageLogId("");
    setVoiceError("");
    setVoiceModalOpen(true);
    await postJson("/api/automation-actions", { action: "VOICE_DRAFT_USED", operatorId: user?.id, ...guidancePayload(decision), messageDraft: nextDraft });
  }

  async function createTaskFromGuidance(decision: AutomationDecisionResult) {
    const payload = await postJson("/api/automation-actions", { action: "CREATE_TASK", operatorId: user?.id, ...guidancePayload(decision) });
    if (!payload) return;
    if (payload.task) {
      setData((current) => ({ ...current, tasks: mergeTasks(current.tasks, [payload.task]) }));
    }
    await refreshTodayTasks(payload.task ? [payload.task] : []);
  }

  async function ignoreGuidance(decision: AutomationDecisionResult) {
    const payload = await postJson("/api/automation-actions", { action: "IGNORE", operatorId: user?.id, ...guidancePayload(decision) });
    if (!payload) return;
    setAutomationResult((current) => current ? {
      ...current,
      decisions: current.decisions?.filter((item) => guidanceKey(item) !== guidanceKey(decision))
    } : current);
    await loadData();
  }

  function insertTemplate(template: MessageTemplate) {
    const activeContactId = activeContactIdRef.current || selectedContact?.id || "";
    const templateContact = scopedData.contacts.find((contact) => contact.id === activeContactId);
    if (!templateContact) {
      setError("Hazır mesaj için kişi seçin.");
      return;
    }
    const templateRequest = templateContact ? latestRequestForContact(data, templateContact.id) : undefined;
    setDraft(fillTemplate(getTemplateContent(template), templateContact, templateRequest));
  }

  async function addTemplate() {
    const payload = editingTemplateId
      ? await patchJson("/api/templates", { id: editingTemplateId, ...templateForm })
      : await postJson("/api/templates", templateForm);
    if (!payload) return;
    setEditingTemplateId("");
    setTemplateForm({ title: "", hashtag: "", content: "", isActive: true, isPinned: false });
    await loadData();
  }

  async function toggleTemplatePin(template: MessageTemplate) {
    const payload = await patchJson("/api/templates", { id: template.id, isPinned: !template.isPinned });
    if (!payload) return;
    await loadData();
  }

  function editTemplate(template: MessageTemplate) {
    setEditingTemplateId(template.id);
    setTemplateForm({
      title: template.title,
      hashtag: template.hashtag || template.title,
      content: template.content,
      isActive: template.isActive,
      isPinned: template.isPinned
    });
  }

  function cancelTemplateEdit() {
    setEditingTemplateId("");
    setTemplateForm({ title: "", hashtag: "", content: "", isActive: true, isPinned: false });
  }

  async function deleteTemplate(template: MessageTemplate) {
    if (!window.confirm(`"${template.title}" hazır cevabı silinsin mi?`)) return;
    const payload = await deleteJson("/api/templates", { id: template.id });
    if (!payload) return;
    if (editingTemplateId === template.id) cancelTemplateEdit();
    await loadData();
  }

  async function saveDailyTasks() {
    const title = taskForm.title === newTaskOption ? taskForm.customTitle.trim() : taskForm.title.trim();
    setTaskFeedback({ type: "", message: "" });
    if (!canDistributeTasks) {
      setTaskFeedback({ type: "error", message: "Görev dağıtma yetkisi Admin ve Takım Lideri rollerinde." });
      return;
    }
    if (!title) {
      setTaskFeedback({ type: "error", message: "Görev başlığı seçin veya yeni görev başlığı yazın." });
      return;
    }
    if (taskForm.contactIds.length === 0) {
      setTaskFeedback({ type: "error", message: "En az bir kişi seçin." });
      return;
    }
    const requestPayload = {
      title,
      contactIds: taskForm.contactIds,
      taskDate: dateInputValue(now),
      createdBy: user?.id
    };
    const payload = await postJson("/api/tasks", requestPayload);
    if (!payload) {
      setTaskFeedback({ type: "error", message: "Görev kaydedilemedi. Bilgileri kontrol edip tekrar deneyin." });
      return;
    }
    if (taskForm.title === newTaskOption && !customTaskTitles.includes(title)) {
      setCustomTaskTitles((titles) => [...titles, title]);
    }
    const createdTasks = Array.isArray(payload.tasks) ? payload.tasks as AppData["tasks"] : [];
    if (createdTasks.length === 0) {
      setTaskFeedback({ type: "error", message: payload.message ?? "Bu görev bugün seçilen kişiler için zaten kayıtlı." });
      return;
    }
    const refreshedTasks = await refreshTodayTasks(createdTasks);
    const createdTaskIds = new Set(createdTasks.map((task) => task.id));
    const persistedTasks = refreshedTasks.filter((task) => createdTaskIds.has(task.id));
    if (persistedTasks.length === 0) {
      setTaskFeedback({ type: "error", message: "Görev DB'ye yazıldı fakat bugünkü listede doğrulanamadı. Tarih filtresi veya API cevabı kontrol edilmeli." });
      return;
    }
    setTaskFeedback({ type: "success", message: payload.message ?? "Görev kaydedildi." });
    setTaskForm({ title, customTitle: "", contactIds: [] });
    setTaskSearch("");
  }

  async function refreshTodayTasks(fallbackTasks: AppData["tasks"] = []) {
    const response = await fetch(`/api/tasks?date=${dateInputValue(now)}`, { cache: "no-store" });
    if (!response.ok) return fallbackTasks;
    const payload = await response.json();
    const tasks = Array.isArray(payload.tasks) ? payload.tasks as AppData["tasks"] : [];
    const nextTodayTasks = tasks.length > 0 ? tasks : fallbackTasks;
    setData((current) => ({
      ...current,
      tasks: [...current.tasks.filter((task) => !isSameLocalDay(task.taskDate, now)), ...nextTodayTasks]
    }));
    return nextTodayTasks;
  }

  async function toggleTaskStatus(task: AppData["tasks"][number]) {
    const nextStatus = task.status === "Bekliyor" ? "COMPLETED" : "PENDING";
    const payload = await patchJson("/api/tasks", { id: task.id, status: nextStatus });
    if (!payload) return;
    if (payload.task) {
      setData((current) => ({ ...current, tasks: mergeTasks(current.tasks, [payload.task]) }));
    }
    await refreshTodayTasks();
  }

  function openTaskDetail(contactId: string, taskDateKey = dateInputValue(now)) {
    setTaskDetailContactId(contactId);
    setTaskDetailDateKey(taskDateKey);
  }

  async function saveTaskNote(task: AppData["tasks"][number]) {
    const noteText = (taskNoteDrafts[task.id] ?? "").trim();
    if (!noteText) return;
    const payload = await patchJson("/api/tasks", { id: task.id, note: noteText, createdBy: user?.id });
    if (!payload) return;
    if (payload.task) {
      setData((current) => ({ ...current, tasks: mergeTasks(current.tasks, [payload.task]) }));
      setTaskNoteDrafts((drafts) => ({ ...drafts, [task.id]: "" }));
    }
    await refreshTodayTasks();
  }

  async function saveCustomerNote() {
    if (!selectedContact || !customerNoteDraft.trim()) return;
    const payload = await postJson("/api/customer-notes", {
      contactId: selectedContact.id,
      noteText: customerNoteDraft,
      createdBy: user?.id
    });
    if (!payload) return;
    setCustomerNoteDraft("");
    if (payload.note) {
      setData((current) => ({ ...current, customerNotes: [payload.note, ...current.customerNotes] }));
    } else {
      await loadData(undefined, selectedContact.id);
    }
  }

  async function saveMemberNote() {
    if (!memberDetail || !memberNoteDraft.trim()) return;
    const payload = await postJson("/api/customer-notes", {
      contactId: memberDetail.id,
      noteText: memberNoteDraft,
      createdBy: user?.id
    });
    if (!payload) return;
    setMemberNoteDraft("");
    await loadData(undefined, memberDetail.id);
  }

  function openTaskContact(task: AppData["tasks"][number]) {
    const conversation = scopedData.conversations.find((item) => item.contactId === task.contactId);
    activeContactIdRef.current = task.contactId;
    setSelectedContactId(task.contactId);
    setSelectedConversationId(conversation?.id ?? "");
    setMessageSubMenu("Tüm Mesajlar");
    setActive("Mesajlar");
    setTaskCenterOpen(false);
  }

  async function guideAssistantTask(task: AppData["tasks"][number]) {
    const contact = contactById(scopedData, task.contactId);
    if (!contact) return;
    const nextDraft = renderGuidanceTaskDraft(task, contact, latestRequestForContact(data, contact.id));
    if (draft.trim() && !window.confirm("Mevcut yazıyı önerilen taslakla değiştirmek ister misiniz?")) return;
    const conversation = scopedData.conversations.find((item) => item.contactId === task.contactId && !item.isArchived);
    activeContactIdRef.current = task.contactId;
    setSelectedContactId(task.contactId);
    setSelectedConversationId(conversation?.id ?? "");
    setMessageSubMenu("Tüm Mesajlar");
    setActive("Mesajlar");
    setDraft(nextDraft);
    setPendingGuidanceTaskId(task.id);
    setPendingSuggestion(null);
    setTaskAssistantOpen(false);
    await postJson("/api/automation-actions", {
      action: "DRAFT_USED",
      operatorId: user?.id,
      memberId: task.contactId,
      ruleKey: task.automationRuleKey ?? "operator_guidance",
      ruleName: "Operatör Yönlendirme",
      taskTitle: task.title,
      reason: task.automationReason ?? task.note ?? "",
      messageDraft: nextDraft,
      referenceType: "task",
      referenceId: task.id,
      questionAnswers: task.automationQuestions ?? []
    });
  }

  async function completeAssistantTask(task: AppData["tasks"][number]) {
    await toggleTaskStatus(task);
    setTaskAssistantOpen(false);
  }

  async function ignoreAssistantTask(task: AppData["tasks"][number]) {
    const payload = await postJson("/api/automation-actions", {
      action: "IGNORE",
      operatorId: user?.id,
      memberId: task.contactId,
      ruleKey: task.automationRuleKey ?? "operator_guidance",
      ruleName: "Operatör Yönlendirme",
      taskTitle: task.title,
      reason: task.automationReason ?? task.note ?? "",
      referenceType: "task",
      referenceId: task.id,
      questionAnswers: task.automationQuestions ?? []
    });
    if (!payload) return;
    await patchJson("/api/tasks", { id: task.id, status: "COMPLETED", createdBy: user?.id });
    await loadData();
  }

  async function createAlarm() {
    const payload = await postJson("/api/alarms", { ...alarmForm, createdBy: user?.id });
    if (!payload) return;
    setAlarmForm({ alarmDate: dateInputValue(now), alarmTime: timeInputValue(now), note: "" });
    await loadData();
  }

  async function updateAlarm(id: string, action: "snooze" | "complete" | "close") {
    const payload = await patchJson("/api/alarms", { id, action });
    if (!payload) return;
    setActiveAlarmId("");
    await loadData();
  }

  async function addOperator() {
    const payload = await postJson("/api/operators", operatorForm);
    if (!payload) return;
    setOperatorForm({ name: "", email: "", password: "", role: "Operatör", status: "Aktif", teamLeadId: "" });
    await loadData();
  }

  async function updateOperatorTtsLimit(operatorId: string, ttsDailyLimit: number) {
    if (!Number.isFinite(ttsDailyLimit)) return;
    setData((current) => ({
      ...current,
      operators: current.operators.map((operator) => operator.id === operatorId ? { ...operator, ttsDailyLimit } : operator)
    }));
    await patchJson("/api/operators", { id: operatorId, ttsDailyLimit });
  }

  async function saveCommunicationLine() {
    if (!canManageOwnership) return;
    const payload = editingLineId
      ? await patchJson("/api/communication-lines", { id: editingLineId, ...lineForm, operatorId: user?.id })
      : await postJson("/api/communication-lines", { ...lineForm, operatorId: user?.id });
    if (!payload) return;
    setEditingLineId("");
    setLineForm(emptyLineForm());
    await loadData();
  }

  function editCommunicationLine(line: AppData["communicationLines"][number]) {
    setEditingLineId(line.id);
    setLineForm({
      name: line.name,
      phoneNumber: line.phoneNumber,
      countryCode: line.countryCode,
      providerType: line.providerType,
      status: line.status,
      isDefault: line.isDefault,
      assignedOperatorId: line.assignedOperatorId ?? "",
      assignmentNote: line.assignmentNote ?? "",
      notes: line.notes ?? ""
    });
  }

  async function makeLineDefault(line: AppData["communicationLines"][number]) {
    if (!canManageOwnership) return;
    const payload = await patchJson("/api/communication-lines", { id: line.id, makeDefault: true, operatorId: user?.id });
    if (!payload) return;
    await loadData();
  }

  async function updateLineStatus(line: AppData["communicationLines"][number], status: string) {
    if (!canManageOwnership) return;
    const payload = await patchJson("/api/communication-lines", { id: line.id, status, operatorId: user?.id });
    if (!payload) return;
    await loadData();
  }

  async function runLineSessionAction(line: AppData["communicationLines"][number], action: "start" | "stop" | "reconnect" | "health") {
    if (!canManageOwnership) return;
    const payload = await postJson("/api/whatsapp-sessions", { lineId: line.id, action, operatorId: user?.id });
    if (!payload) return;
    await loadData();
  }

  async function replaceCommunicationLine(line: AppData["communicationLines"][number]) {
    if (!canManageOwnership) return;
    const replacementName = window.prompt("Yeni hat adını veya telefonunu yazın");
    if (!replacementName) return;
    const replacement = data.communicationLines.find((item) => item.id !== line.id && (item.name === replacementName || item.phoneNumber === replacementName));
    if (!replacement) {
      setError("Yeni hat bulunamadı. Hat adını veya telefon numarasını tam yazın.");
      return;
    }
    const payload = await patchJson("/api/communication-lines", { id: line.id, replaceWithLineId: replacement.id, operatorId: user?.id });
    if (!payload) return;
    await loadData();
  }

  async function openLineSessionSlot(slotNumber: number) {
    if (!user) return;
    const session = userLineSessions.find((item) => item.slotNumber === slotNumber);
    if (session) {
      await patchJson("/api/operator-line-sessions", { id: session.id });
      window.open(`${window.location.pathname}?sessionLineId=${session.lineId}`, "_blank", "noopener,noreferrer");
      return;
    }
    if (!isAdmin && !isTeamLead) {
      setError("Boş oturum slotuna hat atama yetkiniz yok.");
      return;
    }
    if (availableSessionLines.length === 0) {
      setError("Boşta iletişim hattı yok. Atanmış hatlar başka oturumlarda kullanılamaz.");
      return;
    }
    setSessionSlotModal(slotNumber);
    setSessionLineSelect(availableSessionLines[0]?.id ?? "");
  }

  async function assignLineSessionSlot() {
    if (!user || !sessionSlotModal || !sessionLineSelect) return;
    if (assignedLineIds.has(sessionLineSelect)) {
      setError("Bu iletişim hattı başka bir oturumda kullanılmaktadır.");
      return;
    }
    const payload = await postJson("/api/operator-line-sessions", {
      operatorId: user.id,
      lineId: sessionLineSelect,
      slotNumber: sessionSlotModal
    });
    if (!payload) return;
    setSessionSlotModal(null);
    setSessionLineSelect("");
    await loadData();
    window.open(`${window.location.pathname}?sessionLineId=${sessionLineSelect}`, "_blank", "noopener,noreferrer");
  }

  async function closeLineSession(sessionId: string) {
    const payload = await deleteJson("/api/operator-line-sessions", { id: sessionId });
    if (!payload) return;
    if (sessionLineId && userLineSessions.some((session) => session.id === sessionId && session.lineId === sessionLineId)) {
      setSessionLineId("");
      window.history.replaceState(null, "", window.location.pathname);
    }
    await loadData();
  }

  async function postJson(url: string, body: unknown) {
    setError("");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "İşlem tamamlanamadı.");
      return null;
    }
    return payload;
  }

  async function patchJson(url: string, body: unknown) {
    setError("");
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "İşlem tamamlanamadı.");
      return null;
    }
    return payload;
  }

  async function deleteJson(url: string, body: unknown) {
    setError("");
    const response = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "İşlem tamamlanamadı.");
      return null;
    }
    return payload;
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#143034,#071113_42%)] p-6">
        <section className="w-full max-w-md rounded-lg border border-line bg-panel p-6 shadow-glow">
          <div className="mb-8">
            <p className="text-sm font-semibold text-mint">Tek Numara Operasyon</p>
            <h1 className="mt-2 text-2xl font-bold text-white">WhatsApp Panel Girişi</h1>
            <p className="mt-2 text-sm text-slate-400">Kullanıcı doğrulaması users tablosundan yapılır.</p>
          </div>
          <form className="space-y-4" onSubmit={login}>
            <label>
              <span className="label">E-posta</span>
              <input className="field" type="email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} required />
            </label>
            <label>
              <span className="label">Şifre</span>
              <input className="field" type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} required />
            </label>
            {loginError && <p className="rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-red-200">{loginError}</p>}
            <button className="btn btn-primary w-full" type="submit">
              <UserRound size={17} /> Panele Gir
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-ink text-slate-100">
      <aside className="relative hidden h-screen w-72 shrink-0 flex-col border-r border-line bg-panel p-4 lg:flex">
        <div className="mb-8 rounded-md border border-line bg-panelSoft p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Tek WhatsApp Numarası</p>
          <p className="mt-1 text-lg font-bold text-white">Operasyon Paneli</p>
          <p className="mt-2 text-sm text-mint">PostgreSQL bağlantısı aktif</p>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pb-16">
          {visibleMenu.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key}>
                <button
                  className={clsx("flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition", active === item.key ? "bg-mint text-ink" : "text-slate-300 hover:bg-panelSoft hover:text-white")}
                  onClick={() => {
                    setActive(item.key);
                    if (item.key === "Mesajlar") setMessageSubMenu("Tüm Mesajlar");
                  }}
                >
                  <Icon size={18} />
                  <span className="min-w-0 flex-1">{item.key}</span>
                  {item.key === "Talepler" && pastOpenRequests.length > 0 && (
                    <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-xs text-amber-100">{pastOpenRequests.length}</span>
                  )}
                </button>
                {item.key === "Mesajlar" && active === "Mesajlar" && (
                  <div className="ml-8 mt-1 space-y-1 border-l border-line pl-3">
                    {(["Tüm Mesajlar", "Numara Kaydet", "Sohbet Deposu"] as const).map((subItem) => (
                      <button
                        key={subItem}
                        className={clsx(
                          "h-9 w-full rounded-md px-3 text-left text-sm transition",
                          messageSubMenu === subItem ? "bg-panelSoft text-mint" : "text-slate-400 hover:bg-panelSoft hover:text-white"
                        )}
                        onClick={() => {
                          setActive("Mesajlar");
                          setMessageSubMenu(subItem);
                        }}
                      >
                        {subItem}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="fixed bottom-4 left-4 z-40 hidden w-64 lg:block">
        <button
          className="flex h-11 w-full items-center gap-3 rounded-md border border-line bg-panelSoft px-3 text-left text-sm font-medium text-slate-200 shadow-glow transition hover:border-mint/40 hover:text-white"
          onClick={() => setTaskAssistantOpen((open) => !open)}
        >
          <Bell size={18} />
          <span className="min-w-0 flex-1">Görev Asistanı</span>
          {guidanceTasks.length > 0 && (
            <span className="rounded-full border border-mint/40 bg-mint/10 px-2 py-0.5 text-xs text-mint">{guidanceTasks.length}</span>
          )}
        </button>
      </div>
      {taskAssistantOpen && (
        <div className="fixed bottom-20 left-4 z-50 w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-line bg-panel shadow-glow">
          <div className="border-b border-line p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">Hazır Görevler</h3>
                <p className="mt-1 text-xs text-slate-400">Operatör onayı bekleyen yönlendirmeler</p>
              </div>
              <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => setTaskAssistantOpen(false)}>Kapat</button>
            </div>
          </div>
          <div className="max-h-[calc(100vh-12rem)] space-y-3 overflow-y-auto p-3">
            {guidanceTasks.map(({ task, contact, urgency }) => (
              <article key={task.id} className="rounded-md border border-line bg-ink/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{contact ? memberDisplayName(contact) : "Üye"}</p>
                    <p className="text-xs text-slate-500">{contact?.phone ?? "-"}</p>
                  </div>
                  <span className={clsx("rounded-full border px-2 py-0.5 text-[11px]", urgencyTone(urgency))}>{urgency}</span>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <p><span className="text-slate-500">Aksiyon:</span> <span className="text-slate-100">{task.title}</span></p>
                  <p className="line-clamp-2 text-slate-400"><span className="text-slate-500">Gerekçe:</span> {task.automationReason || task.note || "-"}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Oluşturulma: {formatDate(task.createdAt)}</span>
                    <SourceBadge source={task.source} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn btn-primary h-8 px-3 text-xs" onClick={() => void guideAssistantTask(task)}>Yönlendir</button>
                  <button className="btn btn-secondary h-8 px-3 text-xs" onClick={() => void completeAssistantTask(task)}>Tamamlandı</button>
                  <button className="btn btn-secondary h-8 px-3 text-xs" onClick={() => void ignoreAssistantTask(task)}>Yoksay</button>
                </div>
              </article>
            ))}
            {guidanceTasks.length === 0 && (
              <p className="rounded-md border border-line bg-ink/40 p-4 text-sm text-slate-400">Hazır bekleyen görev yok.</p>
            )}
          </div>
        </div>
      )}

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-line bg-panel/85 px-4 backdrop-blur md:px-6">
          <div>
            <h2 className="text-lg font-bold text-white">{active}</h2>
            <p className="text-xs text-slate-400">{user.name} · {user.role}</p>
          </div>
          {active === "Ayarlar" && (
            <div className="hidden items-center gap-2 xl:flex">
              {[1, 2, 3, 4, 5].map((slot) => {
                const session = userLineSessions.find((item) => item.slotNumber === slot);
                const line = session ? scopedData.communicationLines.find((item) => item.id === session.lineId) : undefined;
                return (
                  <div key={slot} className="relative">
                    <button
                      className={clsx(
                        "flex h-10 min-w-10 items-center justify-center rounded-full border px-2 text-xs font-bold transition",
                        line ? sessionLineId === line.id ? "border-mint bg-mint text-ink" : "border-mint/30 bg-mint/10 text-mint hover:border-mint/70" : "border-line bg-panelSoft text-slate-500 hover:text-white"
                      )}
                      title={line ? line.name : "Boş oturum"}
                      onClick={() => void openLineSessionSlot(slot)}
                    >
                      {line ? lineShortName(line) : slot}
                    </button>
                    {session && (isAdmin || isTeamLead) && (
                      <button
                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-line bg-ink text-[10px] text-slate-300 hover:border-coral/50 hover:text-red-200"
                        title="Oturumu kapat"
                        onClick={(event) => {
                          event.stopPropagation();
                          void closeLineSession(session.id);
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className={clsx("rounded-full border px-3 py-1.5 text-xs font-semibold", activeLine && canSendWithLineStatus(activeLine.status) ? "border-mint/30 bg-mint/10 text-mint" : "border-coral/30 bg-coral/10 text-red-200")}>
              {activeLine ? lineShortName(activeLine) : "Hat yok"}
            </span>
            <button className="btn btn-secondary" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw size={17} /> Yenile
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                window.sessionStorage.removeItem("whatsapp-ops-user");
                setUser(null);
              }}
            >
              <LogOut size={17} /> Çıkış
            </button>
          </div>
        </header>

        <div className={clsx("min-h-0 flex-1 p-4 md:p-6", active === "Mesajlar" ? "overflow-auto lg:overflow-hidden" : "overflow-auto")}>
          {error && <p className="mb-4 rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-red-200">{error}</p>}

          {active === "Dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-3 xl:grid-cols-[1.05fr_1fr_1fr]">
                <button className="relative rounded-lg border border-mint/25 bg-panel p-4 text-left shadow-glow transition hover:border-mint/60" onClick={() => setTaskCenterOpen(true)}>
                  {overduePendingTaskCount > 0 && (
                    <span className="absolute right-3 top-3 inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/20 px-2 text-xs font-bold text-amber-100">
                      {overduePendingTaskCount}
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-mint text-ink"><CheckCircle2 size={20} /></div>
                    <div>
                      <p className="font-semibold text-white">Görev Merkezi{pendingTodayTasks.length > 0 ? ` (${pendingTodayTasks.length})` : ""}</p>
                      <p className="mt-1 text-sm text-slate-400">{pendingTodayTasks.length} bekleyen görev</p>
                      {overduePendingTaskCount > 0 && <p className="mt-1 text-xs text-amber-200">Geçmişten kalan {overduePendingTaskCount} görev</p>}
                    </div>
                  </div>
                </button>
                <button className="rounded-lg border border-line bg-panel p-4 text-left transition hover:border-slate-500" onClick={() => setAlarmCenterOpen(true)}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-panelSoft text-mint"><Clock3 size={20} /></div>
                      <div>
                        <p className="font-semibold text-white">Tarih / Saat</p>
                        <p className="mt-1 text-sm text-slate-400">{formatShortDate(now)}</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold tabular-nums text-white">{timeDisplay(now)}</p>
                  </div>
                </button>
                <button className={clsx("rounded-lg border bg-panel p-4 text-left transition hover:border-slate-500", activeLine && canSendWithLineStatus(activeLine.status) ? "border-mint/25" : "border-coral/30")} onClick={() => setActive("İletişim Hatları")}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">Aktif Operasyon Hattı</p>
                      <p className="mt-1 text-sm text-slate-400">{activeLine ? `${activeLine.name} · ${activeLine.phoneNumber}` : "Aktif hat seçilmedi"}</p>
                      <p className="mt-2 text-xs text-slate-500">Son bağlantı: {activeLine?.lastConnectedAt ? formatDate(activeLine.lastConnectedAt) : "-"}</p>
                      <p className="mt-1 text-xs text-slate-500">Son mesaj: {activeLine?.lastMessageAt ? formatDate(activeLine.lastMessageAt) : "-"}</p>
                    </div>
                    <span className={clsx("status-pill", lineStatusTone(activeLine?.status))}>{lineStatusLabel(activeLine?.status)}</span>
                  </div>
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-line bg-panel p-4">
                    <p className="text-xs text-slate-400">{metric.label}</p>
                    <p className="mt-3 text-3xl font-bold text-white">{metric.value}</p>
                  </div>
                ))}
                <div className="rounded-lg border border-line bg-panel p-4">
                  <p className="text-xs text-slate-400">Sesli Yanıtlar</p>
                  <p className="mt-3 text-3xl font-bold text-white">{ttsUsageSummary.todayCount}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Bu ay: {ttsUsageSummary.monthCount}
                    {canManageTtsCosts ? ` · Bugün: $${ttsUsageSummary.todayCost.toFixed(4)} · Ay: $${ttsUsageSummary.monthCost.toFixed(4)}` : ""}
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-panel p-4">
                  <p className="text-xs text-slate-400">Otomatik Görev Motoru</p>
                  <p className="mt-3 text-3xl font-bold text-white">{automationSummary.todayCreated}</p>
                  <p className="mt-2 text-xs text-slate-400">Bekleyen: {automationSummary.pending} · Son: {automationSummary.lastRunAt ? formatDate(automationSummary.lastRunAt) : "-"}</p>
                </div>
                {canManageOwnership && (
                  <div className="rounded-lg border border-line bg-panel p-4">
                    <p className="text-xs text-slate-400">Müşteri Sahipliği</p>
                    <p className="mt-3 text-3xl font-bold text-white">{ownershipSummary.pending}</p>
                    <p className="mt-2 text-xs text-slate-400">Bugün devredilen: {ownershipSummary.transferredToday} · Havuz: {ownershipSummary.pooled} · Blokeli: {ownershipSummary.blocked}</p>
                  </div>
                )}
              </div>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_420px]">
                <section className="rounded-lg border border-line bg-panel p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-white">Bugünün Son Talepleri</h3>
                    {pastOpenRequests.length > 0 && <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-1 text-xs text-amber-100">Geçmiş açık: {pastOpenRequests.length}</span>}
                  </div>
                  <RequestTable data={scopedData} rows={todayRequests} compact emptyText="Bugün için kayıt bulunmuyor." onOpenDetail={openRequestDetail} />
                </section>
                <TaskCenterSummary
                  pendingTasks={pendingTodayTasks}
                  completedTasks={completedTodayTasks}
                  overdueTasks={overduePendingTasks}
                  totalCompletedTasks={scopedData.tasks.filter((task) => task.status === "Tamamlandı").length}
                  data={scopedData}
                />
              </div>
            </div>
          )}

          {active === "Talepler" && (
            <section className="grid gap-4 xl:grid-cols-[560px_minmax(0,1fr)]">
              <div className="rounded-lg border border-line bg-panel p-5">
                <h3 className="font-semibold text-white">Talep Oluştur</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Input label="Ad" value={requestForm.firstName} onChange={(value) => setRequestForm(applyMemberToRequestForm({ ...requestForm, firstName: value }))} />
                  <Input label="Soyad" value={requestForm.lastName} onChange={(value) => setRequestForm(applyMemberToRequestForm({ ...requestForm, lastName: value }))} />
                  <Input label="Kullanıcı ID / Kullanıcı Adı" value={requestForm.username} onChange={(value) => setRequestForm({ ...requestForm, username: value })} />
                  <Input label="T.C." value={requestForm.nationalId} onChange={(value) => setRequestForm({ ...requestForm, nationalId: value })} />
                  <Input label="Telefon Numarası" value={requestForm.phone} onChange={(value) => setRequestForm(applyMemberToRequestForm({ ...requestForm, phone: value }))} />
                  <Select label="Cinsiyet" value={requestForm.gender} options={["Belirtilmedi", "Kadın", "Erkek"]} onChange={(value) => setRequestForm({ ...requestForm, gender: value })} />
                  <Select label="Talep Türü" value={requestForm.requestType} options={requestTypes} onChange={(value) => setRequestForm({ ...requestForm, requestType: value as RequestType })} />
                  <Input label="Miktar / Tutar" value={requestForm.amount} onChange={(value) => setRequestForm({ ...requestForm, amount: value })} />
                  {requestForm.requestType === "Bonus" && (
                    <>
                      <Input label="Bonus miktarı" value={requestForm.bonusAmount} onChange={(value) => setRequestForm({ ...requestForm, bonusAmount: value })} />
                      <Input label="Bonus açıklaması" value={requestForm.bonusDescription} onChange={(value) => setRequestForm({ ...requestForm, bonusDescription: value })} />
                    </>
                  )}
                  {requestForm.requestType === "Nakit hediye" && (
                    <>
                      <Input label="Hediye tutarı" value={requestForm.giftAmount} onChange={(value) => setRequestForm({ ...requestForm, giftAmount: value })} />
                      <Input label="Açıklama" value={requestForm.giftDescription} onChange={(value) => setRequestForm({ ...requestForm, giftDescription: value })} />
                    </>
                  )}
                  {requestForm.requestType === "Düzeltme alt/üst" && (
                    <>
                      <Select label="İşlem yönü" value={requestForm.correctionDirection} options={["Alt", "Üst"]} onChange={(value) => setRequestForm({ ...requestForm, correctionDirection: value })} />
                      <Input label="Tutar" value={requestForm.correctionAmount} onChange={(value) => setRequestForm({ ...requestForm, correctionAmount: value })} />
                      <Input label="Açıklama" value={requestForm.correctionDescription} onChange={(value) => setRequestForm({ ...requestForm, correctionDescription: value })} />
                    </>
                  )}
                  {requestForm.requestType === "Bahis detayı" && (
                    <>
                      <Input label="Bahis ID" value={requestForm.betId} onChange={(value) => setRequestForm({ ...requestForm, betId: value })} />
                      <Input label="Oyun ismi" value={requestForm.gameName} onChange={(value) => setRequestForm({ ...requestForm, gameName: value })} />
                      <Input label="Açıklama" value={requestForm.betDescription} onChange={(value) => setRequestForm({ ...requestForm, betDescription: value })} />
                    </>
                  )}
                  <label className="md:col-span-2">
                    <span className="label">Not</span>
                    <textarea className="field min-h-28" value={requestForm.note} onChange={(event) => setRequestForm({ ...requestForm, note: event.target.value })} />
                  </label>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="btn btn-primary" onClick={() => void saveRequest(false)}><Save size={17} /> Talep Kaydet</button>
                  <button className="btn btn-secondary" onClick={() => void saveRequest(true)}><MessageCircle size={17} /> Mesaj Oluştur</button>
                  <button className="btn btn-secondary" onClick={previewRequestMessage}><Search size={17} /> Mesaj Önizle</button>
                </div>
                <div className="mt-5 rounded-lg border border-line bg-ink/40 p-4">
                  <h3 className="font-semibold text-white">Komut / Mesaj Önizleme</h3>
                  <pre className="mt-3 whitespace-pre-wrap rounded-md border border-line bg-panelSoft p-4 text-sm leading-6 text-slate-300">
                    {preview || "Talep türüne göre oluşturulacak komut burada görünecek."}
                  </pre>
                </div>
              </div>
              <div className="rounded-lg border border-line bg-panel p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">Talepler / Aktif Talepler</h3>
                  {pastOpenRequests.length > 0 && <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-1 text-xs text-amber-100">{pastOpenRequests.length} geçmiş açık</span>}
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(["Bugünkü Talepler", "Geçmiş Talepler"] as const).map((tab) => (
                    <button
                      key={tab}
                      className={clsx("h-9 rounded-md border px-3 text-sm transition", requestListTab === tab ? "border-mint/40 bg-mint/10 text-mint" : "border-line bg-panelSoft text-slate-400 hover:text-white")}
                      onClick={() => setRequestListTab(tab)}
                    >
                      {tab}
                      {tab === "Geçmiş Talepler" && pastOpenRequests.length > 0 && <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-100">{pastOpenRequests.length}</span>}
                    </button>
                  ))}
                </div>
                <RequestTable data={scopedData} rows={requestListTab === "Bugünkü Talepler" ? todayRequests : pastOpenRequests} onOpenDetail={openRequestDetail} />
              </div>
            </section>
          )}

          {active === "Mesajlar" && messageSubMenu === "Tüm Mesajlar" && (
            <section className="flex min-h-[720px] flex-col gap-3 lg:h-[calc(100vh-8rem)] lg:min-h-0 lg:overflow-hidden">
              <div className="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-line bg-panel lg:grid-cols-[320px_minmax(0,1fr)_320px] xl:grid-cols-[360px_minmax(0,1fr)_340px]">
                <div className="flex min-h-0 flex-col overflow-hidden border-r border-line">
                  <div className="shrink-0 border-b border-line p-3">
                    <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                      {["Tüm Hatlar", ...scopedData.communicationLines.map((line) => line.id)].map((lineId) => (
                        <button
                          key={lineId}
                          className={clsx("h-8 shrink-0 rounded-md border px-2 text-xs transition", messageLineFilter === lineId ? "border-mint/40 bg-mint/10 text-mint" : "border-line bg-panelSoft text-slate-400 hover:text-white")}
                          onClick={() => setMessageLineFilter(lineId)}
                        >
                          {lineId === "Tüm Hatlar" ? "Tüm Hatlar" : lineShortName(scopedData.communicationLines.find((line) => line.id === lineId)!)}
                        </button>
                      ))}
                    </div>
                    <input className="field" placeholder="Kişi ara" value={query} onChange={(event) => setQuery(event.target.value)} />
                  </div>
                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                    {messageContacts
                      .filter((contact) => {
                        const textMatch = `${contact.name} ${contact.phone}`.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"));
                        const phoneMatch = normalizePhone(contact.phone).includes(normalizePhone(query));
                        return !query.trim() || textMatch || phoneMatch;
                      })
                      .map((contact) => {
                        const conversation = activeConversations.find((item) => item.contactId === contact.id);
                        return (
                          <div
                            key={contact.id}
                            className={clsx(
                              "w-full rounded-md border border-line bg-ink/35 px-3 py-2 transition hover:border-slate-500 hover:bg-panelSoft",
                              selectedContact?.id === contact.id && "border-mint/40 bg-panelSoft"
                            )}
                          >
                            <button
                              className="w-full text-left"
                              onClick={() => {
                                activeContactIdRef.current = contact.id;
                                setSelectedContactId(contact.id);
                                setSelectedConversationId(conversation?.id ?? "");
                              }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex items-center gap-2 text-sm">
                                  <span className="truncate font-semibold text-white">{contactDisplayName(contact)}</span>
                                  <span className="text-slate-600">|</span>
                                  <span className="shrink-0 text-xs text-slate-400">{contact.phone}</span>
                                </div>
                                <span className={clsx("status-pill shrink-0 px-2 py-0.5 text-[10px]", conversation ? statusTone[conversation.status] : statusTone.Yeni)}>
                                  {conversation?.status ?? "Yeni"}
                                </span>
                                {conversation?.lineId && <span className="rounded-full border border-line bg-panel px-2 py-0.5 text-[10px] text-slate-400">{lineShortName(scopedData.communicationLines.find((line) => line.id === conversation.lineId) ?? { name: lineName(scopedData, conversation.lineId), phoneNumber: "" } as AppData["communicationLines"][number])}</span>}
                                {conversation?.isMuted && <VolumeX className="shrink-0 text-slate-500" size={14} />}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
                  <div className="shrink-0 flex items-center justify-between gap-3 border-b border-line p-4">
                    <div>
                      <p className="font-semibold text-white">{selectedContact ? contactDisplayName(selectedContact) : "Konuşma seçin"}</p>
                      <p className="text-sm text-slate-400">{selectedContact?.phone}</p>
                      {selectedConversation?.lineId && <p className="mt-1 text-xs text-slate-500">Sohbet kanalı: {lineName(scopedData, selectedConversation.lineId)}</p>}
                    </div>
                    <div className="relative flex items-center gap-2">
                      {selectedConversation?.isMuted && <VolumeX className="text-slate-500" size={16} />}
                      {selectedConversation ? <span className={clsx("status-pill", statusTone[selectedConversation.status])}>{selectedConversation.status}</span> : <span className="status-pill border-slate-500/40 bg-slate-500/10 text-slate-300">Konuşma yok</span>}
                      {selectedConversation && (
                        <button className="btn btn-secondary h-9 w-9 px-0" onClick={() => setConversationMenuOpen((open) => !open)} aria-label="Sohbet işlemleri">
                          <MoreVertical size={17} />
                        </button>
                      )}
                      {selectedConversation && conversationMenuOpen && (
                        <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-md border border-line bg-panel shadow-glow">
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-panelSoft"
                            onClick={() => void toggleConversationMuted(selectedConversation.id, !selectedConversation.isMuted)}
                          >
                            {selectedConversation.isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            {selectedConversation.isMuted ? "Sesi Aç" : "Sohbeti Sessize Al"}
                          </button>
                          {canArchiveChats && (
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-panelSoft"
                              onClick={() => void setConversationArchived(selectedConversation.id, true)}
                            >
                              <Archive size={16} /> Sohbeti Depoya Taşı
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#091416] p-4">
                    {!selectedConversation && selectedContact && (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Bu kişiyle henüz konuşma yok.
                      </div>
                    )}
                    {selectedMessageItems.map((item) => item.type === "date" ? (
                      <div key={item.key} className="flex justify-center">
                        <span className="rounded-full border border-line bg-panelSoft px-3 py-1 text-xs text-slate-400">{item.label}</span>
                      </div>
                    ) : (
                      <div key={item.message.id} className={clsx("flex", item.message.senderType === "operator" ? "justify-end" : "justify-start")}>
                        <div className={clsx("max-w-[78%] rounded-lg border px-4 py-3 text-sm leading-6", item.message.senderType === "operator" ? "border-mint/25 bg-emerald-500/15 text-emerald-50" : item.message.senderType === "system" ? "border-line bg-panelSoft text-slate-400" : "border-line bg-panel text-slate-100")}>
                          {isVoiceMessage(item.message.messageText) ? (
                            <VoiceBubble messageText={item.message.messageText} />
                          ) : (
                            <p>{item.message.messageText}</p>
                          )}
                          {item.message.lineId && (
                            <p className="mt-2 text-[11px] text-slate-500">Hat: {lineName(scopedData, item.message.lineId)}</p>
                          )}
                          <p className="mt-2 text-right text-[11px] text-slate-500">{formatDate(item.message.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messageEndRef} />
                  </div>
                  <div className="shrink-0 border-t border-line p-4">
                    {draft.startsWith("#") && (
                      <div className="mb-3 max-h-44 overflow-y-auto rounded-md border border-line bg-panelSoft p-2">
                        {templateSearchResults.length > 0 ? (
                          templateSearchResults.map((template) => (
                            <button
                              key={template.id}
                              className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-panel"
                              onClick={() => insertTemplate(template)}
                            >
                              <span className="font-semibold text-white">{template.title}</span>
                              <span className="truncate text-xs text-slate-400">{getTemplateContent(template)}</span>
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-sm text-slate-400">Eşleşen hazır mesaj yok.</p>
                        )}
                      </div>
                    )}
                    <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                      {data.templates.filter((template) => template.isActive && template.isPinned).map((template) => (
                        <button key={template.id} className="btn btn-secondary h-9" onClick={() => insertTemplate(template)}>
                          {template.title}
                        </button>
                      ))}
                    </div>
                    {(!activeLine || !canSendWithLineStatus(activeLine.status)) && (
                      <p className="mb-3 rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-red-200">
                        Aktif operasyon hattı yok veya gönderime kapalı. Admin yeni aktif hat seçene kadar mesaj gönderilemez.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <textarea
                        className="field min-h-12 flex-1 resize-none"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey && draft.startsWith("#")) {
                            event.preventDefault();
                            if (templateSearchResults[0]) insertTemplate(templateSearchResults[0]);
                          }
                        }}
                        placeholder="Mesaj yazın veya # ile hazır cevap ara"
                      />
                      <button className="btn btn-primary h-auto" onClick={() => void sendMessage()} disabled={!selectedContact || !activeLine || !canSendWithLineStatus(activeLine.status)}><Send size={18} /> Gönder</button>
                      <button className="btn btn-secondary h-auto" onClick={() => {
                        setVoiceModalOpen(true);
                        setVoiceDraft(draft || "");
                        setVoiceAudioUrl("");
                        setVoiceUsageLogId("");
                        setVoiceError("");
                      }} disabled={!selectedContact}>
                        <Volume2 size={18} /> Sesli Yanıt
                      </button>
                    </div>
                  </div>
                </div>
                <CustomerInfoPanel
                  data={data}
                  contact={selectedContact}
                  conversations={selectedContact ? scopedData.conversations.filter((conversation) => conversation.contactId === selectedContact.id) : []}
                  messages={selectedContact ? data.messages.filter((message) => {
                    const conversation = scopedData.conversations.find((item) => item.id === message.conversationId);
                    return conversation?.contactId === selectedContact.id;
                  }) : []}
                  requests={selectedContact ? data.requests.filter((request) => request.contactId === selectedContact.id) : []}
                  tasks={selectedContact ? data.tasks.filter((task) => task.contactId === selectedContact.id) : []}
                  notes={selectedCustomerNotes}
                  noteDraft={customerNoteDraft}
                  onNoteDraftChange={setCustomerNoteDraft}
                  onSaveNote={() => void saveCustomerNote()}
                  onOpenTimeline={(contactId) => setTimelineContactId(contactId)}
                />
              </div>
            </section>
          )}


          {active === "Mesajlar" && messageSubMenu === "Numara Kaydet" && (
            <section className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
              <div className="rounded-lg border border-line bg-panel p-5">
                <h3 className="font-semibold text-white">{editingContactId ? "Numara Güncelle" : "Numara Kaydet"}</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                  <Input label="Ad Soyad" value={contactForm.name || formatName(`${contactForm.firstName} ${contactForm.lastName}`.trim())} onChange={(value) => setContactForm({ ...contactForm, name: value, firstName: formatName(value).split(" ")[0] ?? "", lastName: formatName(value).split(" ").slice(1).join(" ") })} onBlur={() => setContactForm({ ...contactForm, name: formatName(contactForm.name) })} />
                  <Input label="Telefon Numarası" value={contactForm.phone} onChange={(value) => setContactForm({ ...contactForm, phone: value })} />
                  <Select label="Cinsiyet" value={contactForm.gender} options={["Belirtilmedi", "Kadın", "Erkek"]} onChange={(value) => setContactForm({ ...contactForm, gender: value })} />
                  <label className="md:col-span-2 xl:col-span-1">
                    <span className="label">Not</span>
                    <textarea className="field min-h-32" value={contactForm.note} onChange={(event) => setContactForm({ ...contactForm, note: event.target.value })} />
                  </label>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="btn btn-primary" onClick={() => void saveContact()}>
                    <Save size={17} /> {editingContactId ? "Güncelle" : "Numara Kaydet"}
                  </button>
                  {editingContactId && (
                    <button className="btn btn-secondary" onClick={cancelContactEdit}>Vazgeç</button>
                  )}
                </div>
                <OwnershipConflictPanel
                  conflict={ownershipConflict}
                  operators={data.operators}
                  note={ownershipRequestNote}
                  onNoteChange={setOwnershipRequestNote}
                  onAskAdmin={() => void requestOwnershipPermission()}
                />
                <section className="mt-5 rounded-lg border border-line bg-ink/35 p-4">
                  <h4 className="font-semibold text-white">Son Eklenen Numaralar</h4>
                  <div className="mt-3 space-y-2">
                    {recentRegisteredContacts.map((contact) => (
                      <div key={contact.id} className="rounded-md border border-line bg-panelSoft p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-semibold text-white">{memberDisplayName(contact)}</p>
                          <span className="text-xs text-slate-500">{formatShortDate(new Date(contact.createdAt))}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{contact.phone} · {contact.gender}</p>
                      </div>
                    ))}
                    {recentRegisteredContacts.length === 0 && (
                      <p className="rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-400">Bugün için kayıt bulunmuyor.</p>
                    )}
                  </div>
                </section>
              </div>
              <div className="rounded-lg border border-line bg-panel p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">Kayıtlı Numaralar</h3>
                  <span className="text-xs text-slate-500">{registeredContacts.length} kayıt</span>
                </div>
                <div className="space-y-2">
                  {registeredContacts.length === 0 && <p className="rounded-md border border-line bg-panelSoft p-4 text-sm text-slate-400">Kayıtlı numara yok.</p>}
                  {registeredContacts.map((contact) => (
                    <article key={contact.id} className="grid gap-3 rounded-md border border-line bg-ink/35 p-3 text-sm md:grid-cols-[1.1fr_130px_100px_minmax(120px,1fr)_150px] md:items-center">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{contact.name}</p>
                      </div>
                      <p className="text-slate-300">{contact.phone}</p>
                      <p className="text-slate-400">{contact.gender}</p>
                      <p className="truncate text-slate-500">{contact.note || "-"}</p>
                      <div className="flex justify-end gap-2">
                        <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => editContact(contact)}>Düzenle</button>
                        <button className="btn btn-secondary h-8 px-2 text-xs text-rose-200 hover:border-rose-500/60 hover:text-rose-100" onClick={() => void deleteContact(contact)}>Sil</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {active === "Mesajlar" && messageSubMenu === "Sohbet Deposu" && (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="rounded-lg border border-line bg-panel p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">Sohbet Deposu</h3>
                  <span className="text-xs text-slate-500">{archivedConversations.length} sohbet</span>
                </div>
                <div className="space-y-2">
                  {archivedConversations.length === 0 && <p className="rounded-md border border-line bg-panelSoft p-4 text-sm text-slate-400">Depoda sohbet yok.</p>}
                  {archivedConversations.map((conversation) => {
                    const contact = contactById(data, conversation.contactId);
                    return (
                      <article key={conversation.id} className="grid gap-3 rounded-md border border-line bg-ink/35 p-3 text-sm lg:grid-cols-[1.1fr_150px_150px_110px_190px] lg:items-center">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{contact ? contactDisplayName(contact) : "Kişi yok"}</p>
                        </div>
                        <p className="text-slate-300">{contact?.phone ?? "-"}</p>
                        <p className="text-slate-400">{formatDate(conversation.lastMessageAt)}</p>
                        <span className={clsx("status-pill w-fit", statusTone[conversation.status])}>{conversation.status}</span>
                        <div className="flex justify-end gap-2">
                          <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => setArchiveDetailId(conversation.id)}>Detay Gör</button>
                          <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => void setConversationArchived(conversation.id, false)}>Geri Al</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
              <aside className="rounded-lg border border-line bg-panel p-5">
                <h3 className="font-semibold text-white">Sohbet Detayı</h3>
                {!archiveDetailConversation && <p className="mt-4 text-sm text-slate-400">Okumak için depodan bir sohbet seçin.</p>}
                {archiveDetailConversation && (
                  <div className="mt-4 flex max-h-[620px] flex-col overflow-hidden rounded-md border border-line bg-[#091416]">
                    <div className="shrink-0 border-b border-line bg-panelSoft p-3">
                      <p className="font-semibold text-white">{archiveDetailContact ? contactDisplayName(archiveDetailContact) : "Kişi yok"}</p>
                      <p className="text-xs text-slate-400">{archiveDetailContact?.phone ?? "-"}</p>
                    </div>
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                      {archiveDetailMessages.map((message) => (
                        <div key={message.id} className={clsx("flex", message.senderType === "operator" ? "justify-end" : "justify-start")}>
                          <div className={clsx("max-w-[88%] rounded-lg border px-3 py-2 text-sm leading-6", message.senderType === "operator" ? "border-mint/25 bg-emerald-500/15 text-emerald-50" : message.senderType === "system" ? "border-line bg-panelSoft text-slate-400" : "border-line bg-panel text-slate-100")}>
                            <p>{message.messageText}</p>
                            <p className="mt-2 text-right text-[11px] text-slate-500">{formatDate(message.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                      {archiveDetailMessages.length === 0 && <p className="text-sm text-slate-500">Mesaj geçmişi yok.</p>}
                    </div>
                  </div>
                )}
              </aside>
            </section>
          )}

          {active === "Üyeler" && (
            <section className="grid gap-4 xl:grid-cols-[440px_minmax(0,1fr)]">
              <div className="rounded-lg border border-line bg-panel p-5">
                <h3 className="font-semibold text-white">{editingContactId ? "Üye Güncelle" : "Üye Kaydı Oluştur"}</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                  <Input label="Ad" value={contactForm.firstName} onChange={(value) => setContactForm({ ...contactForm, firstName: value, name: formatName(`${value} ${contactForm.lastName}`.trim()) })} />
                  <Input label="Soyad" value={contactForm.lastName} onChange={(value) => setContactForm({ ...contactForm, lastName: value, name: formatName(`${contactForm.firstName} ${value}`.trim()) })} />
                  <Input label="Kullanıcı ID / Kullanıcı Adı" value={contactForm.username} onChange={(value) => setContactForm({ ...contactForm, username: value })} />
                  <Input label="T.C." value={contactForm.nationalId} onChange={(value) => setContactForm({ ...contactForm, nationalId: value })} />
                  <Input label="Telefon numarası" value={contactForm.phone} onChange={(value) => setContactForm({ ...contactForm, phone: value })} />
                  <Select label="Cinsiyet" value={contactForm.gender} options={["Belirtilmedi", "Kadın", "Erkek"]} onChange={(value) => setContactForm({ ...contactForm, gender: value })} />
                  <Select label="Üye durumu" value={contactForm.memberStatus} options={["Aktif", "Pasif", "Riskli", "VIP"]} onChange={(value) => setContactForm({ ...contactForm, memberStatus: value })} />
                  <Select label="Kayıt kaynağı" value={contactForm.source} options={["WhatsApp", "Chat", "Manuel", "Bot", "Diğer"]} onChange={(value) => setContactForm({ ...contactForm, source: value })} />
                  <label className="md:col-span-2 xl:col-span-1">
                    <span className="label">Not</span>
                    <textarea className="field min-h-28" value={contactForm.note} onChange={(event) => setContactForm({ ...contactForm, note: event.target.value })} />
                  </label>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="btn btn-primary" onClick={() => void saveContact()}>
                    <Save size={17} /> {editingContactId ? "Üye Güncelle" : "Üye Kaydet"}
                  </button>
                  {editingContactId && <button className="btn btn-secondary" onClick={cancelContactEdit}>Vazgeç</button>}
                </div>
                <OwnershipConflictPanel
                  conflict={ownershipConflict}
                  operators={data.operators}
                  note={ownershipRequestNote}
                  onNoteChange={setOwnershipRequestNote}
                  onAskAdmin={() => void requestOwnershipPermission()}
                />
              </div>
              <div className="rounded-lg border border-line bg-panel p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">Üye Listesi</h3>
                  <span className="text-xs text-slate-500">{filteredMembers.length} / {registeredContacts.length} üye</span>
                </div>
                <div className="mb-4 grid gap-3 md:grid-cols-4">
                  <Select label="Durum filtresi" value={memberStatusFilter} options={["Tümü", "Aktif", "Pasif", "Riskli", "VIP"]} onChange={setMemberStatusFilter} />
                  <Select label="Cinsiyet filtresi" value={memberGenderFilter} options={["Tümü", "Erkek", "Kadın"]} onChange={setMemberGenderFilter} />
                  <Select label="Etiket filtresi" value={memberTagFilter} options={["Tüm üyeler", ...data.memberTags.map((tag) => tag.name)]} onChange={setMemberTagFilter} />
                  <Select label="Sıralama" value={memberSort} options={["Son görüşme", "Ad Soyad"]} onChange={setMemberSort} />
                </div>
                <div className="overflow-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-panelSoft text-xs uppercase text-slate-400">
                      <tr>
                        <th className="p-3">Ad Soyad</th><th>Etiketler</th><th>Kullanıcı ID</th><th>Telefon</th><th>Cinsiyet</th><th>Durum</th><th>Kayıt kaynağı</th><th>Son görüşme</th><th className="text-right pr-3">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((contact) => {
                        const lastConversationAt = getMemberLastConversation(data, contact.id);
                        return (
                          <tr key={contact.id} className="border-t border-line">
                            <td className="p-3 font-semibold text-white">{memberDisplayName(contact)}</td>
                            <td><TagBadges tags={contact.tags} /></td>
                            <td className="text-slate-300">{contact.username ?? "-"}</td>
                            <td className="text-slate-300">{contact.phone}</td>
                            <td className="text-slate-400">{contact.gender}</td>
                            <td><span className={clsx("status-pill", memberStatusTone(contact.memberStatus))}>{contact.memberStatus}</span></td>
                            <td className="text-slate-400">{contact.source}</td>
                            <td className="text-slate-400">{lastConversationAt.getTime() > 0 ? formatDate(lastConversationAt.toISOString()) : "-"}</td>
                            <td className="p-3">
                              <div className="flex justify-end gap-2">
                                <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => setMemberDetailId(contact.id)}>Detay</button>
                                <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => editContact(contact)}>Düzenle</button>
                                <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => void toggleMemberStatus(contact)}>
                                  {contact.memberStatus === "Pasif" ? "Aktifleştir" : "Pasifleştir"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredMembers.length === 0 && <p className="p-6 text-sm text-slate-400">Filtreye uygun üye yok.</p>}
                </div>
              </div>
            </section>
          )}

          {active === "Hazır Cevaplar" && (
            <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
              <div className="rounded-lg border border-line bg-panel p-5">
                <h3 className="font-semibold text-white">{editingTemplateId ? "Hazır Cevap Güncelle" : "Hazır Cevap Ekle"}</h3>
                <Input label="Şablon adı" value={templateForm.title} onChange={(value) => setTemplateForm({ ...templateForm, title: value })} />
                <Input label="Hashtag" value={templateForm.hashtag} onChange={(value) => setTemplateForm({ ...templateForm, hashtag: value.replace(/^#+/, "") })} />
                <label className="mt-4 block">
                  <span className="label">Şablon içeriği</span>
                  <textarea className="field min-h-36" value={templateForm.content} onChange={(event) => setTemplateForm({ ...templateForm, content: event.target.value })} placeholder="{ad}, {soyad}, {adSoyad}, {hitap}, {telefon}, {cinsiyet}" />
                </label>
                <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={templateForm.isActive} onChange={(event) => setTemplateForm({ ...templateForm, isActive: event.target.checked })} />
                  Aktif
                </label>
                <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={templateForm.isPinned} onChange={(event) => setTemplateForm({ ...templateForm, isPinned: event.target.checked })} />
                  Sabitle
                </label>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="btn btn-primary" onClick={() => void addTemplate()}>
                    {editingTemplateId ? <Save size={17} /> : <Plus size={17} />}
                    {editingTemplateId ? "Şablon Güncelle" : "Şablon Ekle"}
                  </button>
                  {editingTemplateId && (
                    <button className="btn btn-secondary" onClick={cancelTemplateEdit}>
                      Vazgeç
                    </button>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                {data.templates.map((template) => (
                  <article key={template.id} className="rounded-lg border border-line bg-panel p-3">
                    <div className="grid gap-3 xl:grid-cols-[180px_120px_minmax(0,1fr)_150px_280px] xl:items-center">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-white">{template.title}</h3>
                      </div>
                      <p className="truncate text-xs text-slate-400">#{template.hashtag || template.title}</p>
                      <p className="line-clamp-2 text-sm leading-5 text-slate-300">{template.content.length > 100 ? `${template.content.slice(0, 100)}...` : template.content}</p>
                      <div className="flex flex-wrap justify-end gap-2">
                        <span className={clsx("status-pill", template.isActive ? statusTone.Aktif : statusTone.Pasif)}>{template.isActive ? "Aktif" : "Pasif"}</span>
                        <span className={clsx("status-pill", template.isPinned ? statusTone.Yeni : statusTone.Pasif)}>{template.isPinned ? "Sabit" : "Sabit değil"}</span>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => editTemplate(template)}>
                          <Pencil size={14} /> Düzenle
                        </button>
                        <button className="btn btn-secondary h-8 px-2 text-xs text-rose-200 hover:border-rose-500/60 hover:text-rose-100" onClick={() => void deleteTemplate(template)}>
                          <Trash2 size={14} /> Sil
                        </button>
                        <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => void toggleTemplatePin(template)}>
                          {template.isPinned ? "Sabitten çıkar" : "Sabitle"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {active === "İletişim Hatları" && (
            <section className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
              <div className="rounded-lg border border-line bg-panel p-5">
                <h3 className="font-semibold text-white">{editingLineId ? "Hat Güncelle" : "Yeni Hat Ekle"}</h3>
                <p className="mt-2 text-sm text-slate-400">WhatsApp hattı değişse bile üye, görev, talep ve timeline verileri korunur.</p>
                <div className="mt-5 grid gap-4">
                  <Input label="Hat adı" value={lineForm.name} onChange={(value) => setLineForm({ ...lineForm, name: value })} />
                  <Input label="Telefon" value={lineForm.phoneNumber} onChange={(value) => setLineForm({ ...lineForm, phoneNumber: value })} />
                  <Input label="Ülke kodu" value={lineForm.countryCode} onChange={(value) => setLineForm({ ...lineForm, countryCode: value })} />
                  <Select label="Provider" value={lineForm.providerType} options={["manual", "whatsapp_web", "cloud_api"]} optionLabels={{ manual: "Manual", whatsapp_web: "WhatsApp Web", cloud_api: "Cloud API" }} onChange={(value) => setLineForm({ ...lineForm, providerType: value })} />
                  <Select label="Durum" value={lineForm.status} options={["active", "passive", "connecting", "blocked", "disconnected", "qr_waiting", "connected", "replacement_pending", "archived"]} optionLabels={lineStatusLabels} onChange={(value) => setLineForm({ ...lineForm, status: value })} />
                  <Select
                    label="Atanan operatör"
                    value={lineForm.assignedOperatorId}
                    options={["", ...data.operators.map((operator) => operator.id)]}
                    optionLabels={{ "": "Atanmadı", ...Object.fromEntries(data.operators.map((operator) => [operator.id, operator.name])) }}
                    onChange={(value) => setLineForm({ ...lineForm, assignedOperatorId: value })}
                  />
                  <Input label="Atama notu" value={lineForm.assignmentNote} onChange={(value) => setLineForm({ ...lineForm, assignmentNote: value })} />
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={lineForm.isDefault} onChange={(event) => setLineForm({ ...lineForm, isDefault: event.target.checked })} />
                    Aktif operasyon hattı yap
                  </label>
                  <label>
                    <span className="label">Notlar</span>
                    <textarea className="field min-h-24" value={lineForm.notes} onChange={(event) => setLineForm({ ...lineForm, notes: event.target.value })} />
                  </label>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="btn btn-primary" onClick={() => void saveCommunicationLine()} disabled={!canManageOwnership}><Save size={17} /> {editingLineId ? "Güncelle" : "Hat Ekle"}</button>
                  {editingLineId && <button className="btn btn-secondary" onClick={() => { setEditingLineId(""); setLineForm(emptyLineForm()); }}>Vazgeç</button>}
                </div>
                {!canManageOwnership && <p className="mt-4 rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-400">Hat yönetimi Admin / COO yetkisindedir. Bu ekranı görüntüleyebilirsiniz.</p>}
              </div>
              <div className="rounded-lg border border-line bg-panel p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">İletişim Hatları</h3>
                    <p className="mt-1 text-sm text-slate-400">Aktif hat gönderimde kullanılır, eski mesajlar kendi hattı ile arşivde kalır.</p>
                  </div>
                  {activeLine && <span className={clsx("status-pill", lineStatusTone(activeLine.status))}>Aktif: {activeLine.name}</span>}
                </div>
                <div className="space-y-3">
                  {scopedData.communicationLines.map((line) => {
                    const stats = lineUsageStats(scopedData, line.id);
                    const assignedOperator = line.assignedOperatorId ? data.operators.find((operator) => operator.id === line.assignedOperatorId) : undefined;
                    const replacementOf = line.replacementOfLineId ? data.communicationLines.find((item) => item.id === line.replacementOfLineId) : undefined;
                    const replacedBy = line.replacedByLineId ? data.communicationLines.find((item) => item.id === line.replacedByLineId) : undefined;
                    return (
                    <article key={line.id} className="rounded-md border border-line bg-ink/35 p-4">
                      <div className="grid gap-3 xl:grid-cols-[1.1fr_120px_120px_120px_130px_160px_150px_auto] xl:items-center">
                        <div>
                          <p className="font-semibold text-white">{line.name}</p>
                          <p className="mt-1 text-sm text-slate-400">{line.countryCode} {line.phoneNumber}</p>
                        </div>
                        <span className="text-sm text-slate-300">{providerLabel(line.providerType)}</span>
                        <span className={clsx("status-pill w-fit", lineStatusTone(line.status))}>{lineStatusLabel(line.status)}</span>
                        <span className={clsx("status-pill w-fit", line.isDefault ? statusTone.Aktif : statusTone.Pasif)}>{line.isDefault ? "Aktif hat" : "Pasif"}</span>
                        <span className={clsx("status-pill w-fit", lineHealthTone(lineHealth(line)))}>{lineHealth(line)}</span>
                        <div className="text-xs text-slate-400">
                          <p>Operatör: {assignedOperator?.name ?? "-"}</p>
                          <p className="mt-1">Konuşma: {stats.conversations} · Mesaj: {stats.messages}</p>
                        </div>
                        <div className="text-xs text-slate-500">
                          <p>Son bağlantı: {line.lastConnectedAt ? formatDate(line.lastConnectedAt) : "-"}</p>
                          <p className="mt-1">Son mesaj: {line.lastMessageAt ? formatDate(line.lastMessageAt) : "-"}</p>
                          {(replacementOf || replacedBy) && <p className="mt-1 text-amber-200">Değişim: {replacementOf ? `Eski ${replacementOf.name}` : ""}{replacedBy ? ` Yeni ${replacedBy.name}` : ""}</p>}
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => editCommunicationLine(line)} disabled={!canManageOwnership}>Düzenle</button>
                          <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => void runLineSessionAction(line, "start")} disabled={!canManageOwnership || line.status === "blocked" || line.status === "archived"}>Bağlan</button>
                          <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => void runLineSessionAction(line, "reconnect")} disabled={!canManageOwnership || line.status === "blocked" || line.status === "archived"}>Yeniden Bağlan</button>
                          <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => void runLineSessionAction(line, "health")} disabled={!canManageOwnership}>Sağlık</button>
                          <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => void runLineSessionAction(line, "stop")} disabled={!canManageOwnership || line.status === "blocked" || line.status === "archived"}>Kapat</button>
                          <button className="btn btn-primary h-8 px-2 text-xs" onClick={() => void makeLineDefault(line)} disabled={!canManageOwnership || line.isDefault || !canSendWithLineStatus(line.status)}>Aktif Hat Yap</button>
                          <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => void replaceCommunicationLine(line)} disabled={!canManageOwnership}>Hattı Değiştir</button>
                          <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => void updateLineStatus(line, "blocked")} disabled={!canManageOwnership}>Bloke</button>
                          <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => void updateLineStatus(line, "qr_waiting")} disabled={!canManageOwnership}>QR Bekliyor</button>
                        </div>
                      </div>
                      {line.notes && <p className="mt-3 rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-400">{line.notes}</p>}
                    </article>
                  );
                  })}
                  {scopedData.communicationLines.length === 0 && (
                    <p className="rounded-md border border-line bg-panelSoft p-6 text-sm text-slate-400">Henüz iletişim hattı yok. Mesaj göndermek için Admin bir aktif hat eklemeli.</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {active === "Operasyon Performansı" && (
            <section className="space-y-4">
              <div className="rounded-lg border border-line bg-panel p-5">
                <h3 className="font-semibold text-white">Operatör Performans Merkezi</h3>
                <p className="mt-2 text-sm text-slate-400">Bugünkü mesaj, görev ve talep aksiyonlarına göre temel operasyon görünümü.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["Genel Performans", "Görev Performansı", "Talep Performansı", "TTS Performansı"] as const).map((tab) => (
                  <button
                    key={tab}
                    className={clsx("h-9 rounded-md border px-3 text-sm transition", performanceTab === tab ? "border-mint/40 bg-mint/10 text-mint" : "border-line bg-panelSoft text-slate-400 hover:text-white")}
                    onClick={() => setPerformanceTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {performanceTab === "Genel Performans" && (
                <>
              <div className="grid gap-3 xl:grid-cols-[340px_minmax(0,1fr)]">
                <section className="rounded-lg border border-mint/20 bg-panel p-4">
                  <p className="text-xs text-slate-400">Operasyon Skoru</p>
                  <div className="mt-3 flex items-end gap-2">
                    <p className="text-4xl font-bold text-white">{operationScore}</p>
                    <p className="pb-1 text-sm text-slate-400">/100</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">Bugünkü görev tamamlama oranı, bekleyen mesajlar ve geçmiş iş yüküne göre hesaplandı.</p>
                  <div className="mt-4 rounded-md border border-line bg-ink/35 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-400">Skor Açıklaması</p>
                    <div className="mt-3 space-y-2 text-sm">
                      {operationScoreDetails.map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-3">
                          <span className="text-slate-300">{item.label}</span>
                          <span className={clsx("font-semibold", item.tone === "positive" ? "text-emerald-200" : "text-amber-200")}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
                <section className="rounded-lg border border-line bg-panel p-4">
                  <h3 className="font-semibold text-white">Günlük Operasyon Özeti</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MiniMetric label="Bugünkü mesaj" value={operationSummary.todayMessages} />
                    <MiniMetric label="Tamamlanan görev" value={operationSummary.completedTodayTasks} />
                    <MiniMetric label="Bekleyen görev" value={operationSummary.pendingTodayTasks} />
                    <MiniMetric label="Geçmiş bekleyen" value={operationSummary.overduePendingTasks} tone="warning" />
                    <MiniMetric label="Bugünkü talep" value={operationSummary.todayRequests} />
                    <MiniMetric label="Cevaplanan konuşma" value={operationSummary.answeredConversations} />
                    <MiniMetric label="Bekleyen konuşma" value={operationSummary.pendingConversations} />
                  </div>
                </section>
              </div>
              <div className="overflow-auto rounded-lg border border-line bg-panel">
                <table className="w-full min-w-[1040px] text-left text-sm">
                  <thead className="bg-panelSoft text-xs uppercase text-slate-400">
                    <tr>
                      <th className="p-3">Operatör</th>
                      <th>Bugünkü mesaj</th>
                      <th>Tamamlanan görev</th>
                      <th>Bekleyen görev</th>
                      <th>Bugünkü talep</th>
                      <th>Toplam konuşma</th>
                      <th>Son aktiflik</th>
                      <th>Oran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceRows.map((row) => (
                      <tr key={row.operatorId} className="border-t border-line">
                        <td className="p-3">
                          <p className="font-semibold text-white">{row.name}</p>
                          <p className="text-xs text-slate-500">{row.role}</p>
                        </td>
                        <td>{row.todayMessages}</td>
                        <td className="text-emerald-200">{row.completedTodayTasks}</td>
                        <td className="text-amber-200">{row.pendingTodayTasks}</td>
                        <td>{row.todayRequests}</td>
                        <td>{row.totalConversations}</td>
                        <td className="text-slate-400">{row.lastActiveAt ? formatShortDate(new Date(row.lastActiveAt)) : "-"}</td>
                        <td><span className="status-pill border-mint/30 bg-mint/10 text-emerald-200">%{row.completionRate}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                </>
              )}
              {performanceTab === "Görev Performansı" && (
                <section className="rounded-lg border border-line bg-panel p-4">
                  <h3 className="font-semibold text-white">Görev Performansı</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MiniMetric label="Bugünkü bekleyen görev" value={operationSummary.pendingTodayTasks} />
                    <MiniMetric label="Bugünkü tamamlanan görev" value={operationSummary.completedTodayTasks} />
                    <MiniMetric label="Geçmiş bekleyen görev" value={operationSummary.overduePendingTasks} tone="warning" />
                    <MiniMetric label="Toplam görev" value={scopedData.tasks.length} />
                  </div>
                </section>
              )}
              {performanceTab === "Talep Performansı" && (
                <section className="rounded-lg border border-line bg-panel p-4">
                  <h3 className="font-semibold text-white">Talep Performansı</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MiniMetric label="Bugünkü talep" value={operationSummary.todayRequests} />
                    <MiniMetric label="Açık talep" value={operationSummary.openRequests} />
                    <MiniMetric label="Toplam talep" value={scopedData.requests.length} />
                    <MiniMetric label="Geçmiş açık talep" value={pastOpenRequests.length} tone="warning" />
                  </div>
                </section>
              )}
              {performanceTab === "TTS Performansı" && (
                <>
              <section className="rounded-lg border border-line bg-panel p-4">
                <h3 className="font-semibold text-white">TTS Kullanımı</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MiniMetric label="Bugünkü ses" value={ttsUsageSummary.todayCount} />
                  <MiniMetric label="Bu ay ses" value={ttsUsageSummary.monthCount} />
                  <MiniMetric label="Bugün gönderilen ses" value={ttsUsageSummary.todaySentCount} />
                  <MiniMetric label="Bu ay gönderilen ses" value={ttsUsageSummary.monthSentCount} />
                  {canManageTtsCosts && (
                    <>
                      <div className="rounded-md border border-line bg-panelSoft p-3">
                        <p className="text-xs text-slate-500">Bugünkü maliyet</p>
                        <p className="mt-2 text-2xl font-bold text-white">${ttsUsageSummary.todayCost.toFixed(4)}</p>
                      </div>
                      <div className="rounded-md border border-line bg-panelSoft p-3">
                        <p className="text-xs text-slate-500">Aylık maliyet</p>
                        <p className="mt-2 text-2xl font-bold text-white">${ttsUsageSummary.monthCost.toFixed(4)}</p>
                      </div>
                    </>
                  )}
                  <MiniMetric label="Ort. süre sn" value={Math.round(ttsUsageSummary.averageDuration)} />
                  <div className="rounded-md border border-line bg-panelSoft p-3">
                    <p className="text-xs text-slate-500">Toplam MP3 boyutu</p>
                    <p className="mt-2 text-2xl font-bold text-white">{formatBytes(ttsUsageSummary.totalBytes)}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <TtsRankList title="En çok ses oluşturan operatörler" rows={ttsUsageSummary.topOperators} />
                  <TtsRankList title="En çok ses gönderilen üyeler" rows={ttsUsageSummary.topMembers} />
                </div>
              </section>
              <TtsOperatorTable rows={ttsUsageSummary.operatorRows} showCost={canManageTtsCosts} />
              <TtsMemberTable rows={ttsUsageSummary.memberRows} />
              {canManageTtsCosts && (
                <section className="rounded-lg border border-line bg-panel p-4">
                  <h3 className="font-semibold text-white">TTS Ayarları</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Info label="Aktif provider önceliği" value="OpenAI / ElevenLabs / Azure" />
                    <Info label="Model / Voice" value="Env üzerinden yönetilir" />
                    <Info label="Operatör günlük limiti" value="Operatörler ekranından düzenlenir" />
                    <Info label="Bu ay tahmini toplam maliyet" value={`$${ttsUsageSummary.monthCost.toFixed(4)}`} />
                  </div>
                </section>
              )}
                </>
              )}
            </section>
          )}

          {active === "Operatörler" && (
            <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
              {isAdmin && (
                <div className="rounded-lg border border-line bg-panel p-5">
                  <h3 className="font-semibold text-white">Operatör Ekle</h3>
                  <div className="mt-4 space-y-3">
                    <Input label="Operatör adı" value={operatorForm.name} onChange={(value) => setOperatorForm({ ...operatorForm, name: value })} />
                    <Input label="E-posta" value={operatorForm.email} onChange={(value) => setOperatorForm({ ...operatorForm, email: value })} />
                    <Input label="Şifre" value={operatorForm.password} onChange={(value) => setOperatorForm({ ...operatorForm, password: value })} />
                    <Select label="Rol" value={operatorForm.role} options={["Admin", "Takım Lideri", "Operatör"]} onChange={(value) => setOperatorForm({ ...operatorForm, role: value, teamLeadId: value === "Operatör" ? operatorForm.teamLeadId : "" })} />
                    {operatorForm.role === "Operatör" && (
                      <Select
                        label="Takım lideri"
                        value={operatorForm.teamLeadId}
                        options={["", ...data.operators.filter((operator) => operator.role === "Takım Lideri").map((operator) => operator.id)]}
                        optionLabels={{ "": "Seçilmedi", ...Object.fromEntries(data.operators.filter((operator) => operator.role === "Takım Lideri").map((operator) => [operator.id, operator.name])) }}
                        onChange={(value) => setOperatorForm({ ...operatorForm, teamLeadId: value })}
                      />
                    )}
                    <Select label="Durum" value={operatorForm.status} options={["Aktif", "Pasif"]} onChange={(value) => setOperatorForm({ ...operatorForm, status: value })} />
                    <button className="btn btn-primary w-full" onClick={() => void addOperator()}><Plus size={17} /> Operatör Kaydet</button>
                  </div>
                </div>
              )}
              <div className="overflow-auto rounded-lg border border-line bg-panel">
                <table className="w-full min-w-[1180px] text-left text-sm">
                  <thead className="bg-panelSoft text-xs uppercase text-slate-400">
                    <tr><th className="p-3">Operatör adı</th><th>E-posta</th><th>Rol</th><th>Takım lideri</th><th>Durum</th><th>Bugünkü Mesaj</th><th>Tamamlanan Görev</th><th>Bekleyen Görev</th><th>Bugünkü Talep</th><th>TTS limit</th><th>Son Aktivite</th></tr>
                  </thead>
                  <tbody>
                    {visibleOperators.map((operator) => {
                      const stats = performanceRows.find((row) => row.operatorId === operator.id);
                      return (
                        <tr key={operator.id} className="border-t border-line">
                          <td className="p-3 font-semibold text-white">{operator.name}</td>
                          <td>{operator.email}</td>
                          <td>{operator.role}</td>
                          <td>{operator.teamLeadId ? data.operators.find((item) => item.id === operator.teamLeadId)?.name ?? "-" : "-"}</td>
                          <td><span className={clsx("status-pill", statusTone[operator.status])}>{operator.status}</span></td>
                          <td>{stats?.todayMessages ?? 0}</td>
                          <td className="text-emerald-200">{stats?.completedTodayTasks ?? 0}</td>
                          <td className="text-amber-200">{stats?.pendingTodayTasks ?? 0}</td>
                          <td>{stats?.todayRequests ?? 0}</td>
                          <td>
                            <input
                              className="field h-9 w-24"
                              type="number"
                              min={0}
                              value={operator.ttsDailyLimit}
                              onChange={(event) => void updateOperatorTtsLimit(operator.id, Number(event.target.value))}
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>{formatDate(operator.lastActiveAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {active === "Ayarlar" && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-panel p-4">
                <div>
                  <h3 className="font-semibold text-white">Ayarlar</h3>
                  <p className="mt-1 text-sm text-slate-400">Sistem ayarları ve gizli bilgi merkezi.</p>
                </div>
                <div className="flex rounded-md border border-line bg-ink/40 p-1">
                  {(["Genel", "Sistem Kılavuzu"] as const).map((tab) => (
                    <button
                      key={tab}
                      className={clsx("flex h-8 items-center gap-2 rounded px-3 text-xs transition", settingsSubTab === tab ? "bg-mint text-ink" : "text-slate-400 hover:text-white")}
                      onClick={() => setSettingsSubTab(tab)}
                    >
                      {tab === "Sistem Kılavuzu" && <BookOpen size={14} />}
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              {settingsSubTab === "Sistem Kılavuzu" ? (
                <SystemGuidePage query={guideQuery} onQueryChange={setGuideQuery} canEdit={isAdmin || String(user?.role ?? "") === "Developer"} />
              ) : (
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-line bg-panel p-5">
                <h3 className="font-semibold text-white">WhatsApp Bağlantısı</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">V2 gerçek PostgreSQL verisiyle çalışır. WhatsApp API entegrasyonu eklenene kadar gelen mesajlar admin simülasyonu ile messages tablosuna CUSTOMER olarak yazılır.</p>
              </div>
              <div className="rounded-lg border border-line bg-panel p-5">
                <h3 className="font-semibold text-white">Veri Saklama</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Talep, müşteri, konuşma, mesaj, hazır cevap ve kullanıcı kayıtları Prisma üzerinden PostgreSQL tablolarına kaydedilir.</p>
              </div>
              {canManageOwnership && (
                <>
                  <OwnershipRequestCenter
                    data={data}
                    onDecide={(requestId, action) => void decideOwnershipRequest(requestId, action)}
                  />
                  <MemberTransferCenter
                    data={data}
                    form={memberTransferForm}
                    onChange={setMemberTransferForm}
                    onTransfer={() => void transferMemberOwnership()}
                  />
                </>
              )}
              <div className="rounded-lg border border-line bg-panel p-5 md:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">Operasyon Kural Merkezi</h3>
                      <p className="mt-2 text-sm text-slate-400">Bu kurallar sistem genelinde görev oluşturma ve takip süreçlerini yönetir. Sadece Admin / COO tarafından değiştirilebilir.</p>
                    </div>
                    <span className={clsx("status-pill", canManageOperationRules ? statusTone.Aktif : statusTone.Pasif)}>
                      {canManageOperationRules ? "Düzenleme yetkisi" : "Salt okunur"}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {[
                      ["engine_enabled", "Operatör yönlendirme motoru"],
                      ["new_member_task", "Yeni üye görevi"],
                      ["inactive_member_task", "Pasif üye takip görevi"],
                      ["request_control_task", "Talep kontrol görevi"],
                      ["voice_followup_task", "Sesli mesaj takip görevi"]
                    ].map(([key, label]) => {
                      const setting = automationSetting(data, key);
                      return (
                        <label key={key} className="flex items-center justify-between gap-3 rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-200">
                          <span>{label}</span>
                          <input
                            type="checkbox"
                            checked={setting?.enabled ?? true}
                            onChange={(event) => void updateAutomationSetting(key, event.target.checked, setting?.value)}
                            disabled={!canManageOperationRules}
                          />
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button className="btn btn-secondary" onClick={() => void runAutomation(true)} disabled={automationLoading || !canManageOperationRules}>
                      Test Et
                    </button>
                    <button className="btn btn-primary" onClick={() => void runAutomation(false)} disabled={automationLoading || !canManageOperationRules}>
                      Önerileri Hazırla
                    </button>
                    {!canManageOperationRules && (
                      <p className="flex items-center text-sm text-slate-500">Bu alanı görüntüleyebilirsiniz; değişiklik için Admin / COO yetkisi gerekir.</p>
                    )}
                  </div>
                  {automationResult && (
                    <div className="mt-4 grid gap-3 rounded-md border border-line bg-ink/40 p-4 sm:grid-cols-2 xl:grid-cols-5">
                      <MiniMetric label="Kontrol edilen üye" value={automationResult.checkedMemberCount} />
                      <MiniMetric label="Önerilen aksiyon" value={automationResult.createdCount} />
                      <MiniMetric label="Atlanan görev" value={automationResult.skippedCount} />
                      <MiniMetric label="Zaten var" value={automationResult.duplicateCount} />
                      <MiniMetric label="Oto tamamlanacak" value={automationResult.autoCompletedCount} />
                      <MiniMetric label="Beklemeli" value={automationResult.waitCount} />
                      <MiniMetric label="Hata" value={automationResult.errorCount} tone={automationResult.errorCount > 0 ? "warning" : undefined} />
                      {automationResult.errors.length > 0 && (
                        <p className="sm:col-span-2 xl:col-span-5 rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-red-200">{automationResult.errors.join(" | ")}</p>
                      )}
                      {automationResult.decisions && automationResult.decisions.length > 0 && (
                        <div className="sm:col-span-2 xl:col-span-5">
                          <AutomationDecisionReport
                            decisions={automationResult.decisions}
                            contacts={data.contacts}
                            onOpenChat={(decision) => void useGuidanceDraft(decision)}
                            onCreateTask={(decision) => void createTaskFromGuidance(decision)}
                            onPrepareVoice={(decision) => void useGuidanceVoice(decision)}
                            onIgnore={(decision) => void ignoreGuidance(decision)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-white">Son Otomatik Görev Kayıtları</h4>
                        <p className="mt-1 text-xs text-slate-500">{automationLogRangeLabel(automationLogDateMode, automationLogDate, now)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(["Bugün", "Dün", "Son 7 gün", "Özel tarih"] as const).map((mode) => (
                          <button
                            key={mode}
                            className={clsx("h-8 rounded-md border px-2 text-xs transition", automationLogDateMode === mode ? "border-mint/40 bg-mint/10 text-mint" : "border-line bg-panelSoft text-slate-400 hover:text-white")}
                            onClick={() => setAutomationLogDateMode(mode)}
                          >
                            {mode}
                          </button>
                        ))}
                        {automationLogDateMode === "Özel tarih" && (
                          <input
                            className="field h-8 w-auto px-2 text-xs"
                            type="date"
                            value={automationLogDate}
                            onChange={(event) => setAutomationLogDate(event.target.value)}
                          />
                        )}
                        <span className="mx-1 h-6 w-px bg-line" />
                        {(["Tümü", "Oluşturuldu", "Hata", "Zaten var"] as const).map((filter) => (
                          <button
                            key={filter}
                            className={clsx("h-8 rounded-md border px-2 text-xs transition", automationLogFilter === filter ? "border-mint/40 bg-mint/10 text-mint" : "border-line bg-panelSoft text-slate-400 hover:text-white")}
                            onClick={() => setAutomationLogFilter(filter)}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>
                    <AutomationLogTable logs={filteredAutomationLogs} contacts={data.contacts} />
                  </div>
                </div>
            </section>
              )}
            </section>
          )}
        </div>
      </section>
      {taskCenterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <section className="max-h-[90vh] w-[95vw] max-w-[1600px] overflow-y-auto rounded-lg border border-line bg-panel p-5 shadow-glow">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Görev Merkezi</h2>
                <p className="mt-1 text-sm text-slate-400">Bugünkü görevler ve kişi atamaları</p>
              </div>
              <button className="btn btn-secondary" onClick={() => setTaskCenterOpen(false)}>Kapat</button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {(["Bugünkü Görevler", "Geçmiş Görevler"] as const).map((tab) => (
                <button
                  key={tab}
                  className={clsx("h-9 rounded-md border px-3 text-sm transition", taskCenterTab === tab ? "border-mint/40 bg-mint/10 text-mint" : "border-line bg-panelSoft text-slate-400 hover:text-white")}
                  onClick={() => setTaskCenterTab(tab)}
                >
                  {tab}
                  {tab === "Geçmiş Görevler" && overduePendingTaskCount > 0 && (
                    <span className="ml-2 rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-xs text-amber-100">{overduePendingTaskCount}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
              <div className="rounded-lg border border-line bg-ink/40 p-4">
                {taskFeedback.message && (
                  <p className={clsx("mb-4 rounded-md border p-3 text-sm", taskFeedback.type === "success" ? "border-mint/30 bg-mint/10 text-emerald-200" : "border-coral/30 bg-coral/10 text-red-200")}>
                    {taskFeedback.message}
                  </p>
                )}
                {!canDistributeTasks && (
                  <p className="mb-4 rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-400">
                    Görev dağıtımı Admin ve Takım Lideri rollerine açıktır. Operatörler atanmış görevlerini tamamlayabilir.
                  </p>
                )}
                <Select
                  label="Görev başlığı"
                  value={taskForm.title}
                  options={taskTitleOptions}
                  onChange={(value) => setTaskForm({ ...taskForm, title: value, customTitle: value === newTaskOption ? taskForm.customTitle : "" })}
                />
                {taskForm.title === newTaskOption && (
                  <div className="mt-4">
                    <Input label="Yeni görev başlığı" value={taskForm.customTitle} onChange={(value) => setTaskForm({ ...taskForm, customTitle: value })} />
                  </div>
                )}
                <div className="mt-4">
                  <Input label="Numara veya kişi ara" value={taskSearch} onChange={setTaskSearch} />
                </div>
                {selectedTaskContacts.length > 0 && (
                  <div className="mt-4 rounded-md border border-line bg-panel/70 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Seçilen kişiler</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTaskContacts.map((contact) => (
                        <span key={contact.id} className="inline-flex items-center gap-2 rounded-md border border-line bg-panelSoft px-2 py-1 text-xs text-slate-200">
                          {contact.name}
                          <button
                            className="text-slate-500 hover:text-white"
                            onClick={() => setTaskForm({ ...taskForm, contactIds: taskForm.contactIds.filter((id) => id !== contact.id) })}
                            aria-label={`${contact.name} kaldır`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                  {filteredTaskContacts.map((contact) => (
                    <label key={contact.id} className="flex items-center gap-3 rounded-md border border-line bg-panelSoft px-3 py-2 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={taskForm.contactIds.includes(contact.id)}
                        onChange={(event) => {
                          const contactIds = event.target.checked
                            ? [...taskForm.contactIds, contact.id]
                            : taskForm.contactIds.filter((id) => id !== contact.id);
                          setTaskForm({ ...taskForm, contactIds });
                          if (event.target.checked) setTaskSearch("");
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate">{contact.name}</span>
                      <span className="shrink-0 text-xs text-slate-400">{contact.phone}</span>
                    </label>
                  ))}
                  {filteredTaskContacts.length === 0 && <p className="rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-400">Eşleşen kişi bulunamadı.</p>}
                </div>
                <button className="btn btn-primary mt-4 w-full" onClick={() => void saveDailyTasks()} disabled={!canDistributeTasks}>
                  <Save size={17} /> Kaydet
                </button>
              </div>
              {taskCenterTab === "Bugünkü Görevler" ? (
                <TaskList data={scopedData} groups={taskGroups} onOpenDetail={(contactId) => openTaskDetail(contactId, dateInputValue(now))} onGuideTask={(task) => void guideAssistantTask(task)} />
              ) : (
                <PastTaskArchive
                  data={scopedData}
                  tasks={taskArchiveTasks}
                  overdueTasks={overduePendingTasks}
                  filter={taskArchiveFilter}
                  startDate={taskArchiveStartDate}
                  endDate={taskArchiveEndDate}
                  onFilterChange={setTaskArchiveFilter}
                  onStartDateChange={setTaskArchiveStartDate}
                  onEndDateChange={setTaskArchiveEndDate}
                  onOpenDetail={openTaskDetail}
                />
              )}
            </div>
          </section>
        </div>
      )}
      {alarmCenterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <section className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-line bg-panel p-5 shadow-glow">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Alarm Merkezi</h2>
                <p className="mt-1 text-sm text-slate-400">Alarm oluştur ve geçmişi takip et</p>
              </div>
              <button className="btn btn-secondary" onClick={() => setAlarmCenterOpen(false)}>Kapat</button>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[320px_1fr]">
              <div className="rounded-lg border border-line bg-ink/40 p-4">
                <label>
                  <span className="label">Alarm tarihi</span>
                  <input className="field" type="date" value={alarmForm.alarmDate} onChange={(event) => setAlarmForm({ ...alarmForm, alarmDate: event.target.value })} />
                </label>
                <label className="mt-4 block">
                  <span className="label">Alarm saati</span>
                  <input className="field" type="time" value={alarmForm.alarmTime} onChange={(event) => setAlarmForm({ ...alarmForm, alarmTime: event.target.value })} />
                </label>
                <label className="mt-4 block">
                  <span className="label">Alarm notu</span>
                  <textarea className="field min-h-28" value={alarmForm.note} onChange={(event) => setAlarmForm({ ...alarmForm, note: event.target.value })} />
                </label>
                <button className="btn btn-primary mt-4 w-full" onClick={() => void createAlarm()}>
                  <Bell size={17} /> Alarm oluştur
                </button>
              </div>
              <AlarmList alarms={data.alarms} />
            </div>
          </section>
        </div>
      )}
      {requestDetail && requestDetailContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-line bg-panel p-5 shadow-glow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Talep Detayı</h2>
                <p className="mt-1 text-sm text-slate-400">{requestDisplayName(requestDetail, requestDetailContact)} | {requestPhone(requestDetail, requestDetailContact)} | {formatDate(requestDetail.createdAt)}</p>
              </div>
              <button className="btn btn-secondary" onClick={() => setRequestDetailId("")}>Kapat</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Info label="Ad" value={requestFirstName(requestDetail, requestDetailContact)} />
              <Info label="Soyad" value={requestLastName(requestDetail, requestDetailContact) || "-"} />
              <Info label="Kullanıcı ID / Kullanıcı Adı" value={requestDetail.username || "-"} />
              <Info label="Cinsiyet" value={requestGender(requestDetail, requestDetailContact)} />
              <Info label="T.C." value={requestDetail.nationalId || "-"} />
              <Info label="Numara" value={requestPhone(requestDetail, requestDetailContact)} />
              <Info label="Talep türü" value={requestDetail.requestType} />
              <Info label="Miktar / Tutar" value={formatCurrency(requestAmountForDisplay(requestDetail))} />
              {requestDetail.requestType === "Bonus" && (
                <>
                  <Info label="Bonus miktarı" value={formatCurrency(requestDetail.bonusAmount ?? requestDetail.amount)} />
                  <Info label="Bonus açıklaması" value={requestDetail.bonusDescription ?? "-"} />
                </>
              )}
              {requestDetail.requestType === "Nakit hediye" && (
                <>
                  <Info label="Hediye tutarı" value={formatCurrency(requestDetail.giftAmount ?? requestDetail.amount)} />
                  <Info label="Açıklama" value={requestDetail.giftDescription ?? "-"} />
                </>
              )}
              {requestDetail.requestType === "Düzeltme alt/üst" && (
                <>
                  <Info label="İşlem yönü" value={requestDetail.correctionDirection ?? "-"} />
                  <Info label="Tutar" value={formatCurrency(requestDetail.correctionAmount ?? requestDetail.amount)} />
                  <Info label="Açıklama" value={requestDetail.correctionDescription ?? "-"} />
                </>
              )}
              {requestDetail.requestType === "Bahis detayı" && (
                <>
                  <Info label="Bahis ID" value={requestDetail.betId ?? "-"} />
                  <Info label="Oyun ismi" value={requestDetail.gameName ?? "-"} />
                  <Info label="Açıklama" value={requestDetail.betDescription ?? "-"} />
                </>
              )}
              <Info label="Not" value={requestDetail.note || "-"} />
              <Info label="Durum" value={requestDetail.status} />
              <Info label="Son işlem" value={formatDate(requestDetail.updatedAt)} />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-[260px_1fr]">
              <Select label="Talep Durumu" value={requestDetailForm.status} options={requestStatuses} onChange={(value) => setRequestDetailForm({ ...requestDetailForm, status: value as RequestStatus })} />
              <label>
                <span className="label">Not</span>
                <textarea className="field min-h-24" value={requestDetailForm.note} onChange={(event) => setRequestDetailForm({ ...requestDetailForm, note: event.target.value })} />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn btn-secondary" onClick={() => openMessageForRequest(requestDetail)}>
                <MessageCircle size={17} /> Mesaj Aç
              </button>
              <button className="btn btn-secondary" onClick={() => void updateRequestDetail()}>
                <Save size={17} /> Durum Güncelle / Not Ekle
              </button>
            </div>
            <div className="mt-5 rounded-lg border border-line bg-ink/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">Bonus / İşlem Komutu</h3>
                <button className="btn btn-primary h-9" onClick={() => void copyBonusCommand()}>
                  <Copy size={16} /> Oluştur / Kopyala
                </button>
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-md border border-line bg-panelSoft p-4 text-sm leading-6 text-slate-200">{requestCommand(requestDetail, requestDetailContact)}</pre>
            </div>
          </section>
        </div>
      )}
      {taskDetailContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <section className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-line bg-panel p-5 shadow-glow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Kişi Görev Detayı</h2>
                <p className="mt-1 text-sm text-slate-400">{taskDetailContact.name} | {taskDetailContact.phone} | {taskDetailDateKey ? formatShortDate(new Date(`${taskDetailDateKey}T00:00:00`)) : ""}</p>
              </div>
              <button className="btn btn-secondary" onClick={() => {
                setTaskDetailContactId("");
                setTaskDetailDateKey("");
              }}>Kapat</button>
            </div>
            <div className="mt-5 space-y-4">
              {taskDetailTasks.map((task) => (
                <article key={task.id} className="rounded-lg border border-line bg-ink/40 p-4">
                  <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_130px_110px_130px_180px] lg:items-center">
                    <div>
                      <p className="font-semibold text-white">{task.title}</p>
                      <p className="mt-1 text-xs text-slate-500">Son güncelleme: {formatDate(task.updatedAt)}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <SourceBadge source={task.source} />
                        {task.dueAt && <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200">Plan: {formatDate(task.dueAt)}</span>}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{formatShortDate(new Date(task.taskDate))}</p>
                    <p className="text-sm text-slate-400">{timeDisplay(new Date(task.createdAt))}</p>
                    <span className={clsx("status-pill w-fit", task.status === "Tamamlandı" ? statusTone.Tamamlandı : statusTone.Beklemede)}>{task.status}</span>
                    <button className="btn btn-secondary h-9" onClick={() => void toggleTaskStatus(task)}>
                      {task.status === "Bekliyor" ? "Tamamlandı" : "Beklemede"}
                    </button>
                    {task.status === "Bekliyor" && (
                      <>
                        <button className="btn btn-secondary h-9" onClick={() => void guideAssistantTask(task)}>Yönlendir</button>
                        <button className="btn btn-secondary h-9" onClick={() => void ignoreAssistantTask(task)}>Yoksay</button>
                      </>
                    )}
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                    <textarea
                      className="field min-h-20"
                      placeholder="Not yaz"
                      value={taskNoteDrafts[task.id] ?? ""}
                      onChange={(event) => setTaskNoteDrafts((drafts) => ({ ...drafts, [task.id]: event.target.value }))}
                    />
                    <button className="btn btn-primary self-end" onClick={() => void saveTaskNote(task)}><Save size={17} /> Not Kaydet</button>
                  </div>
                  {task.automationRuleKey && (
                    <div className="mt-4 rounded-md border border-line bg-panelSoft p-3">
                      <h4 className="text-sm font-semibold text-white">Otomatik Görev Kararı</h4>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <Info label="Kaynak" value="Otomatik Görev Motoru" />
                        <Info label="Kural adı" value={automationRuleLabel(task.automationRuleKey)} />
                        <Info label="Karar gerekçesi" value={task.automationReason ?? "-"} />
                        <Info label="İlgili üye" value={taskDetailContact.name} />
                        <Info label="Referans" value={task.sourceReferenceId ?? "-"} />
                      </div>
                      {task.automationQuestions && task.automationQuestions.length > 0 && (
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {task.automationQuestions.map((item) => (
                            <div key={item.question} className="rounded-md border border-line bg-ink/40 p-2 text-xs">
                              <p className="text-slate-500">{item.question}</p>
                              <p className="mt-1 font-semibold text-slate-200">{item.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-white">Not Geçmişi</h4>
                    <div className="mt-2 space-y-2">
                      {task.notes.length === 0 && <p className="rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-500">Henüz not yok.</p>}
                      {task.notes.map((note) => (
                        <div key={note.id} className="rounded-md border border-line bg-panelSoft p-3">
                          <p className="text-xs text-slate-500">{formatShortDate(new Date(note.createdAt))} {timeDisplay(new Date(note.createdAt))}{note.createdByName ? ` · ${note.createdByName}` : ""}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-200">{note.noteText}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button className="btn btn-secondary" onClick={() => taskDetailTasks[0] && openTaskContact(taskDetailTasks[0])}><MessageCircle size={17} /> Mesaj Aç</button>
            </div>
          </section>
        </div>
      )}
      {timelineContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-line bg-panel p-5 shadow-glow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Müşteri Zaman Çizelgesi</h2>
                <p className="mt-1 text-sm text-slate-400">{timelineContact.name} | {timelineContact.phone}</p>
              </div>
              <button className="btn btn-secondary" onClick={() => setTimelineContactId("")}>Kapat</button>
            </div>
            <div className="mt-5 space-y-3">
              {timelineEvents.map((event) => (
                <div key={event.id} className="rounded-md border border-line bg-ink/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-white">{event.title}</p>
                    <p className="text-xs text-slate-500">{formatDate(event.createdAt)}</p>
                  </div>
                  {event.description && <p className="mt-2 text-sm leading-6 text-slate-300">{event.description}</p>}
                </div>
              ))}
              {timelineEvents.length === 0 && <p className="rounded-md border border-line bg-panelSoft p-4 text-sm text-slate-400">Henüz zaman çizelgesi kaydı yok.</p>}
            </div>
          </section>
        </div>
      )}
      {voiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-line bg-panel p-5 shadow-glow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Oto Sesli Yanıt</h2>
                <p className="mt-1 text-sm text-slate-400">Türkçe, doğal kadın sesiyle gerçek TTS önizleme akışı</p>
              </div>
              <button className="btn btn-secondary" onClick={() => setVoiceModalOpen(false)}>Kapat</button>
            </div>
            {voiceError && <p className="mt-4 rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-red-200">{voiceError}</p>}
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_260px]">
              <div>
                <label>
                  <span className="label">Sesli yanıt metni</span>
                  <textarea
                    className="field min-h-40"
                    value={voiceDraft}
                    onChange={(event) => {
                      setVoiceDraft(event.target.value);
                      setVoiceAudioUrl("");
                      setVoiceUsageLogId("");
                    }}
                    placeholder="Merhaba {isim} {hitap}, işleminizle ilgili kısa bir bilgilendirme yapmak istedik."
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">{voiceDraft.length}/600 · Değişkenler: {"{isim}"}, {"{hitap}"}, {"{kullaniciAdi}"}, {"{miktar}"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn btn-primary" onClick={() => void generateVoiceReply()} disabled={voiceLoading}>
                    <Volume2 size={17} /> {voiceLoading ? "Oluşturuluyor" : "Kadın sesiyle oluştur"}
                  </button>
                  <button className="btn btn-secondary" onClick={() => void sendVoiceReply()} disabled={!voiceAudioUrl || !selectedContact}>
                    <Send size={17} /> Gönder
                  </button>
                </div>
                <div className="mt-4 rounded-lg border border-line bg-ink/40 p-4">
                  <h3 className="font-semibold text-white">Ön izleme</h3>
                  {voiceAudioUrl ? (
                    <audio className="mt-3 w-full" src={voiceAudioUrl} controls />
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">Ses dosyası oluşturulduktan sonra burada dinlenebilir.</p>
                  )}
                </div>
              </div>
              <aside className="rounded-lg border border-line bg-ink/40 p-4">
                <h3 className="font-semibold text-white">Hazır Sesli Şablonlar</h3>
                <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                  {data.voiceTemplates.filter((template) => template.isActive).map((template) => (
                    <button
                      key={template.id}
                      className="w-full rounded-md border border-line bg-panelSoft p-3 text-left text-sm transition hover:border-mint/40"
                      onClick={() => {
                        setVoiceDraft(renderVoiceTemplate(template.content, selectedContact, selectedContact ? latestRequestForContact(data, selectedContact.id) : undefined));
                        setVoiceAudioUrl("");
                        setVoiceUsageLogId("");
                      }}
                    >
                      <span className="font-semibold text-white">{template.title}</span>
                      <span className="mt-1 block line-clamp-2 text-xs text-slate-400">{template.content}</span>
                    </button>
                  ))}
                  {data.voiceTemplates.filter((template) => template.isActive).length === 0 && <p className="rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-500">Kayıtlı sesli şablon yok.</p>}
                </div>
                <div className="mt-4 border-t border-line pt-4">
                  <Input label="Şablon adı" value={voiceTemplateTitle} onChange={setVoiceTemplateTitle} />
                  <button className="btn btn-secondary mt-3 w-full" onClick={() => void saveVoiceTemplate()}>
                    <Save size={16} /> Şablon Kaydet
                  </button>
                </div>
              </aside>
            </div>
          </section>
        </div>
      )}
      {memberDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <section className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-line bg-panel p-5 shadow-glow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Üye Detayı</h2>
                <p className="mt-1 text-sm text-slate-400">{memberDisplayName(memberDetail)} | {memberDetail.phone}</p>
                <div className="mt-3"><TagBadges tags={memberDetail.tags} /></div>
              </div>
              <button className="btn btn-secondary" onClick={() => setMemberDetailId("")}>Kapat</button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {(["Genel Bilgiler", "Notlar", "Talepler", "Görevler", "Mesajlar", "Zaman Çizelgesi"] as const).map((tab) => (
                <button
                  key={tab}
                  className={clsx("h-9 rounded-md border px-3 text-sm transition", memberDetailTab === tab ? "border-mint/40 bg-mint/10 text-mint" : "border-line bg-panelSoft text-slate-400 hover:text-white")}
                  onClick={() => setMemberDetailTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {memberDetailTab === "Genel Bilgiler" && (
              <>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Info label="Ad" value={memberDetail.firstName || getFirstName(memberDetail) || "-"} />
                  <Info label="Soyad" value={memberDetail.lastName || getLastName(memberDetail) || "-"} />
                  <Info label="Kullanıcı ID" value={memberDetail.username ?? "-"} />
                  <Info label="Telefon" value={memberDetail.phone} />
                  <Info label="Cinsiyet" value={memberDetail.gender} />
                  <Info label="T.C." value={memberDetail.nationalId ?? "-"} />
                  <Info label="Durum" value={memberDetail.memberStatus} />
                  <Info label="Kayıt kaynağı" value={memberDetail.source} />
                  <Info label="Kayıt tarihi" value={formatDate(memberDetail.createdAt)} />
                  <Info label="Son görüşme / son mesaj" value={memberDetailLastConversation ? formatDate(memberDetailLastConversation.lastMessageAt) : "-"} />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                  <MiniMetric label="Toplam Mesaj" value={memberDetailMessages.length} />
                  <MiniMetric label="Toplam Talep" value={memberDetailRequests.length} />
                  <MiniMetric label="Bekleyen Talep" value={memberDetailRequests.filter((request) => request.status !== "Tamamlandı" && request.status !== "Kapatıldı").length} tone={memberDetailRequests.some((request) => request.status !== "Tamamlandı" && request.status !== "Kapatıldı") ? "warning" : undefined} />
                  <MiniMetric label="Toplam Görev" value={memberDetailTasks.length} />
                  <MiniMetric label="Açık Görev" value={memberDetailTasks.filter((task) => task.status === "Bekliyor").length} tone={memberDetailTasks.some((task) => task.status === "Bekliyor") ? "warning" : undefined} />
                  <MiniMetric label="Tamamlanan Görev" value={memberDetailTasks.filter((task) => task.status === "Tamamlandı").length} />
                </div>
                <section className="mt-5 rounded-lg border border-line bg-ink/40 p-4">
                  <h3 className="font-semibold text-white">Hızlı İşlemler</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="btn btn-secondary" onClick={() => setMemberDetailTab("Zaman Çizelgesi")}>Zaman Çizelgesi</button>
                    <button className="btn btn-secondary" onClick={() => editContact(memberDetail)}>Düzenle</button>
                  </div>
                </section>
                <section className="mt-5 rounded-lg border border-line bg-ink/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold text-white">Etiketler</h3>
                    <select
                      className="field h-9 max-w-xs"
                      value=""
                      onChange={(event) => void addMemberTag(memberDetail.id, event.target.value)}
                    >
                      <option value="">Etiket ekle</option>
                      {data.memberTags
                        .filter((tag) => !memberDetail.tags.some((item) => item.id === tag.id))
                        .map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
                    </select>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {memberDetail.tags.map((tag) => (
                      <span key={tag.id} className={clsx("inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs", tagTone(tag.color))}>
                        {tag.name}
                        <button className="text-current opacity-70 hover:opacity-100" onClick={() => void removeMemberTag(memberDetail.id, tag.id)}>×</button>
                      </span>
                    ))}
                    {memberDetail.tags.length === 0 && <p className="text-sm text-slate-500">Henüz etiket yok.</p>}
                  </div>
                </section>
                <OwnershipInfoSection data={data} contact={memberDetail} />
              </>
            )}

            {memberDetailTab === "Notlar" && (
              <section className="mt-5 rounded-lg border border-line bg-ink/40 p-4">
                <h3 className="font-semibold text-white">Genel Notlar</h3>
                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
                  <textarea
                    className="field min-h-20"
                    placeholder="Operatör notu ekle"
                    value={memberNoteDraft}
                    onChange={(event) => setMemberNoteDraft(event.target.value)}
                  />
                  <button className="btn btn-primary self-end" onClick={() => void saveMemberNote()} disabled={!memberNoteDraft.trim()}>
                    <Save size={17} /> Not Ekle
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {memberDetailNotes.map((note) => (
                    <div key={note.id} className="rounded-md border border-line bg-panelSoft p-3">
                      <p className="text-xs text-slate-500">{formatShortDate(new Date(note.createdAt))} {timeDisplay(new Date(note.createdAt))}{note.createdByName ? ` · ${note.createdByName}` : ""}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{note.noteText}</p>
                    </div>
                  ))}
                  {memberDetailNotes.length === 0 && <p className="rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-500">Henüz genel not yok.</p>}
                </div>
              </section>
            )}

            {memberDetailTab === "Talepler" && (
              <section className="mt-5 rounded-lg border border-line bg-ink/40 p-4">
                <h3 className="font-semibold text-white">Üyeye Ait Talepler</h3>
                <div className="mt-3 space-y-2">
                  {memberDetailRequests.map((request) => (
                    <div key={request.id} className="grid gap-3 rounded-md border border-line bg-panelSoft p-3 text-sm xl:grid-cols-[130px_1fr_120px_140px_140px_minmax(160px,1fr)_auto] xl:items-center">
                      <span className={clsx("status-pill w-fit", statusTone[request.status])}>{request.status}</span>
                      <span className="font-semibold text-white">{request.requestType}</span>
                      <span className="text-slate-300">{formatCurrency(requestAmountForDisplay(request))}</span>
                      <span className="text-slate-500">{formatShortDate(new Date(request.createdAt))}</span>
                      <span className="text-slate-500">{request.status === "Tamamlandı" || request.status === "Kapatıldı" ? formatShortDate(new Date(request.updatedAt)) : "-"}</span>
                      <span className="truncate text-slate-400">{request.note || "-"}</span>
                      <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => openRequestDetail(request)}>Detay</button>
                    </div>
                  ))}
                  {memberDetailRequests.length === 0 && <p className="rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-500">Bu üyeye ait kayıt bulunmuyor.</p>}
                </div>
              </section>
            )}

            {memberDetailTab === "Görevler" && (
              <section className="mt-5 rounded-lg border border-line bg-ink/40 p-4">
                <h3 className="font-semibold text-white">Üyeye Ait Görevler</h3>
                <div className="mt-3 space-y-2">
                  {memberDetailTasks.map((task) => (
                    <div key={task.id} className="grid gap-3 rounded-md border border-line bg-panelSoft p-3 text-sm xl:grid-cols-[minmax(180px,1fr)_120px_130px_130px_130px_minmax(160px,1fr)_120px] xl:items-center">
                      <span className="font-semibold text-white">{task.title}</span>
                      <span className={clsx("status-pill w-fit", task.status === "Tamamlandı" ? statusTone.Tamamlandı : statusTone.Beklemede)}>{task.status}</span>
                      <span className="text-slate-500">{formatShortDate(new Date(task.createdAt))}</span>
                      <span className="text-slate-500">{task.status === "Tamamlandı" ? formatShortDate(new Date(task.updatedAt)) : "-"}</span>
                      <SourceBadge source={task.source} />
                      <span className="truncate text-slate-400">{task.notes[0]?.noteText || task.note || "-"}</span>
                      <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => openTaskDetail(memberDetail.id, dateKey(task.taskDate))}>Detay</button>
                    </div>
                  ))}
                  {memberDetailTasks.length === 0 && <p className="rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-500">Bu üyeye ait kayıt bulunmuyor.</p>}
                </div>
              </section>
            )}

            {memberDetailTab === "Mesajlar" && (
              <section className="mt-5 rounded-lg border border-line bg-ink/40 p-4">
                <h3 className="font-semibold text-white">Mesaj Geçmişi</h3>
                <div className="mt-3 max-h-[52vh] space-y-2 overflow-y-auto pr-1">
                  {memberDetailMessages.map((message) => (
                    <div key={message.id} className={clsx("rounded-md border p-3 text-sm", message.senderType === "operator" ? "border-mint/25 bg-emerald-500/10" : "border-line bg-panelSoft")}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-white">{message.senderType === "operator" ? "Mesaj gönderildi" : message.senderType === "customer" ? "Mesaj alındı" : "Sistem"}</span>
                        <span className="text-xs text-slate-500">{formatDate(message.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-slate-300">{isVoiceMessage(message.messageText) ? "Sesli mesaj gönderildi" : message.messageText}</p>
                    </div>
                  ))}
                  {memberDetailMessages.length === 0 && <p className="rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-500">Bu üyeye ait mesaj yok.</p>}
                </div>
              </section>
            )}

            {memberDetailTab === "Zaman Çizelgesi" && (
              <section className="mt-5 rounded-lg border border-line bg-ink/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">Üye Zaman Çizelgesi</h3>
                  <div className="flex flex-wrap gap-2">
                    {(["Tümü", "Mesajlar", "Sesli Yanıtlar", "Görevler", "Talepler", "Notlar", "Üye İşlemleri"] as const).map((filter) => (
                      <button
                        key={filter}
                        className={clsx("h-8 rounded-md border px-2 text-xs transition", timelineFilter === filter ? "border-mint/40 bg-mint/10 text-mint" : "border-line bg-panelSoft text-slate-400 hover:text-white")}
                        onClick={() => setTimelineFilter(filter)}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
                <TimelineList events={memberDetailTimeline} />
              </section>
            )}
          </section>
        </div>
      )}
      {activeAlarm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4">
          <section className="w-full max-w-md rounded-lg border border-mint/30 bg-panel p-6 text-center shadow-glow">
            <CalendarClock className="mx-auto text-mint" size={34} />
            <h2 className="mt-4 text-xl font-bold text-white">Alarm Zamanı</h2>
            <p className="mt-3 rounded-md border border-line bg-panelSoft p-4 text-sm leading-6 text-slate-200">{activeAlarm.note}</p>
            <p className="mt-3 text-xs text-slate-500">{formatDate(activeAlarm.scheduledAt)}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button className="btn btn-primary" onClick={() => {
                void updateAlarm(activeAlarm.id, "complete");
                setTaskCenterOpen(true);
                setActive("Dashboard");
              }}>
                Göreve Git
              </button>
              <button className="btn btn-secondary" onClick={() => void updateAlarm(activeAlarm.id, "snooze")}>Ertele 10 dk</button>
              <button className="btn btn-secondary" onClick={() => void updateAlarm(activeAlarm.id, "close")}>Kapat</button>
            </div>
          </section>
        </div>
      )}
      {sessionSlotModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
          <section className="w-full max-w-md rounded-lg border border-line bg-panel p-5 shadow-glow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Oturum {sessionSlotModal}</h2>
                <p className="mt-1 text-sm text-slate-400">Bu slota bir iletişim hattı bağla.</p>
              </div>
              <button className="btn btn-secondary h-9" onClick={() => setSessionSlotModal(null)}>Kapat</button>
            </div>
            <div className="mt-5">
              <Select
                label="Hat seç"
                value={sessionLineSelect}
                options={availableSessionLines.map((line) => line.id)}
                optionLabels={Object.fromEntries(availableSessionLines.map((line) => [line.id, `${line.name} · ${line.phoneNumber}`]))}
                onChange={setSessionLineSelect}
              />
              {availableSessionLines.length === 0 && (
                <p className="mt-3 rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-400">
                  Boşta iletişim hattı yok. Bir oturumu kapatırsanız bağlı hat tekrar havuza döner.
                </p>
              )}
              <button className="btn btn-primary mt-4 w-full" onClick={() => void assignLineSessionSlot()} disabled={!sessionLineSelect}>
                Oturumu Aç
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function TaskList({
  data,
  groups,
  onOpenDetail,
  onGuideTask
}: {
  data: AppData;
  groups: TaskGroup[];
  onOpenDetail: (contactId: string) => void;
  onGuideTask: (task: AppData["tasks"][number]) => void;
}) {
  return (
    <div className="w-full min-w-0 rounded-lg border border-line bg-panel p-3">
      <div className="space-y-2">
        {groups.map((group) => {
          const contact = contactById(data, group.contactId);
          const pendingTask = group.tasks.find((task) => task.status === "Bekliyor") ?? group.tasks[0];
          return (
            <div key={group.contactId} className="grid gap-3 rounded-md border border-line bg-ink/35 p-3 text-sm xl:grid-cols-[minmax(180px,1fr)_minmax(220px,1.4fr)_170px_110px_130px_170px] xl:items-center">
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{contact?.name ?? "-"}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{contact?.phone ?? "-"}</p>
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-100">{group.latestTaskTitle || "-"}</p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">{pendingTask?.automationReason || pendingTask?.note || "Açık görev"}</p>
              </div>
              <div className="flex flex-wrap gap-1">{group.sources.map((source) => <SourceBadge key={source} source={source} />)}</div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2 text-xs font-bold text-amber-200">{group.pending}</span>
                <span className="text-xs text-slate-500">bekleyen</span>
              </div>
              <div className="text-xs text-slate-400">{group.latestTaskAt ? formatShortDate(new Date(group.latestTaskAt)) : "-"}</div>
              <div className="flex flex-wrap justify-end gap-2">
                <button className="btn btn-secondary h-8 whitespace-nowrap px-3 text-xs" onClick={() => onOpenDetail(group.contactId)}>Detay</button>
                <button className="btn btn-primary h-8 whitespace-nowrap px-3 text-xs" onClick={() => pendingTask && onGuideTask(pendingTask)} disabled={!pendingTask || pendingTask.status !== "Bekliyor"}>Yönlendir</button>
              </div>
            </div>
          );
        })}
      </div>
      {groups.length === 0 && <p className="p-6 text-sm text-slate-400">Bugün için görev yok.</p>}
    </div>
  );
}

function PastTaskList({ data, dateGroups, onOpenDetail, onGuideTask }: { data: AppData; dateGroups: TaskDateGroup[]; onOpenDetail: (contactId: string, taskDateKey: string) => void; onGuideTask: (task: AppData["tasks"][number]) => void }) {
  return (
    <div className="space-y-4">
      {dateGroups.map((dateGroup) => (
        <section key={dateGroup.dateKey} className="overflow-hidden rounded-lg border border-line bg-panel">
          <div className="border-b border-line bg-panelSoft px-4 py-3">
            <h3 className="font-semibold text-white">{formatShortDate(new Date(`${dateGroup.dateKey}T00:00:00`))}</h3>
          </div>
          <TaskList data={data} groups={dateGroup.groups} onOpenDetail={(contactId) => onOpenDetail(contactId, dateGroup.dateKey)} onGuideTask={onGuideTask} />
        </section>
      ))}
      {dateGroups.length === 0 && <p className="rounded-lg border border-line bg-panel p-6 text-sm text-slate-400">Geçmiş görev yok.</p>}
    </div>
  );
}

function PastTaskArchive({
  data,
  tasks,
  overdueTasks,
  filter,
  startDate,
  endDate,
  onFilterChange,
  onStartDateChange,
  onEndDateChange,
  onOpenDetail
}: {
  data: AppData;
  tasks: AppData["tasks"];
  overdueTasks: AppData["tasks"];
  filter: TaskArchiveFilter;
  startDate: string;
  endDate: string;
  onFilterChange: (value: TaskArchiveFilter) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onOpenDetail: (contactId: string, taskDateKey: string) => void;
}) {
  const sortedTasks = [...tasks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return (
    <section className="min-w-0 rounded-lg border border-line bg-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">Geçmiş Görevler Arşivi</h3>
          <p className="mt-1 text-sm text-slate-400">Tamamlanan veya planlanan görevleri gün bazlı kontrol edin.</p>
        </div>
        <span className="text-xs text-slate-500">{sortedTasks.length} kayıt</span>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        {(["Bugün", "Dün", "Son 7 Gün", "Son 30 Gün", "Tarih Aralığı Seç"] as const).map((item) => (
          <button
            key={item}
            className={clsx("h-9 rounded-md border px-3 text-sm transition", filter === item ? "border-mint/40 bg-mint/10 text-mint" : "border-line bg-panelSoft text-slate-400 hover:text-white")}
            onClick={() => onFilterChange(item)}
          >
            {item}
          </button>
        ))}
        {filter === "Tarih Aralığı Seç" && (
          <>
            <label className="text-xs text-slate-500">
              Başlangıç
              <input className="field mt-1 h-9 w-auto px-2 text-xs" type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} />
            </label>
            <label className="text-xs text-slate-500">
              Bitiş
              <input className="field mt-1 h-9 w-auto px-2 text-xs" type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} />
            </label>
          </>
        )}
      </div>
      {overdueTasks.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold text-amber-100">Geçmiş Bekleyen Görevler</h4>
            <span className="rounded-full border border-amber-400/40 px-2 py-0.5 text-xs text-amber-100">{overdueTasks.length}</span>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {overdueTasks.slice(0, 6).map((task) => {
              const contact = contactById(data, task.contactId);
              return (
                <button key={task.id} className="rounded-md border border-amber-400/20 bg-panel/60 p-3 text-left text-sm transition hover:border-amber-400/50" onClick={() => onOpenDetail(task.contactId, dateKey(task.taskDate))}>
                  <p className="truncate font-semibold text-white">{task.title}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{contact ? memberDisplayName(contact) : "Üye"} · {formatShortDate(new Date(task.taskDate))}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="mt-4 max-h-[54vh] overflow-auto rounded-lg border border-line">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-panelSoft text-xs uppercase text-slate-400">
            <tr>
              <th className="p-3">Görev Adı</th>
              <th>İlgili Üye</th>
              <th>Telefon</th>
              <th>Görev Durumu</th>
              <th>Oluşturulma Tarihi</th>
              <th>Planlanan Tarih</th>
              <th>Tamamlanma Tarihi</th>
              <th>Atanan Operatör</th>
              <th>Not</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => {
              const contact = contactById(data, task.contactId);
              const operator = task.createdBy ? data.operators.find((item) => item.id === task.createdBy) : undefined;
              return (
                <tr key={task.id} className="border-t border-line align-middle">
                  <td className="p-3">
                    <button className="max-w-[180px] truncate text-left font-semibold text-white hover:text-mint" onClick={() => onOpenDetail(task.contactId, dateKey(task.taskDate))}>
                      {task.title}
                    </button>
                  </td>
                  <td className="max-w-[150px] truncate text-slate-300">{contact ? memberDisplayName(contact) : "-"}</td>
                  <td className="text-slate-400">{contact?.phone ?? "-"}</td>
                  <td><span className={clsx("status-pill", task.status === "Tamamlandı" ? statusTone.Tamamlandı : statusTone.Beklemede)}>{task.status}</span></td>
                  <td className="text-slate-400">{formatDate(task.createdAt)}</td>
                  <td className="text-slate-400">{formatShortDate(new Date(task.taskDate))}</td>
                  <td className="text-slate-400">{task.status === "Tamamlandı" ? formatDate(task.updatedAt) : "-"}</td>
                  <td className="text-slate-300">{operator?.name ?? "-"}</td>
                  <td className="max-w-[220px] truncate text-slate-500">{task.notes[0]?.noteText || task.note || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sortedTasks.length === 0 && <p className="p-6 text-sm text-slate-400">Bu üyeye ait kayıt bulunmuyor.</p>}
      </div>
    </section>
  );
}

function CustomerInfoPanel({
  data,
  contact,
  conversations,
  messages,
  requests,
  tasks,
  notes,
  noteDraft,
  onNoteDraftChange,
  onSaveNote,
  onOpenTimeline
}: {
  data: AppData;
  contact?: Contact;
  conversations: AppData["conversations"];
  messages: AppData["messages"];
  requests: AppData["requests"];
  tasks: AppData["tasks"];
  notes: AppData["customerNotes"];
  noteDraft: string;
  onNoteDraftChange: (value: string) => void;
  onSaveNote: () => void;
  onOpenTimeline: (contactId: string) => void;
}) {
  const lastConversation = [...conversations].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())[0];
  const openTasks = tasks.filter((task) => task.status === "Bekliyor").length;
  const completedTasks = tasks.filter((task) => task.status === "Tamamlandı").length;
  const lastNote = notes[0];
  const recentActivities = contact ? buildRecentContactActivities(data, contact, messages, requests, tasks, notes).slice(0, 5) : [];

  return (
    <aside className="hidden min-h-0 overflow-y-auto border-l border-line bg-ink/30 p-4 lg:block">
      {!contact && <p className="text-sm text-slate-400">Müşteri bilgisi için bir kişi seçin.</p>}
      {contact && (
        <div className="space-y-4">
          <section className="rounded-lg border border-line bg-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{contactDisplayName(contact)}</h3>
                <p className="mt-1 text-sm text-slate-400">{contact.phone}</p>
              </div>
              <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => onOpenTimeline(contact.id)}>Zaman Çizelgesi</button>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <Info label="Cinsiyet" value={contact.gender} />
              <Info label="Üye durumu" value={contact.memberStatus} />
              <Info label="Kayıt kaynağı" value={contact.source} />
              <Info label="Kullanıcı ID" value={contact.username ?? "-"} />
              <Info label="Kayıt tarihi" value={formatShortDate(new Date(contact.createdAt))} />
              <Info label="Son görüşme" value={lastConversation ? formatDate(lastConversation.lastMessageAt) : "-"} />
              <Info label="Toplam mesaj" value={String(messages.length)} />
              <Info label="Toplam talep" value={String(requests.length)} />
              <Info label="Açık görev" value={String(openTasks)} />
              <Info label="Tamamlanan görev" value={String(completedTasks)} />
              <Info label="Son not" value={lastNote?.noteText ?? "-"} />
            </div>
          </section>
          <section className="rounded-lg border border-line bg-panel p-4">
            <h3 className="font-semibold text-white">Müşteri Notları</h3>
            <textarea
              className="field mt-3 min-h-24"
              placeholder="Genel not ekle"
              value={noteDraft}
              onChange={(event) => onNoteDraftChange(event.target.value)}
            />
            <button className="btn btn-primary mt-3 h-9 w-full" onClick={onSaveNote} disabled={!noteDraft.trim()}>
              <Save size={16} /> Not Ekle
            </button>
            <div className="mt-4 space-y-2">
              {notes.slice(0, 5).map((note) => (
                <div key={note.id} className="rounded-md border border-line bg-panelSoft p-3">
                  <p className="text-xs text-slate-500">{formatShortDate(new Date(note.createdAt))} {timeDisplay(new Date(note.createdAt))}{note.createdByName ? ` · ${note.createdByName}` : ""}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{note.noteText}</p>
                </div>
              ))}
              {notes.length === 0 && <p className="rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-500">Henüz müşteri notu yok.</p>}
            </div>
          </section>
          <section className="rounded-lg border border-line bg-panel p-4">
            <h3 className="font-semibold text-white">Son İşlemler</h3>
            <div className="mt-3 space-y-2">
              {recentActivities.map((activity) => (
                <div key={activity.key} className="rounded-md border border-line bg-panelSoft p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{activity.title}</p>
                    <span className="shrink-0 text-xs text-slate-500">{formatShortDate(new Date(activity.createdAt))}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{activity.description}</p>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <p className="rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-500">Henüz işlem geçmişi yok.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}

function OwnershipConflictPanel({
  conflict,
  operators,
  note,
  onNoteChange,
  onAskAdmin
}: {
  conflict: { contactId: string; phone: string; currentOwnerOperatorId?: string; message: string } | null;
  operators: AppData["operators"];
  note: string;
  onNoteChange: (value: string) => void;
  onAskAdmin: () => void;
}) {
  if (!conflict) return null;
  const owner = conflict.currentOwnerOperatorId ? operators.find((operator) => operator.id === conflict.currentOwnerOperatorId) : undefined;
  return (
    <section className="mt-5 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4">
      <h4 className="font-semibold text-amber-100">Müşteri sahipliği çakışması</h4>
      <p className="mt-2 text-sm leading-6 text-amber-50">{conflict.message}</p>
      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        <Info label="Müşteri numarası" value={conflict.phone} />
        <Info label="Mevcut sorumlu" value={owner?.name ?? "-"} />
      </div>
      <label className="mt-3 block">
        <span className="label">Operatör açıklaması</span>
        <textarea
          className="field min-h-20"
          placeholder="Bu müşteri bana dönüş yaptı."
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
        />
      </label>
      <button className="btn btn-primary mt-3" onClick={onAskAdmin}>
        Admine Sor
      </button>
    </section>
  );
}

function SystemGuidePage({
  query,
  onQueryChange,
  canEdit
}: {
  query: string;
  onQueryChange: (value: string) => void;
  canEdit: boolean;
}) {
  const normalizedQuery = normalizeGuideText(query);
  const filteredSections = systemGuideSections.filter((section) => {
    if (!normalizedQuery) return true;
    const searchable = normalizeGuideText([
      section.title,
      section.category,
      section.summary,
      section.users,
      section.permission,
      section.operationLogic,
      section.sprint,
      ...section.connections,
      ...section.dataStore,
      ...section.cautions,
      ...section.keywords
    ].join(" "));
    return searchable.includes(normalizedQuery);
  });
  const groupedSections = filteredSections.reduce<Record<string, typeof systemGuideSections>>((groups, section) => {
    groups[section.category] = [...(groups[section.category] ?? []), section];
    return groups;
  }, {});

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-line bg-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-mint">Yaşayan Dokümantasyon</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Sistem Kılavuzu</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Panel geliştikçe modüller, yetkiler, iş akışları, API yapıları ve veri mimarisi burada güncel tutulur. Yeni özellik dokümante edilmeden sprint tamamlanmış kabul edilmez.</p>
          </div>
          <span className={clsx("status-pill", canEdit ? statusTone.Aktif : statusTone.Pasif)}>
            {canEdit ? "Developer/Admin düzenleyebilir" : "Salt okunur"}
          </span>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <label>
            <span className="label">Kılavuzda ara</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                className="field pl-9"
                placeholder="hat, hazır cevap, transfer, API, ownership..."
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
              />
            </div>
          </label>
          <div className="rounded-md border border-mint/20 bg-mint/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-white">Son Güncelleme</p>
              <span className="text-xs text-mint">{systemGuideLastUpdate.date}</span>
            </div>
            <p className="mt-1 text-sm text-slate-300">{systemGuideLastUpdate.sprint}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {systemGuideLastUpdate.additions.map((addition) => (
                <span key={addition} className="rounded-full border border-mint/20 bg-panel px-2 py-1 text-xs text-emerald-100">✓ {addition}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-line bg-panel p-5">
        <h3 className="font-semibold text-white">Sistem Mantığı</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {systemPrinciples.map((principle) => (
            <div key={principle} className="rounded-md border border-line bg-ink/40 p-3 text-sm leading-6 text-slate-300">{principle}</div>
          ))}
        </div>
      </section>

      <div className="space-y-4">
        {Object.entries(groupedSections).map(([category, sections]) => (
          <section key={category} className="rounded-lg border border-line bg-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-white">{category}</h3>
              <span className="text-xs text-slate-500">{sections.length} başlık</span>
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {sections.map((section) => (
                <article key={section.id} className="rounded-lg border border-line bg-ink/35 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-white">{section.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{section.summary}</p>
                    </div>
                    <span className="status-pill border-sky-400/30 bg-sky-400/10 text-sky-200">{section.sprint}</span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                    <Info label="Kim kullanabilir?" value={section.users} />
                    <Info label="Yetki ihtiyacı" value={section.permission} />
                    <Info label="Veri nerede tutulur?" value={section.dataStore.join(", ")} />
                    <Info label="Son güncelleme" value={section.lastUpdated} />
                  </div>
                  <div className="mt-4 rounded-md border border-line bg-panelSoft p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">Operasyon mantığı</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{section.operationLogic}</p>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Bağlantılı modüller</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {section.connections.map((connection) => (
                          <span key={connection} className="rounded-full border border-line bg-panel px-2 py-1 text-xs text-slate-300">{connection}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Dikkat noktaları</p>
                      <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-400">
                        {section.cautions.map((caution) => (
                          <li key={caution}>• {caution}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        {filteredSections.length === 0 && (
          <p className="rounded-lg border border-line bg-panel p-8 text-center text-sm text-slate-400">Aramanızla eşleşen kılavuz başlığı bulunamadı.</p>
        )}
      </div>
    </section>
  );
}

function OwnershipRequestCenter({
  data,
  onDecide
}: {
  data: AppData;
  onDecide: (requestId: string, action: "approve" | "reject" | "pool" | "block") => void;
}) {
  const pendingRequests = data.ownershipRequests.filter((request) => request.status === "pending");
  return (
    <section className="rounded-lg border border-line bg-panel p-5 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">Müşteri İletişim İzin Talepleri</h3>
          <p className="mt-1 text-sm text-slate-400">Farklı operatör sahipliğindeki müşteri numaraları için admin karar alanı.</p>
        </div>
        <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-1 text-xs text-amber-100">Bekleyen: {pendingRequests.length}</span>
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {pendingRequests.map((request) => {
          const contact = contactById(data, request.contactId);
          const currentOwner = request.currentOwnerOperatorId ? data.operators.find((operator) => operator.id === request.currentOwnerOperatorId) : undefined;
          const requester = request.requestedByOperatorId ? data.operators.find((operator) => operator.id === request.requestedByOperatorId) : undefined;
          const lastConversation = contact ? getMemberLastConversation(data, contact.id) : new Date(0);
          const hasOpenTask = contact ? data.tasks.some((task) => task.contactId === contact.id && task.status === "Bekliyor") : false;
          const hasOpenRequest = contact ? data.requests.some((item) => item.contactId === contact.id && item.status !== "Tamamlandı" && item.status !== "Kapatıldı") : false;
          return (
            <article key={request.id} className="rounded-lg border border-line bg-ink/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{contact ? memberDisplayName(contact) : "Müşteri"}</p>
                  <p className="mt-1 text-sm text-slate-400">{request.customerPhone}</p>
                </div>
                <span className="status-pill border-amber-400/30 bg-amber-400/10 text-amber-200">Bekliyor</span>
              </div>
              <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                <Info label="Mevcut operatör" value={currentOwner?.name ?? "-"} />
                <Info label="İzin isteyen" value={requester?.name ?? "-"} />
                <Info label="Son iletişim" value={lastConversation.getTime() > 0 ? formatDate(lastConversation.toISOString()) : "-"} />
                <Info label="Müşteri durumu" value={contact?.memberStatus ?? "-"} />
                <Info label="Açık görev" value={hasOpenTask ? "Var" : "Yok"} />
                <Info label="Bekleyen talep" value={hasOpenRequest ? "Var" : "Yok"} />
              </div>
              {request.note && <p className="mt-3 rounded-md border border-line bg-panelSoft p-3 text-sm leading-6 text-slate-300">{request.note}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn btn-primary h-8 px-3 text-xs" onClick={() => onDecide(request.id, "approve")}>Onayla / Devret</button>
                <button className="btn btn-secondary h-8 px-3 text-xs" onClick={() => onDecide(request.id, "reject")}>Reddet</button>
                <button className="btn btn-secondary h-8 px-3 text-xs" onClick={() => onDecide(request.id, "pool")}>Havuza Al</button>
                <button className="btn btn-secondary h-8 px-3 text-xs text-rose-200 hover:border-rose-500/60" onClick={() => onDecide(request.id, "block")}>Bloke Et</button>
              </div>
            </article>
          );
        })}
        {pendingRequests.length === 0 && (
          <p className="rounded-md border border-line bg-panelSoft p-4 text-sm text-slate-400">Bekleyen iletişim izin talebi yok.</p>
        )}
      </div>
    </section>
  );
}

function MemberTransferCenter({
  data,
  form,
  onChange,
  onTransfer
}: {
  data: AppData;
  form: { contactId: string; operatorId: string; reason: string; note: string; sendInfo: boolean; message: string };
  onChange: (form: { contactId: string; operatorId: string; reason: string; note: string; sendInfo: boolean; message: string }) => void;
  onTransfer: () => void;
}) {
  const members = [...data.contacts].sort((a, b) => memberDisplayName(a).localeCompare(memberDisplayName(b), "tr"));
  const operators = data.operators.filter((operator) => operator.status === "Aktif");
  const selectedMember = form.contactId ? contactById(data, form.contactId) : undefined;
  const currentOwner = selectedMember?.ownerOperatorId ? data.operators.find((operator) => operator.id === selectedMember.ownerOperatorId) : undefined;

  return (
    <section className="rounded-lg border border-line bg-panel p-5 md:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">Üye Transfer Merkezi</h3>
          <p className="mt-1 text-sm text-slate-400">Admin / COO üye sorumluluğunu operatörler arasında veri kaybı olmadan devredebilir.</p>
        </div>
        {selectedMember && <span className="status-pill border-mint/30 bg-mint/10 text-emerald-200">Mevcut: {currentOwner?.name ?? "Havuz"}</span>}
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Select
          label="Üye"
          value={form.contactId}
          options={["", ...members.map((contact) => contact.id)]}
          optionLabels={{ "": "Üye seç", ...Object.fromEntries(members.map((contact) => [contact.id, `${memberDisplayName(contact)} · ${contact.phone}`])) }}
          onChange={(value) => onChange({ ...form, contactId: value })}
        />
        <Select
          label="Yeni operatör"
          value={form.operatorId}
          options={["", ...operators.map((operator) => operator.id)]}
          optionLabels={{ "": "Operatör seç", ...Object.fromEntries(operators.map((operator) => [operator.id, operator.name])) }}
          onChange={(value) => onChange({ ...form, operatorId: value })}
        />
        <Select
          label="Transfer sebebi"
          value={form.reason}
          options={["Hat değişimi", "Operatör değişimi", "Yoğunluk dengeleme", "Risk / VIP takip", "Diğer"]}
          onChange={(value) => onChange({ ...form, reason: value })}
        />
        <Input label="Transfer notu" value={form.note} onChange={(value) => onChange({ ...form, note: value })} />
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={form.sendInfo} onChange={(event) => onChange({ ...form, sendInfo: event.target.checked })} />
        Üyeye bilgilendirme mesajı taslağı hazırla
      </label>
      {form.sendInfo && (
        <label className="mt-3 block">
          <span className="label">Bilgilendirme taslağı</span>
          <textarea className="field min-h-20" value={form.message} onChange={(event) => onChange({ ...form, message: event.target.value })} />
        </label>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button className="btn btn-primary" onClick={onTransfer} disabled={!form.contactId || !form.operatorId}>
          Üyeyi Devret
        </button>
        <p className="text-sm text-slate-500">Transfer; üye, mesaj, talep, görev ve timeline kayıtlarını silmez.</p>
      </div>
    </section>
  );
}

function OwnershipInfoSection({ data, contact }: { data: AppData; contact: Contact }) {
  const owner = contact.ownerOperatorId ? data.operators.find((operator) => operator.id === contact.ownerOperatorId) : undefined;
  const assignedBy = contact.assignedByAdminId ? data.operators.find((operator) => operator.id === contact.assignedByAdminId) : undefined;
  const requests = data.ownershipRequests.filter((request) => request.contactId === contact.id);
  const pastOperators = Array.from(new Set(requests.flatMap((request) => [request.currentOwnerOperatorId, request.requestedByOperatorId]).filter(Boolean) as string[]))
    .map((id) => data.operators.find((operator) => operator.id === id)?.name)
    .filter(Boolean);
  const hasOwnership = Boolean(contact.ownerOperatorId || contact.ownershipStatus !== "pool" || requests.length > 0);

  return (
    <section className="mt-5 rounded-lg border border-line bg-ink/40 p-4">
      <h3 className="font-semibold text-white">Müşteri Sahipliği</h3>
      {!hasOwnership && <p className="mt-3 rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-500">Bu müşteri için sahiplik kaydı bulunmuyor.</p>}
      {hasOwnership && (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Info label="Aktif sorumlu operatör" value={owner?.name ?? "-"} />
            <Info label="Sahiplik durumu" value={ownershipStatusLabel(contact.ownershipStatus)} />
            <Info label="Atanma tarihi" value={contact.assignedAt ? formatDate(contact.assignedAt) : "-"} />
            <Info label="Son iletişim tarihi" value={contact.lastContactAt ? formatDate(contact.lastContactAt) : "-"} />
            <Info label="Son devreden admin" value={assignedBy?.name ?? "-"} />
            <Info label="Geçmiş operatörler" value={pastOperators.length ? pastOperators.join(", ") : "-"} />
          </div>
          <div className="mt-4 rounded-md border border-line bg-panelSoft p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">İzin talepleri geçmişi</p>
            <div className="mt-3 space-y-2">
              {requests.slice(0, 5).map((request) => {
                const requester = request.requestedByOperatorId ? data.operators.find((operator) => operator.id === request.requestedByOperatorId) : undefined;
                return (
                  <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-ink/40 p-2 text-sm">
                    <span className="text-slate-200">{requester?.name ?? "-"} · {ownershipRequestStatusLabel(request.status)}</span>
                    <span className="text-xs text-slate-500">{formatDate(request.createdAt)}</span>
                  </div>
                );
              })}
              {requests.length === 0 && <p className="text-sm text-slate-500">İzin talebi geçmişi yok.</p>}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function buildRecentContactActivities(
  data: AppData,
  contact: Contact,
  messages: AppData["messages"],
  requests: AppData["requests"],
  tasks: AppData["tasks"],
  notes: AppData["customerNotes"]
) {
  const activities: { key: string; title: string; description: string; createdAt: string }[] = [];
  const latestMessage = [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const latestTask = [...tasks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  const latestRequest = [...requests].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  const latestNote = [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const latestStatusEvent = data.timelineEvents
    .filter((event) => event.memberId === contact.id && /STATUS|UPDATED|ARCHIVED|RESTORED|TAG_/i.test(event.eventType))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (latestMessage) activities.push({
    key: `message-${latestMessage.id}`,
    title: latestMessage.senderType === "operator" ? "Son mesaj gönderildi" : latestMessage.senderType === "customer" ? "Son mesaj alındı" : "Sistem mesajı",
    description: isVoiceMessage(latestMessage.messageText) ? "Sesli mesaj gönderildi" : latestMessage.messageText,
    createdAt: latestMessage.createdAt
  });
  if (latestTask) activities.push({
    key: `task-${latestTask.id}`,
    title: "Son görev",
    description: `${latestTask.title} · ${latestTask.status}`,
    createdAt: latestTask.updatedAt
  });
  if (latestRequest) activities.push({
    key: `request-${latestRequest.id}`,
    title: "Son talep",
    description: `${latestRequest.requestType} · ${latestRequest.status}`,
    createdAt: latestRequest.updatedAt
  });
  if (latestStatusEvent) activities.push({
    key: `event-${latestStatusEvent.id}`,
    title: "Son durum değişikliği",
    description: latestStatusEvent.eventDescription || latestStatusEvent.eventTitle,
    createdAt: latestStatusEvent.createdAt
  });
  if (latestNote) activities.push({
    key: `note-${latestNote.id}`,
    title: "Son not",
    description: latestNote.noteText,
    createdAt: latestNote.createdAt
  });

  return activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function MiniMetric({ label, value, tone }: { label: string; value: number; tone?: "warning" }) {
  return (
    <div className={clsx("rounded-md border bg-panelSoft p-3", tone === "warning" ? "border-amber-400/30" : "border-line")}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={clsx("mt-2 text-2xl font-bold", tone === "warning" ? "text-amber-200" : "text-white")}>{value}</p>
    </div>
  );
}

function TtsRankList({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  return (
    <div className="rounded-md border border-line bg-panelSoft p-3">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-slate-300">{row.label}</span>
            <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-mint">{row.value}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-500">Kayıt yok.</p>}
      </div>
    </div>
  );
}

function TtsOperatorTable({ rows, showCost }: { rows: ReturnType<typeof buildTtsUsageSummary>["operatorRows"]; showCost: boolean }) {
  return (
    <div className="overflow-auto rounded-lg border border-line bg-panel">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-panelSoft text-xs uppercase text-slate-400">
          <tr>
            <th className="p-3">Operatör</th><th>Bugün oluşturulan</th><th>Bu ay oluşturulan</th><th>Gönderilen</th><th>Ortalama süre</th>{showCost && <th>Tahmini maliyet</th>}<th>Günlük limit</th><th>Limit durumu</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.operatorId} className="border-t border-line">
              <td className="p-3 font-semibold text-white">{row.name}</td>
              <td>{row.todayCreated}</td>
              <td>{row.monthCreated}</td>
              <td>{row.sentCount}</td>
              <td>{row.averageDuration.toFixed(1)} sn</td>
              {showCost && <td>${row.estimatedCost.toFixed(4)}</td>}
              <td>{row.dailyLimit}</td>
              <td><span className={clsx("status-pill", row.limitUsed >= row.dailyLimit ? statusTone.Beklemede : statusTone.Aktif)}>{row.limitUsed}/{row.dailyLimit}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="p-6 text-sm text-slate-400">TTS operatör kaydı yok.</p>}
    </div>
  );
}

function TtsMemberTable({ rows }: { rows: ReturnType<typeof buildTtsUsageSummary>["memberRows"] }) {
  return (
    <div className="overflow-auto rounded-lg border border-line bg-panel">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-panelSoft text-xs uppercase text-slate-400">
          <tr>
            <th className="p-3">Üye adı</th><th>Telefon</th><th>Toplam sesli mesaj</th><th>Son sesli mesaj</th><th>Son metin</th><th>İlgili operatör</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.memberId} className="border-t border-line">
              <td className="p-3 font-semibold text-white">{row.name}</td>
              <td>{row.phone}</td>
              <td>{row.totalVoiceMessages}</td>
              <td className="text-slate-400">{row.lastSentAt ? formatDate(row.lastSentAt) : "-"}</td>
              <td className="max-w-xs truncate text-slate-300">{row.lastText || "-"}</td>
              <td>{row.operatorName}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="p-6 text-sm text-slate-400">TTS üye kaydı yok.</p>}
    </div>
  );
}

function VoiceBubble({ messageText }: { messageText: string }) {
  const voice = parseVoiceMessage(messageText);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-semibold text-white">
        <Volume2 size={16} /> Sesli mesaj gönderildi
      </div>
      {voice.operatorName && <p className="text-xs text-slate-400">Operatör: {voice.operatorName}</p>}
      {voice.audioUrl && <audio className="w-full max-w-xs" src={voice.audioUrl} controls />}
      {voice.text && <p className="text-xs leading-5 text-slate-300">{voice.text}</p>}
    </div>
  );
}

type TimelineItem = {
  id: string;
  category: TimelineFilter;
  eventType: string;
  title: string;
  description: string;
  operatorName?: string;
  createdAt: string;
  icon: string;
  referenceKey: string;
};

function TimelineList({ events }: { events: TimelineItem[] }) {
  return (
    <div className="relative mt-5 space-y-3 pl-5 before:absolute before:bottom-0 before:left-2 before:top-0 before:w-px before:bg-line">
      {events.map((event) => (
        <article key={event.id} className="relative rounded-md border border-line bg-panelSoft p-3">
          <span className="absolute -left-[26px] top-3 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-panel text-sm">{event.icon}</span>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-white">{event.title}</h4>
              <p className="mt-1 text-xs text-slate-500">{formatShortDate(new Date(event.createdAt))} - {timeDisplay(new Date(event.createdAt))}{event.operatorName ? ` · Operatör: ${event.operatorName}` : ""}</p>
            </div>
            <span className="rounded-full border border-line bg-ink/50 px-2 py-0.5 text-xs text-slate-400">{event.category}</span>
          </div>
          {event.description && <p className="mt-3 text-sm leading-6 text-slate-300">{event.description}</p>}
        </article>
      ))}
      {events.length === 0 && <p className="rounded-md border border-line bg-panelSoft p-4 text-sm text-slate-400">Bu filtrede zaman çizelgesi kaydı yok.</p>}
    </div>
  );
}

function AutomationLogTable({ logs, contacts }: { logs: AppData["automationLogs"]; contacts: AppData["contacts"] }) {
  return (
    <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-line bg-panel">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-panelSoft text-xs uppercase text-slate-400">
          <tr><th className="p-2">Saat</th><th>Üye</th><th>Kural</th><th>Görev</th><th>Durum</th><th>Açıklama</th></tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const contact = log.memberId ? contacts.find((item) => item.id === log.memberId) : undefined;
            return (
              <tr key={log.id} className="border-t border-line">
                <td className="p-2 text-xs text-slate-400">{timeDisplay(new Date(log.createdAt))}</td>
                <td className="max-w-[150px] truncate font-semibold text-white">{contact ? memberDisplayName(contact) : "-"}</td>
                <td className="max-w-[140px] truncate text-slate-300">{automationRuleLabel(log.ruleKey)}</td>
                <td className="max-w-[170px] truncate text-slate-300">{log.taskTitle}</td>
                <td><span className={clsx("status-pill", automationLogTone(log.status))}>{automationLogLabel(log.status)}</span></td>
                <td className="max-w-xs truncate text-slate-500">{log.explanation ?? "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {logs.length === 0 && <p className="p-6 text-sm text-slate-400">Otomatik görev log kaydı yok.</p>}
    </div>
  );
}

function AutomationDecisionReport({
  decisions,
  contacts,
  onOpenChat,
  onCreateTask,
  onPrepareVoice,
  onIgnore
}: {
  decisions: AutomationDecisionResult[];
  contacts: AppData["contacts"];
  onOpenChat: (decision: AutomationDecisionResult) => void;
  onCreateTask: (decision: AutomationDecisionResult) => void;
  onPrepareVoice: (decision: AutomationDecisionResult) => void;
  onIgnore: (decision: AutomationDecisionResult) => void;
}) {
  const rows = (decisions ?? []).slice(0, 20);
  return (
    <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
      {rows.map((decision, index) => {
        const contact = contacts.find((item) => item.id === decision.memberId);
        return (
          <article key={`${decision.memberId}-${decision.ruleKey}-${index}`} className="rounded-md border border-line bg-panelSoft p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">Üye: {contact ? memberDisplayName(contact) : decision.memberId}</p>
                <p className="mt-1 text-xs text-slate-500">Kural: {decision.ruleName}</p>
              </div>
              <button
                className={clsx("status-pill transition disabled:cursor-not-allowed disabled:opacity-60", decisionTone(decision.decisionType))}
                onClick={() => onOpenChat(decision)}
                disabled={!canUseChatGuidance(decision)}
              >
                {decisionLabel(decision.decisionType)}
              </button>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <div className="rounded-md border border-line bg-ink/40 p-2 text-xs">
                <p className="text-slate-500">Önerilen aksiyon</p>
                <p className="mt-1 font-semibold text-slate-100">{decision.taskTitle ?? decision.nextStep ?? decisionLabel(decision.decisionType)}</p>
              </div>
              <div className="rounded-md border border-line bg-ink/40 p-2 text-xs">
                <p className="text-slate-500">Sonraki adım</p>
                <p className="mt-1 font-semibold text-slate-100">{decision.nextStep ?? "-"}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {decision.questionAnswers.map((qa) => (
                <div key={qa.question} className="rounded-md border border-line bg-ink/40 p-2 text-xs">
                  <p className="text-slate-500">{qa.question}</p>
                  <p className="mt-1 font-semibold text-slate-200">{qa.answer}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">Gerekçe: {decision.reason}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn btn-secondary h-8 px-3" onClick={() => onOpenChat(decision)} disabled={!canUseChatGuidance(decision)}>
                Sohbete Git
              </button>
              <button className="btn btn-secondary h-8 px-3" onClick={() => onCreateTask(decision)} disabled={!canCreateGuidanceTask(decision)}>
                Görev Aç
              </button>
              <button className="btn btn-secondary h-8 px-3" onClick={() => onPrepareVoice(decision)} disabled={decision.actionType !== "VOICE_FOLLOWUP"}>
                Sesli Yanıt Hazırla
              </button>
              <button className="btn btn-secondary h-8 px-3" onClick={() => onIgnore(decision)}>
                Yoksay
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function AlarmList({ alarms }: { alarms: AppData["alarms"] }) {
  return (
    <div className="overflow-auto rounded-lg border border-line bg-panel">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-panelSoft text-xs uppercase text-slate-400">
          <tr><th className="p-3">Alarm tarihi</th><th>Alarm saati</th><th>Alarm notu</th><th>Durum</th></tr>
        </thead>
        <tbody>
          {alarms.map((alarm) => {
            const scheduledAt = new Date(alarm.scheduledAt);
            return (
              <tr key={alarm.id} className="border-t border-line">
                <td className="p-3">{formatShortDate(scheduledAt)}</td>
                <td className="tabular-nums">{timeDisplay(scheduledAt)}</td>
                <td className="max-w-sm truncate text-slate-300">{alarm.note}</td>
                <td><span className={clsx("status-pill", alarm.status === "Tamamlandı" ? statusTone.Tamamlandı : alarm.status === "Kapatıldı" ? statusTone.Kapatıldı : statusTone.Beklemede)}>{alarm.status}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {alarms.length === 0 && <p className="p-6 text-sm text-slate-400">Alarm geçmişi boş.</p>}
    </div>
  );
}

function RequestTable({
  data,
  rows,
  compact,
  emptyText = "Veritabanında kayıt yok.",
  onOpenDetail
}: {
  data: AppData;
  rows?: AppData["requests"];
  compact?: boolean;
  emptyText?: string;
  onOpenDetail: (request: RequestItem) => void;
}) {
  const tableRows = compact ? (rows ?? data.requests).slice(0, 5) : (rows ?? data.requests);
  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-panelSoft text-xs uppercase text-slate-400">
          <tr>
            <th className="p-3">Durum</th><th className="px-3 py-3">Ad Soyad</th><th className="px-3 py-3">Telefon</th><th className="px-3 py-3">Talep türü</th><th className="px-3 py-3">Miktar / Tutar</th><th className="px-3 py-3">Son İşlem</th><th className="px-3 py-3">Oluşturulma Tarihi</th><th className="px-3 py-3 text-right">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((request) => {
            const contact = contactById(data, request.contactId);
            return (
              <tr key={request.id} className="border-t border-line align-middle">
                <td className="p-3"><span className={clsx("status-pill", statusTone[request.status])}>{request.status}</span></td>
                <td className="px-3 py-3 font-semibold text-white">{contact ? requestDisplayName(request, contact) : request.firstName ?? "-"}</td>
                <td className="px-3 py-3 text-slate-300">{contact ? requestPhone(request, contact) : request.phone ?? "-"}</td>
                <td className="px-3 py-3 text-slate-300">{request.requestType}</td>
                <td className="px-3 py-3 font-semibold text-slate-100">{formatCurrency(requestAmountForDisplay(request))}</td>
                <td className="px-3 py-3 text-slate-400">{formatDate(request.updatedAt)}</td>
                <td className="px-3 py-3 text-slate-400">{formatDate(request.createdAt)}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button className="btn btn-secondary h-8 px-3" onClick={() => onOpenDetail(request)}>Detay Gör</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {tableRows.length === 0 && <p className="p-6 text-sm text-slate-400">{emptyText}</p>}
    </div>
  );
}

function TaskCenterSummary({
  pendingTasks,
  completedTasks,
  overdueTasks,
  totalCompletedTasks,
  data
}: {
  pendingTasks: AppData["tasks"];
  completedTasks: AppData["tasks"];
  overdueTasks: AppData["tasks"];
  totalCompletedTasks: number;
  data: AppData;
}) {
  const latestCompleted = [...completedTasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <h3 className="font-semibold text-white">Görev Merkezi Özeti</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MiniMetric label="Açık Görevler" value={pendingTasks.length} tone={pendingTasks.length ? "warning" : undefined} />
        <MiniMetric label="Bugün Tamamlanan Görevler" value={completedTasks.length} />
        <MiniMetric label="Geçmiş Bekleyen Görevler" value={overdueTasks.length} tone={overdueTasks.length ? "warning" : undefined} />
        <MiniMetric label="Toplam Tamamlanan Görevler" value={totalCompletedTasks} />
      </div>
      <div className="mt-4 rounded-md border border-line bg-ink/35">
        <div className="border-b border-line px-3 py-2 text-xs font-semibold uppercase text-slate-400">Son Tamamlanan 5 Görev</div>
        <div className="max-h-56 overflow-y-auto">
          {latestCompleted.map((task) => {
            const contact = contactById(data, task.contactId);
            return (
              <div key={task.id} className="border-b border-line px-3 py-2 last:border-b-0">
                <p className="truncate text-sm font-semibold text-white">{task.title}</p>
                <p className="mt-1 truncate text-xs text-slate-400">{contact ? memberDisplayName(contact) : "Üye"} · {formatDate(task.updatedAt)}</p>
              </div>
            );
          })}
          {latestCompleted.length === 0 && <p className="p-4 text-sm text-slate-400">Bugün için kayıt bulunmuyor.</p>}
        </div>
      </div>
    </section>
  );
}

function CustomerCard({ data, contact }: { data: AppData; contact?: Contact }) {
  if (!contact) return (
    <section className="rounded-lg border border-line bg-panel p-4 text-sm text-slate-400">
      Müşteri kartı için bir konuşma seçin.
    </section>
  );
  const requests = data.requests.filter((request) => request.contactId === contact.id);
  const conversations = data.conversations.filter((conversation) => conversation.contactId === contact.id);
  const lastConversation = conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())[0];
  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-mint text-lg font-bold text-ink">{contact.name.slice(0, 1)}</div>
        <div>
          <h3 className="font-semibold text-white">{contact.name}</h3>
          <p className="text-sm text-slate-400">{contact.phone}</p>
        </div>
      </div>
      <dl className="mt-5 grid gap-3 text-sm">
        <Info label="Cinsiyet" value={contact.gender} />
        <Info label="Miktar" value={formatCurrency(requests[0]?.amount ?? 0)} />
        <Info label="Notlar" value={requests[0]?.note ?? "-"} />
        <Info label="Açılan talep sayısı" value={String(requests.length)} />
        <Info label="Son görüşme tarihi" value={lastConversation ? formatDate(lastConversation.lastMessageAt) : "-"} />
      </dl>
    </section>
  );
}

function Input({ label, value, onChange, onBlur }: { label: string; value: string; onChange: (value: string) => void; onBlur?: () => void }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input className="field" value={value} onBlur={onBlur} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ label, value, options, optionLabels = {}, onChange }: { label: string; value: string; options: readonly string[]; optionLabels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="label">{label}</span>
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{optionLabels[option] ?? option}</option>)}
      </select>
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-panelSoft p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-200">{value}</dd>
    </div>
  );
}

function TagBadges({ tags }: { tags: AppData["memberTags"] }) {
  if (tags.length === 0) return <span className="text-xs text-slate-600">-</span>;
  return (
    <div className="flex max-w-[220px] flex-wrap gap-1">
      {tags.slice(0, 3).map((tag) => (
        <span key={tag.id} className={clsx("rounded-full border px-2 py-0.5 text-[11px]", tagTone(tag.color))}>{tag.name}</span>
      ))}
      {tags.length > 3 && <span className="rounded-full border border-line bg-panelSoft px-2 py-0.5 text-[11px] text-slate-400">+{tags.length - 3}</span>}
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const tone = source === "Otomatik Sistem"
    ? "border-mint/30 bg-mint/10 text-emerald-200"
    : source === "Karar Motoru"
      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
    : source === "Talep"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
      : source === "Sesli Yanıt"
        ? "border-sky-400/30 bg-sky-400/10 text-sky-200"
        : source === "Üye Aktivitesi"
          ? "border-violet-400/30 bg-violet-400/10 text-violet-200"
          : "border-slate-500/40 bg-slate-500/10 text-slate-300";
  return <span className={clsx("rounded-full border px-2 py-0.5 text-[11px]", tone)}>Kaynak: {source}</span>;
}

function lineStatusLabel(status?: string) {
  return status ? lineStatusLabels[status] ?? status : "Hat yok";
}

function lineStatusTone(status?: string) {
  if (status === "active" || status === "connected") return "border-mint/30 bg-mint/10 text-emerald-200";
  if (status === "qr_waiting") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  if (status === "connecting" || status === "disconnected" || status === "replacement_pending") return "border-orange-400/30 bg-orange-400/10 text-orange-200";
  if (status === "blocked") return "border-coral/30 bg-coral/10 text-red-200";
  return "border-slate-500/40 bg-slate-500/10 text-slate-300";
}

function lineHealth(line: AppData["communicationLines"][number]) {
  if (line.status === "blocked" || line.status === "archived" || line.status === "disconnected") return "Riskli";
  if (line.status === "connecting" || line.status === "qr_waiting" || line.status === "replacement_pending") return "Kontrol gerekli";
  const latestActivity = [line.lastMessageAt, line.lastConnectedAt]
    .filter(Boolean)
    .map((value) => new Date(value as string).getTime())
    .sort((a, b) => b - a)[0];
  if (!latestActivity) return "Riskli";
  const hours = (Date.now() - latestActivity) / (60 * 60 * 1000);
  if (hours > 24) return "Riskli";
  if (hours > 6) return "Kontrol gerekli";
  return "Sağlıklı";
}

function lineHealthTone(health: string) {
  if (health === "Sağlıklı") return "border-mint/30 bg-mint/10 text-emerald-200";
  if (health === "Kontrol gerekli") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  return "border-coral/30 bg-coral/10 text-red-200";
}

function canSendWithLineStatus(status?: string) {
  return status === "active" || status === "connected";
}

function providerLabel(provider: string) {
  const labels: Record<string, string> = {
    manual: "Manual",
    whatsapp_web: "WhatsApp Web",
    cloud_api: "Cloud API"
  };
  return labels[provider] ?? provider;
}

function lineName(data: AppData, lineId: string) {
  return data.communicationLines.find((line) => line.id === lineId)?.name ?? "Bilinmeyen hat";
}

function lineShortName(line: AppData["communicationLines"][number]) {
  return (line.name || line.phoneNumber).slice(0, 8);
}

function lineUsageStats(data: AppData, lineId: string) {
  const conversationIds = new Set(data.conversations.filter((conversation) => conversation.lineId === lineId).map((conversation) => conversation.id));
  return {
    conversations: conversationIds.size,
    messages: data.messages.filter((message) => message.lineId === lineId || conversationIds.has(message.conversationId)).length
  };
}

function normalizeGuideText(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function tagTone(color: string) {
  const tones: Record<string, string> = {
    emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    rose: "border-rose-400/30 bg-rose-400/10 text-rose-200",
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    sky: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    violet: "border-violet-400/30 bg-violet-400/10 text-violet-200",
    cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
    mint: "border-mint/30 bg-mint/10 text-emerald-200"
  };
  return tones[color] ?? "border-slate-500/40 bg-slate-500/10 text-slate-300";
}

function contactById(data: AppData, id: string) {
  return data.contacts.find((contact) => contact.id === id);
}

function contactDisplayName(contact: Contact) {
  return contact.isRegistered ? contact.name : contact.phone;
}

function latestRequestForContact(data: AppData, contactId: string) {
  return data.requests
    .filter((request) => request.contactId === contactId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

function lastAutomaticTaskDate(tasks: AppData["tasks"]) {
  const latest = tasks
    .filter((task) => task.source !== "Manuel")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  return latest ? formatDate(latest.createdAt) : "-";
}

function automationSetting(data: AppData, key: string) {
  return data.automationSettings.find((setting) => setting.key === key);
}

function getAutomationSummary(data: AppData, now: Date) {
  const automaticTasks = data.tasks.filter((task) => task.source !== "Manuel");
  const lastLog = [...data.automationLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  return {
    todayCreated: automaticTasks.filter((task) => isSameLocalDay(task.createdAt, now)).length,
    pending: automaticTasks.filter((task) => task.status === "Bekliyor").length,
    lastRunAt: lastLog?.createdAt
  };
}

function getOwnershipSummary(data: AppData, now: Date) {
  return {
    pending: data.ownershipRequests.filter((request) => request.status === "pending").length,
    transferredToday: data.ownershipRequests.filter((request) => request.status === "approved" && request.decidedAt && isSameLocalDay(request.decidedAt, now)).length,
    pooled: data.contacts.filter((contact) => contact.ownershipStatus === "pool").length,
    blocked: data.contacts.filter((contact) => contact.ownershipStatus === "blocked").length
  };
}

function ownershipStatusLabel(status: Contact["ownershipStatus"]) {
  const labels = {
    active: "Aktif",
    passive: "Pasif",
    pool: "Havuz",
    blocked: "Blokeli"
  };
  return labels[status] ?? status;
}

function ownershipRequestStatusLabel(status: AppData["ownershipRequests"][number]["status"]) {
  const labels = {
    pending: "Bekliyor",
    approved: "Onaylandı / Devredildi",
    rejected: "Reddedildi",
    pooled: "Havuza alındı",
    blocked: "Bloke edildi"
  };
  return labels[status] ?? status;
}

function automationRuleLabel(key: string) {
  const labels: Record<string, string> = {
    engine_enabled: "Motor",
    new_member_task: "Yeni üye",
    inactive_member_task: "Pasif üye",
    request_control_task: "Talep kontrol",
    request_completed_followup: "Memnuniyet",
    voice_followup_task: "Sesli takip"
  };
  return labels[key] ?? key;
}

function automationLogLabel(status: AppData["automationLogs"][number]["status"]) {
  const labels = {
    created: "Oluşturuldu",
    skipped: "Atlandı",
    duplicate: "Zaten var",
    error: "Hata",
    test: "Test"
  };
  return labels[status];
}

function automationLogTone(status: AppData["automationLogs"][number]["status"]) {
  if (status === "created") return statusTone.Aktif;
  if (status === "duplicate" || status === "test") return statusTone.Beklemede;
  if (status === "error") return "border-coral/30 bg-coral/10 text-red-200";
  return statusTone.Pasif;
}

function automationLogInRange(createdAt: string, mode: AutomationLogDateMode, customDate: string, now: Date) {
  const logDay = dateKey(createdAt);
  const today = dateInputValue(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = dateInputValue(yesterdayDate);

  if (mode === "Bugün") return logDay === today;
  if (mode === "Dün") return logDay === yesterday;
  if (mode === "Özel tarih") return logDay === customDate;

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 6);
  const start = dateInputValue(startDate);
  return logDay >= start && logDay <= today;
}

function automationLogRangeLabel(mode: AutomationLogDateMode, customDate: string, now: Date) {
  if (mode === "Bugün") return `Bugün · ${formatShortDate(now)}`;
  if (mode === "Dün") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return `Dün · ${formatShortDate(yesterday)}`;
  }
  if (mode === "Özel tarih") return `Özel tarih · ${formatShortDate(new Date(customDate))}`;
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  return `Son 7 gün · ${formatShortDate(start)} - ${formatShortDate(now)}`;
}

function isTaskInArchiveRange(task: AppData["tasks"][number], filter: TaskArchiveFilter, startDate: string, endDate: string, now: Date) {
  const range = taskArchiveRange(filter, startDate, endDate, now);
  const plannedDay = dateKey(task.taskDate);
  const completedDay = task.status === "Tamamlandı" ? dateKey(task.updatedAt) : "";
  return isDateKeyInRange(plannedDay, range.start, range.end) || Boolean(completedDay && isDateKeyInRange(completedDay, range.start, range.end));
}

function taskArchiveRange(filter: TaskArchiveFilter, startDate: string, endDate: string, now: Date) {
  const end = dateInputValue(now);
  if (filter === "Bugün") return { start: end, end };
  if (filter === "Dün") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const day = dateInputValue(yesterday);
    return { start: day, end: day };
  }
  if (filter === "Son 7 Gün") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { start: dateInputValue(start), end };
  }
  if (filter === "Son 30 Gün") {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    return { start: dateInputValue(start), end };
  }
  return startDate <= endDate ? { start: startDate, end: endDate } : { start: endDate, end: startDate };
}

function isDateKeyInRange(value: string, start: string, end: string) {
  return value >= start && value <= end;
}

function decisionLabel(type: AutomationDecisionResult["decisionType"]) {
  const labels = {
    CREATE_TASK: "Görev oluşturulmalı",
    FOLLOW_UP_TASK: "Takip görevi gerekli",
    SKIP: "Gerçekten görev gereksiz",
    DUPLICATE: "Açık görev zaten var",
    AUTO_COMPLETE_EXISTING_TASK: "Otomatik tamamla",
    WAIT: "Beklemeli",
    ERROR: "Hata"
  };
  return labels[type];
}

function decisionTone(type: AutomationDecisionResult["decisionType"]) {
  if (type === "CREATE_TASK" || type === "FOLLOW_UP_TASK") return statusTone.Aktif;
  if (type === "AUTO_COMPLETE_EXISTING_TASK") return statusTone.Tamamlandı;
  if (type === "WAIT" || type === "DUPLICATE") return statusTone.Beklemede;
  if (type === "ERROR") return "border-coral/30 bg-coral/10 text-red-200";
  return statusTone.Pasif;
}

function formatName(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1).toLocaleLowerCase("tr-TR"))
    .join(" ");
}

function getFirstName(contact?: Contact) {
  return formatName(contact?.name ?? "").split(" ")[0] ?? "";
}

function getLastName(contact?: Contact) {
  const parts = formatName(contact?.name ?? "").split(" ").filter(Boolean);
  return parts.slice(1).join(" ");
}

function getHonorific(contact?: Contact) {
  const firstName = getFirstName(contact);
  if (!firstName) return "";
  if (contact?.gender === "Erkek") return `${firstName} Bey`;
  if (contact?.gender === "Kadın") return `${firstName} Hanım`;
  return firstName;
}

function renderTemplate(content: string, contact?: Contact, request?: RequestItem) {
  return content
    .replaceAll("{ad}", getFirstName(contact))
    .replaceAll("{soyad}", getLastName(contact))
    .replaceAll("{adSoyad}", formatName(contact?.name ?? ""))
    .replaceAll("{hitap}", getHonorific(contact))
    .replaceAll("{telefon}", contact?.phone ?? "")
    .replaceAll("{cinsiyet}", contact?.gender ?? "")
    .replaceAll("{miktar}", request ? formatCurrency(request.amount) : "");
}

function fillTemplate(content: string, contact?: Contact, request?: RequestItem) {
  return renderTemplate(content, contact, request);
}

function renderGuidanceDraft(decision: AutomationDecisionResult, contact?: Contact, request?: RequestItem) {
  return fillTemplate(decision.messageDraft || decision.nextStep || decision.taskTitle || "", contact, request)
    .replaceAll("{isim}", getFirstName(contact))
    .replaceAll("{kullaniciAdi}", contact?.username ?? "");
}

function renderGuidanceTaskDraft(task: AppData["tasks"][number], contact?: Contact, request?: RequestItem) {
  const templates: Record<string, string> = {
    "Yeniden aktiflik mesajı gönder": "Merhaba {hitap}, uzun süredir görüşemedik. Sizin için güncel fırsatları kontrol etmek ister misiniz?",
    "Karşılama sonrası dönüş kontrolü yap": "Merhaba {hitap}, önceki bilgilendirmemizle ilgili size yardımcı olabileceğimiz bir konu var mı?",
    "Üyeye ihtiyaç analizi yap": "{hitap}, size daha doğru yardımcı olabilmemiz için hangi konuda destek almak istediğinizi öğrenebilir miyim?",
    "Talep durumunu kontrol et": "{hitap}, talebinizle ilgili süreci kontrol ediyorum. Kısa süre içinde size bilgi vereceğim.",
    "Açık talep takibi yap": "{hitap}, talebinizle ilgili süreci kontrol ediyorum. Kısa süre içinde size bilgi vereceğim.",
    "Memnuniyet kontrolü yap": "{hitap}, işleminiz tamamlandı. Süreçle ilgili memnuniyetinizi kontrol etmek istedik.",
    "Sesli mesaj dönüş kontrolü yap": "{hitap}, size kısa bir sesli bilgilendirme iletmiştik. Kontrol etme fırsatınız oldu mu?",
    "İlk karşılama mesajı gönder": "Merhaba {hitap}, aramıza hoş geldiniz. Size nasıl yardımcı olabiliriz?",
    "Üyeye güncel durum sor": "Merhaba {hitap}, bugün size yardımcı olabileceğimiz güncel bir konu var mı?"
  };
  return fillTemplate(templates[task.title] ?? task.title, contact, request)
    .replaceAll("{isim}", getFirstName(contact))
    .replaceAll("{kullaniciAdi}", contact?.username ?? "");
}

function guidancePayload(decision: AutomationDecisionResult) {
  return {
    memberId: decision.memberId,
    ruleKey: decision.ruleKey,
    ruleName: decision.ruleName,
    taskTitle: decision.taskTitle ?? decision.nextStep ?? decisionLabel(decision.decisionType),
    reason: decision.reason,
    messageDraft: decision.messageDraft ?? "",
    referenceType: decision.referenceType,
    referenceId: decision.referenceId ?? decision.sourceReferenceId,
    questionAnswers: decision.questionAnswers
  };
}

function guidanceKey(decision: AutomationDecisionResult) {
  return `${decision.memberId}:${decision.ruleKey}:${decision.referenceType ?? ""}:${decision.referenceId ?? decision.sourceReferenceId ?? ""}:${decision.taskTitle ?? ""}`;
}

function canUseChatGuidance(decision: AutomationDecisionResult) {
  return decision.actionType === "MESSAGE_DRAFT" || decision.actionType === "REQUEST_CHECK" || decision.actionType === "NOTE_REVIEW" || decision.decisionType === "CREATE_TASK" || decision.decisionType === "FOLLOW_UP_TASK";
}

function canCreateGuidanceTask(decision: AutomationDecisionResult) {
  return decision.decisionType === "CREATE_TASK" || decision.decisionType === "FOLLOW_UP_TASK";
}

function guidanceTaskUrgency(task: AppData["tasks"][number], contact?: Contact) {
  let level = task.title.includes("Talep durumunu") || task.title.includes("Açık talep") || task.title.includes("karşılama")
    ? 3
    : task.title.includes("Memnuniyet") || task.title.includes("aktiflik") || task.title.includes("Sesli mesaj")
      ? 2
      : 1;
  if (contact?.memberStatus === "Riskli" || contact?.memberStatus === "VIP") level += 1;
  if (level >= 4) return "Kritik";
  if (level === 3) return "Yüksek";
  if (level === 2) return "Orta";
  return "Düşük";
}

function guidanceUrgencyPriority(urgency: string) {
  const priorities: Record<string, number> = { Kritik: 4, Yüksek: 3, Orta: 2, Düşük: 1 };
  return priorities[urgency] ?? 0;
}

function urgencyTone(urgency: string) {
  if (urgency === "Kritik") return "border-coral/30 bg-coral/10 text-red-200";
  if (urgency === "Yüksek") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  if (urgency === "Orta") return "border-sky-400/30 bg-sky-400/10 text-sky-200";
  return "border-slate-500/40 bg-slate-500/10 text-slate-300";
}

function getTemplateContent(template: MessageTemplate) {
  if (template.title.trim().toLocaleLowerCase("tr-TR") === "mrb") {
    return "Merhaba {hitap}, hoş geldiniz.";
  }
  return template.content;
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("90")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function mergeTasks(existing: AppData["tasks"], incoming: AppData["tasks"]) {
  const taskMap = new Map(existing.map((task) => [task.id, task]));
  incoming.forEach((task) => taskMap.set(task.id, task));
  return Array.from(taskMap.values());
}

function groupTasksByContact(tasks: AppData["tasks"]): TaskGroup[] {
  const groups = new Map<string, TaskGroup>();
  tasks.forEach((task) => {
    const current = groups.get(task.contactId) ?? { contactId: task.contactId, total: 0, pending: 0, completed: 0, sources: [], tasks: [], latestTaskTitle: "", latestTaskAt: "" };
    current.total += 1;
    if (!current.sources.includes(task.source)) current.sources.push(task.source);
    if (task.status === "Tamamlandı") current.completed += 1;
    else current.pending += 1;
    current.tasks.push(task);
    const latestTime = current.latestTaskAt ? new Date(current.latestTaskAt).getTime() : 0;
    if (new Date(task.createdAt).getTime() >= latestTime) {
      current.latestTaskTitle = task.title;
      current.latestTaskAt = task.createdAt;
    }
    groups.set(task.contactId, current);
  });
  return Array.from(groups.values()).sort((a, b) => b.pending - a.pending || new Date(b.latestTaskAt).getTime() - new Date(a.latestTaskAt).getTime());
}

function groupTasksByDateAndContact(tasks: AppData["tasks"]): TaskDateGroup[] {
  const byDate = new Map<string, AppData["tasks"]>();
  tasks.forEach((task) => {
    const key = dateKey(task.taskDate);
    byDate.set(key, [...(byDate.get(key) ?? []), task]);
  });
  return Array.from(byDate.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKeyValue, dateTasks]) => ({ dateKey: dateKeyValue, groups: groupTasksByContact(dateTasks) }));
}

function buildMessageItems(messages: AppData["messages"]) {
  const items: Array<
    | { type: "date"; key: string; label: string }
    | { type: "message"; message: AppData["messages"][number] }
  > = [];
  let lastKey = "";
  messages.forEach((message) => {
    const key = dateKey(message.createdAt);
    if (key !== lastKey) {
      items.push({ type: "date", key: `date-${key}`, label: formatShortDate(new Date(message.createdAt)) });
      lastKey = key;
    }
    items.push({ type: "message", message });
  });
  return items;
}

function buildCustomerTimeline(data: AppData, contact: Contact) {
  const contactConversations = data.conversations.filter((conversation) => conversation.contactId === contact.id);
  const conversationIds = new Set(contactConversations.map((conversation) => conversation.id));
  const events: { id: string; title: string; description?: string; createdAt: string }[] = [
    {
      id: `contact-${contact.id}`,
      title: "Numara/kayıt oluşturuldu",
      description: `${contact.name} sisteme kaydedildi.`,
      createdAt: contact.createdAt
    }
  ];

  data.messages
    .filter((message) => conversationIds.has(message.conversationId))
    .forEach((message) => {
      events.push({
        id: `message-${message.id}`,
        title: message.senderType === "operator" ? "Mesaj gönderildi" : "Mesaj alındı",
        description: message.messageText,
        createdAt: message.createdAt
      });
    });

  data.requests
    .filter((request) => request.contactId === contact.id)
    .forEach((request) => {
      events.push({
        id: `request-${request.id}`,
        title: "Talep oluşturuldu",
        description: `${formatCurrency(request.amount)} | ${request.status}${request.note ? ` | ${request.note}` : ""}`,
        createdAt: request.createdAt
      });
    });

  data.tasks
    .filter((task) => task.contactId === contact.id)
    .forEach((task) => {
      events.push({
        id: `task-${task.id}`,
        title: task.status === "Tamamlandı" ? "Görev tamamlandı" : "Görev atandı",
        description: task.title,
        createdAt: task.status === "Tamamlandı" ? task.updatedAt : task.createdAt
      });
      task.notes.forEach((note) => {
        events.push({
          id: `task-note-${note.id}`,
          title: "Görev notu eklendi",
          description: note.noteText,
          createdAt: note.createdAt
        });
      });
    });

  data.customerNotes
    .filter((note) => note.contactId === contact.id)
    .forEach((note) => {
      events.push({
        id: `customer-note-${note.id}`,
        title: "Müşteri notu eklendi",
        description: note.noteText,
        createdAt: note.createdAt
      });
    });

  contactConversations.forEach((conversation) => {
    if (conversation.isArchived) {
      events.push({
        id: `archive-${conversation.id}`,
        title: "Sohbet depoya taşındı",
        description: conversation.status,
        createdAt: conversation.updatedAt
      });
    }
  });

  return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function buildMemberTimeline(data: AppData, contact: Contact, filter: TimelineFilter): TimelineItem[] {
  const events: TimelineItem[] = [];
  const seenReferences = new Set<string>();
  const operatorName = (operatorId?: string) => operatorId ? data.operators.find((operator) => operator.id === operatorId)?.name : undefined;
  const pushEvent = (event: TimelineItem) => {
    if (filter !== "Tümü" && event.category !== filter) return;
    if (event.referenceKey && seenReferences.has(event.referenceKey)) return;
    seenReferences.add(event.referenceKey);
    events.push(event);
  };

  data.timelineEvents
    .filter((event) => event.memberId === contact.id)
    .forEach((event) => {
      pushEvent({
        id: `event-${event.id}`,
        category: timelineCategory(event.eventType),
        eventType: event.eventType,
        title: event.eventTitle,
        description: event.eventDescription ?? "",
        operatorName: event.operatorName ?? operatorName(event.operatorId),
        createdAt: event.createdAt,
        icon: timelineIcon(event.eventType),
        referenceKey: event.referenceType && event.referenceId ? `${event.referenceType}:${event.referenceId}` : `event:${event.id}`
      });
    });

  pushEvent({
    id: `derived-member-${contact.id}`,
    category: "Üye İşlemleri",
    eventType: "MEMBER_CREATED",
    title: "Üye oluşturuldu",
    description: `${memberDisplayName(contact)} | ${contact.phone}`,
    createdAt: contact.createdAt,
    icon: "👤",
    referenceKey: `contact:${contact.id}`
  });

  const contactConversations = data.conversations.filter((conversation) => conversation.contactId === contact.id);
  const conversationIds = new Set(contactConversations.map((conversation) => conversation.id));

  data.messages
    .filter((message) => conversationIds.has(message.conversationId))
    .forEach((message) => {
      const voice = parseVoiceMessage(message.messageText);
      pushEvent({
        id: `derived-message-${message.id}`,
        category: voice ? "Sesli Yanıtlar" : "Mesajlar",
        eventType: voice ? "VOICE_SENT" : message.senderType === "customer" ? "MESSAGE_RECEIVED" : "MESSAGE_SENT",
        title: voice ? "Sesli mesaj gönderildi" : message.senderType === "customer" ? "Mesaj alındı" : "Mesaj gönderildi",
        description: voice ? voice.text || "Sesli yanıt üyeye gönderildi." : message.messageText.slice(0, 240),
        operatorName: voice?.operatorName ?? operatorName(message.createdBy),
        createdAt: message.createdAt,
        icon: voice ? "🎤" : "💬",
        referenceKey: voice?.usageLogId ? `tts_usage_log:${voice.usageLogId}` : `message:${message.id}`
      });
    });

  data.ttsUsageLogs
    .filter((log) => log.memberId === contact.id)
    .forEach((log) => {
      pushEvent({
        id: `derived-tts-${log.id}`,
        category: "Sesli Yanıtlar",
        eventType: log.status === "failed" ? "VOICE_FAILED" : "VOICE_CREATED",
        title: log.status === "failed" ? "Ses gönderimi başarısız oldu" : "Ses oluşturuldu",
        description: log.status === "failed" ? log.errorMessage ?? "Ses oluşturulamadı." : log.messageText.slice(0, 240),
        operatorName: operatorName(log.operatorId),
        createdAt: log.createdAt,
        icon: log.status === "failed" ? "⚠️" : "🎤",
        referenceKey: `tts_usage_log:${log.id}`
      });
    });

  data.requests
    .filter((request) => request.contactId === contact.id)
    .forEach((request) => {
      pushEvent({
        id: `derived-request-${request.id}`,
        category: "Talepler",
        eventType: "REQUEST_CREATED",
        title: "Talep oluşturuldu",
        description: `Tür: ${request.requestType} · Durum: ${request.status}`,
        operatorName: operatorName(request.createdBy),
        createdAt: request.createdAt,
        icon: "📋",
        referenceKey: `request:${request.id}`
      });
    });

  data.tasks
    .filter((task) => task.contactId === contact.id)
    .forEach((task) => {
      pushEvent({
        id: `derived-task-${task.id}`,
        category: "Görevler",
        eventType: task.status === "Tamamlandı" ? "TASK_COMPLETED" : "TASK_CREATED",
        title: task.status === "Tamamlandı" ? "Görev tamamlandı" : "Görev oluşturuldu",
        description: task.title,
        operatorName: operatorName(task.createdBy),
        createdAt: task.status === "Tamamlandı" ? task.updatedAt : task.createdAt,
        icon: "✅",
        referenceKey: `task:${task.id}`
      });
      task.notes.forEach((note) => {
        pushEvent({
          id: `derived-task-note-${note.id}`,
          category: "Notlar",
          eventType: "TASK_NOTE_ADDED",
          title: "Görev notu eklendi",
          description: note.noteText,
          operatorName: note.createdByName ?? operatorName(note.createdBy),
          createdAt: note.createdAt,
          icon: "📝",
          referenceKey: `task_note:${note.id}`
        });
      });
    });

  data.customerNotes
    .filter((note) => note.contactId === contact.id)
    .forEach((note) => {
      pushEvent({
        id: `derived-note-${note.id}`,
        category: "Notlar",
        eventType: "NOTE_ADDED",
        title: "Not eklendi",
        description: note.noteText,
        operatorName: note.createdByName ?? operatorName(note.createdBy),
        createdAt: note.createdAt,
        icon: "📝",
        referenceKey: `customer_note:${note.id}`
      });
    });

  return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function timelineCategory(eventType: string): TimelineFilter {
  if (eventType.startsWith("MESSAGE")) return "Mesajlar";
  if (eventType.startsWith("VOICE")) return "Sesli Yanıtlar";
  if (eventType.startsWith("TASK") || eventType.startsWith("AUTO_TASK")) return "Görevler";
  if (eventType.startsWith("REQUEST")) return "Talepler";
  if (eventType.includes("NOTE")) return "Notlar";
  return "Üye İşlemleri";
}

function timelineIcon(eventType: string) {
  if (eventType.startsWith("MESSAGE")) return "💬";
  if (eventType.startsWith("VOICE")) return eventType === "VOICE_FAILED" ? "⚠️" : "🎤";
  if (eventType.startsWith("TASK") || eventType.startsWith("AUTO_TASK")) return "✅";
  if (eventType.startsWith("REQUEST")) return "📋";
  if (eventType.includes("NOTE")) return "📝";
  if (eventType.startsWith("TAG")) return "🏷";
  if (eventType.includes("RISK") || eventType.includes("STATUS")) return "⚠️";
  return "👤";
}

function canUseMenu(key: ActiveMenu, user: SessionUser | null) {
  if (!user) return false;
  if (user.role === "Admin") return true;
  if (user.role === "Takım Lideri") return true;
  return key !== "Operatörler" && key !== "Operasyon Performansı";
}

function scopeAppDataForUser(data: AppData, user: SessionUser): AppData {
  if (user.role === "Admin") return data;

  const visibleOperatorIds = new Set<string>([user.id]);
  if (user.role === "Takım Lideri") {
    data.operators
      .filter((operator) => operator.teamLeadId === user.id)
      .forEach((operator) => visibleOperatorIds.add(operator.id));
  }

  const isVisibleOperator = (operatorId?: string) => Boolean(operatorId && visibleOperatorIds.has(operatorId));
  const conversationsByOperator = data.conversations.filter((conversation) => isVisibleOperator(conversation.assignedOperatorId));
  const visibleConversationIds = new Set(conversationsByOperator.map((conversation) => conversation.id));
  const visibleContactIds = new Set(conversationsByOperator.map((conversation) => conversation.contactId));

  data.requests
    .filter((request) => isVisibleOperator(request.createdBy))
    .forEach((request) => visibleContactIds.add(request.contactId));

  data.tasks
    .filter((task) => isVisibleOperator(task.createdBy))
    .forEach((task) => visibleContactIds.add(task.contactId));

  data.contacts
    .filter((contact) => isVisibleOperator(contact.ownerOperatorId))
    .forEach((contact) => visibleContactIds.add(contact.id));

  data.messages
    .filter((message) => isVisibleOperator(message.createdBy))
    .forEach((message) => {
      const conversation = data.conversations.find((item) => item.id === message.conversationId);
      if (conversation) {
        visibleConversationIds.add(conversation.id);
        visibleContactIds.add(conversation.contactId);
      }
    });

  const contacts = data.contacts.filter((contact) => visibleContactIds.has(contact.id));
  const conversations = data.conversations.filter((conversation) => visibleConversationIds.has(conversation.id) || visibleContactIds.has(conversation.contactId));
  const conversationIds = new Set(conversations.map((conversation) => conversation.id));
  const sessionLineIds = new Set(data.operatorLineSessions.filter((session) => visibleOperatorIds.has(session.operatorId)).map((session) => session.lineId));
  const visibleLineIds = new Set<string>(sessionLineIds);
  data.communicationLines
    .filter((line) => line.assignedOperatorId && visibleOperatorIds.has(line.assignedOperatorId))
    .forEach((line) => visibleLineIds.add(line.id));
  conversations
    .filter((conversation) => conversation.lineId && (user.role === "Takım Lideri" || visibleLineIds.has(conversation.lineId)))
    .forEach((conversation) => {
      if (conversation.lineId) visibleLineIds.add(conversation.lineId);
    });

  return {
    ...data,
    contacts,
    requests: data.requests.filter((request) => visibleContactIds.has(request.contactId) && (user.role === "Takım Lideri" || isVisibleOperator(request.createdBy))),
    conversations,
    messages: data.messages.filter((message) => conversationIds.has(message.conversationId)),
    operators: data.operators.filter((operator) => visibleOperatorIds.has(operator.id)),
    communicationLines: data.communicationLines.filter((line) => user.role === "Takım Lideri" ? (!line.assignedOperatorId || visibleLineIds.has(line.id)) : visibleLineIds.has(line.id)),
    ttsUsageLogs: data.ttsUsageLogs.filter((log) => isVisibleOperator(log.operatorId)),
    operatorLineSessions: data.operatorLineSessions.filter((session) => visibleOperatorIds.has(session.operatorId)),
    ownershipRequests: data.ownershipRequests.filter((request) => visibleContactIds.has(request.contactId) || isVisibleOperator(request.requestedByOperatorId) || isVisibleOperator(request.currentOwnerOperatorId)),
    tasks: data.tasks.filter((task) => visibleContactIds.has(task.contactId) && (user.role === "Takım Lideri" || isVisibleOperator(task.createdBy))),
    customerNotes: data.customerNotes.filter((note) => visibleContactIds.has(note.contactId)),
    timelineEvents: data.timelineEvents.filter((event) => event.memberId ? visibleContactIds.has(event.memberId) : user.role === "Takım Lideri"),
    automationLogs: data.automationLogs.filter((log) => !log.memberId || visibleContactIds.has(log.memberId)),
    automationDecisionLogs: data.automationDecisionLogs.filter((log) => !log.memberId || visibleContactIds.has(log.memberId)),
    alarms: data.alarms.filter((alarm) => user.role === "Takım Lideri" || isVisibleOperator(alarm.createdBy))
  };
}

function getOperationSummary(data: AppData, now: Date, overduePendingTasks: number) {
  const todayMessages = data.messages.filter((message) => isSameLocalDay(message.createdAt, now)).length;
  const todayTasks = data.tasks.filter((task) => isSameLocalDay(task.taskDate, now));
  const todayRequests = data.requests.filter((request) => isSameLocalDay(request.createdAt, now)).length;
  return {
    todayMessages,
    completedTodayTasks: todayTasks.filter((task) => task.status === "Tamamlandı").length,
    pendingTodayTasks: todayTasks.filter((task) => task.status === "Bekliyor").length,
    overduePendingTasks,
    todayRequests,
    answeredConversations: data.conversations.filter((conversation) => conversation.status === "Cevaplandı").length,
    pendingConversations: data.conversations.filter((conversation) => conversation.unread || conversation.status === "Yeni" || conversation.status === "İşlemde").length,
    unreadConversations: data.conversations.filter((conversation) => conversation.unread).length,
    openRequests: data.requests.filter((request) => request.status !== "Tamamlandı" && request.status !== "Kapatıldı").length
  };
}

function calculateOperationScore(summary: ReturnType<typeof getOperationSummary>, todayTasks: AppData["tasks"]) {
  const completionRate = todayTasks.length === 0 ? 1 : summary.completedTodayTasks / todayTasks.length;
  const unreadPenalty = Math.min(25, summary.unreadConversations * 5);
  const overduePenalty = Math.min(25, summary.overduePendingTasks * 4);
  const openRequestPenalty = Math.min(20, summary.openRequests * 2);
  return Math.max(0, Math.min(100, Math.round(55 + completionRate * 45 - unreadPenalty - overduePenalty - openRequestPenalty)));
}

function buildOperationScoreDetails(summary: ReturnType<typeof getOperationSummary>, todayTasks: AppData["tasks"]) {
  const completionRate = todayTasks.length === 0 ? 100 : Math.round((summary.completedTodayTasks / todayTasks.length) * 100);
  return [
    { label: "Tamamlanan görevler", value: `+ görev oranı %${completionRate}`, tone: "positive" as const },
    { label: "Cevaplanan konuşmalar", value: `+ ${summary.answeredConversations} konuşma`, tone: "positive" as const },
    { label: "Bekleyen görevler", value: `- ${summary.pendingTodayTasks} görev`, tone: "negative" as const },
    { label: "Geçmiş bekleyen işler", value: `- ${summary.overduePendingTasks} iş`, tone: "negative" as const },
    { label: "Açık talepler", value: `- ${summary.openRequests} talep`, tone: "negative" as const }
  ];
}

function buildPerformanceRows(data: AppData, now: Date) {
  const operators = data.operators.length > 0
    ? data.operators
    : [{ id: "panel-admin", name: "Panel Admin", role: "Admin" as const, status: "Aktif" as const, email: "", ttsDailyLimit: 50, lastActiveAt: new Date().toISOString() }];

  return operators.map((operator) => {
    const todayMessages = data.messages.filter((message) => message.createdBy === operator.id && isSameLocalDay(message.createdAt, now)).length;
    const todayTasks = data.tasks.filter((task) => task.createdBy === operator.id && isSameLocalDay(task.taskDate, now));
    const todayRequests = data.requests.filter((request) => request.createdBy === operator.id && isSameLocalDay(request.createdAt, now)).length;
    const totalConversations = data.conversations.filter((conversation) => conversation.assignedOperatorId === operator.id).length || data.conversations.length;
    const completedTodayTasks = todayTasks.filter((task) => task.status === "Tamamlandı").length;
    const pendingTodayTasks = todayTasks.filter((task) => task.status === "Bekliyor").length;
    const completionRate = todayTasks.length === 0 ? 0 : Math.round((completedTodayTasks / todayTasks.length) * 100);

    return {
      operatorId: operator.id,
      name: operator.name,
      role: operator.role,
      todayMessages,
      completedTodayTasks,
      pendingTodayTasks,
      todayRequests,
      totalConversations,
      lastActiveAt: operator.lastActiveAt,
      completionRate
    };
  });
}

function buildTtsUsageSummary(data: AppData, now: Date) {
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const todayLogs = data.ttsUsageLogs.filter((log) => isSameLocalDay(log.createdAt, now));
  const monthLogs = data.ttsUsageLogs.filter((log) => dateKey(log.createdAt).startsWith(monthKey));
  const successfulMonthLogs = monthLogs.filter((log) => log.status !== "failed");
  const sentMonthLogs = monthLogs.filter((log) => log.status === "sent");
  const topOperators = rankTtsUsage(successfulMonthLogs, (log) => data.operators.find((operator) => operator.id === log.operatorId)?.name ?? "Bilinmeyen operatör");
  const topMembers = rankTtsUsage(sentMonthLogs, (log) => data.contacts.find((contact) => contact.id === log.memberId)?.name ?? "Bilinmeyen üye");

  return {
    todayCount: todayLogs.filter((log) => log.status !== "failed").length,
    monthCount: successfulMonthLogs.length,
    todaySentCount: todayLogs.filter((log) => log.status === "sent").length,
    monthSentCount: sentMonthLogs.length,
    todayCost: sumTtsCost(todayLogs),
    monthCost: sumTtsCost(monthLogs),
    averageDuration: successfulMonthLogs.length ? successfulMonthLogs.reduce((total, log) => total + log.audioDurationSeconds, 0) / successfulMonthLogs.length : 0,
    totalBytes: successfulMonthLogs.reduce((total, log) => total + (log.fileSizeBytes || log.audioFileSizeBytes), 0),
    topOperators,
    topMembers,
    operatorRows: buildTtsOperatorRows(data, monthLogs, todayLogs),
    memberRows: buildTtsMemberRows(data, sentMonthLogs)
  };
}

function buildTtsOperatorRows(data: AppData, monthLogs: AppData["ttsUsageLogs"], todayLogs: AppData["ttsUsageLogs"]) {
  return data.operators.map((operator) => {
    const operatorMonthLogs = monthLogs.filter((log) => log.operatorId === operator.id && log.status !== "failed");
    const operatorTodayLogs = todayLogs.filter((log) => log.operatorId === operator.id && log.status !== "failed");
    const sentLogs = operatorMonthLogs.filter((log) => log.status === "sent");
    const averageDuration = operatorMonthLogs.length ? operatorMonthLogs.reduce((total, log) => total + log.audioDurationSeconds, 0) / operatorMonthLogs.length : 0;
    return {
      operatorId: operator.id,
      name: operator.name,
      todayCreated: operatorTodayLogs.length,
      monthCreated: operatorMonthLogs.length,
      sentCount: sentLogs.length,
      averageDuration,
      estimatedCost: sumTtsCost(operatorMonthLogs),
      dailyLimit: operator.ttsDailyLimit,
      limitUsed: operatorTodayLogs.length
    };
  }).filter((row) => row.monthCreated > 0 || row.todayCreated > 0 || row.dailyLimit > 0);
}

function buildTtsMemberRows(data: AppData, sentLogs: AppData["ttsUsageLogs"]) {
  const grouped = new Map<string, AppData["ttsUsageLogs"]>();
  sentLogs.forEach((log) => {
    const key = log.memberId ?? "unknown";
    grouped.set(key, [...(grouped.get(key) ?? []), log]);
  });
  return Array.from(grouped.entries()).map(([memberId, logs]) => {
    const sorted = logs.sort((a, b) => new Date(b.sentAt ?? b.createdAt).getTime() - new Date(a.sentAt ?? a.createdAt).getTime());
    const latest = sorted[0];
    const contact = data.contacts.find((item) => item.id === memberId);
    const operator = data.operators.find((item) => item.id === latest?.operatorId);
    return {
      memberId,
      name: contact ? memberDisplayName(contact) : "Bilinmeyen üye",
      phone: contact?.phone ?? "-",
      totalVoiceMessages: logs.length,
      lastSentAt: latest?.sentAt ?? latest?.createdAt ?? "",
      lastText: latest?.messageText ?? "",
      operatorName: operator?.name ?? "-"
    };
  }).sort((a, b) => b.totalVoiceMessages - a.totalVoiceMessages);
}

function rankTtsUsage(logs: AppData["ttsUsageLogs"], labelFor: (log: AppData["ttsUsageLogs"][number]) => string) {
  const map = new Map<string, number>();
  logs.forEach((log) => {
    const label = labelFor(log);
    map.set(label, (map.get(label) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function sumTtsCost(logs: AppData["ttsUsageLogs"]) {
  return logs.reduce((total, log) => total + Number(log.estimatedCostUsd || 0), 0);
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function requestCommand(request: RequestItem, contact: Contact) {
  const note = request.note.trim() || "-";
  const name = requestDisplayName(request, contact);
  const phone = requestPhone(request, contact);
  if (request.requestType === "Nakit hediye") {
    return [
      "NAKİT HEDİYE TANIMLA",
      `Ad Soyad: ${name}`,
      `Telefon: ${phone}`,
      `Tutar: ${formatCurrency(request.giftAmount ?? request.amount)}`,
      `Not: ${note}`
    ].join("\n");
  }
  if (request.requestType === "Düzeltme alt/üst") {
    return [
      "DÜZELTME TALEBİ",
      `Ad Soyad: ${name}`,
      `Telefon: ${phone}`,
      `Yön: ${request.correctionDirection ?? "-"}`,
      `Tutar: ${formatCurrency(request.correctionAmount ?? request.amount)}`,
      `Not: ${note}`
    ].join("\n");
  }
  if (request.requestType === "Bahis detayı") {
    return [
      "BAHİS DETAYI KONTROL",
      `Ad Soyad: ${name}`,
      `Telefon: ${phone}`,
      `Bahis ID: ${request.betId ?? "-"}`,
      `Oyun İsmi: ${request.gameName ?? "-"}`,
      `Not: ${note}`
    ].join("\n");
  }
  return [
    "BONUS TANIMLA",
    `Ad Soyad: ${name}`,
    `Telefon: ${phone}`,
    `Miktar: ${formatCurrency(request.bonusAmount ?? request.amount)}`,
    "Talep Türü: Bonus",
    `Not: ${note}`
  ].join("\n");
}

function requestCommandFromForm(form: typeof emptyRequest) {
  const fakeContact: Contact = {
    id: "form",
    name: requestFullNameFromForm(form) || "-",
    phone: form.phone || "-",
    gender: form.gender,
    memberStatus: "Aktif",
    source: "Manuel",
    isRegistered: true,
    ownershipStatus: "pool",
    tags: [],
    createdAt: "",
    updatedAt: ""
  };
  const fakeRequest: RequestItem = {
    id: "form",
    contactId: "form",
    amount: form.amount,
    status: "Beklemede",
    note: form.note,
    firstName: form.firstName,
    lastName: form.lastName,
    username: form.username,
    nationalId: form.nationalId,
    phone: form.phone,
    gender: form.gender,
    requestType: form.requestType,
    bonusAmount: form.bonusAmount,
    bonusDescription: form.bonusDescription,
    giftAmount: form.giftAmount,
    giftDescription: form.giftDescription,
    correctionDirection: form.correctionDirection,
    correctionAmount: form.correctionAmount,
    correctionDescription: form.correctionDescription,
    betId: form.betId,
    gameName: form.gameName,
    betDescription: form.betDescription,
    createdBy: "",
    createdAt: "",
    updatedAt: ""
  };
  return requestCommand(fakeRequest, fakeContact);
}

function requestAmountForDisplay(request: RequestItem) {
  if (request.requestType === "Nakit hediye") return request.giftAmount ?? request.amount;
  if (request.requestType === "Düzeltme alt/üst") return request.correctionAmount ?? request.amount;
  if (request.requestType === "Bonus") return request.bonusAmount ?? request.amount;
  return request.amount;
}

function requestFullNameFromForm(form: typeof emptyRequest) {
  return formatName(`${form.firstName} ${form.lastName}`.trim());
}

function requestDisplayName(request: RequestItem, contact: Contact) {
  const name = formatName(`${request.firstName ?? ""} ${request.lastName ?? ""}`.trim());
  return name || contact.name;
}

function requestFirstName(request: RequestItem, contact: Contact) {
  return request.firstName || getFirstName(contact) || "-";
}

function requestLastName(request: RequestItem, contact: Contact) {
  if (request.lastName) return request.lastName;
  return getLastName(contact);
}

function requestPhone(request: RequestItem, contact: Contact) {
  return request.phone || contact.phone;
}

function requestGender(request: RequestItem, contact: Contact) {
  return request.gender || contact.gender;
}

function emptyContactForm() {
  return {
    firstName: "",
    lastName: "",
    username: "",
    nationalId: "",
    name: "",
    phone: "",
    gender: "Belirtilmedi",
    note: "",
    memberStatus: "Aktif",
    source: "Manuel"
  };
}

function emptyLineForm() {
  return {
    name: "",
    phoneNumber: "",
    countryCode: "+90",
    providerType: "manual",
    status: "passive",
    isDefault: false,
    assignedOperatorId: "",
    assignmentNote: "",
    notes: ""
  };
}

function memberDisplayName(contact: Contact) {
  const name = formatName(`${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim());
  return name || contact.name;
}

function memberStatusTone(status: Contact["memberStatus"]) {
  if (status === "VIP") return "border-mint/30 bg-mint/10 text-emerald-200";
  if (status === "Riskli") return "border-coral/30 bg-coral/10 text-red-200";
  if (status === "Pasif") return "border-slate-500/40 bg-slate-500/10 text-slate-300";
  return "border-sky-400/30 bg-sky-400/10 text-sky-200";
}

function getMemberLastConversation(data: AppData, contactId: string) {
  const latest = data.conversations
    .filter((conversation) => conversation.contactId === contactId)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())[0];
  return latest ? new Date(latest.lastMessageAt) : new Date(0);
}

function findMatchingMember(contacts: Contact[], form: typeof emptyRequest) {
  const phone = normalizePhone(form.phone);
  if (phone) {
    const byPhone = contacts.find((contact) => contact.isRegistered && normalizePhone(contact.phone) === phone);
    if (byPhone) return byPhone;
  }
  const name = formatName(`${form.firstName} ${form.lastName}`.trim()).toLocaleLowerCase("tr-TR");
  if (!name || name.length < 3) return undefined;
  return contacts.find((contact) => contact.isRegistered && memberDisplayName(contact).toLocaleLowerCase("tr-TR") === name);
}

function renderVoiceTemplate(content: string, contact?: Contact, request?: RequestItem) {
  return content
    .replaceAll("{isim}", getFirstName(contact))
    .replaceAll("{ad}", getFirstName(contact))
    .replaceAll("{hitap}", getHonorific(contact))
    .replaceAll("{kullaniciAdi}", contact?.username ?? "")
    .replaceAll("{telefon}", contact?.phone ?? "")
    .replaceAll("{cinsiyet}", contact?.gender ?? "")
    .replaceAll("{miktar}", request ? formatCurrency(requestAmountForDisplay(request)) : "");
}

function voiceMessagePayload(text: string, audioUrl: string, usageLogId?: string, operatorName?: string) {
  return `[VOICE]${JSON.stringify({ text, audioUrl, usageLogId, operatorName })}`;
}

function isVoiceMessage(messageText: string) {
  return messageText.startsWith("[VOICE]");
}

function parseVoiceMessage(messageText: string) {
  if (!isVoiceMessage(messageText)) return { text: messageText, audioUrl: "", usageLogId: "", operatorName: "" };
  try {
    const payload = JSON.parse(messageText.slice("[VOICE]".length)) as { text?: string; audioUrl?: string; usageLogId?: string; operatorName?: string };
    return { text: payload.text ?? "", audioUrl: payload.audioUrl ?? "", usageLogId: payload.usageLogId ?? "", operatorName: payload.operatorName ?? "" };
  } catch {
    return { text: "Sesli mesaj gönderildi.", audioUrl: "", usageLogId: "", operatorName: "" };
  }
}

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeInputValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function timeDisplay(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function isSameLocalDay(value: string, date: Date) {
  return dateKey(value) === dateInputValue(date);
}

function dateKey(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return dateInputValue(new Date(value));
}
