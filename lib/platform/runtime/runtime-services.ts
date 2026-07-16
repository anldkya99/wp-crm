import type { RuntimeCompanyConfiguration } from "@/lib/platform/runtime/runtime-types";
import { activateRuntimeResolution } from "@/lib/platform/runtime/runtime-activation";
import { createRuntimeContext } from "@/lib/platform/runtime/runtime-context";
import { createAgentRuntime } from "@/lib/platform/agents/agent-runtime";
import { platformAgentRegistry } from "@/lib/platform/agents/agent-discovery";
import { createAIRuntime } from "@/lib/platform/ai/ai-runtime";
import { platformAIRegistry } from "@/lib/platform/ai/ai-discovery";
import { getPlatformEventFramework } from "@/lib/platform/events/event-framework";
import { getPlatformIntegrationFramework } from "@/lib/platform/integrations/integration-framework";
import { getPlatformObservabilityFramework } from "@/lib/platform/observability/observability-framework";
import { createOrchestrationRuntime } from "@/lib/platform/orchestration/orchestration-runtime";
import { platformOrchestrationRegistry } from "@/lib/platform/orchestration/orchestration-discovery";
import { getPlatformServiceFramework } from "@/lib/platform/services/service-framework";
import { getPlatformStorageFramework } from "@/lib/platform/storage/storage-framework";
import { getPlatformWorkflowEngine } from "@/lib/platform/workflows/workflow-engine";
import { getRuntimeHealth } from "@/lib/platform/runtime/runtime-health";
import { buildRuntimeNavigation } from "@/lib/platform/runtime/runtime-navigation";
import { resolvePlatformRuntime } from "@/lib/platform/runtime/runtime-resolver";
import { createRuntimeStateStore } from "@/lib/platform/runtime/runtime-state";
import { getRuntimeMetadata } from "@/lib/platform/runtime/runtime-metadata";

export function createPlatformRuntimeServices(configuration: RuntimeCompanyConfiguration) {
  const events = getPlatformEventFramework();
  const integrations = getPlatformIntegrationFramework();
  const observability = getPlatformObservabilityFramework();
  const serviceFramework = getPlatformServiceFramework();
  const storage = getPlatformStorageFramework();
  const workflows = getPlatformWorkflowEngine();
  const context = createRuntimeContext(configuration);
  const resolution = resolvePlatformRuntime(context);
  const activationRecords = activateRuntimeResolution(resolution);
  const state = createRuntimeStateStore();
  activationRecords.forEach((record) => state.set(record));
  const health = getRuntimeHealth(state.list());
  const metadata = getRuntimeMetadata(resolution, health);
  const navigation = buildRuntimeNavigation(resolution);
  const ai = createAIRuntime(platformAIRegistry, {
    runtime: context,
    storage: storage.context,
    integration: integrations.context
  });
  const agents = createAgentRuntime(platformAgentRegistry, {
    runtime: context,
    storage: storage.context,
    integration: integrations.context,
    ai: ai.context
  });
  const orchestration = createOrchestrationRuntime(platformOrchestrationRegistry, {
    runtime: context,
    storage: storage.context,
    integration: integrations.context,
    ai: ai.context,
    agent: agents.context
  });

  return {
    context,
    resolution,
    state,
    health,
    metadata,
    navigation,
    events,
    agents,
    ai,
    integrations,
    observability,
    orchestration,
    serviceFramework,
    storage,
    workflows
  };
}
