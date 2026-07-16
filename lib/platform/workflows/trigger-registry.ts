import type { WorkflowTriggerDefinition, WorkflowTriggerType } from "@/lib/platform/workflows/workflow-manifest";

export class TriggerRegistry {
  private triggers = new Map<string, WorkflowTriggerDefinition>();

  register(trigger: WorkflowTriggerDefinition) {
    if (!trigger.triggerId || !trigger.type) throw new Error("Trigger definition is missing required metadata.");
    if (this.triggers.has(trigger.triggerId)) throw new Error(`Duplicate workflow trigger: ${trigger.triggerId}`);
    this.triggers.set(trigger.triggerId, trigger);
    return this;
  }

  registerMany(triggers: readonly WorkflowTriggerDefinition[]) {
    triggers.forEach((trigger) => this.register(trigger));
    return this;
  }

  get(triggerId: string) {
    return this.triggers.get(triggerId) ?? null;
  }

  list(type?: WorkflowTriggerType) {
    const triggers = Array.from(this.triggers.values());
    return type ? triggers.filter((trigger) => trigger.type === type) : triggers;
  }
}
