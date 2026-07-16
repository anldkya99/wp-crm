import type { ConfigurationDataType, ConfigurationSchema } from "@/lib/platform/configuration/configuration-schema";

export class ConfigurationValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export function inferConfigurationDataType(value: unknown): ConfigurationDataType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const valueType = typeof value;
  if (valueType === "string" || valueType === "number" || valueType === "boolean") return valueType;
  return "object";
}

export function validateConfigurationValue(schema: ConfigurationSchema, value: unknown) {
  if (schema.validationRules.some((rule) => rule.rule === "required") && (value === null || value === undefined || value === "")) {
    throw new ConfigurationValidationError(`${schema.configurationId} is required.`, "CONFIGURATION_REQUIRED");
  }

  const expectedType = schema.validationRules.find((rule) => rule.rule === "type")?.value ?? schema.dataType;
  if (expectedType && inferConfigurationDataType(value) !== expectedType) {
    throw new ConfigurationValidationError(`${schema.configurationId} must be ${String(expectedType)}.`, "INVALID_CONFIGURATION_TYPE");
  }

  return true;
}
