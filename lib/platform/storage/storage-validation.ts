import type { StorageManifest } from "@/lib/platform/storage/storage-manifest";

export class StorageValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export function validateStorageManifest(manifest: StorageManifest) {
  if (!manifest.providerId || !manifest.name || !manifest.version || !manifest.kind || !manifest.owner || !manifest.description) {
    throw new StorageValidationError("Storage manifest is missing required metadata.", "INVALID_STORAGE_MANIFEST");
  }
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    throw new StorageValidationError(`Storage provider ${manifest.providerId} has an invalid version.`, "INVALID_STORAGE_VERSION");
  }
  if (manifest.capabilities.length === 0) {
    throw new StorageValidationError(`Storage provider ${manifest.providerId} must declare at least one capability.`, "MISSING_STORAGE_CAPABILITY");
  }
  return true;
}
