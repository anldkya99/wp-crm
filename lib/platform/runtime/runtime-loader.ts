import { getPlatformCapabilityFramework } from "@/lib/platform/capabilities/capability-framework";
import { getPlatformModuleFramework } from "@/lib/platform/modules/module-framework";
import type { RuntimeDependencyNode, RuntimeGraph } from "@/lib/platform/runtime/runtime-types";

function buildDependencyTree(graph: RuntimeGraph): readonly RuntimeDependencyNode[] {
  return [
    ...graph.modules.map((module) => ({
      id: module.moduleId,
      type: "module" as const,
      dependencies: module.dependencies
    })),
    ...graph.capabilities.map((capability) => ({
      id: capability.capabilityId,
      type: "capability" as const,
      dependencies: capability.dependencies
    }))
  ];
}

export function loadPlatformRuntimeGraph(): RuntimeGraph {
  const moduleFramework = getPlatformModuleFramework();
  const capabilityFramework = getPlatformCapabilityFramework();
  const modules = moduleFramework.registry.resolveDependencies(moduleFramework.modules.map((module) => module.moduleId));
  const capabilities = capabilityFramework.registry.resolveDependencies(capabilityFramework.capabilities.map((capability) => capability.capabilityId));

  return {
    modules,
    capabilities,
    dependencyTree: buildDependencyTree({ modules, capabilities, dependencyTree: [] })
  };
}
