import type { LicensePackageKey } from "@/lib/platform/license-packages";
import type {
  ModuleAuditEventDeclaration,
  ModuleExtensionPointDeclaration,
  ModuleFeatureFlagDeclaration,
  ModulePermissionDeclaration,
  ModuleSettingDefinition
} from "@/lib/platform/modules/module-manifest";

export type CapabilityLifecycleState =
  | "registered"
  | "validated"
  | "initialized"
  | "activated"
  | "configured"
  | "suspended"
  | "deactivated"
  | "upgraded";

export type PlatformCapabilityManifest = {
  capabilityId: string;
  moduleId: string;
  name: string;
  description: string;
  version: string;
  category: string;
  permissionGroup: string;
  licenseRequirement: LicensePackageKey;
  dependencies: readonly string[];
  defaultEnabled: boolean;
  permissions: readonly ModulePermissionDeclaration[];
  featureFlags: readonly ModuleFeatureFlagDeclaration[];
  settings: readonly ModuleSettingDefinition[];
  auditEvents: readonly ModuleAuditEventDeclaration[];
  extensionPoints: readonly ModuleExtensionPointDeclaration[];
  configurationSchema: Record<string, unknown>;
};
