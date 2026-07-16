import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformStorageFramework } from "@/lib/platform/storage/storage-framework";

export default function StorageCenterFoundationPage() {
  const storage = getPlatformStorageFramework();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Platform Storage Framework</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Storage Center</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">
        Foundation for storage provider manifests, registry discovery, validation, runtime context, provider capabilities, and metadata.
      </p>

      <DashboardSection title="Storage Runtime">
        <DashboardCard title="Active Provider" value={storage.runtime.activeProvider.providerId} description="Storage Runtime resolves the active provider context from registered manifests." />
        <DashboardCard title="Providers" value={String(storage.metadata.providerCount)} description="Providers register through the Storage Registry." />
        <DashboardCard title="Capabilities" value={String(storage.metadata.capabilityCount)} description={storage.metadata.capabilities.join(", ")} />
      </DashboardSection>

      <DashboardSection title="Architecture Boundary">
        <DashboardCard title="Persistence" value="Not Implemented" description="This foundation exposes contracts and runtime context only." />
        <DashboardCard title="Runtime Context" value="Ready" description="Future frameworks can consume Storage Context without directly choosing providers." />
        <DashboardCard title="Validation" value="Enabled" description="Storage manifests are validated and duplicate providers are rejected." />
      </DashboardSection>

      <DashboardSection title="Providers">
        {storage.runtime.providers.map((provider) => (
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
