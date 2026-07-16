import type { PlatformEventBus } from "@/lib/platform/events/event-bus";
import type { PlatformEventRegistry } from "@/lib/platform/events/event-registry";

export function getPlatformEventMetadata(registry: PlatformEventRegistry, bus: PlatformEventBus) {
  const events = registry.list();
  const categories = new Set(events.map((event) => event.category));
  return {
    eventCount: events.length,
    categoryCount: categories.size,
    subscriberCount: bus.getSubscriberCount(),
    dispatchedEvents: bus.getDispatchLog().length,
    eventsByCategory: Object.fromEntries(
      Array.from(categories).map((category) => [category, events.filter((event) => event.category === category).length])
    )
  };
}
