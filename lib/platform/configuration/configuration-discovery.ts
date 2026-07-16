import { builtInConfigurationSchemas } from "@/lib/platform/configuration/builtin-configurations";
import { ConfigurationRegistry } from "@/lib/platform/configuration/configuration-registry";
import type { ConfigurationSchema } from "@/lib/platform/configuration/configuration-schema";
import { inferConfigurationDataType } from "@/lib/platform/configuration/configuration-validation";
import { getPlatformCapabilityFramework } from "@/lib/platform/capabilities/capability-framework";
import { getPlatformModuleFramework } from "@/lib/platform/modules/module-framework";

export function discoverModuleConfigurationSchemas(): readonly ConfigurationSchema[] {
  return getPlatformModuleFramework().settings.map((setting) => ({
    configurationId: setting.key,
    ownerType: "module",
    ownerId: setting.moduleId,
    scope: setting.scope,
    defaultValue: setting.defaultValue,
    dataType: inferConfigurationDataType(setting.defaultValue),
    validationRules: [
      ...(setting.required ? [{ rule: "required" as const }] : []),
      { rule: "type" as const, value: inferConfigurationDataType(setting.defaultValue) }
    ],
    description: `Configuration for module ${setting.moduleId}.`,
    version: "1.0.0"
  }));
}

export function discoverCapabilityConfigurationSchemas(): readonly ConfigurationSchema[] {
  return getPlatformCapabilityFramework().settings.map((setting) => ({
    configurationId: setting.key,
    ownerType: "capability",
    ownerId: setting.capabilityId,
    scope: setting.scope,
    defaultValue: setting.defaultValue,
    dataType: inferConfigurationDataType(setting.defaultValue),
    validationRules: [
      ...(setting.required ? [{ rule: "required" as const }] : []),
      { rule: "type" as const, value: inferConfigurationDataType(setting.defaultValue) }
    ],
    description: `Configuration for capability ${setting.capabilityId}.`,
    version: "1.0.0"
  }));
}

export function discoverPlatformConfigurationSchemas(): readonly ConfigurationSchema[] {
  return [
    ...builtInConfigurationSchemas,
    ...discoverModuleConfigurationSchemas(),
    ...discoverCapabilityConfigurationSchemas()
  ];
}

export function createPlatformConfigurationRegistry() {
  return new ConfigurationRegistry().registerMany(discoverPlatformConfigurationSchemas());
}

export const platformConfigurationRegistry = createPlatformConfigurationRegistry();
