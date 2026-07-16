import type { PlatformEventEnvelope } from "@/lib/platform/events/event-manifest";
import type { IdentityContext } from "@/lib/platform/identity/identity-manifest";
import type { RuntimeContext } from "@/lib/platform/runtime/runtime-types";

export type WorkflowTriggerType =
  | "platform_event"
  | "company_event"
  | "department_event"
  | "operator_event"
  | "runtime_event"
  | "ai_event"
  | "manual"
  | "scheduled";

export type WorkflowOwnerType = "platform" | "module" | "capability" | "company";

export type WorkflowTriggerDefinition = {
  triggerId: string;
  type: WorkflowTriggerType;
  eventId?: string;
  description: string;
};

export type WorkflowConditionDefinition = {
  conditionId: string;
  parameters?: Record<string, unknown>;
};

export type WorkflowActionDefinition = {
  actionId: string;
  parameters?: Record<string, unknown>;
};

export type WorkflowManifest = {
  workflowId: string;
  name: string;
  version: string;
  trigger: WorkflowTriggerDefinition;
  conditions: readonly WorkflowConditionDefinition[];
  actions: readonly WorkflowActionDefinition[];
  owner: {
    type: WorkflowOwnerType;
    id: string;
  };
  description: string;
  enabled: boolean;
};

export type WorkflowExecutionStatus = "pending" | "skipped" | "running" | "completed" | "failed";

export type WorkflowContext = {
  workflow: WorkflowManifest;
  event?: PlatformEventEnvelope;
  runtime?: RuntimeContext;
  companyId?: string | null;
  departmentId?: string | null;
  operatorId?: string | null;
  identity?: IdentityContext;
  configurationContext: Record<string, unknown>;
  licenseContext?: RuntimeContext["licenseContext"];
};

export type WorkflowExecutionRecord = {
  executionId: string;
  workflowId: string;
  triggerId: string;
  status: WorkflowExecutionStatus;
  startedAt: string;
  completedAt: string | null;
  actionsExecuted: readonly string[];
  conditionsEvaluated: readonly string[];
  error: string | null;
};

export type WorkflowConditionHandler = (context: WorkflowContext, parameters?: Record<string, unknown>) => boolean | Promise<boolean>;
export type WorkflowActionHandler = (context: WorkflowContext, parameters?: Record<string, unknown>) => void | Promise<void>;
