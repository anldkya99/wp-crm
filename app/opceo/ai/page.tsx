import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformAIFramework } from "@/lib/platform/ai/ai-framework";
import { getServerTranslator } from "@/lib/platform/localization/server";

export default async function AICenterFoundationPage() {
  const t = await getServerTranslator();
  const ai = getPlatformAIFramework();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">{t("opceo.framework.ai.eyebrow")}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("opceo.framework.ai.title")}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">{t("opceo.framework.ai.description")}</p>

      <DashboardSection title={t("opceo.framework.aiRuntime")}>
        <DashboardCard title={t("opceo.framework.activeProvider")} value={ai.runtime.activeProvider.providerId} description={t("opceo.framework.activeProvider.ai.description")} />
        <DashboardCard title={t("opceo.framework.registeredProviders")} value={String(ai.metadata.providerCount)} description={t("opceo.framework.providerRegistry.ai.description")} />
        <DashboardCard title={t("opceo.framework.capabilities")} value={String(ai.metadata.capabilityCount)} description={ai.metadata.capabilities.join(", ")} />
      </DashboardSection>

      <DashboardSection title={t("opceo.framework.architectureBoundary")}>
        <DashboardCard title={t("opceo.framework.externalIntelligence")} value={t("opceo.notImplemented")} description={t("opceo.framework.contractsOnly.description")} />
        <DashboardCard title={t("opceo.framework.runtimeContext")} value={t("opceo.ready")} description={t("opceo.framework.aiContext.description")} />
        <DashboardCard title={t("opceo.framework.validation")} value={t("opceo.framework.validationEnabled")} description={t("opceo.framework.validation.ai.description")} />
      </DashboardSection>

      <DashboardSection title={t("opceo.framework.providers")}>
        {ai.runtime.providers.map((provider) => (
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
