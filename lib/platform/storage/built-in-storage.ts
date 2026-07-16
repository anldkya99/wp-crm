import type { StorageManifest } from "@/lib/platform/storage/storage-manifest";

export const builtInStorageManifests: readonly StorageManifest[] = [
  {
    providerId: "platform.storage.metadata",
    name: "Platform Storage Metadata Provider",
    version: "1.0.0",
    kind: "metadata",
    capabilities: ["metadata", "schema", "provider-context", "runtime-context", "capability-discovery"],
    lifecycle: "active",
    owner: "operation-pact",
    description: "Foundation-only storage metadata provider. It does not read or write persistent data."
  }
];
