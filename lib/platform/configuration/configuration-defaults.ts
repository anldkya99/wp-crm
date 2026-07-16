import type { ConfigurationSchema } from "@/lib/platform/configuration/configuration-schema";
import { platformConfigurationRegistry } from "@/lib/platform/configuration/configuration-discovery";

export function buildDefaultConfigurations(schemas: readonly ConfigurationSchema[] = platformConfigurationRegistry.list()) {
  return schemas.map((schema) => ({
    key: schema.configurationId,
    value: schema.defaultValue,
    scope: schema.scope,
    ownerType: schema.ownerType,
    ownerId: schema.ownerId,
    version: schema.version
  }));
}
