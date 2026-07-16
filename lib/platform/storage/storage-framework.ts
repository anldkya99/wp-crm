import { platformStorageRegistry } from "@/lib/platform/storage/storage-discovery";
import { createStorageRuntime } from "@/lib/platform/storage/storage-runtime";

export function getPlatformStorageFramework() {
  const runtime = createStorageRuntime(platformStorageRegistry);

  return {
    registry: platformStorageRegistry,
    manifests: platformStorageRegistry.list(),
    runtime,
    context: runtime.context,
    metadata: runtime.metadata
  };
}
