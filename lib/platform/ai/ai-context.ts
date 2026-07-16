import type { AIProviderContext, AIRuntimeContext } from "@/lib/platform/ai/ai-manifest";
import { getAIMetadata } from "@/lib/platform/ai/ai-metadata";

export function createAIContext(input: {
  providers: readonly AIProviderContext[];
  runtime?: AIRuntimeContext["runtime"];
  workflow?: AIRuntimeContext["workflow"];
  service?: AIRuntimeContext["service"];
  storage?: AIRuntimeContext["storage"];
  integration?: AIRuntimeContext["integration"];
}): AIRuntimeContext {
  const activeProvider = input.providers.find((provider) => provider.lifecycle === "active") ?? input.providers[0];
  if (!activeProvider) throw new Error("AI Runtime requires at least one registered provider.");
  const metadata = getAIMetadata(input.providers);
  const runtime = input.runtime;

  return {
    activeProvider,
    providers: input.providers,
    capabilities: metadata.capabilities,
    metadata,
    runtime,
    identity: runtime?.identity ?? input.workflow?.identity ?? input.service?.identity,
    permission: runtime?.permissionResolver,
    license: runtime?.licenseContext ?? input.workflow?.licenseContext ?? input.service?.licenseContext,
    workflow: input.workflow,
    event: runtime?.eventContext.lastEvent ?? input.service?.event?.context ?? null,
    service: input.service,
    storage: input.storage,
    integration: input.integration
  };
}
