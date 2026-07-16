import type { IntegrationManifest, IntegrationProviderContext } from "@/lib/platform/integrations/integration-manifest";

export function createIntegrationProviderContext(manifest: IntegrationManifest): IntegrationProviderContext {
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
