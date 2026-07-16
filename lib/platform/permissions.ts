import type { PlatformRole } from "@/types/domain";
import { createPermissionResolver } from "@/lib/platform/permission-engine";
import {
  platformPermissionDefinitions,
  type PlatformPermissionKey
} from "@/lib/platform/permission-definitions";

export type PlatformScope = "platform" | "company" | "department" | "operator";

type LegacyPermissionKey =
  | "platform:access_op_ceo_panel"
  | "platform:manage_companies"
  | "company:manage"
  | "department:manage"
  | "crm:access";

export type PermissionKey = PlatformPermissionKey | LegacyPermissionKey;

export const platformRoleHierarchy: Record<PlatformRole, PlatformScope> = {
  OP_CEO: "platform",
  COMPANY_BOSS: "company",
  COMPANY_ADMIN: "company",
  DEPARTMENT_ADMIN: "department",
  OPERATOR: "operator"
};

const legacyPermissionMap: Partial<Record<LegacyPermissionKey, PlatformPermissionKey>> = {
  "platform:access_op_ceo_panel": platformPermissionDefinitions.OP_CEO.accessPanel,
  "platform:manage_companies": platformPermissionDefinitions.Company.manageCompanies,
  "company:manage": platformPermissionDefinitions.Company.manageCompany,
  "department:manage": platformPermissionDefinitions.Department.manageDepartments,
  "crm:access": platformPermissionDefinitions.Operator.accessModule
};

export function hasPlatformPermission(platformRole: PlatformRole | null | undefined, permission: PermissionKey) {
  const resolvedPermission = legacyPermissionMap[permission as LegacyPermissionKey] ?? permission;
  return createPermissionResolver({ platformRole }).can(resolvedPermission as PlatformPermissionKey);
}

export function hasPlatformRole(platformRole: PlatformRole | null | undefined, expected: PlatformRole | PlatformRole[]) {
  if (!platformRole) return false;
  const expectedRoles = Array.isArray(expected) ? expected : [expected];
  return expectedRoles.includes(platformRole);
}

export function isPlatformOwner(platformRole: PlatformRole | null | undefined) {
  return hasPlatformRole(platformRole, "OP_CEO");
}

export function isCompanyBoss(platformRole: PlatformRole | null | undefined) {
  return hasPlatformRole(platformRole, "COMPANY_BOSS");
}

export function isCompanyAdmin(platformRole: PlatformRole | null | undefined) {
  return hasPlatformRole(platformRole, ["COMPANY_BOSS", "COMPANY_ADMIN"]);
}

export function isDepartmentAdmin(platformRole: PlatformRole | null | undefined) {
  return hasPlatformRole(platformRole, "DEPARTMENT_ADMIN");
}

export function isOperator(platformRole: PlatformRole | null | undefined) {
  return hasPlatformRole(platformRole, "OPERATOR");
}

export function canAccessOpCeoRoutes(platformRole: PlatformRole | null | undefined) {
  return createPermissionResolver({ platformRole }).canAccessModule("OP_CEO");
}
