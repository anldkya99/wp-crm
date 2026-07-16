import type { AIManifest } from "@/lib/platform/ai/ai-manifest";

export const builtInAIManifests: readonly AIManifest[] = [
  {
    providerId: "platform.ai.metadata",
    name: "Platform AI Metadata Provider",
    version: "1.0.0",
    kind: "metadata",
    capabilities: ["metadata", "schema", "provider-context", "runtime-context", "capability-discovery"],
    lifecycle: "active",
    owner: "operation-pact",
    description: "Foundation-only AI metadata provider. It exposes contracts and context without external intelligence execution."
  }
];
