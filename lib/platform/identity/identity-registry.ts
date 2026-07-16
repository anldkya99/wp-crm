import type { IdentityManifest, PrincipalType } from "@/lib/platform/identity/identity-manifest";
import { validateIdentityManifest } from "@/lib/platform/identity/identity-validation";

export class IdentityRegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class IdentityRegistry {
  private manifests = new Map<string, IdentityManifest>();

  register(manifest: IdentityManifest) {
    validateIdentityManifest(manifest);
    if (this.manifests.has(manifest.identityId)) {
      throw new IdentityRegistryError(`Duplicate identity registration: ${manifest.identityId}`, "DUPLICATE_IDENTITY");
    }
    this.manifests.set(manifest.identityId, manifest);
    return this;
  }

  registerMany(manifests: readonly IdentityManifest[]) {
    manifests.forEach((manifest) => this.register(manifest));
    return this;
  }

  get(identityId: string) {
    return this.manifests.get(identityId) ?? null;
  }

  list() {
    return Array.from(this.manifests.values());
  }

  discover(predicate?: (manifest: IdentityManifest) => boolean) {
    const identities = this.list();
    return predicate ? identities.filter(predicate) : identities;
  }

  findByPrincipalType(principalType: PrincipalType) {
    return this.discover((manifest) => manifest.principalType === principalType);
  }
}
