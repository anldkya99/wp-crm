import type { RuntimeHealthEntry, RuntimeResolution } from "@/lib/platform/runtime/runtime-types";

export function getRuntimeMetadata(resolution: RuntimeResolution, health: readonly RuntimeHealthEntry[]) {
  return {
    runtimeVersion: "0.1.0",
    environment: resolution.context.environment,
    loadedModules: resolution.modules.length,
    loadedCapabilities: resolution.capabilities.length,
    inactiveModules: resolution.inactiveModules.length,
    inactiveCapabilities: resolution.inactiveCapabilities.length,
    principalType: resolution.context.identity.principal.principalType,
    principalId: resolution.context.identity.principal.principalId,
    activePackage: resolution.context.licenseContext.packageId,
    licenseStatus: resolution.context.licenseContext.status,
    entitledModules: resolution.context.licenseContext.purchasedModules.size,
    entitledCapabilities: resolution.context.licenseContext.purchasedCapabilities.size,
    healthStatus: health.find((entry) => entry.id === "platform-runtime")?.status ?? "inactive",
    observabilityContracts: 9,
    storageRuntime: "platform.storage.metadata",
    integrationRuntime: "platform.integration.metadata",
    aiRuntime: "platform.ai.metadata",
    agentRuntime: "platform.agent.metadata",
    orchestrationRuntime: "platform.orchestration.metadata",
    dependencyTree: resolution.dependencyTree,
    generatedAt: new Date().toISOString()
  };
}
