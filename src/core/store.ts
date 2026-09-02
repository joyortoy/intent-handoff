import { deriveStatus } from "./intent";
import { assertTransition } from "./stateMachine";
import {
  DEFAULT_CONSTRAINTS,
  type AppSnapshot,
  type ConstraintDelta,
  type FrozenIntent,
  type Intent,
  type ProgressEvent,
  type TaskResult,
  type TaskState,
  type ToolCallLog,
} from "./types";

const STORAGE_KEY = "intent-handoff.v1";

function nowIso(): string {
  return new Date().toISOString();
}

function initialIntent(): Intent {
  return {
    origin: null,
    destination: null,
    dates: null,
    constraints: { ...DEFAULT_CONSTRAINTS },
    priority: "balanced",
    notes: "",
    status: "DRAFT",
    version: 1,
  };
}

function initialSnapshot(): AppSnapshot {
  const createdAt = nowIso();
  return {
    intent: initialIntent(),
    frozenIntent: null,
    previousFrozenIntent: null,
    taskId: null,
    humanApprovedAt: null,
    delegationToken: null,
    progress: [],
    result: null,
    previousResult: null,
    delta: null,
    error: null,
    webmcp: {
      available: false,
      api: "unavailable",
      registeredTools: [],
      lastDiscovery: null,
    },
    toolCalls: [],
    timestamps: { createdAt, updatedAt: createdAt },
  };
}

function load(): AppSnapshot {
  if (typeof localStorage === "undefined") return initialSnapshot();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialSnapshot();
    const parsed = JSON.parse(raw) as AppSnapshot;
    parsed.intent.status = deriveStatus(parsed.intent);
    return parsed;
  } catch {
    return initialSnapshot();
  }
}

type StoreBag = {
  snapshot: AppSnapshot;
  listeners: Set<() => void>;
};

const root = globalThis as typeof globalThis & { __intentHandoff?: StoreBag };

function bag(): StoreBag {
  if (!root.__intentHandoff) {
    root.__intentHandoff = { snapshot: load(), listeners: new Set() };
  }
  return root.__intentHandoff;
}

function persist() {
  const snapshot = bag().snapshot;
  snapshot.timestamps.updatedAt = nowIso();
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    }
  } catch {
    // Private / sandboxed browsers may block storage. Intent remains in memory.
  }
}

function emit() {
  persist();
  for (const listener of bag().listeners) listener();
}

export function getSnapshot(): AppSnapshot {
  return bag().snapshot;
}

export function subscribe(listener: () => void): () => void {
  bag().listeners.add(listener);
  return () => bag().listeners.delete(listener);
}

export function patchIntent(partial: Partial<Intent>): AppSnapshot {
  const snapshot = bag().snapshot;
  const status = snapshot.intent.status;
  if (status === "RUNNING" || status === "DELEGATED" || status === "RUNNING_REFINEMENT") {
    throw new Error("Intent is frozen while the agent is working.");
  }
  snapshot.intent = {
    ...snapshot.intent,
    ...partial,
    constraints: { ...snapshot.intent.constraints, ...(partial.constraints ?? {}) },
    version: snapshot.intent.version + 1,
  };
  if (status === "COMPLETED" || status === "UPDATED") {
    // live edits after completion become a pending delta rather than wiping the result
  } else if (status === "DRAFT" || status === "READY") {
    snapshot.intent.status = deriveStatus(snapshot.intent);
  }
  emit();
  return snapshot;
}

export function setWebmcpStatus(webmcp: AppSnapshot["webmcp"]) {
  bag().snapshot.webmcp = webmcp;
  emit();
}

export function logToolCall(entry: Omit<ToolCallLog, "id" | "at">): ToolCallLog {
  const snapshot = bag().snapshot;
  const row: ToolCallLog = {
    ...entry,
    id: crypto.randomUUID(),
    at: nowIso(),
  };
  snapshot.toolCalls = [...snapshot.toolCalls.slice(-48), row];
  emit();
  return row;
}

export function markHumanApproved(): { token: string; taskId: string } {
  const snapshot = bag().snapshot;
  const token = crypto.randomUUID();
  const taskId = snapshot.taskId ?? `task_${crypto.randomUUID().slice(0, 8)}`;
  snapshot.humanApprovedAt = nowIso();
  snapshot.delegationToken = token;
  snapshot.taskId = taskId;
  snapshot.error = null;
  emit();
  return { token, taskId };
}

