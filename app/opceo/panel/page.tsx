import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getServerTranslator } from "@/lib/platform/localization/server";

export default async function OpCeoPanelPage() {
  const t = await getServerTranslator();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">{t("opceo.panel.eyebrow")}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("opceo.title")}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">{t("opceo.panel.description")}</p>

      <DashboardSection title={t("opceo.panel.platformOverview")}>
        <DashboardCard title={t("opceo.panel.platformOverview")} value={t("opceo.ready")} description={t("opceo.panel.platformOverview.description")} />
        <DashboardCard title={t("opceo.nav.companies")} value={t("opceo.foundation")} description={t("opceo.panel.companies.description")} />
        <DashboardCard title={t("opceo.nav.productCenter")} value={t("opceo.entry")} description={t("opceo.panel.productCenter.description")} />
      </DashboardSection>

      <DashboardSection title={t("opceo.panel.controlAreas")}>
        <DashboardCard title={t("opceo.panel.platformHealth")} value={t("opceo.pending")} description={t("opceo.panel.platformHealth.description")} />
        <DashboardCard title={t("opceo.nav.audit")} value={t("opceo.empty")} description={t("opceo.panel.audit.description")} />
        <DashboardCard title={t("opceo.panel.systemSettings")} value={t("opceo.empty")} description={t("opceo.panel.systemSettings.description")} />
      </DashboardSection>
    </div>
  );
}
