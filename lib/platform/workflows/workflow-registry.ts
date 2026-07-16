import type { WorkflowManifest } from "@/lib/platform/workflows/workflow-manifest";

export class WorkflowRegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export class WorkflowRegistry {
  private manifests = new Map<string, WorkflowManifest>();

  register(manifest: WorkflowManifest) {
    this.validateManifest(manifest);
    if (this.manifests.has(manifest.workflowId)) {
      throw new WorkflowRegistryError(`Duplicate workflow manifest: ${manifest.workflowId}`, "DUPLICATE_WORKFLOW");
    }
    this.manifests.set(manifest.workflowId, manifest);
    return this;
  }

  registerMany(manifests: readonly WorkflowManifest[]) {
    manifests.forEach((manifest) => this.register(manifest));
    return this;
  }

  get(workflowId: string) {
    return this.manifests.get(workflowId) ?? null;
  }

  list() {
    return Array.from(this.manifests.values());
  }

  discover(predicate?: (manifest: WorkflowManifest) => boolean) {
    const manifests = this.list();
    return predicate ? manifests.filter(predicate) : manifests;
  }

  private validateManifest(manifest: WorkflowManifest) {
    if (!manifest.workflowId || !manifest.name || !manifest.version || !manifest.trigger.triggerId || !manifest.owner.id) {
      throw new WorkflowRegistryError("Workflow manifest is missing required metadata.", "INVALID_WORKFLOW_MANIFEST");
    }
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new WorkflowRegistryError(`Workflow ${manifest.workflowId} has an invalid version.`, "INVALID_WORKFLOW_VERSION");
    }
  }
}
