import type { WorkflowActionRegistration } from "@/lib/platform/workflows/action-registry";
import type { WorkflowConditionRegistration } from "@/lib/platform/workflows/condition-engine";
import type { WorkflowManifest, WorkflowTriggerDefinition } from "@/lib/platform/workflows/workflow-manifest";
import { getPlatformServiceFramework } from "@/lib/platform/services/service-framework";

export const builtInWorkflowTriggers: readonly WorkflowTriggerDefinition[] = [
  {
    triggerId: "trigger.company.provisioning.completed",
    type: "company_event",
    eventId: "company.provisioning.completed",
    description: "Runs when company provisioning completes."
  },
  {
    triggerId: "trigger.runtime.activated",
    type: "runtime_event",
    eventId: "platform.runtime.activated",
    description: "Runs when platform runtime activation completes."
  },
  {
    triggerId: "trigger.manual.foundation",
    type: "manual",
    description: "Foundation manual trigger for future OP CEO workflows."
  },
  {
    triggerId: "trigger.scheduled.foundation",
    type: "scheduled",
    description: "Foundation scheduled trigger metadata only."
  }
];

export const builtInWorkflowConditions: readonly WorkflowConditionRegistration[] = [
  {
    conditionId: "condition.always",
    description: "Always passes.",
    handler: () => true
  },
  {
    conditionId: "condition.company.present",
    description: "Requires company context.",
    handler: (context) => Boolean(context.companyId ?? context.event?.context.companyId ?? context.event?.payload.companyId)
  },
  {
    conditionId: "condition.license.valid",
    description: "Requires a non-expired and non-suspended license context.",
    handler: (context) => context.licenseContext ? !["expired", "suspended"].includes(context.licenseContext.status) : true
  },
  {
    conditionId: "condition.configuration.value",
    description: "Checks a resolved configuration value.",
    handler: (context, parameters) => {
      const key = String(parameters?.key ?? "");
      if (!key) return false;
      if (!Object.prototype.hasOwnProperty.call(context.configurationContext, key)) return false;
      if (!Object.prototype.hasOwnProperty.call(parameters ?? {}, "equals")) return true;
      return context.configurationContext[key] === parameters?.equals;
    }
  }
];

export const builtInWorkflowActions: readonly WorkflowActionRegistration[] = [
  {
    actionId: "action.invoke.service",
    description: "Invokes a registered Platform Service through the Service Runtime.",
    handler: async (context, parameters) => {
      const serviceId = String(parameters?.serviceId ?? "");
      if (!serviceId) return;
      await getPlatformServiceFramework().runtime.execute(serviceId, (parameters?.input as Record<string, unknown>) ?? {}, { workflow: context });
    }
  },
  {
    actionId: "action.noop",
    description: "Records that the workflow action pipeline executed.",
    handler: () => undefined
  },
  {
    actionId: "action.publish.event",
    description: "Foundation placeholder for publishing follow-up events through the Event Bus.",
    handler: () => undefined
  },
  {
    actionId: "action.create.audit.record",
    description: "Foundation placeholder for creating audit records through a future audit subscriber.",
    handler: () => undefined
  },
  {
    actionId: "action.send.notification",
    description: "Foundation placeholder for future notification dispatch.",
    handler: () => undefined
  }
];

export const builtInWorkflowManifests: readonly WorkflowManifest[] = [
  {
    workflowId: "workflow.company.provisioning.foundation",
    name: "Company Provisioning Foundation",
    version: "1.0.0",
    trigger: builtInWorkflowTriggers[0],
    conditions: [
      { conditionId: "condition.company.present" },
      { conditionId: "condition.license.valid" }
    ],
    actions: [
      { actionId: "action.invoke.service", parameters: { serviceId: "platform.audit", input: { eventType: "COMPANY_PROVISIONED" } } },
      { actionId: "action.noop" }
    ],
    owner: { type: "platform", id: "operation-pact" },
    description: "Foundation workflow that reacts to company provisioning completion.",
    enabled: true
  },
  {
    workflowId: "workflow.runtime.activation.foundation",
    name: "Runtime Activation Foundation",
    version: "1.0.0",
    trigger: builtInWorkflowTriggers[1],
    conditions: [{ conditionId: "condition.always" }],
    actions: [{ actionId: "action.noop" }],
    owner: { type: "platform", id: "operation-pact" },
    description: "Foundation workflow for runtime activation event handling.",
    enabled: true
  }
];
