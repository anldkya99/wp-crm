import type { PlatformRole } from "@/types/domain";
import { resolveCompanyScope, type CompanyScopeContext } from "@/lib/platform/company-scope";
import {
  platformPermissionDefinitions,
  platformRolePermissionGrants,
  type PlatformModuleKey,
  type PlatformPermissionKey
} from "@/lib/platform/permission-definitions";
import { canManagePlatformRole, isPlatformRoleAtLeast } from "@/lib/platform/hierarchy";

export type PermissionSubject = {
  userId?: string;
  platformRole?: PlatformRole | null;
  companyId?: string | null;
};

export type PermissionResolver = {
  can: (permission: PlatformPermissionKey) => boolean;
  canAccessModule: (module: PlatformModuleKey) => boolean;
  canManageCompany: () => boolean;
  canManageOperators: () => boolean;
  canViewAnalytics: () => boolean;
  canManageDepartments: () => boolean;
  canManageRole: (targetRole: PlatformRole | null | undefined) => boolean;
  isAtLeast: (minimumRole: PlatformRole) => boolean;
  permissions: readonly PlatformPermissionKey[];
  scope: ReturnType<typeof resolveCompanyScope> | null;
};

const moduleAccessPermissions: Record<PlatformModuleKey, PlatformPermissionKey> = {
  OP_CEO: platformPermissionDefinitions.OP_CEO.accessPanel,
  Company: platformPermissionDefinitions.Company.accessModule,
  Department: platformPermissionDefinitions.Department.accessModule,
  Operator: platformPermissionDefinitions.Operator.accessModule,
  Communications: platformPermissionDefinitions.Communications.accessModule,
  Management: platformPermissionDefinitions.Management.accessModule,
  Analytics: platformPermissionDefinitions.Analytics.accessModule,
  Engineering: platformPermissionDefinitions.Engineering.accessModule,
  ProductCenter: platformPermissionDefinitions.ProductCenter.accessModule
};

export function getPermissionsForPlatformRole(platformRole: PlatformRole | null | undefined) {
  if (!platformRole) return [];
  return platformRolePermissionGrants[platformRole] ?? [];
}

export function hasPermission(subject: PermissionSubject, permission: PlatformPermissionKey) {
  return getPermissionsForPlatformRole(subject.platformRole).includes(permission);
}

export function createPermissionResolver(subject: PermissionSubject): PermissionResolver {
  const permissions = getPermissionsForPlatformRole(subject.platformRole);
  const subjectWithRole = subject.platformRole && subject.userId
    ? ({
        userId: subject.userId,
        platformRole: subject.platformRole,
        companyId: subject.companyId
      } satisfies CompanyScopeContext)
    : null;
  const scope = subjectWithRole ? resolveCompanyScope(subjectWithRole) : null;
  const can = (permission: PlatformPermissionKey) => permissions.includes(permission);

  return {
    can,
    canAccessModule: (module) => can(moduleAccessPermissions[module]),
    canManageCompany: () => can(platformPermissionDefinitions.Company.manageCompany),
    canManageOperators: () =>
      can(platformPermissionDefinitions.Company.manageOperators) || can(platformPermissionDefinitions.Management.manageOperators),
    canViewAnalytics: () => can(platformPermissionDefinitions.Analytics.viewAnalytics),
    canManageDepartments: () =>
      can(platformPermissionDefinitions.Department.manageDepartments) || can(platformPermissionDefinitions.Management.manageDepartments),
    canManageRole: (targetRole) => canManagePlatformRole(subject.platformRole, targetRole),
    isAtLeast: (minimumRole) => isPlatformRoleAtLeast(subject.platformRole, minimumRole),
    permissions,
    scope
  };
}
