import { getSnapshot, markHumanApproved } from "../core/store";
import { invokeTool } from "../webmcp/register";

function sleep(ms: number) {
  const demo =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "true";
  return new Promise((resolve) => setTimeout(resolve, demo ? Math.min(ms, 280) : ms));
}

export async function delegateToAgent(): Promise<void> {
  const { token } = markHumanApproved();
  await invokeTool("start_task", { confirmation: token });
  await runPlanner();
}

export async function refineWithBudget(to: number): Promise<void> {
  await invokeTool("apply_constraint_delta", { field: "hotelMaxNightly", to });
  await runPlanner();
}

async function runPlanner(): Promise<void> {
  await invokeTool("get_current_intent", {});
  await invokeTool("report_progress", {
    stage: "understanding",
    message: "Reading structured intent from the page. Not asking the human to restate origin, destination, dates, or budget.",
  });
  await sleep(420);

  await invokeTool("get_task_context", {});
  await invokeTool("report_progress", {
    stage: "searching",
    message: "Searching the labeled demo catalog with the frozen constraints.",
  });
  await invokeTool("search_trip_options", {});
  await sleep(520);

  await invokeTool("report_progress", {
    stage: "comparing",
    message: "Comparing surviving options against transit, budget, and departure preferences.",
  });
  await sleep(480);

  await invokeTool("report_progress", {
    stage: "writing",
    message: "Writing a result that cites the human's original selections.",
  });
  await invokeTool("submit_result", { useEngine: true });
}

export function canStart(): { ok: boolean; reason?: string } {
  const snap = getSnapshot();
  if (!snap.intent.origin) return { ok: false, reason: "Choose where you’re leaving from." };
  if (!snap.intent.destination) return { ok: false, reason: "Choose a destination." };
  if (!snap.intent.dates) return { ok: false, reason: "Choose dates." };
  if (snap.intent.origin === snap.intent.destination) {
    return { ok: false, reason: "Origin and destination must differ." };
  }
  return { ok: true };
}
