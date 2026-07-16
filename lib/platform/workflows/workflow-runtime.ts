import type { PlatformEventEnvelope } from "@/lib/platform/events/event-manifest";
import type { RuntimeContext } from "@/lib/platform/runtime/runtime-types";
import type { ActionRegistry } from "@/lib/platform/workflows/action-registry";
import type { ConditionEngine } from "@/lib/platform/workflows/condition-engine";
import { createWorkflowContext } from "@/lib/platform/workflows/workflow-context";
import type { WorkflowExecutionRecord, WorkflowManifest } from "@/lib/platform/workflows/workflow-manifest";

function createExecutionId(workflowId: string) {
  return `wfx_${workflowId.replace(/[^a-z0-9]+/gi, "_")}_${Date.now().toString(36)}`;
}

export class WorkflowRuntime {
  private executions: WorkflowExecutionRecord[] = [];

  constructor(private conditions: ConditionEngine, private actions: ActionRegistry) {}

  async execute(workflow: WorkflowManifest, input: { event?: PlatformEventEnvelope; runtime?: RuntimeContext } = {}): Promise<WorkflowExecutionRecord> {
    const startedAt = new Date().toISOString();
    const baseRecord: WorkflowExecutionRecord = {
      executionId: createExecutionId(workflow.workflowId),
      workflowId: workflow.workflowId,
      triggerId: workflow.trigger.triggerId,
      status: workflow.enabled ? "running" : "skipped",
      startedAt,
      completedAt: null,
      actionsExecuted: [],
      conditionsEvaluated: [],
      error: null
    };

    if (!workflow.enabled) {
      const skipped = { ...baseRecord, completedAt: new Date().toISOString() };
      this.executions.push(skipped);
      return skipped;
    }

    const context = createWorkflowContext({ workflow, event: input.event, runtime: input.runtime });
    const conditionsEvaluated: string[] = [];
    const actionsExecuted: string[] = [];

    try {
      for (const condition of workflow.conditions) {
        conditionsEvaluated.push(condition.conditionId);
        const passed = await this.conditions.evaluate(condition.conditionId, context, condition.parameters);
        if (!passed) {
          const skipped = {
            ...baseRecord,
            status: "skipped" as const,
            completedAt: new Date().toISOString(),
            conditionsEvaluated,
            actionsExecuted
          };
          this.executions.push(skipped);
          return skipped;
        }
      }

      for (const action of workflow.actions) {
        await this.actions.execute(action.actionId, context, action.parameters);
        actionsExecuted.push(action.actionId);
      }

      const completed = {
        ...baseRecord,
        status: "completed" as const,
        completedAt: new Date().toISOString(),
        conditionsEvaluated,
        actionsExecuted
      };
      this.executions.push(completed);
      return completed;
    } catch (error) {
      const failed = {
        ...baseRecord,
        status: "failed" as const,
        completedAt: new Date().toISOString(),
        conditionsEvaluated,
        actionsExecuted,
        error: error instanceof Error ? error.message : "Workflow execution failed."
      };
      this.executions.push(failed);
      return failed;
    }
  }

  getExecutions() {
    return [...this.executions];
  }
}
