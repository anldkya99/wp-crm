import type { PlatformRole } from "@/types/domain";

export const platformRoleLevels: Record<PlatformRole, number> = {
  OP_CEO: 500,
  COMPANY_BOSS: 400,
  COMPANY_ADMIN: 300,
  DEPARTMENT_ADMIN: 200,
  OPERATOR: 100
};

export const platformRoleParents: Record<PlatformRole, PlatformRole | null> = {
  OP_CEO: null,
  COMPANY_BOSS: "OP_CEO",
  COMPANY_ADMIN: "COMPANY_BOSS",
  DEPARTMENT_ADMIN: "COMPANY_ADMIN",
  OPERATOR: "DEPARTMENT_ADMIN"
};

export function isPlatformRoleAtLeast(role: PlatformRole | null | undefined, minimumRole: PlatformRole) {
  if (!role) return false;
  return platformRoleLevels[role] >= platformRoleLevels[minimumRole];
}

export function canManagePlatformRole(managerRole: PlatformRole | null | undefined, targetRole: PlatformRole | null | undefined) {
  if (!managerRole || !targetRole) return false;
  return platformRoleLevels[managerRole] > platformRoleLevels[targetRole];
}

export function getPlatformRoleAncestors(role: PlatformRole): PlatformRole[] {
  const ancestors: PlatformRole[] = [];
  let current = platformRoleParents[role];

  while (current) {
    ancestors.push(current);
    current = platformRoleParents[current];
  }

  return ancestors;
}
