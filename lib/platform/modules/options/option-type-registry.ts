import {
  createOptionTypeRegistrationKey,
  type ModuleOptionTypeManifest,
  type ModuleOptionTypeRegistration
} from "@/lib/platform/modules/options/option-type-manifest";
import {
  validateModuleOptionTypeManifest,
  validateUniqueOptionType
} from "@/lib/platform/modules/options/option-type-validation";

export class ModuleOptionTypeRegistry {
  private registrations = new Map<string, ModuleOptionTypeManifest>();

  register(manifest: ModuleOptionTypeManifest) {
    validateModuleOptionTypeManifest(manifest);
    validateUniqueOptionType(manifest, this.registrations);
    this.registrations.set(createOptionTypeRegistrationKey(manifest.moduleId, manifest.key), manifest);
    return this;
  }

  registerMany(manifests: readonly ModuleOptionTypeManifest[]) {
    manifests.forEach((manifest) => this.register(manifest));
    return this;
  }

  get(moduleId: string, optionTypeKey: string): ModuleOptionTypeRegistration | null {
    const registrationKey = createOptionTypeRegistrationKey(moduleId, optionTypeKey);
    const manifest = this.registrations.get(registrationKey);
    return manifest ? { ...manifest, registrationKey } : null;
  }

  list(): ModuleOptionTypeRegistration[] {
    return Array.from(this.registrations.entries())
      .map(([registrationKey, manifest]) => ({ ...manifest, registrationKey }))
      .sort((left, right) => left.sortOrder - right.sortOrder || left.registrationKey.localeCompare(right.registrationKey));
  }

  discover(predicate?: (manifest: ModuleOptionTypeRegistration) => boolean) {
    const manifests = this.list();
    return predicate ? manifests.filter(predicate) : manifests;
  }
}
