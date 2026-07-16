import type { AIManifest } from "@/lib/platform/ai/ai-manifest";
import { validateAIManifest } from "@/lib/platform/ai/ai-validation";

export class AIRegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class AIRegistry {
  private manifests = new Map<string, AIManifest>();

  register(manifest: AIManifest) {
    validateAIManifest(manifest);
    if (this.manifests.has(manifest.providerId)) {
      throw new AIRegistryError(`Duplicate AI provider: ${manifest.providerId}`, "DUPLICATE_AI_PROVIDER");
    }
    this.manifests.set(manifest.providerId, manifest);
    return this;
  }

  registerMany(manifests: readonly AIManifest[]) {
    manifests.forEach((manifest) => this.register(manifest));
    return this;
  }

  get(providerId: string) {
    return this.manifests.get(providerId) ?? null;
  }

  list() {
    return Array.from(this.manifests.values());
  }

  discover(predicate?: (manifest: AIManifest) => boolean) {
    const manifests = this.list();
    return predicate ? manifests.filter(predicate) : manifests;
  }
}
