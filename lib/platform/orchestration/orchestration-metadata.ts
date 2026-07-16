import type { OrchestrationMetadata, OrchestratorContext } from "@/lib/platform/orchestration/orchestration-manifest";

export function getOrchestrationMetadata(orchestrators: readonly OrchestratorContext[]): OrchestrationMetadata {
  const activeOrchestrator = orchestrators.find((orchestrator) => orchestrator.lifecycle === "active") ?? orchestrators[0] ?? null;
  const capabilities = Array.from(new Set(orchestrators.flatMap((orchestrator) => orchestrator.capabilities)));

  return {
    orchestratorCount: orchestrators.length,
    activeOrchestratorId: activeOrchestrator?.orchestratorId ?? null,
    capabilityCount: capabilities.length,
    capabilities,
    generatedAt: new Date().toISOString()
  };
}
