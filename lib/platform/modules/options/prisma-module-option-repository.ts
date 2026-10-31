import { Prisma, type PrismaClient, type ModuleOptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ModuleOptionListFilters,
  ModuleOptionPersistencePort,
  ModuleOptionTransaction
} from "@/lib/platform/modules/options/module-option-persistence";

type PrismaTransaction = Prisma.TransactionClient;

export class PrismaModuleOptionRepository implements ModuleOptionPersistencePort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async runInTransaction<T>(operation: (tx: ModuleOptionTransaction) => Promise<T>) {
    return this.client.$transaction((tx) => operation(createTransactionAdapter(tx)));
  }

  async listCompanies(companyId?: string | null) {
    return this.client.company.findMany({
      where: companyId ? { id: companyId } : undefined,
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true }
    });
  }
}

function createTransactionAdapter(tx: PrismaTransaction): ModuleOptionTransaction {
  return {
    list: (filters) => tx.moduleOption.findMany({ where: buildWhere(filters), orderBy: [{ moduleId: "asc" }, { optionTypeKey: "asc" }, { sortOrder: "asc" }, { displayName: "asc" }] }),
    getById: (id) => tx.moduleOption.findUnique({ where: { id } }),
    create: (data) =>
      tx.moduleOption.create({
        data: {
          ...data,
          metadataJson: data.metadataJson ?? Prisma.DbNull
        }
      }),
    update: async (data) => {
      const result = await tx.moduleOption.updateMany({
        where: { id: data.id, version: data.expectedVersion, status: { not: "ARCHIVED" } },
        data: {
          displayName: data.displayName,
          description: data.description,
          configurationJson: data.configurationJson,
          metadataJson: data.metadataJson === undefined ? undefined : data.metadataJson ?? Prisma.DbNull,
          sortOrder: data.sortOrder,
          updatedById: data.updatedById,
          version: { increment: 1 }
        }
      });
      if (result.count !== 1) return null;
      return tx.moduleOption.findUnique({ where: { id: data.id } });
    },
    transition: async (data) => {
      const result = await tx.moduleOption.updateMany({
        where: { id: data.id, version: data.expectedVersion, status: data.fromStatus },
        data: {
          status: data.status,
          updatedById: data.actorId,
          archivedById: data.status === "ARCHIVED" ? data.actorId : null,
          archivedAt: data.archivedAt,
          version: { increment: 1 }
        }
      });
      if (result.count !== 1) return null;
      return tx.moduleOption.findUnique({ where: { id: data.id } });
    },
    writeAudit: async (data) => {
      const metadataJson = {
        moduleId: data.moduleId,
        optionTypeKey: data.optionTypeKey,
        optionId: data.optionId ?? null,
        scope: data.scope,
        companyId: data.companyId,
        actorId: data.actorId,
        previousValue: data.previousValue ?? null,
        newValue: data.newValue ?? null,
        version: data.version ?? null,
        occurredAt: data.occurredAt.toISOString()
      } satisfies Prisma.InputJsonObject;

      if (data.scope === "COMPANY") {
        await tx.companyAuditLog.create({
          data: {
            companyId: data.companyId,
            actorId: data.actorId,
            eventType: data.eventType,
            message: data.message,
            metadataJson
          }
        });
        return;
      }

      await tx.platformAuditLog.create({
        data: {
          actorId: data.actorId,
          eventType: data.eventType,
          message: data.message,
          metadataJson
        }
      });
    }
  };
}

function buildWhere(filters: ModuleOptionListFilters): Prisma.ModuleOptionWhereInput {
  const where: Prisma.ModuleOptionWhereInput = {};
  if (filters.scope) where.scope = filters.scope;
  if ("companyId" in filters) where.companyId = filters.companyId ?? null;
  if (filters.moduleId) where.moduleId = filters.moduleId;
  if (filters.optionTypeKey) where.optionTypeKey = filters.optionTypeKey;
  if (!filters.status) where.status = { not: "ARCHIVED" };
  else if (filters.status !== "ALL") where.status = filters.status as ModuleOptionStatus;
  return where;
}
