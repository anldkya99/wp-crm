import type { ReactNode } from "react";

export function DashboardCard({
  title,
  value,
  description,
  children
}: {
  title: string;
  value?: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-[#1C3434] bg-[#0B1718] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C8A45D]">{title}</p>
      {value && <p className="mt-4 text-3xl font-semibold tracking-tight text-[#F4F1EA]">{value}</p>}
      <p className="mt-3 text-sm leading-6 text-[#9CA8A8]">{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </article>
  );
}

export function DashboardSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold tracking-tight text-[#F4F1EA]">{title}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}
