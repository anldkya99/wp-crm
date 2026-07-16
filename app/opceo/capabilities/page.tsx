import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformCapabilityFramework } from "@/lib/platform/capabilities/capability-framework";

export default function CapabilitiesFoundationPage() {
  const framework = getPlatformCapabilityFramework();
  const defaultEnabledCount = framework.capabilities.filter((capability) => capability.defaultEnabled).length;
  const dependencyCount = framework.capabilities.filter((capability) => capability.dependencies.length > 0).length;
  const lifecycleTargets = framework.lifecycle.nextStates("registered");

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Capability Framework</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Capabilities</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">
        Registry-backed foundation for independently licensed, configured, audited, and extended module capabilities.
      </p>

      <DashboardSection title="Registry">
        <DashboardCard title="Registered" value={String(framework.capabilities.length)} description="Capabilities discovered through the centralized Capability Registry." />
        <DashboardCard title="Default Enabled" value={String(defaultEnabledCount)} description="Capabilities marked for default activation during company provisioning when their module and license are active." />
        <DashboardCard title="Dependencies" value={String(dependencyCount)} description="Capability dependency metadata is validated by the registry before provisioning uses it." />
      </DashboardSection>

      <DashboardSection title="Foundations">
        <DashboardCard title="Permissions" value={String(framework.permissions.length)} description="Capability permission declarations are standardized for the Permission Engine to consume in future sprints." />
        <DashboardCard title="Feature Flags" value={String(framework.featureFlags.length)} description="Capability feature flags are centralized and available to provisioning configuration." />
        <DashboardCard title="Lifecycle" value={lifecycleTargets.join(", ")} description="Lifecycle transitions are defined for future runtime and marketplace systems." />
      </DashboardSection>

      <DashboardSection title="Capability Catalog">
        {framework.capabilities.map((capability) => (
          <DashboardCard
            key={capability.capabilityId}
            title={capability.name}
            value={capability.defaultEnabled ? "Default" : "Optional"}
            description={`${capability.capabilityId} in ${capability.moduleId}. Requires ${capability.licenseRequirement} license.`}
          >
            <div className="space-y-2 text-xs leading-5 text-[#9CA8A8]">
              <p>Permission group: {capability.permissionGroup}</p>
              <p>Feature flags: {capability.featureFlags.map((featureFlag) => featureFlag.key).join(", ") || "none"}</p>
              <p>Dependencies: {capability.dependencies.join(", ") || "none"}</p>
            </div>
          </DashboardCard>
        ))}
      </DashboardSection>
    </div>
  );
}
