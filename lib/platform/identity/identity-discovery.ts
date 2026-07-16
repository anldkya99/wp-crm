import { builtInIdentityManifests } from "@/lib/platform/identity/builtin-identities";
import { IdentityRegistry } from "@/lib/platform/identity/identity-registry";

export function discoverPlatformIdentities() {
  return builtInIdentityManifests;
}

export function createPlatformIdentityRegistry() {
  return new IdentityRegistry().registerMany(discoverPlatformIdentities());
}

export const platformIdentityRegistry = createPlatformIdentityRegistry();
