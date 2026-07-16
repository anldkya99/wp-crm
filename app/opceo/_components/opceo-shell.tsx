import Link from "next/link";
import type { ReactNode } from "react";
import type { OpCeoNavigationItem } from "@/lib/platform/opceo-navigation";

export function OpCeoShell({ children, navigation }: { children: ReactNode; navigation: OpCeoNavigationItem[] }) {
  return (
    <main className="min-h-screen bg-[#05080A] text-[#F4F1EA]">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-72 shrink-0 border-r border-[#1C3434] bg-[#071113] px-6 py-8 lg:block">
          <Link href="/opceo/panel" className="block">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#C8A45D]">Operation Pact</p>
            <h1 className="mt-3 text-xl font-semibold tracking-tight">OP CEO Control Center</h1>
          </Link>
          <nav className="mt-10 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-[#9CA8A8] transition hover:border-[#1C3434] hover:bg-[#0B1718] hover:text-[#F4F1EA]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            className="mt-10 inline-flex rounded-full border border-[#C8A45D]/40 px-4 py-2 text-sm font-semibold text-[#C8A45D] transition hover:border-[#C8A45D] hover:bg-[#C8A45D]/10"
          >
            CRM Home
          </Link>
        </aside>
        <section className="min-w-0 flex-1 px-5 py-6 md:px-8 lg:px-10">
          <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full border border-[#1C3434] bg-[#071113] px-3 py-2 text-xs font-semibold text-[#9CA8A8]">
                {item.label}
              </Link>
            ))}
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
