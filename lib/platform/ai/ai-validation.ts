import type { AIManifest } from "@/lib/platform/ai/ai-manifest";

export class AIValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export function validateAIManifest(manifest: AIManifest) {
  if (!manifest.providerId || !manifest.name || !manifest.version || !manifest.kind || !manifest.owner || !manifest.description) {
    throw new AIValidationError("AI manifest is missing required metadata.", "INVALID_AI_MANIFEST");
  }
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    throw new AIValidationError(`AI provider ${manifest.providerId} has an invalid version.`, "INVALID_AI_VERSION");
  }
  if (manifest.capabilities.length === 0) {
    throw new AIValidationError(`AI provider ${manifest.providerId} must declare at least one capability.`, "MISSING_AI_CAPABILITY");
  }
  return true;
}
