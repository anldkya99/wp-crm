import { builtInEventManifests } from "@/lib/platform/events/builtin-events";
import { PlatformEventRegistry } from "@/lib/platform/events/event-registry";

export function discoverPlatformEvents() {
  return builtInEventManifests;
}

export function createPlatformEventRegistry() {
  return new PlatformEventRegistry().registerMany(discoverPlatformEvents());
}

export const platformEventRegistry = createPlatformEventRegistry();
