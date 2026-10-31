import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformIntegrationFramework } from "@/lib/platform/integrations/integration-framework";
import { getServerTranslator } from "@/lib/platform/localization/server";

export default async function IntegrationCenterFoundationPage() {
  const t = await getServerTranslator();
  const integrations = getPlatformIntegrationFramework();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">{t("opceo.framework.integration.eyebrow")}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("opceo.framework.integration.title")}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">{t("opceo.framework.integration.description")}</p>

      <DashboardSection title={t("opceo.framework.integrationRuntime")}>
        <DashboardCard title={t("opceo.framework.activeProvider")} value={integrations.runtime.activeProvider.providerId} description={t("opceo.framework.activeProvider.integration.description")} />
        <DashboardCard title={t("opceo.framework.registeredProviders")} value={String(integrations.metadata.providerCount)} description={t("opceo.framework.providerRegistry.integration.description")} />
        <DashboardCard title={t("opceo.framework.capabilities")} value={String(integrations.metadata.capabilityCount)} description={integrations.metadata.capabilities.join(", ")} />
      </DashboardSection>

      <DashboardSection title={t("opceo.framework.architectureBoundary")}>
        <DashboardCard title={t("opceo.framework.externalCommunication")} value={t("opceo.notImplemented")} description={t("opceo.framework.contractsOnly.description")} />
        <DashboardCard title={t("opceo.framework.runtimeContext")} value={t("opceo.ready")} description={t("opceo.framework.integrationContext.description")} />
        <DashboardCard title={t("opceo.framework.validation")} value={t("opceo.framework.validationEnabled")} description={t("opceo.framework.validation.integrations.description")} />
      </DashboardSection>

      <DashboardSection title={t("opceo.framework.providers")}>
        {integrations.runtime.providers.map((provider) => (
          <DashboardCard
            key={provider.providerId}
            title={String(provider.metadata.name)}
            value={provider.lifecycle}
            description={t("opceo.framework.itemDescription", { id: provider.providerId, kind: provider.kind, capabilities: provider.capabilities.join(", ") })}
          />
        ))}
      </DashboardSection>
    </div>
  );
}
