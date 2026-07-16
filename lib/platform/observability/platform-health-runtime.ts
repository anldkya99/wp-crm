import { collectPlatformDiagnostics } from "@/lib/platform/observability/diagnostics-framework";
import { collectPlatformHealth } from "@/lib/platform/observability/health-framework";
import { collectPlatformMetrics } from "@/lib/platform/observability/metrics-framework";
import { getAggregateStatus } from "@/lib/platform/observability/component-health";
import type { ObservabilityRegistry } from "@/lib/platform/observability/observability-registry";

export function createPlatformHealthRuntime(registry: ObservabilityRegistry) {
  const health = collectPlatformHealth(registry);
  const metrics = collectPlatformMetrics(registry);
  const diagnostics = collectPlatformDiagnostics(registry);

  return {
    snapshot: {
      generatedAt: new Date().toISOString(),
      health,
      metrics,
      diagnostics,
      status: getAggregateStatus(health)
    }
  };
}
