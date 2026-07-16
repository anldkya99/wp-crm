import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformOrchestrationFramework } from "@/lib/platform/orchestration/orchestration-framework";

export default function OrchestrationCenterFoundationPage() {
  const orchestration = getPlatformOrchestrationFramework();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Platform Orchestration Framework</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Orchestration Center</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">
        Foundation for orchestrator manifests, registry discovery, validation, runtime context, capabilities, and metadata.
      </p>

      <DashboardSection title="Orchestration Runtime">
        <DashboardCard title="Active Orchestrator" value={orchestration.runtime.activeOrchestrator.orchestratorId} description="Orchestration Runtime resolves the active orchestrator context from registered manifests." />
        <DashboardCard title="Registered Orchestrators" value={String(orchestration.metadata.orchestratorCount)} description="Orchestrators register through the Orchestration Registry." />
        <DashboardCard title="Capabilities" value={String(orchestration.metadata.capabilityCount)} description={orchestration.metadata.capabilities.join(", ")} />
      </DashboardSection>

      <DashboardSection title="Architecture Boundary">
        <DashboardCard title="Execution" value="Not Implemented" description="This foundation exposes contracts and runtime context only." />
        <DashboardCard title="Runtime Context" value="Ready" description="Future orchestration paths must enter through Orchestration Runtime and consume platform contexts." />
        <DashboardCard title="Validation" value="Enabled" description="Orchestration manifests are validated and duplicate orchestrators are rejected." />
      </DashboardSection>

      <DashboardSection title="Orchestrators">
        {orchestration.runtime.orchestrators.map((orchestrator) => (
          <DashboardCard
            key={orchestrator.orchestratorId}
            title={String(orchestrator.metadata.name)}
            value={orchestrator.lifecycle}
            description={`${orchestrator.orchestratorId}. Kind: ${orchestrator.kind}. Capabilities: ${orchestrator.capabilities.join(", ")}.`}
          />
        ))}
      </DashboardSection>
    </div>
  );
}
