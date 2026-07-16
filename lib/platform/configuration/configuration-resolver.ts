import type {
  ConfigurationLayer,
  ConfigurationScope,
  ResolvedConfigurationValue
} from "@/lib/platform/configuration/configuration-schema";
import type { ConfigurationRegistry } from "@/lib/platform/configuration/configuration-registry";
import { validateConfigurationValue } from "@/lib/platform/configuration/configuration-validation";

const scopeOrder: readonly ConfigurationScope[] = ["platform", "company", "department", "operator"];

export type ConfigurationResolverInput = {
  registry: ConfigurationRegistry;
  layers: readonly ConfigurationLayer[];
  targetScope: ConfigurationScope;
  runtimeOverrides?: Record<string, unknown>;
};

export type ConfigurationResolver = {
  resolve: (configurationId: string) => ResolvedConfigurationValue;
  resolveAll: () => readonly ResolvedConfigurationValue[];
  getConfigurationContext: () => Record<string, unknown>;
};

function orderedScopesFor(targetScope: ConfigurationScope) {
  return scopeOrder.slice(0, scopeOrder.indexOf(targetScope) + 1);
}

export function createConfigurationResolver(input: ConfigurationResolverInput): ConfigurationResolver {
  const layerMap = new Map(input.layers.map((layer) => [layer.scope, layer.values]));
  const orderedScopes = orderedScopesFor(input.targetScope);

  const resolve = (configurationId: string): ResolvedConfigurationValue => {
    const schema = input.registry.get(configurationId);
    if (!schema) throw new Error(`Unknown configuration schema: ${configurationId}`);

    if (input.runtimeOverrides && Object.prototype.hasOwnProperty.call(input.runtimeOverrides, configurationId)) {
      const value = input.runtimeOverrides[configurationId];
      validateConfigurationValue(schema, value);
      return { configurationId, value, sourceScope: input.targetScope, schema };
    }

    for (const scope of [...orderedScopes].reverse()) {
      const values = layerMap.get(scope);
      if (values && Object.prototype.hasOwnProperty.call(values, configurationId)) {
        const value = values[configurationId];
        validateConfigurationValue(schema, value);
        return { configurationId, value, sourceScope: scope, schema };
      }
    }

    validateConfigurationValue(schema, schema.defaultValue);
    return { configurationId, value: schema.defaultValue, sourceScope: "default", schema };
  };

  const resolveAll = () => input.registry.list().map((schema) => resolve(schema.configurationId));

  return {
    resolve,
    resolveAll,
    getConfigurationContext: () =>
      Object.fromEntries(resolveAll().map((configuration) => [configuration.configurationId, configuration.value]))
  };
}
