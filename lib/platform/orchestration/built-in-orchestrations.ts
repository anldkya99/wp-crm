import type { OrchestrationManifest } from "@/lib/platform/orchestration/orchestration-manifest";

export const builtInOrchestrationManifests: readonly OrchestrationManifest[] = [
  {
    orchestratorId: "platform.orchestration.metadata",
    name: "Platform Orchestration Metadata",
    version: "1.0.0",
    kind: "metadata",
    capabilities: ["metadata", "schema", "orchestration-context", "runtime-context", "capability-discovery"],
    lifecycle: "active",
    owner: "operation-pact",
    description: "Foundation-only orchestration metadata registration. It exposes contracts and context without behavior."
  }
];
