import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformAgentFramework } from "@/lib/platform/agents/agent-framework";
import { getServerTranslator } from "@/lib/platform/localization/server";

export default async function AgentCenterFoundationPage() {
  const t = await getServerTranslator();
  const agents = getPlatformAgentFramework();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">{t("opceo.framework.agent.eyebrow")}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("opceo.framework.agent.title")}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">{t("opceo.framework.agent.description")}</p>

      <DashboardSection title={t("opceo.framework.agentRuntime")}>
        <DashboardCard title={t("opceo.framework.activeAgent")} value={agents.runtime.activeAgent.agentId} description={t("opceo.framework.activeAgent.description")} />
        <DashboardCard title={t("opceo.framework.registeredAgents")} value={String(agents.metadata.agentCount)} description={t("opceo.framework.agentRegistry.description")} />
        <DashboardCard title={t("opceo.framework.capabilities")} value={String(agents.metadata.capabilityCount)} description={agents.metadata.capabilities.join(", ")} />
      </DashboardSection>

      <DashboardSection title={t("opceo.framework.architectureBoundary")}>
        <DashboardCard title={t("opceo.framework.execution")} value={t("opceo.notImplemented")} description={t("opceo.framework.contractsOnly.description")} />
        <DashboardCard title={t("opceo.framework.runtimeContext")} value={t("opceo.ready")} description={t("opceo.framework.agentContext.description")} />
        <DashboardCard title={t("opceo.framework.validation")} value={t("opceo.framework.validationEnabled")} description={t("opceo.framework.validation.agents.description")} />
      </DashboardSection>

      <DashboardSection title={t("opceo.framework.agents")}>
        {agents.runtime.agents.map((agent) => (
          <DashboardCard
            key={agent.agentId}
            title={String(agent.metadata.name)}
            value={agent.lifecycle}
            description={t("opceo.framework.itemDescription", { id: agent.agentId, kind: agent.kind, capabilities: agent.capabilities.join(", ") })}
          />
        ))}
      </DashboardSection>
    </div>
  );
}
