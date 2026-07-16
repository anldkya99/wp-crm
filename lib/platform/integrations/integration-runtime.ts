import type { IntegrationRegistry } from "@/lib/platform/integrations/integration-registry";
import { createIntegrationContext } from "@/lib/platform/integrations/integration-context";
import { createIntegrationProviderContext } from "@/lib/platform/integrations/integration-providers";

export function createIntegrationRuntime(registry: IntegrationRegistry) {
  const providers = registry.list().map((manifest) => createIntegrationProviderContext(manifest));
  const context = createIntegrationContext(providers);

  return {
    context,
    activeProvider: context.activeProvider,
    providers: context.providers,
    capabilities: context.capabilities,
    metadata: context.metadata
  };
}
