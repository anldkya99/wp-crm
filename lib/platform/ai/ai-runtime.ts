import { createAIProviderContext } from "@/lib/platform/ai/ai-capabilities";
import { createAIContext } from "@/lib/platform/ai/ai-context";
import type { AIRegistry } from "@/lib/platform/ai/ai-registry";
import type { IntegrationRuntimeContext } from "@/lib/platform/integrations/integration-manifest";
import type { RuntimeContext } from "@/lib/platform/runtime/runtime-types";
import type { ServiceContext } from "@/lib/platform/services/service-manifest";
import type { StorageRuntimeContext } from "@/lib/platform/storage/storage-manifest";
import type { WorkflowContext } from "@/lib/platform/workflows/workflow-manifest";

export function createAIRuntime(
  registry: AIRegistry,
  input: {
    runtime?: RuntimeContext;
    workflow?: WorkflowContext;
    service?: ServiceContext;
    storage?: StorageRuntimeContext;
    integration?: IntegrationRuntimeContext;
  } = {}
) {
  const providers = registry.list().map((manifest) => createAIProviderContext(manifest));
  const context = createAIContext({
    providers,
    runtime: input.runtime,
    workflow: input.workflow,
    service: input.service,
    storage: input.storage,
    integration: input.integration
  });

  return {
    context,
    activeProvider: context.activeProvider,
    providers: context.providers,
    capabilities: context.capabilities,
    metadata: context.metadata
  };
}
