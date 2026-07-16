import type { IdentityLifecycleState } from "@/lib/platform/identity/identity-manifest";

const identityLifecycleTransitions: Record<IdentityLifecycleState, readonly IdentityLifecycleState[]> = {
  created: ["active", "suspended", "deleted"],
  active: ["suspended", "locked", "archived", "deleted"],
  suspended: ["active", "archived", "deleted"],
  locked: ["active", "archived", "deleted"],
  archived: ["deleted"],
  deleted: []
};

export function canTransitionIdentityLifecycle(from: IdentityLifecycleState, to: IdentityLifecycleState) {
  return identityLifecycleTransitions[from].includes(to);
}

export function getNextIdentityLifecycleStates(from: IdentityLifecycleState) {
  return identityLifecycleTransitions[from];
}
