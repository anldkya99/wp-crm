import type { OrchestrationManifest } from "@/lib/platform/orchestration/orchestration-manifest";
import { validateOrchestrationManifest } from "@/lib/platform/orchestration/orchestration-validation";

export class OrchestrationRegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class OrchestrationRegistry {
  private manifests = new Map<string, OrchestrationManifest>();

  register(manifest: OrchestrationManifest) {
    validateOrchestrationManifest(manifest);
    if (this.manifests.has(manifest.orchestratorId)) {
      throw new OrchestrationRegistryError(`Duplicate orchestrator registration: ${manifest.orchestratorId}`, "DUPLICATE_ORCHESTRATOR_REGISTRATION");
    }
    this.manifests.set(manifest.orchestratorId, manifest);
    return this;
  }

  registerMany(manifests: readonly OrchestrationManifest[]) {
    manifests.forEach((manifest) => this.register(manifest));
    return this;
  }

  get(orchestratorId: string) {
    return this.manifests.get(orchestratorId) ?? null;
  }

  list() {
    return Array.from(this.manifests.values());
  }

  discover(predicate?: (manifest: OrchestrationManifest) => boolean) {
    const manifests = this.list();
    return predicate ? manifests.filter(predicate) : manifests;
  }
}
