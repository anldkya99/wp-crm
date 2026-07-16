import type { AgentManifest } from "@/lib/platform/agents/agent-manifest";
import { validateAgentManifest } from "@/lib/platform/agents/agent-validation";

export class AgentRegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class AgentRegistry {
  private manifests = new Map<string, AgentManifest>();

  register(manifest: AgentManifest) {
    validateAgentManifest(manifest);
    if (this.manifests.has(manifest.agentId)) {
      throw new AgentRegistryError(`Duplicate agent registration: ${manifest.agentId}`, "DUPLICATE_AGENT_REGISTRATION");
    }
    this.manifests.set(manifest.agentId, manifest);
    return this;
  }

  registerMany(manifests: readonly AgentManifest[]) {
    manifests.forEach((manifest) => this.register(manifest));
    return this;
  }

  get(agentId: string) {
    return this.manifests.get(agentId) ?? null;
  }

  list() {
    return Array.from(this.manifests.values());
  }

  discover(predicate?: (manifest: AgentManifest) => boolean) {
    const manifests = this.list();
    return predicate ? manifests.filter(predicate) : manifests;
  }
}
