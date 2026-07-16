import type { RuntimeCompanyConfiguration, RuntimeContext, RuntimeEnvironment } from "@/lib/platform/runtime/runtime-types";
import { getPlatformConfigurationEngine } from "@/lib/platform/configuration/configuration-engine";
import { getPlatformEventFramework } from "@/lib/platform/events/event-framework";
import { getPlatformIdentityFramework } from "@/lib/platform/identity/identity-framework";
import { getPlatformLicenseEngine } from "@/lib/platform/licensing/license-engine";

function resolveRuntimeEnvironment(): RuntimeEnvironment {
  if (process.env.NODE_ENV === "production") return "production";
  if (process.env.NODE_ENV === "test") return "test";
  return "development";
}

export function createRuntimeContext(configuration: RuntimeCompanyConfiguration): RuntimeContext {
  const licenseResolution = getPlatformLicenseEngine().resolveLicense({
    packageId: configuration.licensePackage,
    requestedFeatureFlags: configuration.featureFlags,
    purchasedModules: configuration.purchasedModules,
    purchasedCapabilities: configuration.purchasedCapabilities,
    expiresAt: configuration.licenseExpiresAt,
    status: configuration.licenseStatus
  });
  const configurationEngine = getPlatformConfigurationEngine();
  const configurationResolver = configurationEngine.createResolver({
    registry: configurationEngine.registry,
    targetScope: configuration.operatorId ? "operator" : configuration.departmentId ? "department" : configuration.companyId ? "company" : "platform",
    layers: configuration.configurationLayers ?? [{ scope: "platform", values: {} }],
    runtimeOverrides: configuration.runtimeOverrides
  });
  const eventFramework = getPlatformEventFramework();
  const configurationContext = configurationResolver.getConfigurationContext();
  const identity = getPlatformIdentityFramework().runtime.resolveIdentity({
    identityId: configuration.identityId,
    userId: configuration.userId,
    principalType: configuration.principalType ?? "PLATFORM_SERVICE",
    companyId: configuration.companyId,
    departmentId: configuration.departmentId,
    configurationContext,
    licenseContext: licenseResolution.licenseContext,
    eventContext: {
      categories: Array.from(new Set(eventFramework.events.map((event) => event.category)))
    }
  });

  return {
    companyId: configuration.companyId ?? null,
    departmentId: configuration.departmentId ?? null,
    operatorId: configuration.operatorId ?? null,
    identity,
    licensePackage: configuration.licensePackage,
    licenseContext: licenseResolution.licenseContext,
    entitlements: licenseResolution.entitlements,
    featureFlags: licenseResolution.features.enabledFeatureFlags,
    configurationContext,
    eventContext: {
      categories: Array.from(new Set(eventFramework.events.map((event) => event.category))),
      lastEvent: null
    },
    environment: resolveRuntimeEnvironment(),
    configuration
  };
}
