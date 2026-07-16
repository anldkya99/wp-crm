import type { OrchestrationManifest } from "@/lib/platform/orchestration/orchestration-manifest";

export class OrchestrationValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export function validateOrchestrationManifest(manifest: OrchestrationManifest) {
  if (!manifest.orchestratorId || !manifest.name || !manifest.version || !manifest.kind || !manifest.owner || !manifest.description) {
    throw new OrchestrationValidationError("Orchestration manifest is missing required metadata.", "INVALID_ORCHESTRATION_MANIFEST");
  }
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    throw new OrchestrationValidationError(`Orchestrator ${manifest.orchestratorId} has an invalid version.`, "INVALID_ORCHESTRATION_VERSION");
  }
  if (manifest.capabilities.length === 0) {
    throw new OrchestrationValidationError(`Orchestrator ${manifest.orchestratorId} must declare at least one capability.`, "MISSING_ORCHESTRATION_CAPABILITY");
  }
  return true;
}
