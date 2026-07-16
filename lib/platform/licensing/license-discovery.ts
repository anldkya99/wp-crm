import { LicenseRegistry } from "@/lib/platform/licensing/license-registry";
import { licensePackageManifests } from "@/lib/platform/licensing/package-definitions";

export function discoverLicensePackages() {
  return licensePackageManifests;
}

export function createLicenseRegistry() {
  return new LicenseRegistry().registerMany(discoverLicensePackages());
}

export const platformLicenseRegistry = createLicenseRegistry();
