import type { PlatformRole } from "@/types/domain";

export type CompanyScopeContext = {
  userId: string;
  platformRole: PlatformRole;
  companyId?: string | null;
};

export type CompanyScope =
  | { kind: "platform"; userId: string }
  | { kind: "company"; userId: string; companyId: string | null }
  | { kind: "department"; userId: string; companyId: string | null }
  | { kind: "operator"; userId: string; companyId: string | null };

const platformRoleScopeKind: Record<PlatformRole, CompanyScope["kind"]> = {
  OP_CEO: "platform",
  COMPANY_BOSS: "company",
  COMPANY_ADMIN: "company",
  DEPARTMENT_ADMIN: "department",
  OPERATOR: "operator"
};

export function resolveCompanyScope(context: CompanyScopeContext): CompanyScope {
  const kind = platformRoleScopeKind[context.platformRole];

  if (kind === "platform") {
    return { kind: "platform", userId: context.userId };
  }

  if (kind === "company") {
    return { kind: "company", userId: context.userId, companyId: context.companyId ?? null };
  }

  if (kind === "department") {
    return { kind: "department", userId: context.userId, companyId: context.companyId ?? null };
  }

  return { kind: "operator", userId: context.userId, companyId: context.companyId ?? null };
}
