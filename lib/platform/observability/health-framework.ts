import { getAggregateStatus } from "@/lib/platform/observability/component-health";
import type { ObservabilityRegistry } from "@/lib/platform/observability/observability-registry";

export function collectPlatformHealth(registry: ObservabilityRegistry) {
  return registry.list().map((provider) => provider.getHealth());
}

export function resolvePlatformHealthStatus(registry: ObservabilityRegistry) {
  return getAggregateStatus(collectPlatformHealth(registry));
}
