import { resolveServiceExecutionOrder } from "@/lib/platform/services/dependency-resolver";
import { getPlatformEventFramework } from "@/lib/platform/events/event-framework";
import {
  canTransitionServiceLifecycle,
  getNextServiceLifecycleStates
} from "@/lib/platform/services/service-lifecycle";
import {
  discoverPlatformServiceImplementations,
  discoverPlatformServiceManifests
} from "@/lib/platform/services/service-discovery";
import { ServiceRegistry } from "@/lib/platform/services/service-registry";
import { ServiceRuntime } from "@/lib/platform/services/service-runtime";

const serviceImplementations = discoverPlatformServiceImplementations();
const platformServiceRegistry = new ServiceRegistry().registerMany(discoverPlatformServiceManifests());
const platformServiceRuntime = new ServiceRuntime(platformServiceRegistry, serviceImplementations);
const serviceEventBridge = getPlatformEventFramework().subscriber.subscribe({
  subscriberId: "service:platform.audit:company.audit.recorded",
  eventId: "company.audit.recorded",
  handler: async (event) => {
    await platformServiceRuntime.execute("platform.audit", event.payload, { event });
  }
});

export function getPlatformServiceFramework() {
  const services = platformServiceRegistry.list();

  return {
    registry: platformServiceRegistry,
    services,
    implementations: serviceImplementations,
    runtime: platformServiceRuntime,
    executions: platformServiceRuntime.getExecutions(),
    eventBridge: {
      active: Boolean(serviceEventBridge),
      subscriptions: 1
    },
    dependencyResolver: {
      resolveExecutionOrder: (serviceIds: readonly string[]) => resolveServiceExecutionOrder(platformServiceRegistry, serviceIds)
    },
    lifecycle: {
      canTransition: canTransitionServiceLifecycle,
      nextStates: getNextServiceLifecycleStates
    }
  };
}
