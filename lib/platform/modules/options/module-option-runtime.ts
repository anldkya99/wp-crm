import { moduleOptionTypeRegistry } from "@/lib/platform/modules/options/option-type-discovery";
import { getModuleOptionService } from "@/lib/platform/modules/options/module-option-service";

export function getModuleOptionRuntime() {
  const optionTypes = moduleOptionTypeRegistry.list();

  return {
    optionTypes,
    registry: moduleOptionTypeRegistry,
    service: getModuleOptionService(),
    metadata: {
      optionTypeCount: optionTypes.length,
      moduleCount: new Set(optionTypes.map((optionType) => optionType.moduleId)).size,
      foundationOnlyCount: optionTypes.filter((optionType) => optionType.foundationOnly).length
    }
  };
}
