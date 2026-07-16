import type { OrchestrationManifest, OrchestratorContext } from "@/lib/platform/orchestration/orchestration-manifest";

export function createOrchestratorContext(manifest: OrchestrationManifest): OrchestratorContext {
  return {
    orchestratorId: manifest.orchestratorId,
    kind: manifest.kind,
    capabilities: manifest.capabilities,
    lifecycle: manifest.lifecycle,
    metadata: {
      name: manifest.name,
      version: manifest.version,
      owner: manifest.owner,
      description: manifest.description
    }
  };
}
