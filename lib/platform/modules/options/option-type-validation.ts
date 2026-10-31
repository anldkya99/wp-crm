import { platformModuleRegistry } from "@/lib/platform/modules/module-discovery";
import {
  createOptionTypeRegistrationKey,
  type ModuleOptionScope,
  type ModuleOptionTypeManifest
} from "@/lib/platform/modules/options/option-type-manifest";

const validScopes = new Set<ModuleOptionScope>(["PLATFORM", "COMPANY"]);
const versionPattern = /^\d+\.\d+\.\d+$/;

export class ModuleOptionTypeValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export function validateModuleOptionTypeManifest(manifest: ModuleOptionTypeManifest) {
  if (!manifest.moduleId || !manifest.key || !manifest.labelKey || !manifest.descriptionKey || !manifest.version) {
    throw new ModuleOptionTypeValidationError("Module option type manifest is missing required metadata.", "INVALID_OPTION_TYPE_MANIFEST");
  }
  if (!platformModuleRegistry.get(manifest.moduleId)) {
    throw new ModuleOptionTypeValidationError(`Unknown moduleId for option type: ${manifest.moduleId}`, "UNKNOWN_MODULE");
  }
  if (!manifest.allowedScopes.length || manifest.allowedScopes.some((scope) => !validScopes.has(scope))) {
    throw new ModuleOptionTypeValidationError("Module option type allowedScopes are invalid.", "INVALID_SCOPE");
  }
  if (manifest.defaultStatus !== "ACTIVE" && manifest.defaultStatus !== "DISABLED") {
    throw new ModuleOptionTypeValidationError("Module option type defaultStatus is invalid.", "INVALID_STATUS");
  }
  if (typeof manifest.configurationValidator !== "function") {
    throw new ModuleOptionTypeValidationError("Module option type requires a configuration validator.", "MISSING_VALIDATOR");
  }
  if (manifest.metadataValidator && typeof manifest.metadataValidator !== "function") {
    throw new ModuleOptionTypeValidationError("Module option type metadata validator is invalid.", "INVALID_METADATA_VALIDATOR");
  }
  if (!versionPattern.test(manifest.version)) {
    throw new ModuleOptionTypeValidationError("Module option type version must use semantic version format.", "INVALID_VERSION");
  }
  if (!Number.isInteger(manifest.sortOrder) || manifest.sortOrder < 0) {
    throw new ModuleOptionTypeValidationError("Module option type sortOrder must be a non-negative integer.", "INVALID_SORT_ORDER");
  }
}

export function validateUniqueOptionType(manifest: ModuleOptionTypeManifest, registrations: ReadonlyMap<string, ModuleOptionTypeManifest>) {
  const registrationKey = createOptionTypeRegistrationKey(manifest.moduleId, manifest.key);
  if (registrations.has(registrationKey)) {
    throw new ModuleOptionTypeValidationError(`Duplicate module option type registration: ${registrationKey}`, "DUPLICATE_OPTION_TYPE");
  }
}
