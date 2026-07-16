import { platformObservabilityRegistry } from "@/lib/platform/observability/observability-discovery";
import { createPlatformHealthRuntime } from "@/lib/platform/observability/platform-health-runtime";

export function getPlatformObservabilityFramework() {
  const runtime = createPlatformHealthRuntime(platformObservabilityRegistry);

  return {
    registry: platformObservabilityRegistry,
    manifests: platformObservabilityRegistry.list().map((provider) => provider.manifest),
    health: runtime.snapshot.health,
    metrics: runtime.snapshot.metrics,
    diagnostics: runtime.snapshot.diagnostics,
    snapshot: runtime.snapshot
  };
}
