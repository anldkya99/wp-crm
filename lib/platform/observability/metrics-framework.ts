import type { ObservabilityRegistry } from "@/lib/platform/observability/observability-registry";

export function collectPlatformMetrics(registry: ObservabilityRegistry) {
  return registry.list().flatMap((provider) => provider.getMetrics());
}
