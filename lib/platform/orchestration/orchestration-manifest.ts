import type { AgentRuntimeContext } from "@/lib/platform/agents/agent-manifest";
import type { AIRuntimeContext } from "@/lib/platform/ai/ai-manifest";
import type { PlatformEventContext } from "@/lib/platform/events/event-manifest";
import type { IdentityContext } from "@/lib/platform/identity/identity-manifest";
import type { IntegrationRuntimeContext } from "@/lib/platform/integrations/integration-manifest";
import type { LicenseContext } from "@/lib/platform/licensing/license-manifest";
import type { PermissionResolver } from "@/lib/platform/permission-engine";
import type { RuntimeContext } from "@/lib/platform/runtime/runtime-types";
import type { ServiceContext } from "@/lib/platform/services/service-manifest";
import type { StorageRuntimeContext } from "@/lib/platform/storage/storage-manifest";
import type { WorkflowContext } from "@/lib/platform/workflows/workflow-manifest";

export type OrchestratorKind =
  | "metadata"
  | "foundation"
  | "runtime"
  | "extension";

export type OrchestrationCapability =
  | "metadata"
  | "orchestration-context"
  | "runtime-context"
  | "capability-discovery"
  | "schema";

export type OrchestrationLifecycleState = "registered" | "active" | "disabled" | "deprecated";

export type OrchestrationManifest = {
  orchestratorId: string;
  name: string;
  version: string;
  kind: OrchestratorKind;
  capabilities: readonly OrchestrationCapability[];
  lifecycle: OrchestrationLifecycleState;
  owner: string;
  description: string;
};

export type OrchestratorContext = {
  orchestratorId: string;
  kind: OrchestratorKind;
  capabilities: readonly OrchestrationCapability[];
  lifecycle: OrchestrationLifecycleState;
  metadata: Record<string, unknown>;
};

export type OrchestrationMetadata = {
  orchestratorCount: number;
  activeOrchestratorId: string | null;
  capabilityCount: number;
  capabilities: readonly OrchestrationCapability[];
  generatedAt: string;
};

export type OrchestrationRuntimeContext = {
  activeOrchestrator: OrchestratorContext;
  orchestrators: readonly OrchestratorContext[];
  capabilities: readonly OrchestrationCapability[];
  metadata: OrchestrationMetadata;
  runtime?: RuntimeContext;
  identity?: IdentityContext;
  permission?: PermissionResolver;
  license?: LicenseContext;
  workflow?: WorkflowContext;
  event?: PlatformEventContext | null;
  service?: ServiceContext;
  storage?: StorageRuntimeContext;
  integration?: IntegrationRuntimeContext;
  ai?: AIRuntimeContext;
  agent?: AgentRuntimeContext;
};
