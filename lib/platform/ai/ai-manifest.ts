import type { PlatformEventContext } from "@/lib/platform/events/event-manifest";
import type { IdentityContext } from "@/lib/platform/identity/identity-manifest";
import type { IntegrationRuntimeContext } from "@/lib/platform/integrations/integration-manifest";
import type { LicenseContext } from "@/lib/platform/licensing/license-manifest";
import type { PermissionResolver } from "@/lib/platform/permission-engine";
import type { RuntimeContext } from "@/lib/platform/runtime/runtime-types";
import type { ServiceContext } from "@/lib/platform/services/service-manifest";
import type { StorageRuntimeContext } from "@/lib/platform/storage/storage-manifest";
import type { WorkflowContext } from "@/lib/platform/workflows/workflow-manifest";

export type AIProviderKind =
  | "metadata"
  | "foundation"
  | "runtime"
  | "extension";

export type AICapability =
  | "metadata"
  | "provider-context"
  | "runtime-context"
  | "capability-discovery"
  | "schema";

export type AILifecycleState = "registered" | "active" | "disabled" | "deprecated";

export type AIManifest = {
  providerId: string;
  name: string;
  version: string;
  kind: AIProviderKind;
  capabilities: readonly AICapability[];
  lifecycle: AILifecycleState;
  owner: string;
  description: string;
};

export type AIProviderContext = {
  providerId: string;
  kind: AIProviderKind;
  capabilities: readonly AICapability[];
  lifecycle: AILifecycleState;
  metadata: Record<string, unknown>;
};

export type AIMetadata = {
  providerCount: number;
  activeProviderId: string | null;
  capabilityCount: number;
  capabilities: readonly AICapability[];
  generatedAt: string;
};

export type AIRuntimeContext = {
  activeProvider: AIProviderContext;
  providers: readonly AIProviderContext[];
  capabilities: readonly AICapability[];
  metadata: AIMetadata;
  runtime?: RuntimeContext;
  identity?: IdentityContext;
  permission?: PermissionResolver;
  license?: LicenseContext;
  workflow?: WorkflowContext;
  event?: PlatformEventContext | null;
  service?: ServiceContext;
  storage?: StorageRuntimeContext;
  integration?: IntegrationRuntimeContext;
};
