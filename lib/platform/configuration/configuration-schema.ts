export type ConfigurationScope = "platform" | "company" | "department" | "operator";

export type ConfigurationDataType =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "array"
  | "null";

export type ConfigurationOwnerType = "platform" | "module" | "capability";

export type ConfigurationValidationRule = {
  rule: "required" | "type";
  value?: unknown;
  message?: string;
};

export type ConfigurationSchema = {
  configurationId: string;
  ownerType: ConfigurationOwnerType;
  ownerId: string;
  scope: ConfigurationScope;
  defaultValue: unknown;
  dataType: ConfigurationDataType;
  validationRules: readonly ConfigurationValidationRule[];
  description: string;
  version: string;
};

export type ConfigurationLayer = {
  scope: ConfigurationScope;
  values: Record<string, unknown>;
};

export type ResolvedConfigurationValue = {
  configurationId: string;
  value: unknown;
  sourceScope: ConfigurationScope | "default";
  schema: ConfigurationSchema;
};
