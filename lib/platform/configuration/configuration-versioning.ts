import type { ConfigurationScope } from "@/lib/platform/configuration/configuration-schema";

export type ConfigurationVersionRecord = {
  configurationId: string;
  scope: ConfigurationScope;
  previousValue: unknown;
  newValue: unknown;
  changedBy?: string | null;
  changedAt: string;
  version: number;
};

export function createConfigurationVersionRecord(input: Omit<ConfigurationVersionRecord, "changedAt" | "version"> & { previousVersion?: number }) {
  return {
    ...input,
    changedAt: new Date().toISOString(),
    version: (input.previousVersion ?? 0) + 1
  };
}
