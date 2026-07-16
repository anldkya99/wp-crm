import type { LicensePackageKey, LicensePackageManifest } from "@/lib/platform/licensing/license-manifest";

export class LicenseRegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class LicenseRegistry {
  private packages = new Map<LicensePackageKey, LicensePackageManifest>();

  register(manifest: LicensePackageManifest) {
    this.validateManifest(manifest);
    if (this.packages.has(manifest.packageId)) {
      throw new LicenseRegistryError(`Duplicate license package: ${manifest.packageId}`, "DUPLICATE_LICENSE_PACKAGE");
    }
    this.packages.set(manifest.packageId, manifest);
    return this;
  }

  registerMany(manifests: readonly LicensePackageManifest[]) {
    manifests.forEach((manifest) => this.register(manifest));
    this.validateDependencies();
    return this;
  }

  get(packageId: string) {
    return this.packages.get(packageId as LicensePackageKey) ?? null;
  }

  list() {
    return Array.from(this.packages.values());
  }

  resolveInheritance(packageId: LicensePackageKey) {
    const resolved: LicensePackageManifest[] = [];
    const visiting = new Set<LicensePackageKey>();
    const visited = new Set<LicensePackageKey>();

    const visit = (currentPackageId: LicensePackageKey) => {
      if (visited.has(currentPackageId)) return;
      if (visiting.has(currentPackageId)) {
        throw new LicenseRegistryError(`Circular license package dependency: ${currentPackageId}`, "CIRCULAR_LICENSE_DEPENDENCY");
      }
      const manifest = this.get(currentPackageId);
      if (!manifest) throw new LicenseRegistryError(`Missing license package dependency: ${currentPackageId}`, "MISSING_LICENSE_DEPENDENCY");
      visiting.add(currentPackageId);
      manifest.dependencies.forEach(visit);
      visiting.delete(currentPackageId);
      visited.add(currentPackageId);
      resolved.push(manifest);
    };

    visit(packageId);
    return resolved;
  }

  private validateManifest(manifest: LicensePackageManifest) {
    if (!manifest.packageId || !manifest.packageName || !manifest.version) {
      throw new LicenseRegistryError("License package manifest is missing required metadata.", "INVALID_LICENSE_PACKAGE");
    }
  }

  private validateDependencies() {
    this.list().forEach((manifest) => {
      manifest.dependencies.forEach((dependency) => {
        if (!this.packages.has(dependency)) {
          throw new LicenseRegistryError(`License package ${manifest.packageId} depends on missing package ${dependency}.`, "MISSING_LICENSE_DEPENDENCY");
        }
      });
    });
    this.list().forEach((manifest) => this.resolveInheritance(manifest.packageId));
  }
}
