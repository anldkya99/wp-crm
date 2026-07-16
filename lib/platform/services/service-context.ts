import type { PlatformEventEnvelope } from "@/lib/platform/events/event-manifest";
import { getPlatformEventFramework } from "@/lib/platform/events/event-framework";
import type { RuntimeContext } from "@/lib/platform/runtime/runtime-types";
import type { ServiceContext } from "@/lib/platform/services/service-manifest";
import type { WorkflowContext } from "@/lib/platform/workflows/workflow-manifest";

export function createServiceContext(input: {
  runtime?: RuntimeContext;
  workflow?: WorkflowContext;
  event?: PlatformEventEnvelope;
}): ServiceContext {
  return {
    runtime: input.runtime,
    workflow: input.workflow,
    event: input.event,
    companyId: input.runtime?.companyId ?? input.workflow?.companyId ?? input.event?.context.companyId ?? null,
    departmentId: input.runtime?.departmentId ?? input.workflow?.departmentId ?? input.event?.context.departmentId ?? null,
    operatorId: input.runtime?.operatorId ?? input.workflow?.operatorId ?? input.event?.context.operatorId ?? null,
    identity: input.runtime?.identity ?? input.workflow?.identity,
    configurationContext: input.runtime?.configurationContext ?? input.workflow?.configurationContext ?? {},
    licenseContext: input.runtime?.licenseContext ?? input.workflow?.licenseContext,
    eventPublisher: getPlatformEventFramework().publisher
  };
}
