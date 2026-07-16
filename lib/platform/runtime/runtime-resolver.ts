import { getPlatformCapabilityFramework } from "@/lib/platform/capabilities/capability-framework";
import { getPlatformModuleFramework } from "@/lib/platform/modules/module-framework";
import type { PlatformModuleManifest } from "@/lib/platform/modules/module-manifest";
import type { RuntimeContext, RuntimeResolution } from "@/lib/platform/runtime/runtime-types";

function moduleIsActive(module: PlatformModuleManifest, context: RuntimeContext) {
  const configuredModules = context.configuration.moduleIds ? new Set(context.configuration.moduleIds) : null;
  if (configuredModules && !configuredModules.has(module.moduleId)) return false;
  if (!context.entitlements.canUseModule(module.moduleId)) return false;
  if (module.featureFlags.length === 0) return module.defaultEnabled;
  return module.featureFlags.some((featureFlag) => context.featureFlags.has(featureFlag.key) || (module.defaultEnabled && featureFlag.defaultEnabled));
}

export function resolvePlatformRuntime(context: RuntimeContext): RuntimeResolution {
  const moduleFramework = getPlatformModuleFramework();
  const capabilityFramework = getPlatformCapabilityFramework();
  const moduleCandidates = moduleFramework.registry.discover((module) => moduleIsActive(module, context));
  const modules = moduleFramework.registry.resolveDependencies(moduleCandidates.map((module) => module.moduleId));
  const activeModuleIds = new Set(modules.map((module) => module.moduleId));
  const configuredCapabilities = context.configuration.capabilityIds ? new Set(context.configuration.capabilityIds) : null;
  const capabilityCandidates = capabilityFramework.registry.discover((capability) => {
    if (!activeModuleIds.has(capability.moduleId)) return false;
    if (configuredCapabilities && !configuredCapabilities.has(capability.capabilityId)) return false;
    if (!context.entitlements.canUseCapability(capability.capabilityId)) return false;
    if (capability.featureFlags.length === 0) return capability.defaultEnabled;
    return capability.featureFlags.some((featureFlag) => context.featureFlags.has(featureFlag.key) || (capability.defaultEnabled && featureFlag.defaultEnabled));
  });
  const capabilities = capabilityFramework.registry.resolveDependencies(capabilityCandidates.map((capability) => capability.capabilityId));
  const invalidCapability = capabilities.find(
    (capability) => !activeModuleIds.has(capability.moduleId) || !context.entitlements.canUseCapability(capability.capabilityId)
  );
  if (invalidCapability) {
    throw new Error(`Runtime capability ${invalidCapability.capabilityId} cannot activate because its module or license is inactive.`);
  }
  const activeCapabilityIds = new Set(capabilities.map((capability) => capability.capabilityId));

  return {
    context,
    modules,
    capabilities,
    inactiveModules: moduleFramework.modules.filter((module) => !activeModuleIds.has(module.moduleId)),
    inactiveCapabilities: capabilityFramework.capabilities.filter((capability) => !activeCapabilityIds.has(capability.capabilityId)),
    dependencyTree: [
      ...modules.map((module) => ({ id: module.moduleId, type: "module" as const, dependencies: module.dependencies })),
      ...capabilities.map((capability) => ({ id: capability.capabilityId, type: "capability" as const, dependencies: capability.dependencies }))
    ]
  };
}
