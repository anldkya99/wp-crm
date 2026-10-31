import type { LicensePackageKey } from "@/lib/platform/license-packages";

export type ModuleOptionScope = "PLATFORM" | "COMPANY";
export type ModuleOptionStatus = "ACTIVE" | "DISABLED" | "ARCHIVED";

export type ModuleOptionValidationResult = {
  valid: boolean;
  errors: readonly string[];
};

export type ModuleOptionValidator = (value: unknown) => ModuleOptionValidationResult;

export type ModuleOptionTypeManifest = {
  moduleId: string;
  key: string;
  labelKey: string;
  descriptionKey: string;
  allowedScopes: readonly ModuleOptionScope[];
  defaultStatus: Exclude<ModuleOptionStatus, "ARCHIVED">;
  configurationValidator: ModuleOptionValidator;
  metadataValidator?: ModuleOptionValidator;
  version: string;
  sortOrder: number;
  companyManageable: boolean;
  capabilityRequirement?: string;
  licenseRequirement?: LicensePackageKey;
  foundationOnly?: boolean;
};

export type ModuleOptionTypeRegistration = ModuleOptionTypeManifest & {
  registrationKey: string;
};

export function createOptionTypeRegistrationKey(moduleId: string, optionTypeKey: string) {
  return `${moduleId}:${optionTypeKey}`;
}

export function validConfiguration(value: unknown): ModuleOptionValidationResult {
  if (!isPlainObject(value)) return { valid: false, errors: ["Configuration must be an object."] };
  return { valid: true, errors: [] };
}

export function validMetadata(value: unknown): ModuleOptionValidationResult {
  if (value == null) return { valid: true, errors: [] };
  if (!isPlainObject(value)) return { valid: false, errors: ["Metadata must be an object."] };
  return { valid: true, errors: [] };
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
