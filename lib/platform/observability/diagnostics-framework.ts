import type { ObservabilityRegistry } from "@/lib/platform/observability/observability-registry";

export function collectPlatformDiagnostics(registry: ObservabilityRegistry) {
  return registry.list().flatMap((provider) => provider.getDiagnostics());
}
