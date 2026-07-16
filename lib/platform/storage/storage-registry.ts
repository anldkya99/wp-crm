import type { StorageManifest } from "@/lib/platform/storage/storage-manifest";
import { validateStorageManifest } from "@/lib/platform/storage/storage-validation";

export class StorageRegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class StorageRegistry {
  private manifests = new Map<string, StorageManifest>();

  register(manifest: StorageManifest) {
    validateStorageManifest(manifest);
    if (this.manifests.has(manifest.providerId)) {
      throw new StorageRegistryError(`Duplicate storage provider: ${manifest.providerId}`, "DUPLICATE_STORAGE_PROVIDER");
    }
    this.manifests.set(manifest.providerId, manifest);
    return this;
  }

  registerMany(manifests: readonly StorageManifest[]) {
    manifests.forEach((manifest) => this.register(manifest));
    return this;
  }

  get(providerId: string) {
    return this.manifests.get(providerId) ?? null;
  }

  list() {
    return Array.from(this.manifests.values());
  }

  discover(predicate?: (manifest: StorageManifest) => boolean) {
    const manifests = this.list();
    return predicate ? manifests.filter(predicate) : manifests;
  }
}
