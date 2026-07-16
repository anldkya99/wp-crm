import type { PlatformServiceImplementation } from "@/lib/platform/services/service-manifest";

export const builtInServiceImplementations: readonly PlatformServiceImplementation[] = [
  {
    manifest: {
      serviceId: "platform.audit",
      name: "Audit Service",
      version: "1.0.0",
      owner: { type: "platform", id: "operation-pact" },
      dependencies: [],
      inputs: [{ key: "eventType", type: "string", required: false, description: "Audit event type." }],
      outputs: [{ key: "accepted", type: "boolean", required: true, description: "Whether the audit request was accepted by the service foundation." }],
      lifecycle: "active",
      description: "Foundation audit service contract for future audit persistence and subscriptions."
    },
    handler: () => ({ accepted: true })
  },
  {
    manifest: {
      serviceId: "platform.notification",
      name: "Notification Service",
      version: "1.0.0",
      owner: { type: "platform", id: "operation-pact" },
      dependencies: [],
      inputs: [{ key: "message", type: "string", required: false, description: "Notification message." }],
      outputs: [{ key: "accepted", type: "boolean", required: true, description: "Whether the notification request was accepted by the service foundation." }],
      lifecycle: "active",
      description: "Foundation notification service contract for future live notification dispatch."
    },
    handler: () => ({ accepted: true })
  },
  {
    manifest: {
      serviceId: "platform.task",
      name: "Task Service",
      version: "1.0.0",
      owner: { type: "platform", id: "operation-pact" },
      dependencies: ["platform.audit"],
      inputs: [{ key: "title", type: "string", required: false, description: "Task title." }],
      outputs: [{ key: "accepted", type: "boolean", required: true, description: "Whether the task request was accepted by the service foundation." }],
      lifecycle: "active",
      description: "Foundation task service contract for future task creation workflows."
    },
    handler: () => ({ accepted: true })
  },
  {
    manifest: {
      serviceId: "platform.company",
      name: "Company Service",
      version: "1.0.0",
      owner: { type: "platform", id: "operation-pact" },
      dependencies: ["platform.audit"],
      inputs: [{ key: "companyId", type: "string", required: false, description: "Company identifier." }],
      outputs: [{ key: "available", type: "boolean", required: true, description: "Whether the company service foundation is available." }],
      lifecycle: "active",
      description: "Foundation company service contract for future company operations."
    },
    handler: () => ({ available: true })
  },
  {
    manifest: {
      serviceId: "platform.user",
      name: "User Service",
      version: "1.0.0",
      owner: { type: "platform", id: "operation-pact" },
      dependencies: ["platform.audit"],
      inputs: [{ key: "userId", type: "string", required: false, description: "User identifier." }],
      outputs: [{ key: "available", type: "boolean", required: true, description: "Whether the user service foundation is available." }],
      lifecycle: "active",
      description: "Foundation user service contract for future user operations."
    },
    handler: () => ({ available: true })
  },
  {
    manifest: {
      serviceId: "platform.configuration",
      name: "Configuration Service",
      version: "1.0.0",
      owner: { type: "platform", id: "operation-pact" },
      dependencies: [],
      inputs: [{ key: "configurationId", type: "string", required: false, description: "Configuration identifier." }],
      outputs: [{ key: "available", type: "boolean", required: true, description: "Whether the configuration service foundation is available." }],
      lifecycle: "active",
      description: "Foundation configuration service contract for future configuration access."
    },
    handler: () => ({ available: true })
  },
  {
    manifest: {
      serviceId: "platform.ai",
      name: "AI Service",
      version: "1.0.0",
      owner: { type: "platform", id: "operation-pact" },
      dependencies: ["platform.audit"],
      inputs: [{ key: "prompt", type: "string", required: false, description: "Future AI prompt input." }],
      outputs: [{ key: "placeholder", type: "boolean", required: true, description: "Whether the AI service is placeholder-only." }],
      lifecycle: "registered",
      description: "Placeholder AI service contract for future AI Workforce integration."
    },
    handler: () => ({ placeholder: true })
  }
];
