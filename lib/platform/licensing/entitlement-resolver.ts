import { getPlatformCapabilityFramework } from "@/lib/platform/capabilities/capability-framework";
import type { LicenseContext, LicensePackageKey } from "@/lib/platform/licensing/license-manifest";
import type { LicenseRegistry } from "@/lib/platform/licensing/license-registry";
import { getPlatformModuleFramework } from "@/lib/platform/modules/module-framework";

export type EntitlementResolverInput = {
  registry: LicenseRegistry;
  packageId: LicensePackageKey;
  expiresAt?: string | null;
  status?: LicenseContext["status"];
  purchasedModules?: readonly string[];
  purchasedCapabilities?: readonly string[];
};

export type EntitlementResolver = {
  context: LicenseContext;
  canUseModule: (moduleId: string) => boolean;
  canUseCapability: (capabilityId: string) => boolean;
  canUseFeatureFlag: (featureFlag: string) => boolean;
  assertModuleEntitled: (moduleId: string) => void;
  assertCapabilityEntitled: (capabilityId: string) => void;
};

export class EntitlementError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

function isExpired(expiresAt?: string | null) {
  return expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;
}

export function createEntitlementResolver(input: EntitlementResolverInput): EntitlementResolver {
  const activePackage = input.registry.get(input.packageId);
  if (!activePackage) throw new EntitlementError(`Unknown license package: ${input.packageId}`, "UNKNOWN_LICENSE_PACKAGE");

  const inheritedPackages = input.registry.resolveInheritance(input.packageId);
  const allModules = getPlatformModuleFramework().modules.map((module) => module.moduleId);
  const allCapabilities = getPlatformCapabilityFramework().capabilities.map((capability) => capability.capabilityId);
  const packageModules = inheritedPackages.flatMap((manifest) => manifest.includedModules);
  const packageCapabilities = inheritedPackages.flatMap((manifest) => manifest.includedCapabilities);
  const packageFeatures = inheritedPackages.flatMap((manifest) => manifest.featureFlags);
  const customAll = input.packageId === "custom";
  const purchasedModules = new Set([...(customAll ? allModules : packageModules), ...(input.purchasedModules ?? [])]);
  const purchasedCapabilities = new Set([...(customAll ? allCapabilities : packageCapabilities), ...(input.purchasedCapabilities ?? [])]);
  const featureFlags = new Set([...(customAll ? [] : packageFeatures)]);
  const status: LicenseContext["status"] = isExpired(input.expiresAt) ? "expired" : input.status ?? (input.packageId === "custom" ? "custom" : "active");

  const context: LicenseContext = {
    activePackage,
    packageId: input.packageId,
    purchasedModules,
    purchasedCapabilities,
    featureFlags,
    limits: inheritedPackages.flatMap((manifest) => manifest.limits),
    expiresAt: input.expiresAt ?? null,
    status
  };

  const active = () => context.status !== "expired" && context.status !== "suspended";
  const canUseModule = (moduleId: string) => active() && context.purchasedModules.has(moduleId);
  const canUseCapability = (capabilityId: string) => active() && context.purchasedCapabilities.has(capabilityId);

  return {
    context,
    canUseModule,
    canUseCapability,
    canUseFeatureFlag: (featureFlag) => active() && (context.featureFlags.has(featureFlag) || input.packageId === "custom"),
    assertModuleEntitled: (moduleId) => {
      if (!canUseModule(moduleId)) throw new EntitlementError(`Module ${moduleId} is not licensed for package ${input.packageId}.`, "MODULE_NOT_ENTITLED");
    },
    assertCapabilityEntitled: (capabilityId) => {
      if (!canUseCapability(capabilityId)) {
        throw new EntitlementError(`Capability ${capabilityId} is not licensed for package ${input.packageId}.`, "CAPABILITY_NOT_ENTITLED");
      }
    }
  };
}
