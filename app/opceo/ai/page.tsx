import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformAIFramework } from "@/lib/platform/ai/ai-framework";

export default function AICenterFoundationPage() {
  const ai = getPlatformAIFramework();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Platform AI Framework</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">AI Center</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">
        Foundation for AI provider manifests, registry discovery, validation, runtime context, provider capabilities, and metadata.
      </p>

      <DashboardSection title="AI Runtime">
        <DashboardCard title="Active Provider" value={ai.runtime.activeProvider.providerId} description="AI Runtime resolves the active provider context from registered manifests." />
        <DashboardCard title="Providers" value={String(ai.metadata.providerCount)} description="Providers register through the AI Registry." />
        <DashboardCard title="Capabilities" value={String(ai.metadata.capabilityCount)} description={ai.metadata.capabilities.join(", ")} />
      </DashboardSection>

      <DashboardSection title="Architecture Boundary">
        <DashboardCard title="External Intelligence" value="Not Implemented" description="This foundation exposes contracts and runtime context only." />
        <DashboardCard title="Runtime Context" value="Ready" description="Future AI execution must enter through AI Runtime and consume platform contexts." />
        <DashboardCard title="Validation" value="Enabled" description="AI manifests are validated and duplicate providers are rejected." />
      </DashboardSection>

      <DashboardSection title="Providers">
        {ai.runtime.providers.map((provider) => (
          <DashboardCard
            key={provider.providerId}
            title={String(provider.metadata.name)}
            value={provider.lifecycle}
            description={`${provider.providerId}. Kind: ${provider.kind}. Capabilities: ${provider.capabilities.join(", ")}.`}
          />
        ))}
      </DashboardSection>
    </div>
  );
}
