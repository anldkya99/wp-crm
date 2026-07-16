export type ObservableComponentType =
  | "module"
  | "capability"
  | "configuration"
  | "license"
  | "event"
  | "workflow"
  | "service"
  | "identity"
  | "runtime";

export type ObservabilityStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export type ObservabilityManifest = {
  componentId: string;
  componentName: string;
  componentType: ObservableComponentType;
  version: string;
  owner: string;
  healthContract: string;
  metricsContract: string;
  diagnosticsContract: string;
  description: string;
};

export type ComponentHealth = {
  componentId: string;
  componentType: ObservableComponentType;
  status: ObservabilityStatus;
  message: string;
  checkedAt: string;
  dependencies: readonly string[];
};

export type ComponentMetric = {
  componentId: string;
  componentType: ObservableComponentType;
  key: string;
  value: number;
  unit: "count" | "state" | "ms" | "percent";
};

export type ComponentDiagnostic = {
  componentId: string;
  componentType: ObservableComponentType;
  severity: "info" | "warning" | "error";
  message: string;
  metadata?: Record<string, unknown>;
};

export type ObservabilitySnapshot = {
  generatedAt: string;
  health: readonly ComponentHealth[];
  metrics: readonly ComponentMetric[];
  diagnostics: readonly ComponentDiagnostic[];
  status: ObservabilityStatus;
};
