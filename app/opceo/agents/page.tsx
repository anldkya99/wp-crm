import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformAgentFramework } from "@/lib/platform/agents/agent-framework";

export default function AgentCenterFoundationPage() {
  const agents = getPlatformAgentFramework();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Platform Agent Framework</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Agent Center</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">
        Foundation for agent manifests, registry discovery, validation, runtime context, capabilities, and metadata.
      </p>

      <DashboardSection title="Agent Runtime">
        <DashboardCard title="Active Agent" value={agents.runtime.activeAgent.agentId} description="Agent Runtime resolves the active agent context from registered manifests." />
        <DashboardCard title="Registered Agents" value={String(agents.metadata.agentCount)} description="Agents register through the Agent Registry." />
        <DashboardCard title="Capabilities" value={String(agents.metadata.capabilityCount)} description={agents.metadata.capabilities.join(", ")} />
      </DashboardSection>

      <DashboardSection title="Architecture Boundary">
        <DashboardCard title="Execution" value="Not Implemented" description="This foundation exposes contracts and runtime context only." />
        <DashboardCard title="Runtime Context" value="Ready" description="Future agent activity must enter through Agent Runtime and consume platform contexts." />
        <DashboardCard title="Validation" value="Enabled" description="Agent manifests are validated and duplicate registrations are rejected." />
      </DashboardSection>

      <DashboardSection title="Agents">
        {agents.runtime.agents.map((agent) => (
          <DashboardCard
            key={agent.agentId}
            title={String(agent.metadata.name)}
            value={agent.lifecycle}
            description={`${agent.agentId}. Kind: ${agent.kind}. Capabilities: ${agent.capabilities.join(", ")}.`}
          />
        ))}
      </DashboardSection>
    </div>
  );
}
