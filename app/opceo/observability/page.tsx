import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformObservabilityFramework } from "@/lib/platform/observability/observability-framework";

export default function ObservabilityCenterFoundationPage() {
  const observability = getPlatformObservabilityFramework();
  const degraded = observability.health.filter((entry) => entry.status === "degraded");
  const unhealthy = observability.health.filter((entry) => entry.status === "unhealthy");

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Platform Observability</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Observability Center</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">
        Foundation for aggregated framework health, metrics, diagnostics, runtime monitoring context, and future monitoring contracts.
      </p>

      <DashboardSection title="Platform Health">
        <DashboardCard title="Status" value={observability.snapshot.status} description="Aggregated health status from registered observability contracts." />
        <DashboardCard title="Components" value={String(observability.manifests.length)} description="Frameworks report health through their own component contracts." />
        <DashboardCard title="Issues" value={String(degraded.length + unhealthy.length)} description="Degraded and unhealthy components reported through the health framework." />
      </DashboardSection>

      <DashboardSection title="Runtime Monitoring Context">
        <DashboardCard title="Health Records" value={String(observability.health.length)} description="Module, capability, configuration, license, event, workflow, service, identity, and runtime health records." />
        <DashboardCard title="Metrics" value={String(observability.metrics.length)} description="Foundation metrics are aggregated through internal contracts only." />
        <DashboardCard title="Diagnostics" value={String(observability.diagnostics.length)} description="Diagnostics are contract-reported framework messages only." />
      </DashboardSection>

      <DashboardSection title="Component Health">
        {observability.health.map((health) => (
          <DashboardCard
            key={health.componentId}
            title={health.componentId}
            value={health.status}
            description={`${health.message} Dependencies: ${health.dependencies.join(", ") || "none"}.`}
          />
        ))}
      </DashboardSection>
    </div>
  );
}
