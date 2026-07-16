import { builtInServiceImplementations } from "@/lib/platform/services/builtin-services";

export function discoverPlatformServiceImplementations() {
  return builtInServiceImplementations;
}

export function discoverPlatformServiceManifests() {
  return discoverPlatformServiceImplementations().map((service) => service.manifest);
}
