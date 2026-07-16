import type { AgentRuntimeContext, AgentRuntimeSubject } from "@/lib/platform/agents/agent-manifest";
import { getAgentMetadata } from "@/lib/platform/agents/agent-metadata";

export function createAgentContext(input: {
  agents: readonly AgentRuntimeSubject[];
  runtime?: AgentRuntimeContext["runtime"];
  workflow?: AgentRuntimeContext["workflow"];
  service?: AgentRuntimeContext["service"];
  storage?: AgentRuntimeContext["storage"];
  integration?: AgentRuntimeContext["integration"];
  ai?: AgentRuntimeContext["ai"];
}): AgentRuntimeContext {
  const activeAgent = input.agents.find((agent) => agent.lifecycle === "active") ?? input.agents[0];
  if (!activeAgent) throw new Error("Agent Runtime requires at least one registered agent.");
  const metadata = getAgentMetadata(input.agents);
  const runtime = input.runtime;

  return {
    activeAgent,
    agents: input.agents,
    capabilities: metadata.capabilities,
    metadata,
    runtime,
    identity: runtime?.identity ?? input.workflow?.identity ?? input.service?.identity ?? input.ai?.identity,
    permission: runtime?.permissionResolver ?? input.ai?.permission,
    license: runtime?.licenseContext ?? input.workflow?.licenseContext ?? input.service?.licenseContext ?? input.ai?.license,
    workflow: input.workflow,
    event: runtime?.eventContext.lastEvent ?? input.service?.event?.context ?? input.ai?.event ?? null,
    service: input.service,
    storage: input.storage ?? input.ai?.storage,
    integration: input.integration ?? input.ai?.integration,
    ai: input.ai
  };
}