export function freezeAndDelegate(token: string): FrozenIntent {
  const snapshot = bag().snapshot;
  if (snapshot.delegationToken !== token) {
    throw new Error("Delegation requires the human confirmation token from Let AI finish this.");
  }
  if (snapshot.intent.status !== "READY" && snapshot.intent.status !== "DRAFT") {
    if (snapshot.intent.status === "DELEGATED" && snapshot.frozenIntent) return snapshot.frozenIntent;
    throw new Error(`Cannot start a task from ${snapshot.intent.status}.`);
  }
  const next: TaskState = "DELEGATED";
  assertTransition(snapshot.intent.status === "DRAFT" ? "READY" : snapshot.intent.status, next);
  snapshot.intent.status = next;
  snapshot.frozenIntent = {
    ...structuredClone(snapshot.intent),
    frozenAt: nowIso(),
    frozenVersion: snapshot.intent.version,
    status: next,
  };
  snapshot.progress = [];
  snapshot.error = null;
  emit();
  return snapshot.frozenIntent;
}

export function transitionTo(next: TaskState) {
  const snapshot = bag().snapshot;
  assertTransition(snapshot.intent.status, next);
  snapshot.intent.status = next;
  if (snapshot.frozenIntent) snapshot.frozenIntent.status = next;
  emit();
}

export function appendProgress(event: Omit<ProgressEvent, "at">) {
  const snapshot = bag().snapshot;
  snapshot.progress = [...snapshot.progress, { ...event, at: nowIso() }];
  emit();
}

export function completeTask(result: TaskResult) {
  const snapshot = bag().snapshot;
  const next: TaskState = snapshot.intent.status === "RUNNING_REFINEMENT" ? "UPDATED" : "COMPLETED";
  assertTransition(snapshot.intent.status, next);
  snapshot.intent.status = next;
  if (snapshot.frozenIntent) snapshot.frozenIntent.status = next;
  snapshot.previousResult = snapshot.result;
  snapshot.result = { ...result, taskId: snapshot.taskId ?? result.taskId };
  snapshot.error = null;
  emit();
}

export function failTask(message: string) {
  const snapshot = bag().snapshot;
  snapshot.intent.status = "FAILED";
  if (snapshot.frozenIntent) snapshot.frozenIntent.status = "FAILED";
  snapshot.error = message;
  emit();
}

export function requestRefinement(delta: ConstraintDelta) {
  const snapshot = bag().snapshot;
  if (snapshot.intent.status !== "COMPLETED" && snapshot.intent.status !== "UPDATED") {
    throw new Error("Refinement is only available after a result.");
  }
  assertTransition(snapshot.intent.status, "REFINEMENT_REQUESTED");
  snapshot.delta = delta;
  snapshot.intent.status = "REFINEMENT_REQUESTED";
  snapshot.intent.constraints = { ...snapshot.intent.constraints, hotelMaxNightly: delta.to };
  snapshot.intent.version += 1;
  emit();
}

export function applyDeltaToFrozen(): FrozenIntent {
  const snapshot = bag().snapshot;
  if (!snapshot.frozenIntent) throw new Error("No frozen intent to refine.");
  if (!snapshot.delta) throw new Error("No constraint delta.");
  if (snapshot.intent.status === "REFINEMENT_REQUESTED") {
    assertTransition("REFINEMENT_REQUESTED", "RUNNING_REFINEMENT");
  }
  snapshot.previousFrozenIntent = snapshot.frozenIntent;
  snapshot.frozenIntent = {
    ...snapshot.frozenIntent,
    constraints: {
      ...snapshot.frozenIntent.constraints,
      hotelMaxNightly: snapshot.delta.to,
    },
    version: snapshot.frozenIntent.version + 1,
    frozenAt: nowIso(),
    frozenVersion: snapshot.frozenIntent.frozenVersion + 1,
    status: "RUNNING_REFINEMENT",
  };
  snapshot.intent.status = "RUNNING_REFINEMENT";
  snapshot.progress = [];
  emit();
  return snapshot.frozenIntent;
}

export function resetDemo() {
  bag().snapshot = initialSnapshot();
  emit();
}

export function restoreDraft() {
  const snapshot = bag().snapshot;
  snapshot.intent.status = deriveStatus({ ...snapshot.intent, status: "DRAFT" });
  snapshot.frozenIntent = null;
  snapshot.taskId = null;
  snapshot.humanApprovedAt = null;
  snapshot.delegationToken = null;
  snapshot.progress = [];
  snapshot.result = null;
  snapshot.previousResult = null;
  snapshot.delta = null;
  snapshot.error = null;
  emit();
}

