import type { Prisma, ModuleOptionScope, ModuleOptionStatus } from "@prisma/client";

export type ModuleOptionRecord = {
  id: string;
  moduleId: string;
  optionTypeKey: string;
  scope: ModuleOptionScope;
  companyId: string | null;
  key: string;
  displayName: string;
  description: string | null;
  configurationJson: Prisma.JsonValue;
  metadataJson: Prisma.JsonValue | null;
  status: ModuleOptionStatus;
  version: number;
  sortOrder: number;
  createdById: string | null;
  updatedById: string | null;
  archivedById: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ModuleOptionCompanySummary = {
  id: string;
  name: string;
  slug: string;
};

export type ModuleOptionListFilters = {
  scope?: ModuleOptionScope;
  companyId?: string | null;
  moduleId?: string;
  optionTypeKey?: string;
  status?: ModuleOptionStatus | "ALL";
};

export type CreateModuleOptionData = {
  moduleId: string;
  optionTypeKey: string;
  scope: ModuleOptionScope;
  companyId: string | null;
  key: string;
  displayName: string;
  description: string | null;
  configurationJson: Prisma.InputJsonValue;
  metadataJson: Prisma.InputJsonValue | null;
  status: ModuleOptionStatus;
  sortOrder: number;
  createdById: string;
};

export type UpdateModuleOptionData = {
  id: string;
  expectedVersion: number;
  displayName?: string;
  description?: string | null;
  configurationJson?: Prisma.InputJsonValue;
  metadataJson?: Prisma.InputJsonValue | null;
  sortOrder?: number;
  updatedById: string;
};

export type TransitionModuleOptionData = {
  id: string;
  expectedVersion: number;
  fromStatus: ModuleOptionStatus;
  status: ModuleOptionStatus;
  actorId: string;
  archivedAt?: Date | null;
};

export type ModuleOptionAuditEvent =
  | "MODULE_OPTION_CREATED"
  | "MODULE_OPTION_UPDATED"
  | "MODULE_OPTION_CONFIGURATION_CHANGED"
  | "MODULE_OPTION_ACTIVATED"
  | "MODULE_OPTION_DISABLED"
  | "MODULE_OPTION_ARCHIVED"
  | "MODULE_OPTION_RESTORED";

export type ModuleOptionAuditData = {
  eventType: ModuleOptionAuditEvent;
  message: string;
  actorId: string | null;
  moduleId: string;
  optionTypeKey: string;
  optionId?: string | null;
  scope: ModuleOptionScope;
  companyId: string | null;
  previousValue?: Prisma.InputJsonValue | null;
  newValue?: Prisma.InputJsonValue | null;
  version?: number | null;
  occurredAt: Date;
};

export type ModuleOptionTransaction = {
  list(filters: ModuleOptionListFilters): Promise<ModuleOptionRecord[]>;
  getById(id: string): Promise<ModuleOptionRecord | null>;
  create(data: CreateModuleOptionData): Promise<ModuleOptionRecord>;
  update(data: UpdateModuleOptionData): Promise<ModuleOptionRecord | null>;
  transition(data: TransitionModuleOptionData): Promise<ModuleOptionRecord | null>;
  writeAudit(data: ModuleOptionAuditData): Promise<void>;
};

export type ModuleOptionPersistencePort = {
  runInTransaction<T>(operation: (tx: ModuleOptionTransaction) => Promise<T>): Promise<T>;
  listCompanies(companyId?: string | null): Promise<ModuleOptionCompanySummary[]>;
};
