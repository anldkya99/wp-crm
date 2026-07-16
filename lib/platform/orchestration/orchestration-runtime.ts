import { createOrchestratorContext } from "@/lib/platform/orchestration/orchestration-capabilities";
import { createOrchestrationContext } from "@/lib/platform/orchestration/orchestration-context";
import type { OrchestrationRegistry } from "@/lib/platform/orchestration/orchestration-registry";
import type { AgentRuntimeContext } from "@/lib/platform/agents/agent-manifest";
import type { AIRuntimeContext } from "@/lib/platform/ai/ai-manifest";
import type { IntegrationRuntimeContext } from "@/lib/platform/integrations/integration-manifest";
import type { RuntimeContext } from "@/lib/platform/runtime/runtime-types";
import type { ServiceContext } from "@/lib/platform/services/service-manifest";
import type { StorageRuntimeContext } from "@/lib/platform/storage/storage-manifest";
import type { WorkflowContext } from "@/lib/platform/workflows/workflow-manifest";

export function createOrchestrationRuntime(
  registry: OrchestrationRegistry,
  input: {
    runtime?: RuntimeContext;
    workflow?: WorkflowContext;
    service?: ServiceContext;
    storage?: StorageRuntimeContext;
    integration?: IntegrationRuntimeContext;
    ai?: AIRuntimeContext;
    agent?: AgentRuntimeContext;
  } = {}
) {
  const orchestrators = registry.list().map((manifest) => createOrchestratorContext(manifest));
  const context = createOrchestrationContext({
    orchestrators,
    runtime: input.runtime,
    workflow: input.workflow,
    service: input.service,
    storage: input.storage,
    integration: input.integration,
    ai: input.ai,
    agent: input.agent
  });

  return {
    context,
    activeOrchestrator: context.activeOrchestrator,
    orchestrators: context.orchestrators,
    capabilities: context.capabilities,
    metadata: context.metadata
  };
}
