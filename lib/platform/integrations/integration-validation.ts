import type { IntegrationManifest } from "@/lib/platform/integrations/integration-manifest";

export class IntegrationValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export function validateIntegrationManifest(manifest: IntegrationManifest) {
  if (!manifest.providerId || !manifest.name || !manifest.version || !manifest.kind || !manifest.owner || !manifest.description) {
    throw new IntegrationValidationError("Integration manifest is missing required metadata.", "INVALID_INTEGRATION_MANIFEST");
  }
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    throw new IntegrationValidationError(`Integration provider ${manifest.providerId} has an invalid version.`, "INVALID_INTEGRATION_VERSION");
  }
  if (manifest.capabilities.length === 0) {
    throw new IntegrationValidationError(`Integration provider ${manifest.providerId} must declare at least one capability.`, "MISSING_INTEGRATION_CAPABILITY");
  }
  return true;
}
