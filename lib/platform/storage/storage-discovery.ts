import { builtInStorageManifests } from "@/lib/platform/storage/built-in-storage";
import { StorageRegistry } from "@/lib/platform/storage/storage-registry";

export function discoverStorageProviders() {
  return builtInStorageManifests;
}

export function createStorageRegistry() {
  return new StorageRegistry().registerMany(discoverStorageProviders());
}

export const platformStorageRegistry = createStorageRegistry();
