import type { AgentManifest } from "@/lib/platform/agents/agent-manifest";

export const builtInAgentManifests: readonly AgentManifest[] = [
  {
    agentId: "platform.agent.metadata",
    name: "Platform Agent Metadata",
    version: "1.0.0",
    kind: "metadata",
    capabilities: ["metadata", "schema", "agent-context", "runtime-context", "capability-discovery"],
    lifecycle: "active",
    owner: "operation-pact",
    description: "Foundation-only agent metadata registration. It exposes contracts and context without behavior."
  }
];
