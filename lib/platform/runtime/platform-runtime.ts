import { getPlatformAIFramework } from "@/lib/platform/ai/ai-framework";
import { getPlatformAgentFramework } from "@/lib/platform/agents/agent-framework";
import { loadPlatformRuntimeGraph } from "@/lib/platform/runtime/runtime-loader";
import { getPlatformEventFramework } from "@/lib/platform/events/event-framework";
import { getPlatformIdentityFramework } from "@/lib/platform/identity/identity-framework";
import { getPlatformIntegrationFramework } from "@/lib/platform/integrations/integration-framework";
import { getPlatformObservabilityFramework } from "@/lib/platform/observability/observability-framework";
import { getPlatformOrchestrationFramework } from "@/lib/platform/orchestration/orchestration-framework";
import { getPlatformServiceFramework } from "@/lib/platform/services/service-framework";
import { getPlatformStorageFramework } from "@/lib/platform/storage/storage-framework";
import { getPlatformWorkflowEngine } from "@/lib/platform/workflows/workflow-engine";
import { buildAuthorizedOpCeoRuntimeNavigation, buildRuntimeNavigation } from "@/lib/platform/runtime/runtime-navigation";
import { createPlatformRuntimeServices } from "@/lib/platform/runtime/runtime-services";

export function getPlatformRuntime() {
  const graph = loadPlatformRuntimeGraph();

  return {
    graph,
    agents: getPlatformAgentFramework(),
    ai: getPlatformAIFramework(),
    identity: getPlatformIdentityFramework(),
    integrations: getPlatformIntegrationFramework(),
    observability: getPlatformObservabilityFramework(),
    orchestration: getPlatformOrchestrationFramework(),
    storage: getPlatformStorageFramework(),
    events: getPlatformEventFramework(),
    serviceFramework: getPlatformServiceFramework(),
    workflows: getPlatformWorkflowEngine(),
    createServices: createPlatformRuntimeServices,
    navigation: {
      buildRuntimeNavigation,
      buildAuthorizedOpCeoNavigation: buildAuthorizedOpCeoRuntimeNavigation
    }
  };
}
