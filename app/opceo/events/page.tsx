import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformEventFramework } from "@/lib/platform/events/event-framework";
import { getServerTranslator } from "@/lib/platform/localization/server";

export default async function EventCenterFoundationPage() {
  const t = await getServerTranslator();
  const eventFramework = getPlatformEventFramework();
  const categories = Array.from(new Set(eventFramework.events.map((event) => event.category)));

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">{t("opceo.framework.event.eyebrow")}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("opceo.framework.event.title")}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">{t("opceo.framework.event.description")}</p>

      <DashboardSection title="Event Bus">
        <DashboardCard title="Registered Events" value={String(eventFramework.metadata.eventCount)} description="Events are registered through the centralized Event Registry." />
        <DashboardCard title="Categories" value={String(eventFramework.metadata.categoryCount)} description={categories.join(", ")} />
        <DashboardCard title="Subscribers" value={String(eventFramework.metadata.subscriberCount)} description="Subscriber registration is available for future automation, audit, notifications, analytics, and AI monitoring." />
      </DashboardSection>

      <DashboardSection title="Dispatch">
        <DashboardCard title="Published Events" value={String(eventFramework.metadata.dispatchedEvents)} description="The in-process foundation tracks dispatch metadata without implementing distributed queues." />
        <DashboardCard title="Validation" value="Enabled" description="Payloads are validated against registered event manifests before dispatch." />
        <DashboardCard title="Runtime Context" value="Ready" description="Event context includes source, timestamp, correlation ID, company scope, operator scope, and permission context." />
      </DashboardSection>

      <DashboardSection title="Event Registry">
        {eventFramework.events.map((event) => (
          <DashboardCard
            key={event.eventId}
            title={event.eventName}
            value={event.category}
            description={`${event.eventId} from ${event.source} to ${event.target}. Version ${event.version}.`}
          />
        ))}
      </DashboardSection>
    </div>
  );
}
