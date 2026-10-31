import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getServerTranslator } from "@/lib/platform/localization/server";
import { getPlatformStorageFramework } from "@/lib/platform/storage/storage-framework";

export default async function StorageCenterFoundationPage() {
  const t = await getServerTranslator();
  const storage = getPlatformStorageFramework();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">{t("opceo.framework.storage.eyebrow")}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("opceo.framework.storage.title")}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">{t("opceo.framework.storage.description")}</p>

      <DashboardSection title={t("opceo.framework.storageRuntime")}>
        <DashboardCard title={t("opceo.framework.activeProvider")} value={storage.runtime.activeProvider.providerId} description={t("opceo.framework.activeProvider.storage.description")} />
        <DashboardCard title={t("opceo.framework.registeredProviders")} value={String(storage.metadata.providerCount)} description={t("opceo.framework.providerRegistry.storage.description")} />
        <DashboardCard title={t("opceo.framework.capabilities")} value={String(storage.metadata.capabilityCount)} description={storage.metadata.capabilities.join(", ")} />
      </DashboardSection>

      <DashboardSection title={t("opceo.framework.architectureBoundary")}>
        <DashboardCard title={t("opceo.framework.persistence")} value={t("opceo.notImplemented")} description={t("opceo.framework.contractsOnly.description")} />
        <DashboardCard title={t("opceo.framework.runtimeContext")} value={t("opceo.ready")} description={t("opceo.framework.storageContext.description")} />
        <DashboardCard title={t("opceo.framework.validation")} value={t("opceo.framework.validationEnabled")} description={t("opceo.framework.validation.storage.description")} />
      </DashboardSection>

      <DashboardSection title={t("opceo.framework.providers")}>
        {storage.runtime.providers.map((provider) => (
          <DashboardCard
            key={provider.providerId}
            title={String(provider.metadata.name)}
            value={provider.lifecycle}
            description={t("opceo.framework.itemDescription", { id: provider.providerId, kind: provider.kind, capabilities: provider.capabilities.join(", ") })}
          />
        ))}
      </DashboardSection>
    </div>
  );
}
