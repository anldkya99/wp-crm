import type {
  PlatformEventEnvelope,
  PlatformEventSubscriber
} from "@/lib/platform/events/event-manifest";
import type { PlatformEventRegistry } from "@/lib/platform/events/event-registry";
import { createPlatformEventContext, type EventContextInput } from "@/lib/platform/events/event-context";
import { validateEventPayload } from "@/lib/platform/events/event-validation";

export type EventDispatchResult = {
  eventId: string;
  correlationId: string;
  subscriberCount: number;
  dispatchedAt: string;
};

export class PlatformEventBus {
  private subscribers = new Map<string, PlatformEventSubscriber[]>();
  private dispatchLog: PlatformEventEnvelope[] = [];

  constructor(private registry: PlatformEventRegistry) {}

  subscribe(subscriber: PlatformEventSubscriber) {
    if (!this.registry.get(subscriber.eventId)) {
      throw new Error(`Cannot subscribe to unknown event ${subscriber.eventId}.`);
    }
    const subscribers = this.subscribers.get(subscriber.eventId) ?? [];
    this.subscribers.set(subscriber.eventId, [...subscribers, subscriber]);
    return () => this.unsubscribe(subscriber.subscriberId, subscriber.eventId);
  }

  unsubscribe(subscriberId: string, eventId: string) {
    const subscribers = this.subscribers.get(eventId) ?? [];
    this.subscribers.set(eventId, subscribers.filter((subscriber) => subscriber.subscriberId !== subscriberId));
  }

  async publish<TPayload extends Record<string, unknown>>(eventId: string, payload: TPayload, contextInput: EventContextInput = {}): Promise<EventDispatchResult> {
    const manifest = this.registry.get(eventId);
    if (!manifest) throw new Error(`Cannot publish unknown event ${eventId}.`);
    validateEventPayload(manifest, payload);

    const envelope: PlatformEventEnvelope<TPayload> = {
      manifest,
      context: createPlatformEventContext(manifest, contextInput),
      payload
    };
    this.dispatchLog.push(envelope);

    const subscribers = this.subscribers.get(eventId) ?? [];
    await Promise.all(subscribers.map((subscriber) => subscriber.handler(envelope)));

    return {
      eventId,
      correlationId: envelope.context.correlationId,
      subscriberCount: subscribers.length,
      dispatchedAt: envelope.context.timestamp
    };
  }

  getDispatchLog() {
    return [...this.dispatchLog];
  }

  getSubscriberCount(eventId?: string) {
    if (eventId) return this.subscribers.get(eventId)?.length ?? 0;
    return Array.from(this.subscribers.values()).reduce((sum, subscribers) => sum + subscribers.length, 0);
  }
}

export function createPlatformEventBus(registry: PlatformEventRegistry) {
  return new PlatformEventBus(registry);
}
