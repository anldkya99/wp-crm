import type { PermissionResolver } from "@/lib/platform/permission-engine";

export type ModuleOptionActorContext = {
  actorId: string;
  resolver: PermissionResolver;
};
