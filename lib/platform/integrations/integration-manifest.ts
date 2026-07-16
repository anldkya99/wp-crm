export type IntegrationProviderKind =
  | "metadata"
  | "api"
  | "messaging"
  | "ai"
  | "cloud"
  | "marketplace"
  | "identity"
  | "communication";

export type IntegrationCapability =
  | "metadata"
  | "provider-context"
  | "runtime-context"
  | "capability-discovery"
  | "schema";

export type IntegrationLifecycleState = "registered" | "active" | "disabled" | "deprecated";

export type IntegrationManifest = {
  providerId: string;
  name: string;
  version: string;
  kind: IntegrationProviderKind;
  capabilities: readonly IntegrationCapability[];
  lifecycle: IntegrationLifecycleState;
  owner: string;
  description: string;
};

export type IntegrationProviderContext = {
  providerId: string;
  kind: IntegrationProviderKind;
  capabilities: readonly IntegrationCapability[];
  lifecycle: IntegrationLifecycleState;
  metadata: Record<string, unknown>;
};

export type IntegrationMetadata = {
  providerCount: number;
  activeProviderId: string | null;
  capabilityCount: number;
  capabilities: readonly IntegrationCapability[];
  generatedAt: string;
};

export type IntegrationRuntimeContext = {
  activeProvider: IntegrationProviderContext;
  providers: readonly IntegrationProviderContext[];
  capabilities: readonly IntegrationCapability[];
  metadata: IntegrationMetadata;
};
