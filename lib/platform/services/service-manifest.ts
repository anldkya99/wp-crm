import type { PlatformEventEnvelope } from "@/lib/platform/events/event-manifest";
import type { IdentityContext } from "@/lib/platform/identity/identity-manifest";
import type { RuntimeContext } from "@/lib/platform/runtime/runtime-types";
import type { WorkflowContext } from "@/lib/platform/workflows/workflow-manifest";

export type ServiceLifecycleState = "registered" | "loaded" | "active" | "deprecated" | "disabled";

export type ServiceOwnerType = "platform" | "module" | "capability" | "company";

export type ServiceContractField = {
  key: string;
  type: "string" | "number" | "boolean" | "object" | "array" | "null" | "unknown";
  required?: boolean;
  description: string;
};

export type PlatformServiceManifest = {
  serviceId: string;
  name: string;
  version: string;
  owner: {
    type: ServiceOwnerType;
    id: string;
  };
  dependencies: readonly string[];
  inputs: readonly ServiceContractField[];
  outputs: readonly ServiceContractField[];
  lifecycle: ServiceLifecycleState;
  description: string;
};

export type ServiceContext = {
  runtime?: RuntimeContext;
  workflow?: WorkflowContext;
  event?: PlatformEventEnvelope;
  companyId?: string | null;
  departmentId?: string | null;
  operatorId?: string | null;
  identity?: IdentityContext;
  configurationContext: Record<string, unknown>;
  licenseContext?: RuntimeContext["licenseContext"];
  eventPublisher?: {
    publish: <TPayload extends Record<string, unknown>>(eventId: string, payload: TPayload) => Promise<unknown>;
  };
};

export type ServiceExecutionResult<TOutput extends Record<string, unknown> = Record<string, unknown>> = {
  serviceId: string;
  status: "completed" | "failed" | "skipped";
  output: TOutput;
  startedAt: string;
  completedAt: string;
  error: string | null;
};

export type ServiceHandler = (context: ServiceContext, input: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;

export type PlatformServiceImplementation = {
  manifest: PlatformServiceManifest;
  handler: ServiceHandler;
};
