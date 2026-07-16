import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformIntegrationFramework } from "@/lib/platform/integrations/integration-framework";

export default function IntegrationCenterFoundationPage() {
  const integrations = getPlatformIntegrationFramework();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Platform Integration Framework</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Integration Center</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">
        Foundation for integration provider manifests, registry discovery, validation, runtime context, provider capabilities, and metadata.
      </p>

      <DashboardSection title="Integration Runtime">
        <DashboardCard title="Active Provider" value={integrations.runtime.activeProvider.providerId} description="Integration Runtime resolves the active provider context from registered manifests." />
        <DashboardCard title="Providers" value={String(integrations.metadata.providerCount)} description="Providers register through the Integration Registry." />
        <DashboardCard title="Capabilities" value={String(integrations.metadata.capabilityCount)} description={integrations.metadata.capabilities.join(", ")} />
      </DashboardSection>

      <DashboardSection title="Architecture Boundary">
        <DashboardCard title="External Communication" value="Not Implemented" description="This foundation exposes contracts and runtime context only." />
        <DashboardCard title="Runtime Context" value="Ready" description="Future frameworks can consume Integration Context without talking directly to external systems." />
        <DashboardCard title="Validation" value="Enabled" description="Integration manifests are validated and duplicate providers are rejected." />
      </DashboardSection>

      <DashboardSection title="Providers">
        {integrations.runtime.providers.map((provider) => (
          <DashboardCard
            key={provider.providerId}
            title={String(provider.metadata.name)}
            value={provider.lifecycle}
            description={`${provider.providerId}. Kind: ${provider.kind}. Capabilities: ${provider.capabilities.join(", ")}.`}
          />
        ))}
      </DashboardSection>
    </div>
  );
}
