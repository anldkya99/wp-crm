import type { PermissionResolver } from "@/lib/platform/permission-engine";
import type { PlatformModuleKey } from "@/lib/platform/permission-definitions";
import type { RuntimeNavigationItem, RuntimeResolution } from "@/lib/platform/runtime/runtime-types";

export type PlatformRuntimeNavigationItem = {
  label: string;
  labelKey: string;
  href: string;
  module: PlatformModuleKey;
};

export const opCeoRuntimeNavigation: readonly PlatformRuntimeNavigationItem[] = [
  { label: "Dashboard", labelKey: "opceo.nav.dashboard", href: "/opceo/panel", module: "OP_CEO" },
  { label: "Companies", labelKey: "opceo.nav.companies", href: "/opceo/companies", module: "Company" },
  { label: "Module Options", labelKey: "opceo.nav.moduleOptions", href: "/opceo/module-options", module: "ProductCenter" },
  { label: "Product Center", labelKey: "opceo.nav.productCenter", href: "/opceo/product-center", module: "ProductCenter" },
  { label: "Capabilities", labelKey: "opceo.nav.capabilities", href: "/opceo/capabilities", module: "ProductCenter" },
  { label: "Runtime", labelKey: "opceo.nav.runtime", href: "/opceo/runtime", module: "Engineering" },
  { label: "Configuration", labelKey: "opceo.nav.configuration", href: "/opceo/configuration", module: "Engineering" },
  { label: "Licenses", labelKey: "opceo.nav.licenses", href: "/opceo/licenses", module: "ProductCenter" },
  { label: "Events", labelKey: "opceo.nav.events", href: "/opceo/events", module: "Engineering" },
  { label: "Workflows", labelKey: "opceo.nav.workflows", href: "/opceo/workflows", module: "Engineering" },
  { label: "Services", labelKey: "opceo.nav.services", href: "/opceo/services", module: "Engineering" },
  { label: "Identities", labelKey: "opceo.nav.identities", href: "/opceo/identities", module: "Engineering" },
  { label: "Observability", labelKey: "opceo.nav.observability", href: "/opceo/observability", module: "Engineering" },
  { label: "Storage", labelKey: "opceo.nav.storage", href: "/opceo/storage", module: "Engineering" },
  { label: "Integrations", labelKey: "opceo.nav.integrations", href: "/opceo/integrations", module: "Engineering" },
  { label: "AI", labelKey: "opceo.nav.ai", href: "/opceo/ai", module: "Engineering" },
  { label: "Agents", labelKey: "opceo.nav.agents", href: "/opceo/agents", module: "Engineering" },
  { label: "Orchestration", labelKey: "opceo.nav.orchestration", href: "/opceo/orchestration", module: "Engineering" },
  { label: "Audit", labelKey: "opceo.nav.audit", href: "/opceo/audit", module: "Analytics" },
  { label: "Logs", labelKey: "opceo.nav.logs", href: "/opceo/logs", module: "Engineering" },
  { label: "Platform Memory", labelKey: "opceo.nav.platformMemory", href: "/opceo/platform-memory", module: "Engineering" },
  { label: "Settings", labelKey: "opceo.nav.settings", href: "/opceo/settings", module: "OP_CEO" }
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
