import type { ServiceRegistry } from "@/lib/platform/services/service-registry";

export function resolveServiceExecutionOrder(registry: ServiceRegistry, serviceIds: readonly string[]) {
  return registry.resolveDependencies(serviceIds);
}
