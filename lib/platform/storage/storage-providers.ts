import type { StorageManifest, StorageProviderContext } from "@/lib/platform/storage/storage-manifest";

export function createStorageProviderContext(manifest: StorageManifest): StorageProviderContext {
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
