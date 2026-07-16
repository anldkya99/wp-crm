import type { IntegrationProviderContext, IntegrationRuntimeContext } from "@/lib/platform/integrations/integration-manifest";
import { getIntegrationMetadata } from "@/lib/platform/integrations/integration-metadata";

export function createIntegrationContext(providers: readonly IntegrationProviderContext[]): IntegrationRuntimeContext {
  const activeProvider = providers.find((provider) => provider.lifecycle === "active") ?? providers[0];
  if (!activeProvider) throw new Error("Integration Runtime requires at least one registered provider.");
  const metadata = getIntegrationMetadata(providers);

  return {
    activeProvider,
    providers,
    capabilities: metadata.capabilities,
    metadata
  };
}
