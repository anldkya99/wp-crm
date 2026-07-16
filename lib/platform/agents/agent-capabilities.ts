import type { AgentManifest, AgentRuntimeSubject } from "@/lib/platform/agents/agent-manifest";

export function createAgentRuntimeSubject(manifest: AgentManifest): AgentRuntimeSubject {
  return {
    agentId: manifest.agentId,
    kind: manifest.kind,
    capabilities: manifest.capabilities,
    lifecycle: manifest.lifecycle,
    metadata: {
      name: manifest.name,
      version: manifest.version,
      owner: manifest.owner,
      description: manifest.description
    }
  };
}
