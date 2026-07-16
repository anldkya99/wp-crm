import { platformCapabilityRegistry } from "@/lib/platform/capabilities/capability-discovery";
import { canTransitionCapabilityLifecycle, getNextCapabilityLifecycleStates } from "@/lib/platform/capabilities/capability-lifecycle";
import {
  getCapabilityAuditRegistrations,
  getCapabilityExtensionPointRegistrations,
  getCapabilityFeatureFlagRegistrations,
  getCapabilityPermissionRegistrations,
  getCapabilitySettingsRegistrations
} from "@/lib/platform/capabilities/registrations";

export function getPlatformCapabilityFramework() {
  const capabilities = platformCapabilityRegistry.list();

  return {
    registry: platformCapabilityRegistry,
    capabilities,
    permissions: getCapabilityPermissionRegistrations(capabilities),
    featureFlags: getCapabilityFeatureFlagRegistrations(capabilities),
    settings: getCapabilitySettingsRegistrations(capabilities),
    auditEvents: getCapabilityAuditRegistrations(capabilities),
    extensionPoints: getCapabilityExtensionPointRegistrations(capabilities),
    lifecycle: {
      canTransition: canTransitionCapabilityLifecycle,
      nextStates: getNextCapabilityLifecycleStates
    }
  };
}
