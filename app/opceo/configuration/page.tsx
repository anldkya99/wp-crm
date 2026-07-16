import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformConfigurationEngine } from "@/lib/platform/configuration/configuration-engine";

export default function ConfigurationFoundationPage() {
  const configuration = getPlatformConfigurationEngine();
  const schemasByScope = configuration.schemas.reduce<Record<string, number>>((counts, schema) => {
    counts[schema.scope] = (counts[schema.scope] ?? 0) + 1;
    return counts;
  }, {});
  const schemasByOwner = configuration.schemas.reduce<Record<string, number>>((counts, schema) => {
    counts[schema.ownerType] = (counts[schema.ownerType] ?? 0) + 1;
    return counts;
  }, {});
  const resolver = configuration.createResolver({
    registry: configuration.registry,
    targetScope: "company",
    layers: [{ scope: "platform", values: {} }]
  });

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Configuration Framework</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Configuration Center</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">
        Foundation for centralized schemas, defaults, inheritance, validation, runtime context, and future configuration history.
      </p>

      <DashboardSection title="Registry">
        <DashboardCard title="Schemas" value={String(configuration.schemas.length)} description="Configuration schemas registered through the centralized Configuration Registry." />
        <DashboardCard title="Defaults" value={String(configuration.defaults.length)} description="Default values generated from platform, module, and capability schemas." />
        <DashboardCard title="Company Resolved" value={String(Object.keys(resolver.getConfigurationContext()).length)} description="Company-scope configuration can resolve inherited defaults through the resolver." />
      </DashboardSection>

      <DashboardSection title="Coverage">
        <DashboardCard title="Scopes" value={Object.keys(schemasByScope).length.toString()} description={`Platform ${schemasByScope.platform ?? 0}, company ${schemasByScope.company ?? 0}, department ${schemasByScope.department ?? 0}, operator ${schemasByScope.operator ?? 0}.`} />
        <DashboardCard title="Owners" value={Object.keys(schemasByOwner).length.toString()} description={`Platform ${schemasByOwner.platform ?? 0}, modules ${schemasByOwner.module ?? 0}, capabilities ${schemasByOwner.capability ?? 0}.`} />
        <DashboardCard title="Versioning" value="Ready" description="Configuration version records are prepared for future rollback and history workflows." />
      </DashboardSection>

      <DashboardSection title="Schemas">
        {configuration.schemas.slice(0, 9).map((schema) => (
          <DashboardCard
            key={schema.configurationId}
            title={schema.configurationId}
            value={schema.scope}
            description={`${schema.ownerType} ${schema.ownerId}. Type ${schema.dataType}, version ${schema.version}.`}
          />
        ))}
      </DashboardSection>
    </div>
  );
}
