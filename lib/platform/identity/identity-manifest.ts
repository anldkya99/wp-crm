import type { PlatformRole } from "@/types/domain";

export type PrincipalType =
  | "OP_CEO"
  | "COMPANY_BOSS"
  | "COMPANY_ADMIN"
  | "DEPARTMENT_ADMIN"
  | "OPERATOR"
  | "PLATFORM_SERVICE"
  | "AI_AGENT"
  | "AI_SUPERVISOR"
  | "EXTERNAL_API_CLIENT";

export type IdentityLifecycleState = "created" | "active" | "suspended" | "locked" | "archived" | "deleted";

export type PlatformPrincipal = {
  principalId: string;
  principalType: PrincipalType;
  platformRole?: PlatformRole | null;
  companyId?: string | null;
  departmentId?: string | null;
  displayName: string;
  capabilities: readonly string[];
  metadata: Record<string, unknown>;
};

export type IdentityManifest = {
  identityId: string;
  principalType: PrincipalType;
  companyId?: string | null;
  departmentId?: string | null;
  runtimeMetadata: Record<string, unknown>;
  capabilities: readonly string[];
  lifecycle: IdentityLifecycleState;
  description: string;
};

export type IdentityContext = {
  principal: PlatformPrincipal;
  companyId?: string | null;
  departmentId?: string | null;
  runtime: {
    identityId: string;
    lifecycle: IdentityLifecycleState;
  };
  configurationContext?: Record<string, unknown>;
  licenseContext?: unknown;
  workflowContext?: unknown;
  eventContext?: unknown;
  serviceContext?: unknown;
};
