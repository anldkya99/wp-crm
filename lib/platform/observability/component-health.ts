import type {
  ComponentDiagnostic,
  ComponentHealth,
  ComponentMetric,
  ObservableComponentType,
  ObservabilityManifest,
  ObservabilityStatus
} from "@/lib/platform/observability/observability-manifest";

export type ObservabilityProvider = {
  manifest: ObservabilityManifest;
  getHealth: () => ComponentHealth;
  getMetrics: () => readonly ComponentMetric[];
  getDiagnostics: () => readonly ComponentDiagnostic[];
};

export function createHealth(input: {
  componentId: string;
  componentType: ObservableComponentType;
  status?: ObservabilityStatus;
  message: string;
  dependencies?: readonly string[];
}): ComponentHealth {
  return {
    componentId: input.componentId,
    componentType: input.componentType,
    status: input.status ?? "healthy",
    message: input.message,
    dependencies: input.dependencies ?? [],
    checkedAt: new Date().toISOString()
  };
}

export function getAggregateStatus(health: readonly ComponentHealth[]): ObservabilityStatus {
  if (health.some((entry) => entry.status === "unhealthy")) return "unhealthy";
  if (health.some((entry) => entry.status === "degraded")) return "degraded";
  if (health.length === 0 || health.some((entry) => entry.status === "unknown")) return "unknown";
  return "healthy";
}
