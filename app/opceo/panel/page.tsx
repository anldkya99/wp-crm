import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";

export default function OpCeoPanelPage() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Platform Foundation</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">OP CEO Control Center</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">
        Global platform administration foundation for Operation Pact. This dashboard is structural only; business data and module operations will arrive in later sprints.
      </p>

      <DashboardSection title="Platform Overview">
        <DashboardCard title="Platform Overview" value="Ready" description="Global platform control surface registered and protected by the Permission Engine." />
        <DashboardCard title="Companies" value="Foundation" description="Company control entry is available without company management workflows." />
        <DashboardCard title="Product Center" value="Entry" description="Roadmap center route is prepared as an empty platform module." />
      </DashboardSection>

      <DashboardSection title="Control Areas">
        <DashboardCard title="Platform Health" value="Pending" description="Health surfaces are reserved for future platform runtime indicators." />
        <DashboardCard title="Audit" value="Empty" description="Audit entry exists for future platform-wide accountability records." />
        <DashboardCard title="System Settings" value="Empty" description="Settings route is prepared without mutable configuration." />
      </DashboardSection>
    </div>
  );
}
