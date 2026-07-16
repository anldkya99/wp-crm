import type { Prisma, PlatformRole } from "@prisma/client";
import type { PlatformCapabilityManifest } from "@/lib/platform/capabilities/capability-manifest";
import { getPlatformCapabilityFramework } from "@/lib/platform/capabilities/capability-framework";
import { hashPassword } from "@/lib/server/password";
import { getIndustryProfile, type IndustryProfileKey } from "@/lib/platform/industry-profiles";
import { buildInitialCompanySettings } from "@/lib/platform/initial-settings";
import { getLicensePackage, type LicensePackageKey } from "@/lib/platform/license-packages";
import { getPlatformLicenseEngine } from "@/lib/platform/licensing/license-engine";
import type { EntitlementResolver } from "@/lib/platform/licensing/entitlement-resolver";
import type { PlatformModuleManifest } from "@/lib/platform/modules/module-manifest";
import { getPlatformModuleFramework } from "@/lib/platform/modules/module-framework";
import { platformModuleRegistry } from "@/lib/platform/modules/module-discovery";
import { createPermissionResolver } from "@/lib/platform/permission-engine";

export type CompanyProvisioningRequest = {
  actorId?: string;
  company: {
    name: string;
    industryProfile: IndustryProfileKey;
    licensePackage: LicensePackageKey;
    country: string;
    timezone: string;
    language: string;
    currency: string;
    logoUrl?: string;
  };
  owner: {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: string;
  };
  organization: {
    companyAdminCount: number;
    departmentAdminCount: number;
    operatorCount: number;
  };
  featureFlags: string[];
};

export type CompanyProvisioningResult = {
  companyId: string;
  companySlug: string;
  ownerId: string;
  departmentsCreated: number;
  usersCreated: number;
  modulesEnabled: number;
  capabilitiesEnabled: number;
  featureFlagsEnabled: number;
  auditRecordsCreated: number;
};

export class ProvisioningError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function assertNonNegativeInteger(value: number, field: string) {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new ProvisioningError(`${field} must be a number between 0 and 100.`, "INVALID_ORGANIZATION_SIZE");
  }
}

function validateRequest(input: CompanyProvisioningRequest) {
  const companyName = input.company.name.trim();
  const ownerName = input.owner.fullName.trim();
  const ownerEmail = normalizeEmail(input.owner.email);

  if (!companyName) throw new ProvisioningError("Company name is required.", "MISSING_COMPANY_NAME");
  if (!slugify(companyName)) throw new ProvisioningError("Company name cannot generate a valid slug.", "INVALID_COMPANY_NAME");
  if (!getIndustryProfile(input.company.industryProfile)) throw new ProvisioningError("Missing industry profile.", "MISSING_INDUSTRY_PROFILE");
  if (!getLicensePackage(input.company.licensePackage)) throw new ProvisioningError("Invalid license package.", "INVALID_LICENSE");
  if (!ownerName || !ownerEmail || !input.owner.password) throw new ProvisioningError("Company owner name, email and password are required.", "MISSING_OWNER");
  if (input.owner.password.length < 8) throw new ProvisioningError("Company owner password must be at least 8 characters.", "INVALID_OWNER_PASSWORD");
  assertNonNegativeInteger(input.organization.companyAdminCount, "Company Admin count");
  assertNonNegativeInteger(input.organization.departmentAdminCount, "Department Admin count");
  assertNonNegativeInteger(input.organization.operatorCount, "Operator count");
}

function resolveProvisioningLicense(licenseKey: LicensePackageKey, requestedFeatureFlags: string[]) {
  return getPlatformLicenseEngine().resolveLicense({
    packageId: licenseKey,
    requestedFeatureFlags: ["crm", ...requestedFeatureFlags]
  });
}

