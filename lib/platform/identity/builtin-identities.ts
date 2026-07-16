import type { IdentityManifest } from "@/lib/platform/identity/identity-manifest";

export const builtInIdentityManifests: readonly IdentityManifest[] = [
  {
    identityId: "principal.op_ceo",
    principalType: "OP_CEO",
    companyId: null,
    departmentId: null,
    runtimeMetadata: { displayName: "OP CEO", scope: "platform" },
    capabilities: ["platform.control", "platform.identity.manage"],
    lifecycle: "active",
    description: "Global platform owner principal foundation."
  },
  {
    identityId: "principal.company_boss",
    principalType: "COMPANY_BOSS",
    runtimeMetadata: { displayName: "Company Boss", scope: "company" },
    capabilities: ["company.manage", "company.operators.manage"],
    lifecycle: "active",
    description: "Company owner principal foundation."
  },
  {
    identityId: "principal.company_admin",
    principalType: "COMPANY_ADMIN",
    runtimeMetadata: { displayName: "Company Admin", scope: "company" },
    capabilities: ["company.admin", "department.manage"],
    lifecycle: "active",
    description: "Company admin principal foundation."
  },
  {
    identityId: "principal.department_admin",
    principalType: "DEPARTMENT_ADMIN",
    runtimeMetadata: { displayName: "Department Admin", scope: "department" },
    capabilities: ["department.admin", "operator.coordinate"],
    lifecycle: "active",
    description: "Department admin principal foundation."
  },
  {
    identityId: "principal.operator",
    principalType: "OPERATOR",
    runtimeMetadata: { displayName: "Operator", scope: "operator" },
    capabilities: ["operator.workspace"],
    lifecycle: "active",
    description: "Operator principal foundation."
  },
  {
    identityId: "principal.platform_service",
    principalType: "PLATFORM_SERVICE",
    runtimeMetadata: { displayName: "Platform Service", scope: "system" },
    capabilities: ["service.execute", "event.publish"],
    lifecycle: "active",
    description: "Platform service principal foundation."
  },
  {
    identityId: "principal.ai_agent",
    principalType: "AI_AGENT",
    runtimeMetadata: { displayName: "AI Agent", scope: "ai", placeholder: true },
    capabilities: ["ai.observe"],
    lifecycle: "created",
    description: "Placeholder AI agent principal foundation."
  },
  {
    identityId: "principal.ai_supervisor",
    principalType: "AI_SUPERVISOR",
    runtimeMetadata: { displayName: "AI Supervisor", scope: "ai", placeholder: true },
    capabilities: ["ai.supervise"],
    lifecycle: "created",
    description: "Placeholder AI supervisor principal foundation."
  },
  {
    identityId: "principal.external_api_client",
    principalType: "EXTERNAL_API_CLIENT",
    runtimeMetadata: { displayName: "External API Client", scope: "integration", placeholder: true },
    capabilities: ["api.client"],
    lifecycle: "created",
    description: "Placeholder external API client principal foundation."
  }
];
