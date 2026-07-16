import type { IntegrationMetadata, IntegrationProviderContext } from "@/lib/platform/integrations/integration-manifest";

export function getIntegrationMetadata(providers: readonly IntegrationProviderContext[]): IntegrationMetadata {
  const activeProvider = providers.find((provider) => provider.lifecycle === "active") ?? providers[0] ?? null;
  const capabilities = Array.from(new Set(providers.flatMap((provider) => provider.capabilities)));

  return {
    providerCount: providers.length,
    activeProviderId: activeProvider?.providerId ?? null,
    capabilityCount: capabilities.length,
    capabilities,
    generatedAt: new Date().toISOString()
  };
}
