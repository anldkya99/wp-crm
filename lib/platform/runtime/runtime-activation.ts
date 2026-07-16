import type { RuntimeActivationRecord, RuntimeResolution } from "@/lib/platform/runtime/runtime-types";

export function activateRuntimeResolution(resolution: RuntimeResolution): readonly RuntimeActivationRecord[] {
  const initializedAt = new Date().toISOString();

  return [
    ...resolution.modules.map((module) => ({
      id: module.moduleId,
      type: "module" as const,
      state: "active" as const,
      version: module.version,
      dependencies: module.dependencies,
      initializedAt,
      lastError: null
    })),
    ...resolution.capabilities.map((capability) => ({
      id: capability.capabilityId,
      type: "capability" as const,
      state: "active" as const,
      version: capability.version,
      dependencies: capability.dependencies,
      initializedAt,
      lastError: null
    }))
  ];
}