function resolveEnabledModules(entitlements: EntitlementResolver, enabledFeatures: ReadonlySet<string>) {
  const candidates = platformModuleRegistry.discover((module) => {
    const featureEnabled = module.featureFlags.length > 0
      ? module.featureFlags.some((featureFlag) => enabledFeatures.has(featureFlag.key))
      : module.defaultEnabled;
    return featureEnabled && entitlements.canUseModule(module.moduleId);
  });
  try {
    return platformModuleRegistry.resolveDependencies(candidates.map((module) => module.moduleId));
  } catch (error) {
    throw new ProvisioningError(error instanceof Error ? error.message : "Invalid module dependency.", "INVALID_MODULE_DEPENDENCY");
  }
}

function capabilityFeatureEnabled(capability: PlatformCapabilityManifest, enabledFeatures: ReadonlySet<string>) {
  if (capability.featureFlags.length === 0) return capability.defaultEnabled;
  return capability.featureFlags.some((featureFlag) => enabledFeatures.has(featureFlag.key) || (capability.defaultEnabled && featureFlag.defaultEnabled));
}

function resolveEnabledCapabilities(entitlements: EntitlementResolver, enabledFeatures: ReadonlySet<string>, enabledModules: readonly PlatformModuleManifest[]) {
  const enabledModuleIds = new Set(enabledModules.map((module) => module.moduleId));
  const framework = getPlatformCapabilityFramework();
  const candidates = framework.registry.discover((capability) => {
    if (!enabledModuleIds.has(capability.moduleId)) return false;
    if (!entitlements.canUseCapability(capability.capabilityId)) return false;
    return capabilityFeatureEnabled(capability, enabledFeatures);
  });

  try {
    const resolved = framework.registry.resolveDependencies(candidates.map((capability) => capability.capabilityId));
    const invalidDependency = resolved.find((capability) => !enabledModuleIds.has(capability.moduleId) || !entitlements.canUseCapability(capability.capabilityId));
    if (invalidDependency) {
      throw new ProvisioningError(`Capability ${invalidDependency.capabilityId} cannot be enabled because its module or license requirement is not active.`, "INVALID_CAPABILITY_DEPENDENCY");
    }
    return resolved;
  } catch (error) {
    if (error instanceof ProvisioningError) throw error;
    throw new ProvisioningError(error instanceof Error ? error.message : "Invalid capability dependency.", "INVALID_CAPABILITY_DEPENDENCY");
  }
}

function getProvisioningFeatureFlags() {
  const featureFlags = [
    ...getPlatformModuleFramework().featureFlags,
    ...getPlatformCapabilityFramework().featureFlags
  ];
  return Array.from(new Map(featureFlags.map((featureFlag) => [featureFlag.key, featureFlag])).values());
}

async function writeAudit(tx: Prisma.TransactionClient, companyId: string, actorId: string | undefined, eventType: string, message: string, metadata: Prisma.InputJsonValue = {}) {
  await tx.companyAuditLog.create({
    data: {
      companyId,
      actorId: actorId ?? null,
      eventType,
      message,
      metadataJson: metadata
    }
  });
}

