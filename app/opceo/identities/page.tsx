import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformIdentityFramework } from "@/lib/platform/identity/identity-framework";

export default function IdentityCenterFoundationPage() {
  const identityFramework = getPlatformIdentityFramework();
  const activeIdentities = identityFramework.identities.filter((identity) => identity.lifecycle === "active");
  const aiIdentities = identityFramework.identities.filter((identity) => identity.principalType.startsWith("AI_"));
  const serviceIdentities = identityFramework.identities.filter((identity) => identity.principalType === "PLATFORM_SERVICE");

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Identity Framework</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Identity Center</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">
        Foundation for unified identities, principals, lifecycle states, runtime identity context, service identities, AI identities, and future authentication providers.
      </p>

      <DashboardSection title="Identity Runtime">
        <DashboardCard title="Identities" value={String(identityFramework.identities.length)} description="Identity manifests registered through the centralized Identity Registry." />
        <DashboardCard title="Principal Types" value={String(identityFramework.principalTypes.length)} description="Every actor resolves to a Platform Principal." />
        <DashboardCard title="Active" value={String(activeIdentities.length)} description="Active identities are available to runtime contexts." />
      </DashboardSection>

      <DashboardSection title="Foundation Coverage">
        <DashboardCard title="AI Identities" value={String(aiIdentities.length)} description="AI Agent and AI Supervisor placeholders are first-class principal types." />
        <DashboardCard title="Service Identities" value={String(serviceIdentities.length)} description="Platform services can act as principals without authentication coupling." />
        <DashboardCard title="Lifecycle" value="Ready" description="Created, active, suspended, locked, archived, and deleted states are centralized." />
      </DashboardSection>

      <DashboardSection title="Identity Registry">
        {identityFramework.identities.map((identity) => (
          <DashboardCard
            key={identity.identityId}
            title={String(identity.runtimeMetadata.displayName ?? identity.identityId)}
            value={identity.principalType}
            description={`${identity.identityId}. Lifecycle: ${identity.lifecycle}. Capabilities: ${identity.capabilities.join(", ") || "none"}.`}
          />
        ))}
      </DashboardSection>
    </div>
  );
}
