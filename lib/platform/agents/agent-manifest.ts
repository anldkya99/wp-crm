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

export type AgentKind =
  | "metadata"
  | "foundation"
  | "runtime"
  | "extension";

export type AgentCapability =
  | "metadata"
  | "agent-context"
  | "runtime-context"
  | "capability-discovery"
  | "schema";

export type AgentLifecycleState = "registered" | "active" | "disabled" | "deprecated";

export type AgentManifest = {
  agentId: string;
  name: string;
  version: string;
  kind: AgentKind;
  capabilities: readonly AgentCapability[];
  lifecycle: AgentLifecycleState;
  owner: string;
  description: string;
};

export type AgentRuntimeSubject = {
  agentId: string;
  kind: AgentKind;
  capabilities: readonly AgentCapability[];
  lifecycle: AgentLifecycleState;
  metadata: Record<string, unknown>;
};

export type AgentMetadata = {
  agentCount: number;
  activeAgentId: string | null;
  capabilityCount: number;
  capabilities: readonly AgentCapability[];
  generatedAt: string;
};

export type AgentRuntimeContext = {
  activeAgent: AgentRuntimeSubject;
  agents: readonly AgentRuntimeSubject[];
  capabilities: readonly AgentCapability[];
  metadata: AgentMetadata;
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
};
