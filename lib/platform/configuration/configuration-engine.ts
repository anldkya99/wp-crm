import { platformConfigurationRegistry } from "@/lib/platform/configuration/configuration-discovery";
import { buildDefaultConfigurations } from "@/lib/platform/configuration/configuration-defaults";
import { createConfigurationResolver } from "@/lib/platform/configuration/configuration-resolver";
import { createConfigurationVersionRecord } from "@/lib/platform/configuration/configuration-versioning";

export function getPlatformConfigurationEngine() {
  return {
    registry: platformConfigurationRegistry,
    schemas: platformConfigurationRegistry.list(),
    defaults: buildDefaultConfigurations(),
    createResolver: createConfigurationResolver,
    createVersionRecord: createConfigurationVersionRecord
  };
}
