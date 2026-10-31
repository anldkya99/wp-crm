import type { Prisma, ModuleOptionScope, ModuleOptionStatus } from "@prisma/client";
import { platformPermissionDefinitions } from "@/lib/platform/permission-definitions";
import type { ModuleOptionActorContext } from "@/lib/platform/modules/options/module-option-context";
import { moduleOptionTypeRegistry } from "@/lib/platform/modules/options/option-type-discovery";
import type { ModuleOptionTypeRegistration } from "@/lib/platform/modules/options/option-type-manifest";
import type {
  ModuleOptionAuditEvent,
  ModuleOptionListFilters,
  ModuleOptionPersistencePort,
  ModuleOptionRecord,
  ModuleOptionTransaction
} from "@/lib/platform/modules/options/module-option-persistence";
import { PrismaModuleOptionRepository } from "@/lib/platform/modules/options/prisma-module-option-repository";

export class ModuleOptionServiceError extends Error {
  constructor(message: string, public code: string, public status = 400) {
    super(message);
  }
}

export type ModuleOptionMutationInput = {
  moduleId: string;
  optionTypeKey: string;
  scope: ModuleOptionScope;
  companyId?: string | null;
  key: string;
  displayName: string;
  description?: string | null;
  configurationJson: Prisma.InputJsonValue;
  metadataJson?: Prisma.InputJsonValue | null;
  status?: Exclude<ModuleOptionStatus, "ARCHIVED">;
  sortOrder?: number;
};

export type ModuleOptionUpdateInput = {
  id: string;
  expectedVersion: number;
  displayName?: string;
  description?: string | null;
  configurationJson?: Prisma.InputJsonValue;
  metadataJson?: Prisma.InputJsonValue | null;
  sortOrder?: number;
};

export class ModuleOptionService {
  constructor(private readonly persistence: ModuleOptionPersistencePort) {}

  optionTypes() {
    return moduleOptionTypeRegistry.list();
  }

  companies(context: ModuleOptionActorContext) {
    this.assertReadAccess(context);
    if (context.resolver.can(platformPermissionDefinitions.ModuleOptions.managePlatform)) {
      return this.persistence.listCompanies();
    }

    const companyId = context.resolver.scope?.kind === "platform" ? null : context.resolver.scope?.companyId ?? null;
    this.assertCompanyAccess(context, companyId, false);
    return this.persistence.listCompanies(companyId);
  }

  async list(context: ModuleOptionActorContext, filters: ModuleOptionListFilters) {
    this.assertReadAccess(context, filters.scope, filters.companyId);
    return this.persistence.runInTransaction((tx) => tx.list(this.applyScopeDefaults(context, filters)));
  }

  async getById(context: ModuleOptionActorContext, id: string) {
    return this.persistence.runInTransaction(async (tx) => {
      const option = await tx.getById(id);
      if (!option) throw new ModuleOptionServiceError("Module option not found.", "MODULE_OPTION_NOT_FOUND", 404);
      this.assertReadAccess(context, option.scope, option.companyId);
      return option;
    });
  }

  async create(context: ModuleOptionActorContext, input: ModuleOptionMutationInput) {
    return this.persistence.runInTransaction(async (tx) => {
      const optionType = this.resolveOptionType(input.moduleId, input.optionTypeKey);
      this.assertScopeAllowed(optionType, input.scope);
      this.assertMutationAccess(context, input.scope, input.companyId ?? null, optionType);
      this.assertScopeIntegrity(input.scope, input.companyId ?? null);
      this.validateOptionPayload(optionType, input.configurationJson, input.metadataJson ?? null);

      const option = await tx.create({
        moduleId: input.moduleId,
        optionTypeKey: input.optionTypeKey,
        scope: input.scope,
        companyId: input.scope === "PLATFORM" ? null : input.companyId ?? null,
        key: input.key.trim(),
        displayName: input.displayName.trim(),
        description: input.description?.trim() || null,
        configurationJson: input.configurationJson,
        metadataJson: input.metadataJson ?? null,
        status: input.status ?? optionType.defaultStatus,
        sortOrder: input.sortOrder ?? optionType.sortOrder,
        createdById: context.actorId
      });
      await this.writeAudit(tx, "MODULE_OPTION_CREATED", "Module option created.", context, option, null, optionSnapshot(option));
      return option;
    });
  }

