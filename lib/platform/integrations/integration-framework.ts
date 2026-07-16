import { platformIntegrationRegistry } from "@/lib/platform/integrations/integration-discovery";
import { createIntegrationRuntime } from "@/lib/platform/integrations/integration-runtime";

export function getPlatformIntegrationFramework() {
  const runtime = createIntegrationRuntime(platformIntegrationRegistry);

  return {
    registry: platformIntegrationRegistry,
    manifests: platformIntegrationRegistry.list(),
    runtime,
    context: runtime.context,
    metadata: runtime.metadata
  };
}
