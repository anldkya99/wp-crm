import { platformModuleRegistry } from "@/lib/platform/modules/module-discovery";
import { getAuditRegistrations, getExtensionPointRegistrations, getFeatureFlagRegistrations, getNavigationRegistrations, getPermissionRegistrations, getSettingsRegistrations } from "@/lib/platform/modules/registrations";
import { canTransitionModuleLifecycle, getNextModuleLifecycleStates } from "@/lib/platform/modules/module-lifecycle";
import { getModuleOptionRuntime } from "@/lib/platform/modules/options/module-option-runtime";

export function getPlatformModuleFramework() {
  const modules = platformModuleRegistry.list();
  const options = getModuleOptionRuntime();

  return {
    registry: platformModuleRegistry,
    modules,
    navigation: getNavigationRegistrations(modules),
    permissions: getPermissionRegistrations(modules),
    featureFlags: getFeatureFlagRegistrations(modules),
    settings: getSettingsRegistrations(modules),
    auditEvents: getAuditRegistrations(modules),
    extensionPoints: getExtensionPointRegistrations(modules),
    optionTypes: options.optionTypes,
    options,
    lifecycle: {
      canTransition: canTransitionModuleLifecycle,
      nextStates: getNextModuleLifecycleStates
    }
  };
}
