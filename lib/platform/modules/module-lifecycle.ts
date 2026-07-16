import type { ModuleLifecycleState } from "@/lib/platform/modules/module-manifest";

const lifecycleTransitions: Record<ModuleLifecycleState, readonly ModuleLifecycleState[]> = {
  registered: ["validated", "removed"],
  validated: ["initialized", "removed"],
  initialized: ["activated", "removed"],
  activated: ["configured", "suspended", "deactivated", "upgraded"],
  configured: ["suspended", "deactivated", "upgraded"],
  suspended: ["activated", "deactivated", "removed"],
  deactivated: ["activated", "removed"],
  upgraded: ["validated", "removed"],
  removed: []
};

export function canTransitionModuleLifecycle(from: ModuleLifecycleState, to: ModuleLifecycleState) {
  return lifecycleTransitions[from].includes(to);
}

export function getNextModuleLifecycleStates(from: ModuleLifecycleState) {
  return lifecycleTransitions[from];
}
