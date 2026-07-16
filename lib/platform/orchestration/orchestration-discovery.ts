import { builtInOrchestrationManifests } from "@/lib/platform/orchestration/built-in-orchestrations";
import { OrchestrationRegistry } from "@/lib/platform/orchestration/orchestration-registry";

export function discoverOrchestrators() {
  return builtInOrchestrationManifests;
}

export function createOrchestrationRegistry() {
  return new OrchestrationRegistry().registerMany(discoverOrchestrators());
}

export const platformOrchestrationRegistry = createOrchestrationRegistry();
