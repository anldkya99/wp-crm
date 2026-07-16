import type { PlatformCapabilityManifest } from "@/lib/platform/capabilities/capability-manifest";
import type { ModuleRegistry } from "@/lib/platform/modules/module-registry";

export class CapabilityRegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class CapabilityRegistry {
  private manifests = new Map<string, PlatformCapabilityManifest>();

  constructor(private moduleRegistry?: ModuleRegistry) {}

  register(manifest: PlatformCapabilityManifest) {
    this.validateManifest(manifest);
    if (this.manifests.has(manifest.capabilityId)) {
      throw new CapabilityRegistryError(`Duplicate capability registration: ${manifest.capabilityId}`, "DUPLICATE_CAPABILITY");
    }
    if (this.moduleRegistry && !this.moduleRegistry.get(manifest.moduleId)) {
      throw new CapabilityRegistryError(`Capability ${manifest.capabilityId} references missing module ${manifest.moduleId}.`, "MISSING_MODULE");
    }
    this.manifests.set(manifest.capabilityId, manifest);
    return this;
  }

  registerMany(manifests: readonly PlatformCapabilityManifest[]) {
    manifests.forEach((manifest) => this.register(manifest));
    this.validateDependencies();
    return this;
  }

  get(capabilityId: string) {
    return this.manifests.get(capabilityId) ?? null;
  }

  list() {
    return Array.from(this.manifests.values());
  }

  discover(predicate?: (manifest: PlatformCapabilityManifest) => boolean) {
    const manifests = this.list();
    return predicate ? manifests.filter(predicate) : manifests;
  }

  resolveDependencies(capabilityIds: readonly string[]) {
    const resolved: PlatformCapabilityManifest[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (capabilityId: string) => {
      if (visited.has(capabilityId)) return;
      if (visiting.has(capabilityId)) {
        throw new CapabilityRegistryError(`Circular capability dependency detected at ${capabilityId}.`, "CIRCULAR_DEPENDENCY");
      }
      const manifest = this.get(capabilityId);
      if (!manifest) throw new CapabilityRegistryError(`Missing capability dependency: ${capabilityId}.`, "MISSING_DEPENDENCY");
      visiting.add(capabilityId);
      manifest.dependencies.forEach(visit);
      visiting.delete(capabilityId);
      visited.add(capabilityId);
      resolved.push(manifest);
    };

    capabilityIds.forEach(visit);
    return resolved.filter((manifest, index, list) => list.findIndex((item) => item.capabilityId === manifest.capabilityId) === index);
  }

  private validateManifest(manifest: PlatformCapabilityManifest) {
    if (!manifest.capabilityId || !manifest.moduleId || !manifest.name || !manifest.version || !manifest.licenseRequirement) {
      throw new CapabilityRegistryError("Capability manifest is missing required metadata.", "INVALID_CAPABILITY_MANIFEST");
    }
  }

  private validateDependencies() {
    this.list().forEach((manifest) => {
      manifest.dependencies.forEach((dependency) => {
        if (!this.manifests.has(dependency)) {
          throw new CapabilityRegistryError(`Capability ${manifest.capabilityId} depends on missing capability ${dependency}.`, "MISSING_DEPENDENCY");
        }
      });
    });
    this.list().forEach((manifest) => this.resolveDependencies([manifest.capabilityId]));
  }
}
