import { builtInAIManifests } from "@/lib/platform/ai/built-in-ai";
import { AIRegistry } from "@/lib/platform/ai/ai-registry";

export function discoverAIProviders() {
  return builtInAIManifests;
}

export function createAIRegistry() {
  return new AIRegistry().registerMany(discoverAIProviders());
}

export const platformAIRegistry = createAIRegistry();
