export type LicensePackageKey = "starter" | "professional" | "business" | "enterprise" | "custom";

export type LicenseLimit = {
  key: string;
  value: number | "unlimited";
  description: string;
};

export type LicensePackageManifest = {
  packageId: LicensePackageKey;
  packageName: string;
  version: string;
  includedModules: readonly string[];
  includedCapabilities: readonly string[];
  featureFlags: readonly string[];
  limits: readonly LicenseLimit[];
  upgradePath: readonly LicensePackageKey[];
  dependencies: readonly LicensePackageKey[];
};

export type LicenseContext = {
  activePackage: LicensePackageManifest;
  packageId: LicensePackageKey;
  purchasedModules: ReadonlySet<string>;
  purchasedCapabilities: ReadonlySet<string>;
  featureFlags: ReadonlySet<string>;
  limits: readonly LicenseLimit[];
  expiresAt: string | null;
  status: "active" | "expired" | "suspended" | "trial" | "custom";
};
