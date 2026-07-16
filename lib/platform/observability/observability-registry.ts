import type { ObservabilityProvider } from "@/lib/platform/observability/component-health";

export class ObservabilityRegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class ObservabilityRegistry {
  private providers = new Map<string, ObservabilityProvider>();

  register(provider: ObservabilityProvider) {
    this.validateProvider(provider);
    if (this.providers.has(provider.manifest.componentId)) {
      throw new ObservabilityRegistryError(`Duplicate observable component: ${provider.manifest.componentId}`, "DUPLICATE_OBSERVABLE_COMPONENT");
    }
    this.providers.set(provider.manifest.componentId, provider);
    return this;
  }

  registerMany(providers: readonly ObservabilityProvider[]) {
    providers.forEach((provider) => this.register(provider));
    return this;
  }

  get(componentId: string) {
    return this.providers.get(componentId) ?? null;
  }

  list() {
    return Array.from(this.providers.values());
  }

  private validateProvider(provider: ObservabilityProvider) {
    const manifest = provider.manifest;
    if (!manifest.componentId || !manifest.componentName || !manifest.componentType || !manifest.version) {
      throw new ObservabilityRegistryError("Observability manifest is missing required metadata.", "INVALID_OBSERVABILITY_MANIFEST");
    }
  }
}
