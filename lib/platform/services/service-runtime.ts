import type { RuntimeContext } from "@/lib/platform/runtime/runtime-types";
import type {
  PlatformServiceImplementation,
  ServiceExecutionResult,
  ServiceHandler
} from "@/lib/platform/services/service-manifest";
import { createServiceContext } from "@/lib/platform/services/service-context";
import type { ServiceRegistry } from "@/lib/platform/services/service-registry";
import type { WorkflowContext } from "@/lib/platform/workflows/workflow-manifest";
import type { PlatformEventEnvelope } from "@/lib/platform/events/event-manifest";

export class ServiceRuntime {
  private handlers = new Map<string, ServiceHandler>();
  private executions: ServiceExecutionResult[] = [];

  constructor(private registry: ServiceRegistry, implementations: readonly PlatformServiceImplementation[]) {
    implementations.forEach((implementation) => this.handlers.set(implementation.manifest.serviceId, implementation.handler));
  }

  async execute(
    serviceId: string,
    input: Record<string, unknown> = {},
    contextInput: { runtime?: RuntimeContext; workflow?: WorkflowContext; event?: PlatformEventEnvelope } = {}
  ): Promise<ServiceExecutionResult> {
    const startedAt = new Date().toISOString();
    const manifest = this.registry.get(serviceId);
    if (!manifest) return this.recordFailure(serviceId, startedAt, `Unknown service ${serviceId}.`);
    if (manifest.lifecycle === "disabled") return this.recordSkipped(serviceId, startedAt, "Service is disabled.");

    const handler = this.handlers.get(serviceId);
    if (!handler) return this.recordFailure(serviceId, startedAt, `Missing service handler for ${serviceId}.`);

    try {
      const dependencyOrder = this.registry.resolveDependencies([serviceId]).filter((dependency) => dependency.serviceId !== serviceId);
      const dependencyIds = dependencyOrder.map((dependency) => dependency.serviceId);
      const output = await handler(createServiceContext(contextInput), { ...input, dependencyIds });
      const result: ServiceExecutionResult = {
        serviceId,
        status: "completed",
        output,
        startedAt,
        completedAt: new Date().toISOString(),
        error: null
      };
      this.executions.push(result);
      return result;
    } catch (error) {
      return this.recordFailure(serviceId, startedAt, error instanceof Error ? error.message : "Service execution failed.");
    }
  }

  getExecutions() {
    return [...this.executions];
  }

  private recordSkipped(serviceId: string, startedAt: string, reason: string): ServiceExecutionResult {
    const result: ServiceExecutionResult = {
      serviceId,
      status: "skipped",
      output: {},
      startedAt,
      completedAt: new Date().toISOString(),
      error: reason
    };
    this.executions.push(result);
    return result;
  }

  private recordFailure(serviceId: string, startedAt: string, error: string): ServiceExecutionResult {
    const result: ServiceExecutionResult = {
      serviceId,
      status: "failed",
      output: {},
      startedAt,
      completedAt: new Date().toISOString(),
      error
    };
    this.executions.push(result);
    return result;
  }
}
