import { platformLicenseRegistry } from "@/lib/platform/licensing/license-discovery";
import type { LicensePackageKey } from "@/lib/platform/licensing/license-manifest";

export type { LicensePackageKey } from "@/lib/platform/licensing/license-manifest";

export type LicensePackage = {
  key: LicensePackageKey;
  name: string;
  features: readonly string[];
};

function toLegacyPackage(packageKey: LicensePackageKey): LicensePackage {
  const inheritance = platformLicenseRegistry.resolveInheritance(packageKey);
  const activePackage = platformLicenseRegistry.get(packageKey);
  if (!activePackage) throw new Error(`Unknown license package: ${packageKey}`);
  return {
    key: activePackage.packageId,
    name: activePackage.packageName,
    features: Array.from(new Set(inheritance.flatMap((manifest) => manifest.featureFlags)))
  };
}

export const licensePackages: Record<LicensePackageKey, LicensePackage> = {
  starter: toLegacyPackage("starter"),
  professional: toLegacyPackage("professional"),
  business: toLegacyPackage("business"),
  enterprise: toLegacyPackage("enterprise"),
  custom: toLegacyPackage("custom")
};

export const availableFeatureFlags = Array.from(
  new Set(Object.values(licensePackages).flatMap((licensePackage) => licensePackage.features))
);

export function getLicensePackage(key: string) {
  return licensePackages[key as LicensePackageKey] ?? null;
}

export function isFeatureAllowedByLicense(licenseKey: LicensePackageKey, feature: string) {
  return licensePackages[licenseKey].features.includes(feature) || licenseKey === "custom";
}

export function licensePackageAllows(selected: LicensePackageKey, required: LicensePackageKey) {
  return platformLicenseRegistry.resolveInheritance(selected).some((manifest) => manifest.packageId === required);
}
