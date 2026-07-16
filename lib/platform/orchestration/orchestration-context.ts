import type { OrchestrationRuntimeContext, OrchestratorContext } from "@/lib/platform/orchestration/orchestration-manifest";
import { getOrchestrationMetadata } from "@/lib/platform/orchestration/orchestration-metadata";

export function createOrchestrationContext(input: {
  orchestrators: readonly OrchestratorContext[];
  runtime?: OrchestrationRuntimeContext["runtime"];
  workflow?: OrchestrationRuntimeContext["workflow"];
  service?: OrchestrationRuntimeContext["service"];
  storage?: OrchestrationRuntimeContext["storage"];
  integration?: OrchestrationRuntimeContext["integration"];
  ai?: OrchestrationRuntimeContext["ai"];
  agent?: OrchestrationRuntimeContext["agent"];
}): OrchestrationRuntimeContext {
  const activeOrchestrator = input.orchestrators.find((orchestrator) => orchestrator.lifecycle === "active") ?? input.orchestrators[0];
  if (!activeOrchestrator) throw new Error("Orchestration Runtime requires at least one registered orchestrator.");
  const metadata = getOrchestrationMetadata(input.orchestrators);
  const runtime = input.runtime;

  return {
    activeOrchestrator,
    orchestrators: input.orchestrators,
    capabilities: metadata.capabilities,
    metadata,
    runtime,
    identity: runtime?.identity ?? input.workflow?.identity ?? input.service?.identity ?? input.agent?.identity ?? input.ai?.identity,
    permission: runtime?.permissionResolver ?? input.agent?.permission ?? input.ai?.permission,
    license: runtime?.licenseContext ?? input.workflow?.licenseContext ?? input.service?.licenseContext ?? input.agent?.license ?? input.ai?.license,
    workflow: input.workflow,
    event: runtime?.eventContext.lastEvent ?? input.service?.event?.context ?? input.agent?.event ?? input.ai?.event ?? null,
    service: input.service,
    storage: input.storage ?? input.agent?.storage ?? input.ai?.storage,
    integration: input.integration ?? input.agent?.integration ?? input.ai?.integration,
    ai: input.ai,
    agent: input.agent
  };
}