  async update(context: ModuleOptionActorContext, input: ModuleOptionUpdateInput) {
    return this.persistence.runInTransaction(async (tx) => {
      const current = await this.requireOption(tx, input.id);
      const optionType = this.resolveOptionType(current.moduleId, current.optionTypeKey);
      this.assertMutationAccess(context, current.scope, current.companyId, optionType);
      this.assertEditable(current);

      const nextConfiguration = input.configurationJson ?? (current.configurationJson as Prisma.InputJsonValue);
      const nextMetadata = "metadataJson" in input ? input.metadataJson ?? null : (current.metadataJson as Prisma.InputJsonValue | null);
      this.validateOptionPayload(optionType, nextConfiguration, nextMetadata);

      const updated = await tx.update({
        id: input.id,
        expectedVersion: input.expectedVersion,
        displayName: input.displayName?.trim(),
        description: input.description === undefined ? undefined : input.description?.trim() || null,
        configurationJson: input.configurationJson,
        metadataJson: "metadataJson" in input ? input.metadataJson ?? null : undefined,
        sortOrder: input.sortOrder,
        updatedById: context.actorId
      });
      if (!updated) throw new ModuleOptionServiceError("Module option version conflict.", "MODULE_OPTION_VERSION_CONFLICT", 409);

      const eventType = JSON.stringify(current.configurationJson) === JSON.stringify(updated.configurationJson)
        ? "MODULE_OPTION_UPDATED"
        : "MODULE_OPTION_CONFIGURATION_CHANGED";
      await this.writeAudit(tx, eventType, "Module option updated.", context, updated, optionSnapshot(current), optionSnapshot(updated));
      return updated;
    });
  }

  activate(context: ModuleOptionActorContext, id: string, expectedVersion: number) {
    return this.transition(context, id, expectedVersion, "ACTIVE", "MODULE_OPTION_ACTIVATED", "Module option activated.");
  }

  disable(context: ModuleOptionActorContext, id: string, expectedVersion: number) {
    return this.transition(context, id, expectedVersion, "DISABLED", "MODULE_OPTION_DISABLED", "Module option disabled.");
  }

  archive(context: ModuleOptionActorContext, id: string, expectedVersion: number) {
    return this.transition(context, id, expectedVersion, "ARCHIVED", "MODULE_OPTION_ARCHIVED", "Module option archived.");
  }

  restore(context: ModuleOptionActorContext, id: string, expectedVersion: number) {
    return this.transition(context, id, expectedVersion, "DISABLED", "MODULE_OPTION_RESTORED", "Module option restored.");
  }

  private async transition(context: ModuleOptionActorContext, id: string, expectedVersion: number, status: ModuleOptionStatus, eventType: ModuleOptionAuditEvent, message: string) {
    return this.persistence.runInTransaction(async (tx) => {
      const current = await this.requireOption(tx, id);
      const optionType = this.resolveOptionType(current.moduleId, current.optionTypeKey);
      this.assertMutationAccess(context, current.scope, current.companyId, optionType, eventType === "MODULE_OPTION_ARCHIVED");
      this.assertTransitionAllowed(current.status, status, eventType);
      const updated = await tx.transition({
        id,
        expectedVersion,
        fromStatus: current.status,
        status,
        actorId: context.actorId,
        archivedAt: status === "ARCHIVED" ? new Date() : null
      });
      if (!updated) throw new ModuleOptionServiceError("Module option version conflict.", "MODULE_OPTION_VERSION_CONFLICT", 409);
      await this.writeAudit(tx, eventType, message, context, updated, optionSnapshot(current), optionSnapshot(updated));
      return updated;
    });
  }

  private resolveOptionType(moduleId: string, optionTypeKey: string) {
    const optionType = moduleOptionTypeRegistry.get(moduleId, optionTypeKey);
    if (!optionType) throw new ModuleOptionServiceError("Unknown module option type.", "UNKNOWN_OPTION_TYPE", 404);
    return optionType;
  }

  private validateOptionPayload(optionType: ModuleOptionTypeRegistration, configurationJson: unknown, metadataJson: unknown) {
    const configurationResult = optionType.configurationValidator(configurationJson);
    if (!configurationResult.valid) {
      throw new ModuleOptionServiceError(configurationResult.errors.join(" "), "INVALID_CONFIGURATION");
    }
    if (optionType.metadataValidator) {
      const metadataResult = optionType.metadataValidator(metadataJson);
      if (!metadataResult.valid) throw new ModuleOptionServiceError(metadataResult.errors.join(" "), "INVALID_METADATA");
    }
  }

  private assertScopeAllowed(optionType: ModuleOptionTypeRegistration, scope: ModuleOptionScope) {
    if (!optionType.allowedScopes.includes(scope)) {
      throw new ModuleOptionServiceError("Module option type does not allow this scope.", "OPTION_SCOPE_NOT_ALLOWED", 403);
    }
  }

  private assertScopeIntegrity(scope: ModuleOptionScope, companyId: string | null) {
    if (scope === "PLATFORM" && companyId) throw new ModuleOptionServiceError("Platform scope cannot include companyId.", "INVALID_PLATFORM_SCOPE");
    if (scope === "COMPANY" && !companyId) throw new ModuleOptionServiceError("Company scope requires companyId.", "INVALID_COMPANY_SCOPE");
  }

  private assertEditable(option: ModuleOptionRecord) {
    if (option.status === "ARCHIVED") {
      throw new ModuleOptionServiceError("Archived module options are immutable.", "MODULE_OPTION_ARCHIVED_IMMUTABLE", 409);
    }
  }

