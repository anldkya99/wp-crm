import type { IndustryProfile } from "@/lib/platform/industry-profiles";
import { getPlatformConfigurationEngine } from "@/lib/platform/configuration/configuration-engine";

export function buildInitialCompanySettings(input: {
  language: string;
  timezone: string;
  currency: string;
  industryProfile: IndustryProfile;
}) {
  const configuration = getPlatformConfigurationEngine();
  const resolver = configuration.createResolver({
    registry: configuration.registry,
    targetScope: "company",
    layers: [
      { scope: "platform", values: {} },
      {
        scope: "company",
        values: {
          default_language: { language: input.language },
          default_timezone: { timezone: input.timezone },
          default_currency: { currency: input.currency },
          dashboard_preferences: { widgets: input.industryProfile.dashboard },
          initial_system_labels: input.industryProfile.labels,
          industry_templates: {
            templates: input.industryProfile.templates,
            shortcuts: input.industryProfile.shortcuts,
            reports: input.industryProfile.reports
          }
        }
      }
    ]
  });

  return configuration.schemas
    .filter((schema) => schema.scope === "company")
    .map((schema) => {
      const resolved = resolver.resolve(schema.configurationId);
      return { key: resolved.configurationId, value: resolved.value };
    });
}
