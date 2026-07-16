import { DashboardCard } from "@/app/opceo/_components/dashboard-card";

export function FoundationPage({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Foundation</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">{description}</p>
      <div className="mt-8 max-w-2xl">
        <DashboardCard
          title="Module Status"
          value="Empty"
          description="This platform module is registered in the OP CEO navigation foundation. Business functionality will be introduced in a later sprint."
        />
      </div>
    </div>
  );
}
