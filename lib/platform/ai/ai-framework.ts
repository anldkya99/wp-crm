import { platformAIRegistry } from "@/lib/platform/ai/ai-discovery";
import { createAIRuntime } from "@/lib/platform/ai/ai-runtime";

export function getPlatformAIFramework() {
  const runtime = createAIRuntime(platformAIRegistry);

  return {
    registry: platformAIRegistry,
    manifests: platformAIRegistry.list(),
    runtime,
    context: runtime.context,
    metadata: runtime.metadata
  };
}
