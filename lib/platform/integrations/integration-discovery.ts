import { builtInIntegrationManifests } from "@/lib/platform/integrations/built-in-integrations";
import { IntegrationRegistry } from "@/lib/platform/integrations/integration-registry";

export function discoverIntegrationProviders() {
  return builtInIntegrationManifests;
}

export function createIntegrationRegistry() {
  return new IntegrationRegistry().registerMany(discoverIntegrationProviders());
}

export const platformIntegrationRegistry = createIntegrationRegistry();
