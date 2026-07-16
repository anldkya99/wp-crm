import type { IntegrationManifest } from "@/lib/platform/integrations/integration-manifest";
import { validateIntegrationManifest } from "@/lib/platform/integrations/integration-validation";

export class IntegrationRegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class IntegrationRegistry {
  private manifests = new Map<string, IntegrationManifest>();

  register(manifest: IntegrationManifest) {
    validateIntegrationManifest(manifest);
    if (this.manifests.has(manifest.providerId)) {
      throw new IntegrationRegistryError(`Duplicate integration provider: ${manifest.providerId}`, "DUPLICATE_INTEGRATION_PROVIDER");
    }
    this.manifests.set(manifest.providerId, manifest);
    return this;
  }

  registerMany(manifests: readonly IntegrationManifest[]) {
    manifests.forEach((manifest) => this.register(manifest));
    return this;
  }

  get(providerId: string) {
    return this.manifests.get(providerId) ?? null;
  }

  list() {
    return Array.from(this.manifests.values());
  }

  discover(predicate?: (manifest: IntegrationManifest) => boolean) {
    const manifests = this.list();
    return predicate ? manifests.filter(predicate) : manifests;
  }
}
