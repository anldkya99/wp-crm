import type { AgentManifest } from "@/lib/platform/agents/agent-manifest";

export class AgentValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export function validateAgentManifest(manifest: AgentManifest) {
  if (!manifest.agentId || !manifest.name || !manifest.version || !manifest.kind || !manifest.owner || !manifest.description) {
    throw new AgentValidationError("Agent manifest is missing required metadata.", "INVALID_AGENT_MANIFEST");
  }
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    throw new AgentValidationError(`Agent ${manifest.agentId} has an invalid version.`, "INVALID_AGENT_VERSION");
  }
  if (manifest.capabilities.length === 0) {
    throw new AgentValidationError(`Agent ${manifest.agentId} must declare at least one capability.`, "MISSING_AGENT_CAPABILITY");
  }
  return true;
}
