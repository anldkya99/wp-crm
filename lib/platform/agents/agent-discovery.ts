import { builtInAgentManifests } from "@/lib/platform/agents/built-in-agents";
import { AgentRegistry } from "@/lib/platform/agents/agent-registry";

export function discoverAgents() {
  return builtInAgentManifests;
}

export function createAgentRegistry() {
  return new AgentRegistry().registerMany(discoverAgents());
}

export const platformAgentRegistry = createAgentRegistry();
