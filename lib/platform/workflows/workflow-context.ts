import type { PlatformEventEnvelope } from "@/lib/platform/events/event-manifest";
import type { RuntimeContext } from "@/lib/platform/runtime/runtime-types";
import type { WorkflowContext, WorkflowManifest } from "@/lib/platform/workflows/workflow-manifest";

export function createWorkflowContext(input: {
  workflow: WorkflowManifest;
  event?: PlatformEventEnvelope;
  runtime?: RuntimeContext;
}): WorkflowContext {
  return {
    workflow: input.workflow,
    event: input.event,
    runtime: input.runtime,
    companyId: input.runtime?.companyId ?? input.event?.context.companyId ?? null,
    departmentId: input.runtime?.departmentId ?? input.event?.context.departmentId ?? null,
    operatorId: input.runtime?.operatorId ?? input.event?.context.operatorId ?? null,
    identity: input.runtime?.identity,
    configurationContext: input.runtime?.configurationContext ?? {},
    licenseContext: input.runtime?.licenseContext
  };
}
