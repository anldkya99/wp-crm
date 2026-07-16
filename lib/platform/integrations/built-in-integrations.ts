import type { IntegrationManifest } from "@/lib/platform/integrations/integration-manifest";

export const builtInIntegrationManifests: readonly IntegrationManifest[] = [
  {
    providerId: "platform.integration.metadata",
    name: "Platform Integration Metadata Provider",
    version: "1.0.0",
    kind: "metadata",
    capabilities: ["metadata", "schema", "provider-context", "runtime-context", "capability-discovery"],
    lifecycle: "active",
    owner: "operation-pact",
    description: "Foundation-only integration metadata provider. It does not communicate with external systems."
  }
];
