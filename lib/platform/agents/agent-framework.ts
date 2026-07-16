import { platformAgentRegistry } from "@/lib/platform/agents/agent-discovery";
import { createAgentRuntime } from "@/lib/platform/agents/agent-runtime";

export function getPlatformAgentFramework() {
  const runtime = createAgentRuntime(platformAgentRegistry);

  return {
    registry: platformAgentRegistry,
    manifests: platformAgentRegistry.list(),
    runtime,
    context: runtime.context,
    metadata: runtime.metadata
  };
}
