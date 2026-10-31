import {
  validConfiguration,
  validMetadata,
  type ModuleOptionTypeManifest
} from "@/lib/platform/modules/options/option-type-manifest";

export const builtInModuleOptionTypes: readonly ModuleOptionTypeManifest[] = [
  {
    moduleId: "crm-core",
    key: "foundation-segment",
    labelKey: "opceo.moduleOptions.foundationType.label",
    descriptionKey: "opceo.moduleOptions.foundationType.description",
    allowedScopes: ["PLATFORM", "COMPANY"],
    defaultStatus: "DISABLED",
    configurationValidator: validConfiguration,
    metadataValidator: validMetadata,
    version: "1.0.0",
    sortOrder: 10,
    companyManageable: true,
    foundationOnly: true
  }
];
