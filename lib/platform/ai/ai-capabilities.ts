import type { AIManifest, AIProviderContext } from "@/lib/platform/ai/ai-manifest";

export function createAIProviderContext(manifest: AIManifest): AIProviderContext {
  return {
    providerId: manifest.providerId,
    kind: manifest.kind,
    capabilities: manifest.capabilities,
    lifecycle: manifest.lifecycle,
    metadata: {
      name: manifest.name,
      version: manifest.version,
      owner: manifest.owner,
      description: manifest.description
    }
  };
}
