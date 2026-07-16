import type { ServiceLifecycleState } from "@/lib/platform/services/service-manifest";

const serviceLifecycleTransitions: Record<ServiceLifecycleState, readonly ServiceLifecycleState[]> = {
  registered: ["loaded", "disabled"],
  loaded: ["active", "deprecated", "disabled"],
  active: ["deprecated", "disabled"],
  deprecated: ["disabled"],
  disabled: ["loaded"]
};

export function canTransitionServiceLifecycle(from: ServiceLifecycleState, to: ServiceLifecycleState) {
  return serviceLifecycleTransitions[from].includes(to);
}

export function getNextServiceLifecycleStates(from: ServiceLifecycleState) {
  return serviceLifecycleTransitions[from];
}
