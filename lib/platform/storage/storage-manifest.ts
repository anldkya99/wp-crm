export type StorageProviderKind =
  | "metadata"
  | "relational"
  | "document"
  | "object"
  | "cache"
  | "file"
  | "external";

export type StorageCapability =
  | "metadata"
  | "schema"
  | "provider-context"
  | "runtime-context"
  | "capability-discovery";

export type StorageLifecycleState = "registered" | "active" | "disabled" | "deprecated";

export type StorageManifest = {
  providerId: string;
  name: string;
  version: string;
  kind: StorageProviderKind;
  capabilities: readonly StorageCapability[];
  lifecycle: StorageLifecycleState;
  owner: string;
  description: string;
};

export type StorageProviderContext = {
  providerId: string;
  kind: StorageProviderKind;
  capabilities: readonly StorageCapability[];
  lifecycle: StorageLifecycleState;
  metadata: Record<string, unknown>;
};

export type StorageMetadata = {
  providerCount: number;
  activeProviderId: string | null;
  capabilityCount: number;
  capabilities: readonly StorageCapability[];
  generatedAt: string;
};

export type StorageRuntimeContext = {
  activeProvider: StorageProviderContext;
  providers: readonly StorageProviderContext[];
  capabilities: readonly StorageCapability[];
  metadata: StorageMetadata;
};
