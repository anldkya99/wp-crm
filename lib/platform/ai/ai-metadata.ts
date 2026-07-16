import type { AIMetadata, AIProviderContext } from "@/lib/platform/ai/ai-manifest";

export function getAIMetadata(providers: readonly AIProviderContext[]): AIMetadata {
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
