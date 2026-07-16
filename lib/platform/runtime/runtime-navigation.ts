import type { PermissionResolver } from "@/lib/platform/permission-engine";
import type { PlatformModuleKey } from "@/lib/platform/permission-definitions";
import type { RuntimeNavigationItem, RuntimeResolution } from "@/lib/platform/runtime/runtime-types";

export type PlatformRuntimeNavigationItem = {
  label: string;
  href: string;
  module: PlatformModuleKey;
};

export const opCeoRuntimeNavigation: readonly PlatformRuntimeNavigationItem[] = [
  { label: "Dashboard", href: "/opceo/panel", module: "OP_CEO" },
  { label: "Companies", href: "/opceo/companies", module: "Company" },
  { label: "Product Center", href: "/opceo/product-center", module: "ProductCenter" },
  { label: "Capabilities", href: "/opceo/capabilities", module: "ProductCenter" },
  { label: "Runtime", href: "/opceo/runtime", module: "Engineering" },
  { label: "Configuration", href: "/opceo/configuration", module: "Engineering" },
  { label: "Licenses", href: "/opceo/licenses", module: "ProductCenter" },
  { label: "Events", href: "/opceo/events", module: "Engineering" },
  { label: "Workflows", href: "/opceo/workflows", module: "Engineering" },
  { label: "Services", href: "/opceo/services", module: "Engineering" },
  { label: "Identities", href: "/opceo/identities", module: "Engineering" },
  { label: "Observability", href: "/opceo/observability", module: "Engineering" },
  { label: "Storage", href: "/opceo/storage", module: "Engineering" },
  { label: "Integrations", href: "/opceo/integrations", module: "Engineering" },
  { label: "AI", href: "/opceo/ai", module: "Engineering" },
  { label: "Agents", href: "/opceo/agents", module: "Engineering" },
  { label: "Orchestration", href: "/opceo/orchestration", module: "Engineering" },
  { label: "Audit", href: "/opceo/audit", module: "Analytics" },
  { label: "Logs", href: "/opceo/logs", module: "Engineering" },
  { label: "Platform Memory", href: "/opceo/platform-memory", module: "Engineering" },
  { label: "Settings", href: "/opceo/settings", module: "OP_CEO" }
];

export function buildAuthorizedOpCeoRuntimeNavigation(resolver: PermissionResolver) {
  return opCeoRuntimeNavigation.filter((item) => resolver.canAccessModule(item.module));
}

export function buildRuntimeNavigation(resolution: RuntimeResolution): readonly RuntimeNavigationItem[] {
  const moduleNavigation = resolution.modules.flatMap((module) =>
    module.navigation.map((entry) => ({
      label: entry.label,
      href: entry.path,
      area: entry.area,
      group: entry.group,
      source: "module" as const,
      moduleId: module.moduleId,
      order: entry.order
    }))
  );

  const capabilityNavigation = resolution.capabilities.map((capability, index) => ({
    label: capability.name,
    href: `/runtime/capabilities/${capability.capabilityId}`,
    area: "company" as const,
    group: capability.category,
    source: "capability" as const,
    moduleId: capability.moduleId,
    capabilityId: capability.capabilityId,
    order: 1000 + index
  }));

  return [...moduleNavigation, ...capabilityNavigation].sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
}
