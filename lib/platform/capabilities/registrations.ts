import type { PlatformCapabilityManifest } from "@/lib/platform/capabilities/capability-manifest";

export function getCapabilityPermissionRegistrations(capabilities: readonly PlatformCapabilityManifest[]) {
  return capabilities.flatMap((capability) => capability.permissions.map((permission) => ({ capabilityId: capability.capabilityId, moduleId: capability.moduleId, ...permission })));
}

export function getCapabilityFeatureFlagRegistrations(capabilities: readonly PlatformCapabilityManifest[]) {
  return capabilities.flatMap((capability) => capability.featureFlags.map((featureFlag) => ({ capabilityId: capability.capabilityId, moduleId: capability.moduleId, ...featureFlag })));
}

export function getCapabilitySettingsRegistrations(capabilities: readonly PlatformCapabilityManifest[]) {
  return capabilities.flatMap((capability) => capability.settings.map((setting) => ({ capabilityId: capability.capabilityId, moduleId: capability.moduleId, ...setting })));
}

export function getCapabilityAuditRegistrations(capabilities: readonly PlatformCapabilityManifest[]) {
  return capabilities.flatMap((capability) => capability.auditEvents.map((auditEvent) => ({ capabilityId: capability.capabilityId, moduleId: capability.moduleId, ...auditEvent })));
}

export function getCapabilityExtensionPointRegistrations(capabilities: readonly PlatformCapabilityManifest[]) {
  return capabilities.flatMap((capability) => capability.extensionPoints.map((extensionPoint) => ({ capabilityId: capability.capabilityId, moduleId: capability.moduleId, ...extensionPoint })));
}
