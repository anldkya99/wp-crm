import type { CapabilityLifecycleState } from "@/lib/platform/capabilities/capability-manifest";

const lifecycleTransitions: Record<CapabilityLifecycleState, readonly CapabilityLifecycleState[]> = {
  registered: ["validated"],
  validated: ["initialized"],
  initialized: ["activated"],
  activated: ["configured", "suspended", "deactivated", "upgraded"],
  configured: ["suspended", "deactivated", "upgraded"],
  suspended: ["activated", "deactivated"],
  deactivated: ["activated"],
  upgraded: ["validated"]
};

export function canTransitionCapabilityLifecycle(from: CapabilityLifecycleState, to: CapabilityLifecycleState) {
  return lifecycleTransitions[from].includes(to);
}

export function getNextCapabilityLifecycleStates(from: CapabilityLifecycleState) {
  return lifecycleTransitions[from];
}
