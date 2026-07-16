import type { PlatformServiceManifest } from "@/lib/platform/services/service-manifest";

export class ServiceRegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class ServiceRegistry {
  private manifests = new Map<string, PlatformServiceManifest>();

  register(manifest: PlatformServiceManifest) {
    this.validateManifest(manifest);
    if (this.manifests.has(manifest.serviceId)) {
      throw new ServiceRegistryError(`Duplicate service registration: ${manifest.serviceId}`, "DUPLICATE_SERVICE");
    }
    this.manifests.set(manifest.serviceId, manifest);
    return this;
  }

  registerMany(manifests: readonly PlatformServiceManifest[]) {
    manifests.forEach((manifest) => this.register(manifest));
    this.validateDependencies();
    return this;
  }

  get(serviceId: string) {
    return this.manifests.get(serviceId) ?? null;
  }

  list() {
    return Array.from(this.manifests.values());
  }

  discover(predicate?: (manifest: PlatformServiceManifest) => boolean) {
    const manifests = this.list();
    return predicate ? manifests.filter(predicate) : manifests;
  }

  resolveDependencies(serviceIds: readonly string[]) {
    const resolved: PlatformServiceManifest[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (serviceId: string) => {
      if (visited.has(serviceId)) return;
      if (visiting.has(serviceId)) {
        throw new ServiceRegistryError(`Circular service dependency detected at ${serviceId}.`, "CIRCULAR_SERVICE_DEPENDENCY");
      }
      const manifest = this.get(serviceId);
      if (!manifest) throw new ServiceRegistryError(`Missing service dependency: ${serviceId}.`, "MISSING_SERVICE_DEPENDENCY");
      visiting.add(serviceId);
      manifest.dependencies.forEach(visit);
      visiting.delete(serviceId);
      visited.add(serviceId);
      resolved.push(manifest);
    };

    serviceIds.forEach(visit);
    return resolved.filter((manifest, index, list) => list.findIndex((item) => item.serviceId === manifest.serviceId) === index);
  }

  private validateManifest(manifest: PlatformServiceManifest) {
    if (!manifest.serviceId || !manifest.name || !manifest.version || !manifest.owner.id || !manifest.description) {
      throw new ServiceRegistryError("Service manifest is missing required metadata.", "INVALID_SERVICE_MANIFEST");
    }
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new ServiceRegistryError(`Service ${manifest.serviceId} has an invalid version.`, "INVALID_SERVICE_VERSION");
    }
  }

  private validateDependencies() {
    this.list().forEach((manifest) => {
      manifest.dependencies.forEach((dependency) => {
        if (!this.manifests.has(dependency)) {
          throw new ServiceRegistryError(`Service ${manifest.serviceId} depends on missing service ${dependency}.`, "MISSING_SERVICE_DEPENDENCY");
        }
      });
    });
    this.list().forEach((manifest) => this.resolveDependencies([manifest.serviceId]));
  }
}
