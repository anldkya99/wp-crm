import type { RuntimeActivationRecord, RuntimeExecutionState } from "@/lib/platform/runtime/runtime-types";

export class RuntimeStateStore {
  private records = new Map<string, RuntimeActivationRecord>();

  set(record: RuntimeActivationRecord) {
    this.records.set(`${record.type}:${record.id}`, record);
    return record;
  }

  get(type: RuntimeActivationRecord["type"], id: string) {
    return this.records.get(`${type}:${id}`) ?? null;
  }

  list() {
    return Array.from(this.records.values());
  }

  setState(type: RuntimeActivationRecord["type"], id: string, state: RuntimeExecutionState, lastError: string | null = null) {
    const current = this.get(type, id);
    if (!current) return null;
    return this.set({ ...current, state, lastError });
  }
}

export function createRuntimeStateStore() {
  return new RuntimeStateStore();
}
