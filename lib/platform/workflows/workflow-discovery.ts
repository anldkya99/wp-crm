import {
  builtInWorkflowActions,
  builtInWorkflowConditions,
  builtInWorkflowManifests,
  builtInWorkflowTriggers
} from "@/lib/platform/workflows/builtin-workflows";

export function discoverWorkflowTriggers() {
  return builtInWorkflowTriggers;
}

export function discoverWorkflowConditions() {
  return builtInWorkflowConditions;
}

export function discoverWorkflowActions() {
  return builtInWorkflowActions;
}

export function discoverWorkflows() {
  return builtInWorkflowManifests;
}
