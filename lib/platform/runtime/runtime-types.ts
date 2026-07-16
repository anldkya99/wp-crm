import type { PlatformCapabilityManifest } from "@/lib/platform/capabilities/capability-manifest";
import type { ConfigurationLayer } from "@/lib/platform/configuration/configuration-schema";
import type { EntitlementResolver } from "@/lib/platform/licensing/entitlement-resolver";
import type { LicenseContext } from "@/lib/platform/licensing/license-manifest";
import type { PlatformEventContext } from "@/lib/platform/events/event-manifest";
import type { IdentityContext, PrincipalType } from "@/lib/platform/identity/identity-manifest";
import type { LicensePackageKey } from "@/lib/platform/license-packages";
import type { PlatformModuleManifest, ModuleNavigationEntry } from "@/lib/platform/modules/module-manifest";
import type { PermissionResolver } from "@/lib/platform/permission-engine";

export type RuntimeExecutionState =
  | "active"
  | "inactive"
  | "suspended"
  | "initializing"
  | "error"
  | "maintenance";

export type RuntimeEnvironment = "development" | "test" | "production";

export type RuntimeCompanyConfiguration = {
  companyId?: string | null;
  departmentId?: string | null;
  operatorId?: string | null;
  identityId?: string;
  userId?: string;
  principalType?: PrincipalType;
  licensePackage: LicensePackageKey;
  featureFlags: readonly string[];
  moduleIds?: readonly string[];
  capabilityIds?: readonly string[];
  purchasedModules?: readonly string[];
  purchasedCapabilities?: readonly string[];
  licenseExpiresAt?: string | null;
  licenseStatus?: LicenseContext["status"];
  configurationLayers?: readonly ConfigurationLayer[];
  runtimeOverrides?: Record<string, unknown>;
};

export type RuntimeContext = {
  companyId: string | null;
  departmentId: string | null;
  operatorId: string | null;
  identity: IdentityContext;
  licensePackage: LicensePackageKey;
  licenseContext: LicenseContext;
  entitlements: EntitlementResolver;
  featureFlags: ReadonlySet<string>;
  configurationContext: Record<string, unknown>;
  eventContext: {
    categories: readonly string[];
    lastEvent?: PlatformEventContext | null;
  };
  environment: RuntimeEnvironment;
  configuration: RuntimeCompanyConfiguration;
  permissionResolver?: PermissionResolver;
};

export type RuntimeGraph = {
  modules: readonly PlatformModuleManifest[];
  capabilities: readonly PlatformCapabilityManifest[];
  dependencyTree: readonly RuntimeDependencyNode[];
};

export type RuntimeDependencyNode = {
  id: string;
  type: "module" | "capability";
  dependencies: readonly string[];
};

export type RuntimeResolution = RuntimeGraph & {
  context: RuntimeContext;
  inactiveModules: readonly PlatformModuleManifest[];
  inactiveCapabilities: readonly PlatformCapabilityManifest[];
};

export type RuntimeActivationRecord = {
  id: string;
  type: "module" | "capability";
  state: RuntimeExecutionState;
  version: string;
  dependencies: readonly string[];
  initializedAt: string | null;
  lastError: string | null;
};

export type RuntimeNavigationItem = {
  label: string;
  href: string;
  area: ModuleNavigationEntry["area"] | "opceo";
  group: string;
  source: "module" | "capability" | "platform";
  moduleId?: string;
  capabilityId?: string;
  order?: number;
};

export type RuntimeHealthEntry = {
  id: string;
  type: "module" | "capability" | "runtime";
  status: RuntimeExecutionState;
  version: string;
  dependencies: readonly string[];
  lastError: string | null;
};
