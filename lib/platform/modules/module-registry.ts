import type { PlatformModuleManifest } from "@/lib/platform/modules/module-manifest";

export class ModuleRegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class ModuleRegistry {
  private manifests = new Map<string, PlatformModuleManifest>();

  register(manifest: PlatformModuleManifest) {
    this.validateManifest(manifest);
    if (this.manifests.has(manifest.moduleId)) {
      throw new ModuleRegistryError(`Duplicate module registration: ${manifest.moduleId}`, "DUPLICATE_MODULE");
    }
    this.manifests.set(manifest.moduleId, manifest);
    return this;
  }

  registerMany(manifests: readonly PlatformModuleManifest[]) {
    manifests.forEach((manifest) => this.register(manifest));
    this.validateDependencies();
    return this;
  }

  get(moduleId: string) {
    return this.manifests.get(moduleId) ?? null;
  }

  list() {
    return Array.from(this.manifests.values());
  }

  discover(predicate?: (manifest: PlatformModuleManifest) => boolean) {
    const manifests = this.list();
    return predicate ? manifests.filter(predicate) : manifests;
  }

  resolveDependencies(moduleIds: readonly string[]) {
    const requested = new Set(moduleIds);
    const resolved: PlatformModuleManifest[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (moduleId: string) => {
      if (visited.has(moduleId)) return;
      if (visiting.has(moduleId)) {
        throw new ModuleRegistryError(`Circular module dependency detected at ${moduleId}.`, "CIRCULAR_DEPENDENCY");
      }
      const manifest = this.get(moduleId);
      if (!manifest) throw new ModuleRegistryError(`Missing module dependency: ${moduleId}.`, "MISSING_DEPENDENCY");
      visiting.add(moduleId);
      manifest.dependencies.forEach(visit);
      visiting.delete(moduleId);
      visited.add(moduleId);
      if (requested.has(moduleId) || manifest.dependencies.length >= 0) resolved.push(manifest);
    };

    moduleIds.forEach(visit);
    return resolved.filter((manifest, index, list) => list.findIndex((item) => item.moduleId === manifest.moduleId) === index);
  }

  private validateManifest(manifest: PlatformModuleManifest) {
    if (!manifest.moduleId || !manifest.name || !manifest.version || !manifest.licenseRequirement) {
      throw new ModuleRegistryError("Module manifest is missing required identity metadata.", "INVALID_MANIFEST");
    }
  }

  private validateDependencies() {
    this.list().forEach((manifest) => {
      manifest.dependencies.forEach((dependency) => {
        if (!this.manifests.has(dependency)) {
          throw new ModuleRegistryError(`Module ${manifest.moduleId} depends on missing module ${dependency}.`, "MISSING_DEPENDENCY");
        }
      });
    });
    this.list().forEach((manifest) => this.resolveDependencies([manifest.moduleId]));
  }
}
