import type { PlatformEventContext, PlatformEventManifest } from "@/lib/platform/events/event-manifest";

export type EventContextInput = {
  companyId?: string | null;
  departmentId?: string | null;
  operatorId?: string | null;
  userId?: string | null;
  permissionContext?: readonly string[];
  correlationId?: string;
};

function createCorrelationId() {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createPlatformEventContext(manifest: PlatformEventManifest, input: EventContextInput = {}): PlatformEventContext {
  return {
    eventId: manifest.eventId,
    eventName: manifest.eventName,
    source: manifest.source,
    target: manifest.target,
    category: manifest.category,
    version: manifest.version,
    timestamp: new Date().toISOString(),
    correlationId: input.correlationId ?? createCorrelationId(),
    companyId: input.companyId ?? null,
    departmentId: input.departmentId ?? null,
    operatorId: input.operatorId ?? null,
    userId: input.userId ?? null,
    permissionContext: input.permissionContext ?? []
  };
}