  private assertTransitionAllowed(currentStatus: ModuleOptionStatus, nextStatus: ModuleOptionStatus, eventType: ModuleOptionAuditEvent) {
    if (eventType === "MODULE_OPTION_RESTORED") {
      if (currentStatus !== "ARCHIVED" || nextStatus !== "DISABLED") {
        throw new ModuleOptionServiceError("Only archived module options can be restored.", "INVALID_MODULE_OPTION_TRANSITION", 409);
      }
      return;
    }

    if (currentStatus === "ARCHIVED") {
      throw new ModuleOptionServiceError("Archived module options are immutable.", "MODULE_OPTION_ARCHIVED_IMMUTABLE", 409);
    }
  }

  private assertReadAccess(context: ModuleOptionActorContext, scope?: ModuleOptionScope, companyId?: string | null) {
    if (!context.resolver.can(platformPermissionDefinitions.ModuleOptions.read)) {
      throw new ModuleOptionServiceError("Module option access denied.", "MODULE_OPTION_FORBIDDEN", 403);
    }
    if (scope === "PLATFORM" && !context.resolver.can(platformPermissionDefinitions.ModuleOptions.managePlatform)) {
      throw new ModuleOptionServiceError("Platform module option access denied.", "MODULE_OPTION_PLATFORM_FORBIDDEN", 403);
    }
    if (scope === "COMPANY") this.assertCompanyAccess(context, companyId ?? null, false);
  }

  private assertMutationAccess(context: ModuleOptionActorContext, scope: ModuleOptionScope, companyId: string | null, optionType: ModuleOptionTypeRegistration, archive = false) {
    const permission = archive ? platformPermissionDefinitions.ModuleOptions.archive : platformPermissionDefinitions.ModuleOptions.write;
    if (!context.resolver.can(permission)) throw new ModuleOptionServiceError("Module option mutation denied.", "MODULE_OPTION_FORBIDDEN", 403);
    if (scope === "PLATFORM") {
      if (!context.resolver.can(platformPermissionDefinitions.ModuleOptions.managePlatform)) {
        throw new ModuleOptionServiceError("Platform module option mutation denied.", "MODULE_OPTION_PLATFORM_FORBIDDEN", 403);
      }
      return;
    }
    if (!optionType.companyManageable) {
      throw new ModuleOptionServiceError("Module option type is not company manageable.", "OPTION_TYPE_NOT_COMPANY_MANAGEABLE", 403);
    }
    this.assertCompanyAccess(context, companyId, true);
  }

  private assertCompanyAccess(context: ModuleOptionActorContext, companyId: string | null, mutation: boolean) {
    if (!companyId) throw new ModuleOptionServiceError("Company scope requires companyId.", "INVALID_COMPANY_SCOPE");
    if (context.resolver.can(platformPermissionDefinitions.ModuleOptions.managePlatform)) return;
    if (mutation && !context.resolver.can(platformPermissionDefinitions.ModuleOptions.manageCompany)) {
      throw new ModuleOptionServiceError("Company module option mutation denied.", "MODULE_OPTION_COMPANY_FORBIDDEN", 403);
    }
    if (context.resolver.scope?.kind === "platform") return;
    if (context.resolver.scope?.companyId !== companyId) {
      throw new ModuleOptionServiceError("Company scope mismatch.", "COMPANY_SCOPE_MISMATCH", 403);
    }
  }

  private applyScopeDefaults(context: ModuleOptionActorContext, filters: ModuleOptionListFilters) {
    if (context.resolver.can(platformPermissionDefinitions.ModuleOptions.managePlatform)) return filters;
    const scopedCompanyId = context.resolver.scope?.kind === "platform" ? null : context.resolver.scope?.companyId ?? null;
    return {
      ...filters,
      scope: "COMPANY" as const,
      companyId: scopedCompanyId
    };
  }

  private async requireOption(tx: ModuleOptionTransaction, id: string) {
    const option = await tx.getById(id);
    if (!option) throw new ModuleOptionServiceError("Module option not found.", "MODULE_OPTION_NOT_FOUND", 404);
    return option;
  }

  private writeAudit(
    tx: ModuleOptionTransaction,
    eventType: ModuleOptionAuditEvent,
    message: string,
    context: ModuleOptionActorContext,
    option: ModuleOptionRecord,
    previousValue: Prisma.InputJsonValue | null,
    newValue: Prisma.InputJsonValue | null
  ) {
    return tx.writeAudit({
      eventType,
      message,
      actorId: context.actorId,
      moduleId: option.moduleId,
      optionTypeKey: option.optionTypeKey,
      optionId: option.id,
      scope: option.scope,
      companyId: option.companyId,
      previousValue,
      newValue,
      version: option.version,
      occurredAt: new Date()
    });
  }
}

function optionSnapshot(option: ModuleOptionRecord): Prisma.InputJsonObject {
  return {
    id: option.id,
    moduleId: option.moduleId,
    optionTypeKey: option.optionTypeKey,
    scope: option.scope,
    companyId: option.companyId,
    key: option.key,
    displayName: option.displayName,
    description: option.description,
    configurationJson: option.configurationJson as Prisma.InputJsonValue,
    metadataJson: option.metadataJson as Prisma.InputJsonValue | null,
    status: option.status,
    version: option.version,
    sortOrder: option.sortOrder
  };
}

export function getModuleOptionService() {
  return new ModuleOptionService(new PrismaModuleOptionRepository());
}
