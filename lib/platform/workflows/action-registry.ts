import type { WorkflowActionHandler, WorkflowContext } from "@/lib/platform/workflows/workflow-manifest";

export type WorkflowActionRegistration = {
  actionId: string;
  description: string;
  handler: WorkflowActionHandler;
};

export class ActionRegistry {
  private actions = new Map<string, WorkflowActionRegistration>();

  register(action: WorkflowActionRegistration) {
    if (this.actions.has(action.actionId)) throw new Error(`Duplicate workflow action: ${action.actionId}`);
    this.actions.set(action.actionId, action);
    return this;
  }

  registerMany(actions: readonly WorkflowActionRegistration[]) {
    actions.forEach((action) => this.register(action));
    return this;
  }

  list() {
    return Array.from(this.actions.values());
  }

  async execute(actionId: string, context: WorkflowContext, parameters?: Record<string, unknown>) {
    const action = this.actions.get(actionId);
    if (!action) throw new Error(`Unknown workflow action: ${actionId}`);
    await action.handler(context, parameters);
  }
}
