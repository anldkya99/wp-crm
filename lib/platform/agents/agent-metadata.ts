import type { AgentMetadata, AgentRuntimeSubject } from "@/lib/platform/agents/agent-manifest";

export function getAgentMetadata(agents: readonly AgentRuntimeSubject[]): AgentMetadata {
  const activeAgent = agents.find((agent) => agent.lifecycle === "active") ?? agents[0] ?? null;
  const capabilities = Array.from(new Set(agents.flatMap((agent) => agent.capabilities)));

  return {
    agentCount: agents.length,
    activeAgentId: activeAgent?.agentId ?? null,
    capabilityCount: capabilities.length,
    capabilities,
    generatedAt: new Date().toISOString()
  };
}
