import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformRuntime } from "@/lib/platform/runtime/platform-runtime";

export default function RuntimeFoundationPage() {
  const runtime = getPlatformRuntime();
  const featureFlags = Array.from(
    new Set([
      ...runtime.graph.modules.flatMap((module) => module.featureFlags.map((featureFlag) => featureFlag.key)),
      ...runtime.graph.capabilities.flatMap((capability) => capability.featureFlags.map((featureFlag) => featureFlag.key))
    ])
  );
  const services = runtime.createServices({
    licensePackage: "custom",
    featureFlags
  });

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Platform Runtime</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Runtime Foundation</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">
        Execution foundation for resolving registered modules, active capabilities, runtime navigation, metadata, and health.
      </p>

      <DashboardSection title="Runtime Metadata">
        <DashboardCard title="Runtime Version" value={services.metadata.runtimeVersion} description="Current foundation runtime contract version." />
        <DashboardCard title="Loaded Modules" value={String(services.metadata.loadedModules)} description="Modules resolved through the Module Registry and runtime loader." />
        <DashboardCard title="Loaded Capabilities" value={String(services.metadata.loadedCapabilities)} description="Capabilities resolved through the Capability Registry and runtime resolver." />
        <DashboardCard title="License Package" value={services.metadata.activePackage} description={`Runtime entitlements are resolved by the License Engine. Status: ${services.metadata.licenseStatus}.`} />
        <DashboardCard title="Principal" value={services.metadata.principalType} description={`Runtime actions resolve through Identity Context. Principal ID: ${services.metadata.principalId}.`} />
      </DashboardSection>

      <DashboardSection title="Runtime State">
        <DashboardCard title="Health" value={services.metadata.healthStatus} description="Runtime health is derived from centralized runtime state records." />
        <DashboardCard title="Navigation Items" value={String(services.navigation.length)} description="Runtime navigation is generated from active modules and capabilities." />
        <DashboardCard title="Dependency Nodes" value={String(services.metadata.dependencyTree.length)} description="Runtime dependency tree generated from registry metadata." />
      </DashboardSection>

      <DashboardSection title="Loaded Components">
        {services.health.slice(0, 9).map((entry) => (
          <DashboardCard
            key={`${entry.type}:${entry.id}`}
            title={entry.id}
            value={entry.status}
            description={`${entry.type} version ${entry.version}. Dependencies: ${entry.dependencies.join(", ") || "none"}.`}
          />
        ))}
      </DashboardSection>
    </div>
  );
}
