import { builtInModuleOptionTypes } from "@/lib/platform/modules/options/built-in-option-types";
import { ModuleOptionTypeRegistry } from "@/lib/platform/modules/options/option-type-registry";

export function discoverModuleOptionTypes() {
  return builtInModuleOptionTypes;
}

export function createModuleOptionTypeRegistry() {
  return new ModuleOptionTypeRegistry().registerMany(discoverModuleOptionTypes());
}

export const moduleOptionTypeRegistry = createModuleOptionTypeRegistry();
