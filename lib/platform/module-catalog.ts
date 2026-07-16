import type { LicensePackageKey } from "@/lib/platform/license-packages";
import { platformModuleRegistry } from "@/lib/platform/modules/module-discovery";

export type ModuleCatalogItem = {
  moduleId: string;
  name: string;
  version: string;
  navigationGroup: string;
  permissionGroup: string;
  licenseRequirement: LicensePackageKey;
  featureFlag?: string;
  auditEnabled: boolean;
  dependencies: readonly string[];
  defaultEnabled: boolean;
};

export const moduleCatalog: readonly ModuleCatalogItem[] = platformModuleRegistry.list().map((manifest) => ({
  moduleId: manifest.moduleId,
  name: manifest.name,
  version: manifest.version,
  navigationGroup: manifest.navigationGroup,
  permissionGroup: manifest.permissionGroup,
  licenseRequirement: manifest.licenseRequirement,
  featureFlag: manifest.featureFlags[0]?.key,
  auditEnabled: manifest.auditEvents.length > 0,
  dependencies: manifest.dependencies,
  defaultEnabled: manifest.defaultEnabled
}));
