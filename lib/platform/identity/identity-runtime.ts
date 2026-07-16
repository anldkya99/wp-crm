import type { PlatformRole } from "@/types/domain";
import { createPermissionResolver } from "@/lib/platform/permission-engine";
import type { IdentityContext, IdentityManifest, PrincipalType } from "@/lib/platform/identity/identity-manifest";
import { createPrincipalFromManifest, platformRoleToPrincipalType } from "@/lib/platform/identity/principal-model";
import type { IdentityRegistry } from "@/lib/platform/identity/identity-registry";

export type IdentityRuntimeInput = {
  identityId?: string;
  userId?: string;
  platformRole?: PlatformRole | null;
  principalType?: PrincipalType;
  companyId?: string | null;
  departmentId?: string | null;
  runtimeMetadata?: Record<string, unknown>;
  configurationContext?: Record<string, unknown>;
  licenseContext?: unknown;
  workflowContext?: unknown;
  eventContext?: unknown;
  serviceContext?: unknown;
};

function scopedManifest(manifest: IdentityManifest, input: IdentityRuntimeInput): IdentityManifest {
  return {
    ...manifest,
    identityId: input.identityId ?? input.userId ?? manifest.identityId,
    companyId: input.companyId ?? manifest.companyId ?? null,
    departmentId: input.departmentId ?? manifest.departmentId ?? null,
    runtimeMetadata: {
      ...manifest.runtimeMetadata,
      ...(input.runtimeMetadata ?? {})
    }
  };
}

export class IdentityRuntime {
  constructor(private registry: IdentityRegistry) {}

  resolveIdentity(input: IdentityRuntimeInput): IdentityContext {
    const principalType = input.principalType ?? platformRoleToPrincipalType(input.platformRole);
    const manifest = input.identityId ? this.registry.get(input.identityId) : null;
    const fallbackManifest = principalType ? this.registry.findByPrincipalType(principalType)[0] : null;
    const selectedManifest = manifest ?? fallbackManifest;
    if (!selectedManifest) throw new Error("Unable to resolve platform identity.");

    const scoped = scopedManifest(selectedManifest, input);
    const principal = createPrincipalFromManifest(scoped);
    const permissions = createPermissionResolver({
      userId: input.userId ?? scoped.identityId,
      platformRole: principal.platformRole,
      companyId: scoped.companyId
    });

    return {
      principal: {
        ...principal,
        metadata: {
          ...principal.metadata,
          permissions: permissions.permissions
        }
      },
      companyId: scoped.companyId,
      departmentId: scoped.departmentId,
      runtime: {
        identityId: scoped.identityId,
        lifecycle: scoped.lifecycle
      },
      configurationContext: input.configurationContext,
      licenseContext: input.licenseContext,
      workflowContext: input.workflowContext,
      eventContext: input.eventContext,
      serviceContext: input.serviceContext
    };
  }
}
