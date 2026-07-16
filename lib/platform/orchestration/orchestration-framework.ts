import { platformOrchestrationRegistry } from "@/lib/platform/orchestration/orchestration-discovery";
import { createOrchestrationRuntime } from "@/lib/platform/orchestration/orchestration-runtime";

export function getPlatformOrchestrationFramework() {
  const runtime = createOrchestrationRuntime(platformOrchestrationRegistry);

  return {
    registry: platformOrchestrationRegistry,
    manifests: platformOrchestrationRegistry.list(),
    runtime,
    context: runtime.context,
    metadata: runtime.metadata
  };
}
