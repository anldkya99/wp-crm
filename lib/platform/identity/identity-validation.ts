import type { IdentityManifest } from "@/lib/platform/identity/identity-manifest";

export class IdentityValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export function validateIdentityManifest(manifest: IdentityManifest) {
  if (!manifest.identityId || !manifest.principalType || !manifest.lifecycle || !manifest.description) {
    throw new IdentityValidationError("Identity manifest is missing required metadata.", "INVALID_IDENTITY_MANIFEST");
  }
  if (manifest.departmentId && !manifest.companyId) {
    throw new IdentityValidationError(`Identity ${manifest.identityId} has department scope without company scope.`, "INVALID_IDENTITY_SCOPE");
  }
  return true;
}
