import { getBuiltInObservabilityProviders } from "@/lib/platform/observability/builtin-observability";
import { ObservabilityRegistry } from "@/lib/platform/observability/observability-registry";

export function discoverObservabilityProviders() {
  return getBuiltInObservabilityProviders();
}

export function createObservabilityRegistry() {
  return new ObservabilityRegistry().registerMany(discoverObservabilityProviders());
}

export const platformObservabilityRegistry = createObservabilityRegistry();
