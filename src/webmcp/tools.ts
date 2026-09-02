import { getTaskContext, intentToProse, missingRequired } from "../core/intent";
import { rankPackages, searchTripOptions } from "../core/ranker";
import {
  appendProgress,
  applyDeltaToFrozen,
  completeTask,
  failTask,
  freezeAndDelegate,
  getSnapshot,
  logToolCall,
  requestRefinement,
  transitionTo,
} from "../core/store";
import type { ConstraintDelta, ProgressStage } from "../core/types";

export type ToolChannel = "webmcp" | "local_adapter";

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: Record<string, unknown>) => Promise<unknown>;
};

function wrap(name: string, channel: ToolChannel, result: unknown, args: unknown) {
  logToolCall({ name, args, result, channel });
  return result;
}

function currentChannel(): ToolChannel {
  return getSnapshot().webmcp.available ? "webmcp" : "local_adapter";
}

export const TOOLS: ToolDefinition[] = [
  {
    name: "get_current_intent",
    description:
      "Return the complete structured trip intent established by the human. This is the source of truth. Do not reconstruct preferences from the UI.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const snap = getSnapshot();
      const intent = snap.frozenIntent ?? snap.intent;
      return wrap("get_current_intent", currentChannel(), {
        intent,
        sourceOfTruth: "structured_intent",
        proseForHumansOnly: intentToProse(intent),
      }, {});
    },
  },
  {
    name: "get_selected_constraints",
    description: "Return explicit hotel, transit, flight, and priority constraints only.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const intent = getSnapshot().frozenIntent ?? getSnapshot().intent;
      return wrap("get_selected_constraints", currentChannel(), {
        constraints: intent.constraints,
        priority: intent.priority,
        notes: intent.notes,
      }, {});
    },
  },
  {
    name: "get_task_context",
    description:
      "Return enough contextual state for an agent to continue the trip-planning task without asking the human to restate origin, destination, dates, or budget.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const snap = getSnapshot();
      return wrap(
        "get_task_context",
        currentChannel(),
        getTaskContext(snap.frozenIntent ?? snap.intent, {
          taskId: snap.taskId,
          status: snap.intent.status,
          delta: snap.delta,
          previousResultSummary: snap.result
            ? { hotel: snap.result.best.hotel.name, nightlyUsd: snap.result.best.hotel.nightlyUsd }
            : null,
        }),
        {},
      );
    },
  },
  {
    name: "get_task_status",
    description: "Expose the current task id, state, progress stages, and whether the human has delegated.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const snap = getSnapshot();
      return wrap("get_task_status", currentChannel(), {
        taskId: snap.taskId,
        status: snap.intent.status,
        humanApprovedAt: snap.humanApprovedAt,
        progress: snap.progress,
        error: snap.error,
      }, {});
    },
  },
  {
    name: "start_task",
    description:
      "Transition the human-created draft into delegated execution. Requires the confirmation token issued when the human pressed Let AI finish this. Never start silently.",
    inputSchema: {
      type: "object",
      properties: {
        confirmation: {
          type: "string",
          description: "Human-issued delegation token from the Intent Tray CTA.",
        },
      },
      required: ["confirmation"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    execute: async (input) => {
      const confirmation = String(input.confirmation ?? "");
      const missing = missingRequired(getSnapshot().intent);
      if (missing.length) {
        throw new Error(`Cannot start task. Missing: ${missing.join(", ")}`);
      }
      const frozen = freezeAndDelegate(confirmation);
      return wrap("start_task", currentChannel(), {
        ok: true,
        taskId: getSnapshot().taskId,
        status: frozen.status,
        frozenIntent: frozen,
      }, input);
    },
  },
  {
    name: "report_progress",
    description:
      "Record a real execution stage on the page. Only call this when that stage is actually happening. Fabricated progress is forbidden.",
    inputSchema: {
      type: "object",
      properties: {
        stage: {
          type: "string",
          enum: ["understanding", "searching", "comparing", "writing"],
        },
        message: { type: "string" },
      },
      required: ["stage", "message"],
      additionalProperties: false,
    },
    execute: async (input) => {
      const stage = input.stage as ProgressStage;
      const message = String(input.message ?? "");
      const status = getSnapshot().intent.status;
      if (status === "DELEGATED") transitionTo("RUNNING");
      if (status === "REFINEMENT_REQUESTED") transitionTo("RUNNING_REFINEMENT");
      appendProgress({ stage, message, source: currentChannel() });
      return wrap("report_progress", currentChannel(), { ok: true, stage, status: getSnapshot().intent.status }, input);
    },
  },
  {
    name: "search_trip_options",
    description:
      "Search the labeled DEMO CATALOG using the frozen structured intent. Returns hotels and flights that already match the human's constraints. This is not live booking inventory.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const frozen = getSnapshot().frozenIntent;
      if (!frozen) throw new Error("No frozen intent. Call start_task after human delegation.");
      const results = searchTripOptions(frozen);
      return wrap("search_trip_options", currentChannel(), results, {});
    },
  },
  {
    name: "submit_result",
    description:
      "Write the completed comparison back into the application's result panel. Purchases are forbidden. The result must explain how it follows the human's structured intent.",
    inputSchema: {
      type: "object",
      properties: {
        useEngine: {
          type: "boolean",
          description: "If true, rank the demo catalog with the frozen intent. Preferred for this demo.",
        },
      },
      additionalProperties: false,
    },
    execute: async (input) => {
      const snap = getSnapshot();
      if (!snap.frozenIntent || !snap.taskId) throw new Error("No delegated task.");
      try {
        const ranked = rankPackages(snap.frozenIntent, snap.delta ?? undefined);
        completeTask(ranked);
        return wrap("submit_result", currentChannel(), { ok: true, result: getSnapshot().result }, input);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Ranking failed";
        failTask(message);
        throw error;
      }
    },
  },
  {
    name: "apply_constraint_delta",
    description:
      "Apply a single constraint change (hotel budget) on top of the existing frozen intent. Do not restart the conversation. Existing origin, destination, dates, transit, and flight preferences survive.",
    inputSchema: {
      type: "object",
      properties: {
        field: { type: "string", const: "hotelMaxNightly" },
        to: { type: "number" },
      },
      required: ["field", "to"],
      additionalProperties: false,
    },
    execute: async (input) => {
      const snap = getSnapshot();
      const to = Number(input.to);
      const from =
        snap.result?.usedIntent.constraints.hotelMaxNightly ??
        snap.frozenIntent?.constraints.hotelMaxNightly ??
        snap.intent.constraints.hotelMaxNightly;
      const delta: ConstraintDelta = { field: "hotelMaxNightly", from, to };
      requestRefinement(delta);
      const frozen = applyDeltaToFrozen();
      return wrap("apply_constraint_delta", currentChannel(), {
        ok: true,
        delta,
        retained: {
          origin: frozen.origin,
          destination: frozen.destination,
          dates: frozen.dates,
          nearTransit: frozen.constraints.nearTransit,
          preferredDeparture: frozen.constraints.preferredDeparture,
          priority: frozen.priority,
        },
        frozenIntent: frozen,
      }, input);
    },
  },
];

export function getTool(name: string): ToolDefinition {
  const tool = TOOLS.find((item) => item.name === name);
  if (!tool) throw new Error(`Unknown tool ${name}`);
  return tool;
}
