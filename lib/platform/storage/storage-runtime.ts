import type { StorageRegistry } from "@/lib/platform/storage/storage-registry";
import { createStorageContext } from "@/lib/platform/storage/storage-context";
import { createStorageProviderContext } from "@/lib/platform/storage/storage-providers";

export function createStorageRuntime(registry: StorageRegistry) {
  const providers = registry.list().map((manifest) => createStorageProviderContext(manifest));
  const context = createStorageContext(providers);

  return {
    context,
    activeProvider: context.activeProvider,
    providers: context.providers,
    capabilities: context.capabilities,
    metadata: context.metadata
  };
}
