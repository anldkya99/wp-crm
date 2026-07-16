import { builtInCapabilityManifests } from "@/lib/platform/capabilities/builtin-capabilities";
import { CapabilityRegistry } from "@/lib/platform/capabilities/capability-registry";
import { platformModuleRegistry } from "@/lib/platform/modules/module-discovery";

export function discoverPlatformCapabilities() {
  return builtInCapabilityManifests;
}

export function createPlatformCapabilityRegistry() {
  return new CapabilityRegistry(platformModuleRegistry).registerMany(discoverPlatformCapabilities());
}

export const platformCapabilityRegistry = createPlatformCapabilityRegistry();
