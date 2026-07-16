import type { PlatformModuleManifest } from "@/lib/platform/modules/module-manifest";

export function getNavigationRegistrations(manifests: readonly PlatformModuleManifest[]) {
  return manifests.flatMap((manifest) =>
    manifest.navigation.map((entry) => ({
      moduleId: manifest.moduleId,
      ...entry
    }))
  );
}

export function getPermissionRegistrations(manifests: readonly PlatformModuleManifest[]) {
  return manifests.flatMap((manifest) =>
    manifest.permissions.map((permission) => ({
      moduleId: manifest.moduleId,
      ...permission
    }))
  );
}

export function getFeatureFlagRegistrations(manifests: readonly PlatformModuleManifest[]) {
  return manifests.flatMap((manifest) =>
    manifest.featureFlags.map((featureFlag) => ({
      moduleId: manifest.moduleId,
      ...featureFlag
    }))
  );
}

export function getSettingsRegistrations(manifests: readonly PlatformModuleManifest[]) {
  return manifests.flatMap((manifest) =>
    manifest.settings.map((setting) => ({
      moduleId: manifest.moduleId,
      ...setting
    }))
  );
}

export function getAuditRegistrations(manifests: readonly PlatformModuleManifest[]) {
  return manifests.flatMap((manifest) =>
    manifest.auditEvents.map((auditEvent) => ({
      moduleId: manifest.moduleId,
      ...auditEvent
    }))
  );
}

export function getExtensionPointRegistrations(manifests: readonly PlatformModuleManifest[]) {
  return manifests.flatMap((manifest) =>
    manifest.extensionPoints.map((extensionPoint) => ({
      moduleId: manifest.moduleId,
      ...extensionPoint
    }))
  );
}
