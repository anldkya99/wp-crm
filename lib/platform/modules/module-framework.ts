import { platformModuleRegistry } from "@/lib/platform/modules/module-discovery";
import { getAuditRegistrations, getExtensionPointRegistrations, getFeatureFlagRegistrations, getNavigationRegistrations, getPermissionRegistrations, getSettingsRegistrations } from "@/lib/platform/modules/registrations";
import { canTransitionModuleLifecycle, getNextModuleLifecycleStates } from "@/lib/platform/modules/module-lifecycle";

export function getPlatformModuleFramework() {
  const modules = platformModuleRegistry.list();

  return {
    registry: platformModuleRegistry,
    modules,
    navigation: getNavigationRegistrations(modules),
    permissions: getPermissionRegistrations(modules),
    featureFlags: getFeatureFlagRegistrations(modules),
    settings: getSettingsRegistrations(modules),
    auditEvents: getAuditRegistrations(modules),
    extensionPoints: getExtensionPointRegistrations(modules),
    lifecycle: {
      canTransition: canTransitionModuleLifecycle,
      nextStates: getNextModuleLifecycleStates
    }
  };
}
