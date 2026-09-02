import type { TaskState } from "./types";

const TRANSITIONS: Record<TaskState, TaskState[]> = {
  DRAFT: ["READY"],
  READY: ["DRAFT", "DELEGATED"],
  DELEGATED: ["RUNNING", "FAILED"],
  RUNNING: ["COMPLETED", "FAILED"],
  COMPLETED: ["REFINEMENT_REQUESTED"],
  FAILED: ["READY", "DRAFT"],
  REFINEMENT_REQUESTED: ["RUNNING_REFINEMENT", "COMPLETED"],
  RUNNING_REFINEMENT: ["UPDATED", "FAILED"],
  UPDATED: ["REFINEMENT_REQUESTED"],
};

export function canTransition(from: TaskState, to: TaskState): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: TaskState, to: TaskState): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal task transition ${from} → ${to}`);
  }
}
