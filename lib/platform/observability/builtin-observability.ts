import { getPlatformCapabilityFramework } from "@/lib/platform/capabilities/capability-framework";
import { getPlatformConfigurationEngine } from "@/lib/platform/configuration/configuration-engine";
import { getPlatformEventFramework } from "@/lib/platform/events/event-framework";
import { getPlatformIdentityFramework } from "@/lib/platform/identity/identity-framework";
import { getPlatformLicenseEngine } from "@/lib/platform/licensing/license-engine";
import { getPlatformModuleFramework } from "@/lib/platform/modules/module-framework";
import { createHealth, type ObservabilityProvider } from "@/lib/platform/observability/component-health";
import type { ObservableComponentType } from "@/lib/platform/observability/observability-manifest";
import { getPlatformServiceFramework } from "@/lib/platform/services/service-framework";
import { getPlatformWorkflowEngine } from "@/lib/platform/workflows/workflow-engine";

function provider(input: {
  componentId: string;
  componentName: string;
  componentType: ObservableComponentType;
  dependencies: readonly string[];
  countKey: string;
  countValue: () => number;
  description: string;
  diagnostics?: () => readonly string[];
}): ObservabilityProvider {
  return {
    manifest: {
      componentId: input.componentId,
      componentName: input.componentName,
      componentType: input.componentType,
      version: "1.0.0",
      owner: "operation-pact",
      healthContract: `${input.componentId}.health.v1`,
      metricsContract: `${input.componentId}.metrics.v1`,
      diagnosticsContract: `${input.componentId}.diagnostics.v1`,
      description: input.description
    },
    getHealth: () =>
      createHealth({
        componentId: input.componentId,
        componentType: input.componentType,
        message: `${input.componentName} reports through its observability contract.`,
        dependencies: input.dependencies
      }),
    getMetrics: () => [
      {
        componentId: input.componentId,
        componentType: input.componentType,
        key: input.countKey,
        value: input.countValue(),
        unit: "count"
      }
    ],
    getDiagnostics: () =>
      (input.diagnostics?.() ?? []).map((message) => ({
        componentId: input.componentId,
        componentType: input.componentType,
        severity: "info" as const,
        message
      }))
  };
}

export function getBuiltInObservabilityProviders(): readonly ObservabilityProvider[] {
  return [
    provider({
      componentId: "platform.modules",
      componentName: "Module Framework",
      componentType: "module",
      dependencies: ["module-registry"],
      countKey: "registered_modules",
      countValue: () => getPlatformModuleFramework().modules.length,
      description: "Module framework health contract."
    }),
    provider({
      componentId: "platform.capabilities",
      componentName: "Capability Framework",
      componentType: "capability",
      dependencies: ["capability-registry", "module-registry"],
      countKey: "registered_capabilities",
      countValue: () => getPlatformCapabilityFramework().capabilities.length,
      description: "Capability framework health contract."
    }),
    provider({
      componentId: "platform.configuration",
      componentName: "Configuration Framework",
      componentType: "configuration",
      dependencies: ["configuration-registry"],
      countKey: "configuration_schemas",
      countValue: () => getPlatformConfigurationEngine().schemas.length,
      description: "Configuration framework health contract."
    }),
    provider({
      componentId: "platform.licensing",
      componentName: "Licensing Framework",
      componentType: "license",
      dependencies: ["license-registry"],
      countKey: "license_packages",
      countValue: () => getPlatformLicenseEngine().packages.length,
      description: "Licensing framework health contract."
    }),
    provider({
      componentId: "platform.events",
      componentName: "Event Framework",
      componentType: "event",
      dependencies: ["event-registry", "event-bus"],
      countKey: "registered_events",
      countValue: () => getPlatformEventFramework().metadata.eventCount,
      description: "Event framework health contract.",
      diagnostics: () => [`Subscribers: ${getPlatformEventFramework().metadata.subscriberCount}`]
    }),
    provider({
      componentId: "platform.workflows",
      componentName: "Workflow Framework",
      componentType: "workflow",
      dependencies: ["workflow-registry", "event-bus"],
      countKey: "registered_workflows",
      countValue: () => getPlatformWorkflowEngine().workflows.length,
      description: "Workflow framework health contract.",
      diagnostics: () => [`Executions tracked: ${getPlatformWorkflowEngine().executions.length}`]
    }),
    provider({
      componentId: "platform.services",
      componentName: "Service Framework",
      componentType: "service",
      dependencies: ["service-registry", "service-runtime"],
      countKey: "registered_services",
      countValue: () => getPlatformServiceFramework().services.length,
      description: "Service framework health contract.",
      diagnostics: () => [`Service executions tracked: ${getPlatformServiceFramework().executions.length}`]
    }),
    provider({
      componentId: "platform.identity",
      componentName: "Identity Framework",
      componentType: "identity",
      dependencies: ["identity-registry"],
      countKey: "registered_identities",
      countValue: () => getPlatformIdentityFramework().identities.length,
      description: "Identity framework health contract."
    }),
    provider({
      componentId: "platform.runtime",
      componentName: "Platform Runtime",
      componentType: "runtime",
      dependencies: ["module-registry", "capability-registry", "identity-runtime", "license-engine"],
      countKey: "runtime_components",
      countValue: () => 1,
      description: "Platform runtime health contract."
    })
  ];
}
