import type { LicensePackageManifest } from "@/lib/platform/licensing/license-manifest";

export const licensePackageManifests: readonly LicensePackageManifest[] = [
  {
    packageId: "starter",
    packageName: "Starter",
    version: "1.0.0",
    includedModules: ["crm-core", "communications-whatsapp", "ticketing"],
    includedCapabilities: ["crm.customer-profile", "crm.timeline", "crm.notes", "whatsapp.conversations"],
    featureFlags: ["crm", "whatsapp", "ticketing"],
    limits: [
      { key: "operators", value: 10, description: "Included operator seats." },
      { key: "companies", value: 1, description: "Included company workspaces." }
    ],
    upgradePath: ["professional", "business", "enterprise", "custom"],
    dependencies: []
  },
  {
    packageId: "professional",
    packageName: "Professional",
    version: "1.0.0",
    includedModules: ["voice", "reports", "automation", "live-support"],
    includedCapabilities: ["whatsapp.routing", "voice.calls", "reports.analytics"],
    featureFlags: ["voice", "reports", "live_support", "automation"],
    limits: [
      { key: "operators", value: 50, description: "Included operator seats." },
      { key: "companies", value: 3, description: "Included company workspaces." }
    ],
    upgradePath: ["business", "enterprise", "custom"],
    dependencies: ["starter"]
  },
  {
    packageId: "business",
    packageName: "Business",
    version: "1.0.0",
    includedModules: ["api-access", "integrations"],
    includedCapabilities: [],
    featureFlags: ["api_access", "integrations"],
    limits: [
      { key: "operators", value: 150, description: "Included operator seats." },
      { key: "companies", value: 10, description: "Included company workspaces." }
    ],
    upgradePath: ["enterprise", "custom"],
    dependencies: ["professional"]
  },
  {
    packageId: "enterprise",
    packageName: "Enterprise",
    version: "1.0.0",
    includedModules: ["ai-assistant"],
    includedCapabilities: ["ai.assistant"],
    featureFlags: ["ai_assistant"],
    limits: [
      { key: "operators", value: "unlimited", description: "Included operator seats." },
      { key: "companies", value: "unlimited", description: "Included company workspaces." }
    ],
    upgradePath: ["custom"],
    dependencies: ["business"]
  },
  {
    packageId: "custom",
    packageName: "Custom",
    version: "1.0.0",
    includedModules: [],
    includedCapabilities: [],
    featureFlags: [],
    limits: [
      { key: "operators", value: "unlimited", description: "Custom operator seat entitlement." },
      { key: "companies", value: "unlimited", description: "Custom company workspace entitlement." }
    ],
    upgradePath: [],
    dependencies: ["enterprise"]
  }
];
