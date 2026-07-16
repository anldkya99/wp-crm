import type { ConfigurationSchema } from "@/lib/platform/configuration/configuration-schema";
import { validateConfigurationValue } from "@/lib/platform/configuration/configuration-validation";

export class ConfigurationRegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class ConfigurationRegistry {
  private schemas = new Map<string, ConfigurationSchema>();

  register(schema: ConfigurationSchema) {
    this.validateSchema(schema);
    if (this.schemas.has(schema.configurationId)) {
      throw new ConfigurationRegistryError(`Duplicate configuration schema: ${schema.configurationId}`, "DUPLICATE_CONFIGURATION_SCHEMA");
    }
    this.schemas.set(schema.configurationId, schema);
    return this;
  }

  registerMany(schemas: readonly ConfigurationSchema[]) {
    schemas.forEach((schema) => this.register(schema));
    return this;
  }

  get(configurationId: string) {
    return this.schemas.get(configurationId) ?? null;
  }

  list() {
    return Array.from(this.schemas.values());
  }

  discover(predicate?: (schema: ConfigurationSchema) => boolean) {
    const schemas = this.list();
    return predicate ? schemas.filter(predicate) : schemas;
  }

  private validateSchema(schema: ConfigurationSchema) {
    if (!schema.configurationId || !schema.ownerId || !schema.scope || !schema.version || !schema.description) {
      throw new ConfigurationRegistryError("Configuration schema is missing required metadata.", "INVALID_CONFIGURATION_SCHEMA");
    }
    validateConfigurationValue(schema, schema.defaultValue);
  }
}
