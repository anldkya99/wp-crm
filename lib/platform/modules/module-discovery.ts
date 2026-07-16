import { builtInModuleManifests } from "@/lib/platform/modules/builtin-modules";
import { ModuleRegistry } from "@/lib/platform/modules/module-registry";

export function discoverPlatformModules() {
  return builtInModuleManifests;
}

export function createPlatformModuleRegistry() {
  return new ModuleRegistry().registerMany(discoverPlatformModules());
}

export const platformModuleRegistry = createPlatformModuleRegistry();
