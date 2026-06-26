import type { ConversationStatus, RequestStatus } from "@/types/domain";

export const requestStatusLabels = {
  NEW: "Yeni",
  IN_PROGRESS: "İşlemde",
  WAITING: "Beklemede",
  COMPLETED: "Tamamlandı",
  CLOSED: "Kapatıldı"
} as const;

export const conversationStatusLabels = {
  NEW: "Yeni",
  IN_PROGRESS: "İşlemde",
  ANSWERED: "Cevaplandı",
  CLOSED: "Kapandı"
} as const;

export const userRoleLabels = {
  ADMIN: "Admin",
  TEAM_LEAD: "Takım Lideri",
  OPERATOR: "Operatör"
} as const;

export const userStatusLabels = {
  ACTIVE: "Aktif",
  PASSIVE: "Pasif"
} as const;

export function toRequestStatus(value: RequestStatus) {
  return findKey(requestStatusLabels, value) ?? "NEW";
}

export function toConversationStatus(value: ConversationStatus) {
  return findKey(conversationStatusLabels, value) ?? "NEW";
}

export function toUserRole(value: string) {
  if (value === "Admin") return "ADMIN";
  if (value === "Takım Lideri" || value === "Takim Lideri") return "TEAM_LEAD";
  return "OPERATOR";
}

export function toUserStatus(value: string) {
  return value === "Pasif" ? "PASSIVE" : "ACTIVE";
}

function findKey<T extends Record<string, string>>(map: T, label: string) {
  return Object.entries(map).find(([, value]) => value === label)?.[0] as keyof T | undefined;
}
