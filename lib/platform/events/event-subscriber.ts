import type { PlatformEventBus } from "@/lib/platform/events/event-bus";
import type { PlatformEventSubscriber } from "@/lib/platform/events/event-manifest";

export function createEventSubscriber(bus: PlatformEventBus) {
  return {
    subscribe: (subscriber: PlatformEventSubscriber) => bus.subscribe(subscriber)
  };
}
