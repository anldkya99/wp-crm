import type { PlatformEventManifest } from "@/lib/platform/events/event-manifest";

export class PlatformEventRegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class PlatformEventRegistry {
  private manifests = new Map<string, PlatformEventManifest>();

  register(manifest: PlatformEventManifest) {
    this.validateManifest(manifest);
    if (this.manifests.has(manifest.eventId)) {
      throw new PlatformEventRegistryError(`Duplicate event manifest: ${manifest.eventId}`, "DUPLICATE_EVENT_MANIFEST");
    }
    this.manifests.set(manifest.eventId, manifest);
    return this;
  }

  registerMany(manifests: readonly PlatformEventManifest[]) {
    manifests.forEach((manifest) => this.register(manifest));
    return this;
  }

  get(eventId: string) {
    return this.manifests.get(eventId) ?? null;
  }

  list() {
    return Array.from(this.manifests.values());
  }

  discover(predicate?: (manifest: PlatformEventManifest) => boolean) {
    const manifests = this.list();
    return predicate ? manifests.filter(predicate) : manifests;
  }

  private validateManifest(manifest: PlatformEventManifest) {
    if (!manifest.eventId || !manifest.eventName || !manifest.source || !manifest.target || !manifest.version || !manifest.category) {
      throw new PlatformEventRegistryError("Event manifest is missing required metadata.", "INVALID_EVENT_MANIFEST");
    }
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new PlatformEventRegistryError(`Event ${manifest.eventId} has an invalid version.`, "INVALID_EVENT_VERSION");
    }
  }
}
