export type PlatformEventCategory =
  | "Platform"
  | "Company"
  | "Department"
  | "Operator"
  | "AI"
  | "Communication"
  | "Security"
  | "Audit"
  | "Runtime"
  | "System";

export type PlatformEventSource =
  | "platform"
  | "runtime"
  | "module"
  | "capability"
  | "configuration"
  | "licensing"
  | "provisioning"
  | "security"
  | "audit";

export type PlatformEventManifest = {
  eventId: string;
  eventName: string;
  source: PlatformEventSource;
  target: string;
  version: string;
  payloadSchema: Record<string, "string" | "number" | "boolean" | "object" | "array" | "null" | "unknown">;
  category: PlatformEventCategory;
  description: string;
};

export type PlatformEventContext = {
  eventId: string;
  eventName: string;
  source: PlatformEventSource;
  target: string;
  category: PlatformEventCategory;
  version: string;
  timestamp: string;
  correlationId: string;
  companyId?: string | null;
  departmentId?: string | null;
  operatorId?: string | null;
  userId?: string | null;
  permissionContext?: readonly string[];
};

export type PlatformEventEnvelope<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  manifest: PlatformEventManifest;
  context: PlatformEventContext;
  payload: TPayload;
};

export type PlatformEventSubscriber<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  subscriberId: string;
  eventId: string;
  handler: (event: PlatformEventEnvelope<TPayload>) => void | Promise<void>;
};
