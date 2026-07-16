import type { WorkflowConditionHandler, WorkflowContext } from "@/lib/platform/workflows/workflow-manifest";

export type WorkflowConditionRegistration = {
  conditionId: string;
  description: string;
  handler: WorkflowConditionHandler;
};

export class ConditionEngine {
  private conditions = new Map<string, WorkflowConditionRegistration>();

  register(condition: WorkflowConditionRegistration) {
    if (this.conditions.has(condition.conditionId)) throw new Error(`Duplicate workflow condition: ${condition.conditionId}`);
    this.conditions.set(condition.conditionId, condition);
    return this;
  }

  registerMany(conditions: readonly WorkflowConditionRegistration[]) {
    conditions.forEach((condition) => this.register(condition));
    return this;
  }

  list() {
    return Array.from(this.conditions.values());
  }

  async evaluate(conditionId: string, context: WorkflowContext, parameters?: Record<string, unknown>) {
    const condition = this.conditions.get(conditionId);
    if (!condition) throw new Error(`Unknown workflow condition: ${conditionId}`);
    return condition.handler(context, parameters);
  }
}
