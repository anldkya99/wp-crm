import type { PlatformEventManifest } from "@/lib/platform/events/event-manifest";

export const builtInEventManifests: readonly PlatformEventManifest[] = [
  {
    eventId: "platform.runtime.resolved",
    eventName: "Runtime Resolved",
    source: "runtime",
    target: "platform",
    version: "1.0.0",
    payloadSchema: { modules: "number", capabilities: "number" },
    category: "Runtime",
    description: "Runtime metadata was resolved from registries and entitlements."
  },
  {
    eventId: "platform.runtime.activated",
    eventName: "Runtime Activated",
    source: "runtime",
    target: "platform",
    version: "1.0.0",
    payloadSchema: { records: "number" },
    category: "Runtime",
    description: "Runtime activation records were created."
  },
  {
    eventId: "company.provisioning.started",
    eventName: "Company Provisioning Started",
    source: "provisioning",
    target: "platform",
    version: "1.0.0",
    payloadSchema: { companyName: "string", licensePackage: "string" },
    category: "Company",
    description: "Company provisioning started."
  },
  {
    eventId: "company.provisioning.completed",
    eventName: "Company Provisioning Completed",
    source: "provisioning",
    target: "platform",
    version: "1.0.0",
    payloadSchema: { companyId: "string", modules: "number", capabilities: "number" },
    category: "Company",
    description: "Company provisioning completed."
  },
  {
    eventId: "company.audit.recorded",
    eventName: "Company Audit Recorded",
    source: "audit",
    target: "platform",
    version: "1.0.0",
    payloadSchema: { eventType: "string", message: "string" },
    category: "Audit",
    description: "A company audit record was written."
  },
  {
    eventId: "security.authorization.denied",
    eventName: "Authorization Denied",
    source: "security",
    target: "platform",
    version: "1.0.0",
    payloadSchema: { route: "string", reason: "string" },
    category: "Security",
    description: "A protected platform action was denied."
  },
  {
    eventId: "license.entitlement.resolved",
    eventName: "Entitlement Resolved",
    source: "licensing",
    target: "runtime",
    version: "1.0.0",
    payloadSchema: { packageId: "string", modules: "number", capabilities: "number" },
    category: "Platform",
    description: "License entitlements were resolved for runtime or provisioning."
  },
  {
    eventId: "configuration.context.resolved",
    eventName: "Configuration Context Resolved",
    source: "configuration",
    target: "runtime",
    version: "1.0.0",
    payloadSchema: { configurationCount: "number" },
    category: "Platform",
    description: "Configuration context was resolved for runtime."
  }
];
