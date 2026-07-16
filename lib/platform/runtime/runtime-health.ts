import type { RuntimeActivationRecord, RuntimeHealthEntry } from "@/lib/platform/runtime/runtime-types";

export function getRuntimeHealth(records: readonly RuntimeActivationRecord[]): readonly RuntimeHealthEntry[] {
  return [
    {
      id: "platform-runtime",
      type: "runtime",
      status: records.some((record) => record.state === "error") ? "error" : "active",
      version: "0.1.0",
      dependencies: ["module-registry", "capability-registry", "permission-engine"],
      lastError: records.find((record) => record.lastError)?.lastError ?? null
    },
    ...records.map((record) => ({
      id: record.id,
      type: record.type,
      status: record.state,
      version: record.version,
      dependencies: record.dependencies,
      lastError: record.lastError
    }))
  ];
}
