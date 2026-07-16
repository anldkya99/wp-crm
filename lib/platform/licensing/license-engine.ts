import { createEntitlementResolver } from "@/lib/platform/licensing/entitlement-resolver";
import { createFeatureManagementEngine } from "@/lib/platform/licensing/feature-management";
import { platformLicenseRegistry } from "@/lib/platform/licensing/license-discovery";
import type { LicensePackageKey } from "@/lib/platform/licensing/license-manifest";

export function getPlatformLicenseEngine() {
  return {
    registry: platformLicenseRegistry,
    packages: platformLicenseRegistry.list(),
    createEntitlementResolver,
    createFeatureManagementEngine,
    resolveLicense(input: {
      packageId: LicensePackageKey;
      requestedFeatureFlags?: readonly string[];
      expiresAt?: string | null;
      status?: "active" | "expired" | "suspended" | "trial" | "custom";
      purchasedModules?: readonly string[];
      purchasedCapabilities?: readonly string[];
    }) {
      const entitlements = createEntitlementResolver({
        registry: platformLicenseRegistry,
        packageId: input.packageId,
        expiresAt: input.expiresAt,
        status: input.status,
        purchasedModules: input.purchasedModules,
        purchasedCapabilities: input.purchasedCapabilities
      });
      const features = createFeatureManagementEngine({
        requestedFeatureFlags: input.requestedFeatureFlags ?? [],
        licenseContext: entitlements.context
      });
      return {
        entitlements,
        features,
        licenseContext: entitlements.context
      };
    }
  };
}
