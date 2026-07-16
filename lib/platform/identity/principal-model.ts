import type { PlatformRole } from "@/types/domain";
import type { IdentityManifest, PlatformPrincipal, PrincipalType } from "@/lib/platform/identity/identity-manifest";

const principalRoleMap: Partial<Record<PrincipalType, PlatformRole>> = {
  OP_CEO: "OP_CEO",
  COMPANY_BOSS: "COMPANY_BOSS",
  COMPANY_ADMIN: "COMPANY_ADMIN",
  DEPARTMENT_ADMIN: "DEPARTMENT_ADMIN",
  OPERATOR: "OPERATOR"
};

export function platformRoleToPrincipalType(platformRole: PlatformRole | null | undefined): PrincipalType | null {
  if (!platformRole) return null;
  return platformRole;
}

export function principalTypeToPlatformRole(principalType: PrincipalType): PlatformRole | null {
  return principalRoleMap[principalType] ?? null;
}

export function createPrincipalFromManifest(manifest: IdentityManifest): PlatformPrincipal {
  return {
    principalId: manifest.identityId,
    principalType: manifest.principalType,
    platformRole: principalTypeToPlatformRole(manifest.principalType),
    companyId: manifest.companyId ?? null,
    departmentId: manifest.departmentId ?? null,
    displayName: String(manifest.runtimeMetadata.displayName ?? manifest.identityId),
    capabilities: manifest.capabilities,
    metadata: manifest.runtimeMetadata
  };
}
