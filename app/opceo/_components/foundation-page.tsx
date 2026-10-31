import { DashboardCard } from "@/app/opceo/_components/dashboard-card";
import { getServerTranslator } from "@/lib/platform/localization/server";

export async function FoundationPage({ titleKey, descriptionKey }: { titleKey: string; descriptionKey: string }) {
  const t = await getServerTranslator();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">{t("opceo.foundation")}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t(titleKey)}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">{t(descriptionKey)}</p>
      <div className="mt-8 max-w-2xl">
        <DashboardCard
          title={t("opceo.moduleStatus")}
          value={t("opceo.empty")}
          description={t("opceo.moduleStatus.description")}
        />
      </div>
    </div>
  );
}
