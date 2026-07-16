import { getPlatformEventFramework } from "@/lib/platform/events/event-framework";
import { ActionRegistry } from "@/lib/platform/workflows/action-registry";
import { ConditionEngine } from "@/lib/platform/workflows/condition-engine";
import {
  discoverWorkflowActions,
  discoverWorkflowConditions,
  discoverWorkflows,
  discoverWorkflowTriggers
} from "@/lib/platform/workflows/workflow-discovery";
import { WorkflowRegistry } from "@/lib/platform/workflows/workflow-registry";
import { WorkflowRuntime } from "@/lib/platform/workflows/workflow-runtime";
import { TriggerRegistry } from "@/lib/platform/workflows/trigger-registry";

function createWorkflowFrameworkState() {
  const workflows = new WorkflowRegistry().registerMany(discoverWorkflows());
  const triggers = new TriggerRegistry().registerMany(discoverWorkflowTriggers());
  const conditions = new ConditionEngine().registerMany(discoverWorkflowConditions());
  const actions = new ActionRegistry().registerMany(discoverWorkflowActions());
  const runtime = new WorkflowRuntime(conditions, actions);
  const events = getPlatformEventFramework();
  const eventDrivenWorkflows = workflows.discover((workflow) => workflow.enabled && Boolean(workflow.trigger.eventId));

  eventDrivenWorkflows.forEach((workflow) => {
    if (!workflow.trigger.eventId) return;
    events.subscriber.subscribe({
      subscriberId: `workflow:${workflow.workflowId}`,
      eventId: workflow.trigger.eventId,
      handler: async (event) => {
        await runtime.execute(workflow, { event });
      }
    });
  });

  return {
    workflows,
    triggers,
    conditions,
    actions,
    runtime,
    events
  };
}

const workflowFrameworkState = createWorkflowFrameworkState();

export function getPlatformWorkflowEngine() {
  return {
    registry: workflowFrameworkState.workflows,
    workflows: workflowFrameworkState.workflows.list(),
    triggerRegistry: workflowFrameworkState.triggers,
    triggers: workflowFrameworkState.triggers.list(),
    conditionEngine: workflowFrameworkState.conditions,
    conditions: workflowFrameworkState.conditions.list(),
    actionRegistry: workflowFrameworkState.actions,
    actions: workflowFrameworkState.actions.list(),
    runtime: workflowFrameworkState.runtime,
    executions: workflowFrameworkState.runtime.getExecutions(),
    eventSubscriberCount: getPlatformEventFramework().metadata.subscriberCount
  };
}
