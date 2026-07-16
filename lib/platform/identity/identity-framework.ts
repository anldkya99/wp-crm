import { platformIdentityRegistry } from "@/lib/platform/identity/identity-discovery";
import { canTransitionIdentityLifecycle, getNextIdentityLifecycleStates } from "@/lib/platform/identity/identity-lifecycle";
import { IdentityRuntime } from "@/lib/platform/identity/identity-runtime";

const platformIdentityRuntime = new IdentityRuntime(platformIdentityRegistry);

export function getPlatformIdentityFramework() {
  const identities = platformIdentityRegistry.list();

  return {
    registry: platformIdentityRegistry,
    identities,
    runtime: platformIdentityRuntime,
    principalTypes: Array.from(new Set(identities.map((identity) => identity.principalType))),
    lifecycle: {
      canTransition: canTransitionIdentityLifecycle,
      nextStates: getNextIdentityLifecycleStates
    }
  };
}
