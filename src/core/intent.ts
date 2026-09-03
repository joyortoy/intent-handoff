import type { Intent, TaskState } from "./types";

const REQUIRED_FOR_READY: Array<keyof Pick<Intent, "origin" | "destination" | "dates">> = [
  "origin",
  "destination",
  "dates",
];

export function missingRequired(intent: Intent): string[] {
  const missing: string[] = [];
  for (const key of REQUIRED_FOR_READY) {
    if (!intent[key]) missing.push(key);
  }
  if (intent.origin && intent.destination && intent.origin === intent.destination) {
    missing.push("destination_must_differ");
  }
  if (!intent.constraints.hotelMaxNightly) missing.push("hotelMaxNightly");
  return missing;
}

export function canDelegate(intent: Intent): boolean {
  return missingRequired(intent).length === 0;
}

export function deriveStatus(intent: Intent): TaskState {
  if (
    intent.status === "DELEGATED" ||
    intent.status === "RUNNING" ||
    intent.status === "COMPLETED" ||
    intent.status === "FAILED" ||
    intent.status === "REFINEMENT_REQUESTED" ||
    intent.status === "RUNNING_REFINEMENT" ||
    intent.status === "UPDATED"
  ) {
    return intent.status;
  }
  return canDelegate(intent) ? "READY" : "DRAFT";
}

export function intentToProse(intent: Intent): string {
  if (!intent.origin || !intent.destination || !intent.dates) {
    return "Finish choosing origin, destination, and dates. I will then ask the agent to compare options against your constraints.";
  }

  const transit = intent.constraints.nearTransit ? " near a train station" : "";
  const quiet = intent.constraints.quietHotel ? " Prefer a quiet hotel." : "";
  const departure =
    intent.constraints.preferredDeparture === "any"
      ? ""
      : ` Prefer a ${intent.constraints.preferredDeparture} flight.`;
  const priority =
    intent.priority === "price"
      ? " Optimize for price."
      : intent.priority === "convenience"
        ? " Optimize for convenience."
        : " Compare the strongest options and explain the tradeoffs.";
  const notes = intent.notes.trim() ? ` Additional instruction: ${intent.notes.trim()}` : "";

  return `Find a trip from ${intent.origin} to ${intent.destination} ${intent.dates.label.toLowerCase()} (${intent.dates.start} to ${intent.dates.end}). Find hotels under $${intent.constraints.hotelMaxNightly}/night${transit}.${departure}${priority}${quiet}${notes}`;
}

export function constraintLines(intent: Intent): string[] {
  const lines = [`Hotel ≤ $${intent.constraints.hotelMaxNightly}/night`];
  if (intent.constraints.nearTransit) lines.push("Near train station");
  if (intent.constraints.preferredDeparture !== "any") {
    const window =
      intent.constraints.preferredDeparture.charAt(0).toUpperCase() +
      intent.constraints.preferredDeparture.slice(1);
    lines.push(intent.constraints.preferredDeparture === "late" ? "Late arrival" : `${window} arrival`);
  }
  if (intent.constraints.quietHotel) lines.push("Quiet hotel");
  if (intent.priority === "balanced") lines.push("Balanced");
  if (intent.priority === "price") lines.push("Prioritize price");
  if (intent.priority === "convenience") lines.push("Prioritize convenience");
  if (intent.notes.trim()) lines.push(intent.notes.trim());
  return lines;
}

export function consumerSummary(intent: Intent): string {
  if (!intent.origin || !intent.destination || !intent.dates) {
    return "Tell us what matters to you. We’ll handle the rest.";
  }
  const transit = intent.constraints.nearTransit ? " near transit" : "";
  const arrival =
    intent.constraints.preferredDeparture === "late"
      ? ", with a late arrival option"
      : intent.constraints.preferredDeparture === "any"
        ? ""
        : `, with a ${intent.constraints.preferredDeparture} arrival`;
  const style =
    intent.priority === "price"
      ? " and a focus on price"
      : intent.priority === "convenience"
        ? " and a focus on convenience"
        : " and a good balance of price and convenience";
  return `Find a ${intent.destination} stay under $${intent.constraints.hotelMaxNightly}/night${transit}${arrival}${style}.`;
}

export function getTaskContext(intent: Intent, extras: Record<string, unknown> = {}) {
  return {
    goal: "Compare hotels and flights for a human-constructed trip without reconstructing the UI.",
    intent,
    proseForHumansOnly: intentToProse(intent),
    purchasesForbidden: true,
    catalog: "demo_catalog",
    ...extras,
  };
}
