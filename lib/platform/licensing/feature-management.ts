import { getPlatformCapabilityFramework } from "@/lib/platform/capabilities/capability-framework";
import type { LicenseContext } from "@/lib/platform/licensing/license-manifest";
import { getPlatformModuleFramework } from "@/lib/platform/modules/module-framework";

export type FeatureManagementResult = {
  registeredFeatureFlags: readonly string[];
  enabledFeatureFlags: ReadonlySet<string>;
  behaviorEnabled: (featureFlag: string) => boolean;
};

export function createFeatureManagementEngine(input: {
  requestedFeatureFlags: readonly string[];
  licenseContext: LicenseContext;
}): FeatureManagementResult {
  const registeredFeatureFlags = Array.from(
    new Set([
      ...getPlatformModuleFramework().featureFlags.map((featureFlag) => featureFlag.key),
      ...getPlatformCapabilityFramework().featureFlags.map((featureFlag) => featureFlag.key)
    ])
  );
  const requested = new Set(input.requestedFeatureFlags.map((flag) => flag.trim()).filter(Boolean));
  const enabledFeatureFlags = new Set(
    registeredFeatureFlags.filter((flag) => requested.has(flag) || input.licenseContext.featureFlags.has(flag) || input.licenseContext.packageId === "custom")
  );

  return {
    registeredFeatureFlags,
    enabledFeatureFlags,
    behaviorEnabled: (featureFlag) => enabledFeatureFlags.has(featureFlag)
  };
}
