import { createPlatformEventBus } from "@/lib/platform/events/event-bus";
import { platformEventRegistry } from "@/lib/platform/events/event-discovery";
import { createEventPublisher } from "@/lib/platform/events/event-publisher";
import { createEventSubscriber } from "@/lib/platform/events/event-subscriber";
import { getPlatformEventMetadata } from "@/lib/platform/events/event-metadata";

const platformEventBus = createPlatformEventBus(platformEventRegistry);

export function getPlatformEventFramework() {
  return {
    registry: platformEventRegistry,
    events: platformEventRegistry.list(),
    bus: platformEventBus,
    publisher: createEventPublisher(platformEventBus),
    subscriber: createEventSubscriber(platformEventBus),
    metadata: getPlatformEventMetadata(platformEventRegistry, platformEventBus)
  };
}