export async function provisionCompany(tx: Prisma.TransactionClient, input: CompanyProvisioningRequest): Promise<CompanyProvisioningResult> {
  validateRequest(input);

  const industryProfile = getIndustryProfile(input.company.industryProfile);
  const licensePackage = getLicensePackage(input.company.licensePackage);
  if (!industryProfile) throw new ProvisioningError("Missing industry profile.", "MISSING_INDUSTRY_PROFILE");
  if (!licensePackage) throw new ProvisioningError("Invalid license package.", "INVALID_LICENSE");

  const companySlug = slugify(input.company.name);
  const ownerEmail = normalizeEmail(input.owner.email);
  const duplicateCompany = await tx.company.findUnique({ where: { slug: companySlug }, select: { id: true } });
  if (duplicateCompany) throw new ProvisioningError("Duplicate company.", "DUPLICATE_COMPANY");

  const duplicateOwner = await tx.user.findUnique({ where: { email: ownerEmail }, select: { id: true } });
  if (duplicateOwner) throw new ProvisioningError("Owner email already exists.", "DUPLICATE_OWNER_EMAIL");

  const licenseResolution = resolveProvisioningLicense(input.company.licensePackage, input.featureFlags);
  const enabledFeatures = licenseResolution.features.enabledFeatureFlags;
  const enabledModules = resolveEnabledModules(licenseResolution.entitlements, enabledFeatures);
  const enabledCapabilities = resolveEnabledCapabilities(licenseResolution.entitlements, enabledFeatures, enabledModules);
  const enabledFeatureFlags = new Set(enabledFeatures);
  enabledCapabilities.forEach((capability) => {
    capability.featureFlags.forEach((featureFlag) => enabledFeatureFlags.add(featureFlag.key));
  });

  const company = await tx.company.create({
    data: {
      name: input.company.name.trim(),
      slug: companySlug,
      companyType: "standard",
      industryProfile: industryProfile.key,
      licensePackage: licensePackage.key,
      licenseStatus: "active",
      country: input.company.country.trim() || "TR",
      timezone: input.company.timezone.trim() || "Europe/Istanbul",
      language: input.company.language.trim() || "tr",
      currency: input.company.currency.trim() || "TRY",
      logoUrl: input.company.logoUrl?.trim() || null,
      createdBy: input.actorId ?? null
    }
  });
  await writeAudit(tx, company.id, input.actorId, "COMPANY_CREATED", "Company created.", { slug: company.slug });

  const departments = await Promise.all(
    industryProfile.departments.map((departmentName) =>
      tx.department.create({
        data: {
          companyId: company.id,
          name: departmentName,
          slug: slugify(departmentName)
        }
      })
    )
  );
  await writeAudit(tx, company.id, input.actorId, "ORGANIZATION_CREATED", "Organization departments generated.", { count: departments.length });

  const owner = await tx.user.create({
    data: {
      name: input.owner.fullName.trim(),
      email: ownerEmail,
      passwordHash: hashPassword(input.owner.password),
      role: "ADMIN",
      platformRole: "COMPANY_BOSS",
      status: "ACTIVE",
      companyId: company.id
    }
  });
  await writeAudit(tx, company.id, input.actorId, "BOSS_CREATED", "Company Boss created.", { userId: owner.id, phoneNumber: input.owner.phoneNumber ?? null });

  const generatedPasswordHash = hashPassword(`ChangeMe-${companySlug}-001`);
  const generatedUsers: string[] = [];
  for (let index = 1; index <= input.organization.companyAdminCount; index += 1) {
    const user = await tx.user.create({
      data: {
        name: `Company Admin ${index}`,
        email: `company-admin-${index}@${companySlug}.op.local`,
        passwordHash: generatedPasswordHash,
        role: "ADMIN",
        platformRole: "COMPANY_ADMIN",
        status: "ACTIVE",
        companyId: company.id
      }
    });
    generatedUsers.push(user.id);
  }

  for (let index = 1; index <= input.organization.departmentAdminCount; index += 1) {
    const department = departments[(index - 1) % departments.length];
    const user = await tx.user.create({
      data: {
        name: `Department Admin ${index}`,
        email: `department-admin-${index}@${companySlug}.op.local`,
        passwordHash: generatedPasswordHash,
        role: "TEAM_LEAD",
        platformRole: "DEPARTMENT_ADMIN",
        status: "ACTIVE",
        companyId: company.id,
        departmentId: department?.id
      }
    });
    generatedUsers.push(user.id);
  }

  for (let index = 1; index <= input.organization.operatorCount; index += 1) {
    const department = departments[(index - 1) % departments.length];
    const user = await tx.user.create({
      data: {
        name: `Operator ${index}`,
        email: `operator-${index}@${companySlug}.op.local`,
        passwordHash: generatedPasswordHash,
        role: "OPERATOR",
        platformRole: "OPERATOR",
        status: "ACTIVE",
        companyId: company.id,
        departmentId: department?.id
      }
    });
    generatedUsers.push(user.id);
  }
  await writeAudit(tx, company.id, input.actorId, "USERS_GENERATED", "Company users generated.", { generatedCount: generatedUsers.length + 1 });

  await tx.companyFeatureFlag.createMany({
    data: getProvisioningFeatureFlags().map((featureFlag) => ({
      companyId: company.id,
      key: featureFlag.key,
      enabled: enabledFeatureFlags.has(featureFlag.key),
      source: "provisioning"
    }))
  });
  await writeAudit(tx, company.id, input.actorId, "FEATURE_FLAGS_APPLIED", "Feature flags applied.", { enabled: Array.from(enabledFeatureFlags) });

  await tx.companyModule.createMany({
    data: enabledModules.map((module) => ({
      companyId: company.id,
      moduleId: module.moduleId,
      name: module.name,
      version: module.version,
      navigationGroup: module.navigationGroup,
      permissionGroup: module.permissionGroup,
      licenseRequirement: module.licenseRequirement,
      featureFlag: module.featureFlags[0]?.key ?? null,
      auditEnabled: module.auditEvents.length > 0,
      dependenciesJson: [...module.dependencies],
      defaultEnabled: module.defaultEnabled,
      enabled: true
    }))
  });
  await writeAudit(tx, company.id, input.actorId, "MODULES_ENABLED", "Modules enabled through Module Catalog.", { moduleIds: enabledModules.map((module) => module.moduleId) });

  await tx.companyCapability.createMany({
    data: enabledCapabilities.map((capability) => ({
      companyId: company.id,
      moduleId: capability.moduleId,
      capabilityId: capability.capabilityId,
      name: capability.name,
      version: capability.version,
      category: capability.category,
      permissionGroup: capability.permissionGroup,
      licenseRequirement: capability.licenseRequirement,
      featureFlagsJson: capability.featureFlags.map((featureFlag) => featureFlag.key),
      dependenciesJson: [...capability.dependencies],
      defaultEnabled: capability.defaultEnabled,
      enabled: true,
      lifecycleState: "activated"
    }))
  });
  await writeAudit(tx, company.id, input.actorId, "CAPABILITIES_ENABLED", "Capabilities enabled through Capability Registry.", {
    capabilityIds: enabledCapabilities.map((capability) => capability.capabilityId)
  });

  const settings = buildInitialCompanySettings({
    language: company.language,
    timezone: company.timezone,
    currency: company.currency,
    industryProfile
  });
  await tx.companySetting.createMany({
    data: settings.map((setting) => ({
      companyId: company.id,
      key: setting.key,
      valueJson: setting.value as Prisma.InputJsonValue
    }))
  });
  await writeAudit(tx, company.id, input.actorId, "SETTINGS_GENERATED", "Initial company settings generated.", { count: settings.length });

  const permissionRoles: PlatformRole[] = ["COMPANY_BOSS", "COMPANY_ADMIN", "DEPARTMENT_ADMIN", "OPERATOR"];
  const permissionRows = permissionRoles.flatMap((platformRole) =>
    createPermissionResolver({ platformRole }).permissions.map((permission) => ({
      companyId: company.id,
      platformRole,
      permission
    }))
  );
  await tx.companyPermissionGrant.createMany({ data: permissionRows });
  await writeAudit(tx, company.id, input.actorId, "PERMISSIONS_ASSIGNED", "Default permissions resolved by Permission Engine.", { grants: permissionRows.length });

  await writeAudit(tx, company.id, input.actorId, "PROVISION_COMPLETED", "Company provisioning completed.", {
    companyId: company.id,
    departments: departments.length,
    modules: enabledModules.length,
    capabilities: enabledCapabilities.length
  });

  return {
    companyId: company.id,
    companySlug: company.slug,
    ownerId: owner.id,
    departmentsCreated: departments.length,
    usersCreated: generatedUsers.length + 1,
    modulesEnabled: enabledModules.length,
    capabilitiesEnabled: enabledCapabilities.length,
    featureFlagsEnabled: enabledFeatureFlags.size,
    auditRecordsCreated: 10
  };
}
