import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getServerTranslator } from "@/lib/platform/localization/server";
import { getPlatformOrchestrationFramework } from "@/lib/platform/orchestration/orchestration-framework";

export default async function OrchestrationCenterFoundationPage() {
  const t = await getServerTranslator();
  const orchestration = getPlatformOrchestrationFramework();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">{t("opceo.framework.orchestration.eyebrow")}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("opceo.framework.orchestration.title")}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">{t("opceo.framework.orchestration.description")}</p>

      <DashboardSection title={t("opceo.framework.orchestrationRuntime")}>
        <DashboardCard title={t("opceo.framework.activeOrchestrator")} value={orchestration.runtime.activeOrchestrator.orchestratorId} description={t("opceo.framework.activeOrchestrator.description")} />
        <DashboardCard title={t("opceo.framework.registeredOrchestrators")} value={String(orchestration.metadata.orchestratorCount)} description={t("opceo.framework.orchestratorRegistry.description")} />
        <DashboardCard title={t("opceo.framework.capabilities")} value={String(orchestration.metadata.capabilityCount)} description={orchestration.metadata.capabilities.join(", ")} />
      </DashboardSection>

      <DashboardSection title={t("opceo.framework.architectureBoundary")}>
        <DashboardCard title={t("opceo.framework.execution")} value={t("opceo.notImplemented")} description={t("opceo.framework.contractsOnly.description")} />
        <DashboardCard title={t("opceo.framework.runtimeContext")} value={t("opceo.ready")} description={t("opceo.framework.orchestrationContext.description")} />
        <DashboardCard title={t("opceo.framework.validation")} value={t("opceo.framework.validationEnabled")} description={t("opceo.framework.validation.orchestration.description")} />
      </DashboardSection>

      <DashboardSection title={t("opceo.framework.orchestrators")}>
        {orchestration.runtime.orchestrators.map((orchestrator) => (
          <DashboardCard
            key={orchestrator.orchestratorId}
            title={String(orchestrator.metadata.name)}
            value={orchestrator.lifecycle}
            description={t("opceo.framework.itemDescription", { id: orchestrator.orchestratorId, kind: orchestrator.kind, capabilities: orchestrator.capabilities.join(", ") })}
          />
        ))}
      </DashboardSection>
    </div>
  );
}
