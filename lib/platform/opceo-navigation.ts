import type { PermissionResolver } from "@/lib/platform/permission-engine";
import type { PlatformModuleKey } from "@/lib/platform/permission-definitions";
import { getPlatformRuntime } from "@/lib/platform/runtime/platform-runtime";
import { opCeoRuntimeNavigation } from "@/lib/platform/runtime/runtime-navigation";

export type OpCeoNavigationItem = {
  label: string;
  href: string;
  module: PlatformModuleKey;
};

export const opCeoNavigation: readonly OpCeoNavigationItem[] = opCeoRuntimeNavigation;

export function getAuthorizedOpCeoNavigation(resolver: PermissionResolver) {
  return getPlatformRuntime().navigation.buildAuthorizedOpCeoNavigation(resolver);
}
