import type { ConfigurationSchema } from "@/lib/platform/configuration/configuration-schema";

export const builtInConfigurationSchemas: readonly ConfigurationSchema[] = [
  {
    configurationId: "default_theme",
    ownerType: "platform",
    ownerId: "platform",
    scope: "company",
    defaultValue: { theme: "executive-dark" },
    dataType: "object",
    validationRules: [{ rule: "type", value: "object" }],
    description: "Default company theme configuration.",
    version: "1.0.0"
  },
  {
    configurationId: "default_language",
    ownerType: "platform",
    ownerId: "platform",
    scope: "company",
    defaultValue: { language: "tr" },
    dataType: "object",
    validationRules: [{ rule: "type", value: "object" }],
    description: "Default company language configuration.",
    version: "1.0.0"
  },
  {
    configurationId: "default_timezone",
    ownerType: "platform",
    ownerId: "platform",
    scope: "company",
    defaultValue: { timezone: "Europe/Istanbul" },
    dataType: "object",
    validationRules: [{ rule: "type", value: "object" }],
    description: "Default company timezone configuration.",
    version: "1.0.0"
  },
  {
    configurationId: "default_currency",
    ownerType: "platform",
    ownerId: "platform",
    scope: "company",
    defaultValue: { currency: "TRY" },
    dataType: "object",
    validationRules: [{ rule: "type", value: "object" }],
    description: "Default company currency configuration.",
    version: "1.0.0"
  },
  {
    configurationId: "dashboard_preferences",
    ownerType: "platform",
    ownerId: "platform",
    scope: "company",
    defaultValue: { widgets: [] },
    dataType: "object",
    validationRules: [{ rule: "type", value: "object" }],
    description: "Default dashboard widget configuration.",
    version: "1.0.0"
  },
  {
    configurationId: "notification_preferences",
    ownerType: "platform",
    ownerId: "platform",
    scope: "company",
    defaultValue: { email: true, inApp: true },
    dataType: "object",
    validationRules: [{ rule: "type", value: "object" }],
    description: "Default notification configuration.",
    version: "1.0.0"
  },
  {
    configurationId: "initial_system_labels",
    ownerType: "platform",
    ownerId: "platform",
    scope: "company",
    defaultValue: [],
    dataType: "array",
    validationRules: [{ rule: "type", value: "array" }],
    description: "Initial label configuration generated from an Industry Profile.",
    version: "1.0.0"
  },
  {
    configurationId: "default_tags",
    ownerType: "platform",
    ownerId: "platform",
    scope: "company",
    defaultValue: ["New", "Priority", "Follow Up"],
    dataType: "array",
    validationRules: [{ rule: "type", value: "array" }],
    description: "Default company tag configuration.",
    version: "1.0.0"
  },
  {
    configurationId: "initial_folder_structure",
    ownerType: "platform",
    ownerId: "platform",
    scope: "company",
    defaultValue: ["Inbox", "Operations", "Archive"],
    dataType: "array",
    validationRules: [{ rule: "type", value: "array" }],
    description: "Default company folder structure configuration.",
    version: "1.0.0"
  },
  {
    configurationId: "default_status_definitions",
    ownerType: "platform",
    ownerId: "platform",
    scope: "company",
    defaultValue: ["New", "In Progress", "Waiting", "Completed", "Closed"],
    dataType: "array",
    validationRules: [{ rule: "type", value: "array" }],
    description: "Default company status configuration.",
    version: "1.0.0"
  },
  {
    configurationId: "industry_templates",
    ownerType: "platform",
    ownerId: "platform",
    scope: "company",
    defaultValue: { templates: [], shortcuts: [], reports: [] },
    dataType: "object",
    validationRules: [{ rule: "type", value: "object" }],
    description: "Industry template configuration generated from an Industry Profile.",
    version: "1.0.0"
  }
];
