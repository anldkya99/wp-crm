import type { PlatformEventBus } from "@/lib/platform/events/event-bus";
import type { EventContextInput } from "@/lib/platform/events/event-context";

export function createEventPublisher(bus: PlatformEventBus) {
  return {
    publish: <TPayload extends Record<string, unknown>>(eventId: string, payload: TPayload, context?: EventContextInput) =>
      bus.publish(eventId, payload, context)
  };
}
