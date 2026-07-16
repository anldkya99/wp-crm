import type { LicensePackageKey } from "@/lib/platform/license-packages";

export type ModuleLifecycleState =
  | "registered"
  | "validated"
  | "initialized"
  | "activated"
  | "configured"
  | "suspended"
  | "deactivated"
  | "upgraded"
  | "removed";

export type ModuleSettingDefinition = {
  key: string;
  defaultValue: unknown;
  visibility: "platform" | "company" | "department" | "operator";
  scope: "platform" | "company" | "department" | "operator";
  required?: boolean;
};

export type ModuleNavigationEntry = {
  label: string;
  path: string;
  area: "opceo" | "company" | "department" | "operator";
  group: string;
  order?: number;
};

export type ModulePermissionDeclaration = {
  key: string;
  group: string;
  description: string;
};

export type ModuleFeatureFlagDeclaration = {
  key: string;
  defaultEnabled: boolean;
  description: string;
};

export type ModuleAuditEventDeclaration = {
  eventType: string;
  description: string;
};

export type ModuleExtensionPointDeclaration = {
  point: string;
  description: string;
};

export type PlatformModuleManifest = {
  moduleId: string;
  name: string;
  description: string;
  version: string;
  category: string;
  navigationGroup: string;
  permissionGroup: string;
  licenseRequirement: LicensePackageKey;
  requiredPlatformVersion: string;
  compatibility: readonly string[];
  breakingChanges: readonly string[];
  dependencies: readonly string[];
  defaultEnabled: boolean;
  navigation: readonly ModuleNavigationEntry[];
  permissions: readonly ModulePermissionDeclaration[];
  featureFlags: readonly ModuleFeatureFlagDeclaration[];
  settings: readonly ModuleSettingDefinition[];
  auditEvents: readonly ModuleAuditEventDeclaration[];
  extensionPoints: readonly ModuleExtensionPointDeclaration[];
};
