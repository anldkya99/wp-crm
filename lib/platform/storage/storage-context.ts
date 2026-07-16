import type { StorageProviderContext, StorageRuntimeContext } from "@/lib/platform/storage/storage-manifest";
import { getStorageMetadata } from "@/lib/platform/storage/storage-metadata";

export function createStorageContext(providers: readonly StorageProviderContext[]): StorageRuntimeContext {
  const activeProvider = providers.find((provider) => provider.lifecycle === "active") ?? providers[0];
  if (!activeProvider) throw new Error("Storage Runtime requires at least one registered provider.");
  const metadata = getStorageMetadata(providers);

  return {
    activeProvider,
    providers,
    capabilities: metadata.capabilities,
    metadata
  };
}
