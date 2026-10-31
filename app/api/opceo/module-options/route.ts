import type { ModuleOptionScope, ModuleOptionStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPlatformModuleFramework } from "@/lib/platform/modules/module-framework";
import { resolveModuleOptionActorContext } from "@/lib/platform/modules/options/module-option-auth";
import { getModuleOptionService, ModuleOptionServiceError } from "@/lib/platform/modules/options/module-option-service";

const service = getModuleOptionService();

export async function GET(request: Request) {
  const context = await resolveModuleOptionActorContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const scope = optionalEnum<ModuleOptionScope>(searchParams.get("scope"), ["PLATFORM", "COMPANY"]);
    const status = optionalEnum<ModuleOptionStatus | "ALL">(searchParams.get("status"), ["ACTIVE", "DISABLED", "ARCHIVED", "ALL"]);
    const filters = {
      scope,
      status,
      companyId: searchParams.has("companyId") ? searchParams.get("companyId") || null : undefined,
      moduleId: searchParams.get("moduleId") || undefined,
      optionTypeKey: searchParams.get("optionTypeKey") || undefined
    };
    const options = await service.list(context, filters);
    const companies = await service.companies(context);
    const moduleFramework = getPlatformModuleFramework();

    return NextResponse.json({
      modules: moduleFramework.modules.map((module) => ({
        moduleId: module.moduleId,
        name: module.name,
        category: module.category
      })),
      optionTypes: service.optionTypes().map((optionType) => ({
        moduleId: optionType.moduleId,
        key: optionType.key,
        labelKey: optionType.labelKey,
        descriptionKey: optionType.descriptionKey,
        allowedScopes: optionType.allowedScopes,
        defaultStatus: optionType.defaultStatus,
        version: optionType.version,
        sortOrder: optionType.sortOrder,
        companyManageable: optionType.companyManageable,
        foundationOnly: optionType.foundationOnly ?? false
      })),
      companies,
      options
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const context = await resolveModuleOptionActorContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const option = await service.create(context, {
      moduleId: stringField(body.moduleId),
      optionTypeKey: stringField(body.optionTypeKey),
      scope: enumField<ModuleOptionScope>(body.scope, ["PLATFORM", "COMPANY"]),
      companyId: body.companyId ? stringField(body.companyId) : null,
      key: stringField(body.key),
      displayName: stringField(body.displayName),
      description: optionalString(body.description),
      configurationJson: jsonObject(body.configurationJson),
      metadataJson: body.metadataJson == null ? null : jsonObject(body.metadataJson),
      status: body.status ? enumField<Exclude<ModuleOptionStatus, "ARCHIVED">>(body.status, ["ACTIVE", "DISABLED"]) : undefined,
      sortOrder: body.sortOrder == null ? undefined : integerField(body.sortOrder)
    });
    return NextResponse.json({ option }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const context = await resolveModuleOptionActorContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const action = stringField(body.action);
    const id = stringField(body.id);
    const expectedVersion = integerField(body.expectedVersion);

    if (action === "update") {
      const option = await service.update(context, {
        id,
        expectedVersion,
        displayName: body.displayName == null ? undefined : stringField(body.displayName),
        description: body.description === undefined ? undefined : optionalString(body.description),
        configurationJson: body.configurationJson === undefined ? undefined : jsonObject(body.configurationJson),
        metadataJson: body.metadataJson === undefined ? undefined : body.metadataJson == null ? null : jsonObject(body.metadataJson),
        sortOrder: body.sortOrder == null ? undefined : integerField(body.sortOrder)
      });
      return NextResponse.json({ option });
    }

    if (action === "activate") return NextResponse.json({ option: await service.activate(context, id, expectedVersion) });
    if (action === "disable") return NextResponse.json({ option: await service.disable(context, id, expectedVersion) });
    if (action === "archive") return NextResponse.json({ option: await service.archive(context, id, expectedVersion) });
    if (action === "restore") return NextResponse.json({ option: await service.restore(context, id, expectedVersion) });

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown) {
  if (error instanceof ModuleOptionServiceError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ error: "Module option request failed." }, { status: 500 });
}

function stringField(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) throw new ModuleOptionServiceError("Required field is missing.", "MISSING_FIELD");
  return text;
}

function optionalString(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function integerField(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new ModuleOptionServiceError("Expected integer value.", "INVALID_INTEGER");
  return parsed;
}

function enumField<T extends string>(value: unknown, allowed: readonly T[]) {
  if (typeof value === "string" && allowed.includes(value as T)) return value as T;
  throw new ModuleOptionServiceError("Invalid enum value.", "INVALID_ENUM");
}

function optionalEnum<T extends string>(value: string | null, allowed: readonly T[]) {
  if (!value) return undefined;
  return enumField(value, allowed);
}

function jsonObject(value: unknown): Prisma.InputJsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ModuleOptionServiceError("Expected JSON object.", "INVALID_JSON");
  }
  return value as Prisma.InputJsonObject;
}
