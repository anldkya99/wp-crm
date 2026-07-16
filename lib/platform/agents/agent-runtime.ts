import { createAgentRuntimeSubject } from "@/lib/platform/agents/agent-capabilities";
import { createAgentContext } from "@/lib/platform/agents/agent-context";
import type { AgentRegistry } from "@/lib/platform/agents/agent-registry";
import type { AIRuntimeContext } from "@/lib/platform/ai/ai-manifest";
import type { IntegrationRuntimeContext } from "@/lib/platform/integrations/integration-manifest";
import type { RuntimeContext } from "@/lib/platform/runtime/runtime-types";
import type { ServiceContext } from "@/lib/platform/services/service-manifest";
import type { StorageRuntimeContext } from "@/lib/platform/storage/storage-manifest";
import type { WorkflowContext } from "@/lib/platform/workflows/workflow-manifest";

export function createAgentRuntime(
  registry: AgentRegistry,
  input: {
    runtime?: RuntimeContext;
    workflow?: WorkflowContext;
    service?: ServiceContext;
    storage?: StorageRuntimeContext;
    integration?: IntegrationRuntimeContext;
    ai?: AIRuntimeContext;
  } = {}
) {
  const agents = registry.list().map((manifest) => createAgentRuntimeSubject(manifest));
  const context = createAgentContext({
    agents,
    runtime: input.runtime,
    workflow: input.workflow,
    service: input.service,
    storage: input.storage,
    integration: input.integration,
    ai: input.ai
  });

  return {
    context,
    activeAgent: context.activeAgent,
    agents: context.agents,
    capabilities: context.capabilities,
    metadata: context.metadata
  };
}
