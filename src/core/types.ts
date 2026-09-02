export const TASK_STATES = [
  "DRAFT",
  "READY",
  "DELEGATED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "REFINEMENT_REQUESTED",
  "RUNNING_REFINEMENT",
  "UPDATED",
] as const;

export type TaskState = (typeof TASK_STATES)[number];

export type DatePreset = "next_week" | "this_weekend" | "in_two_weeks" | "custom";
export type DepartureWindow = "early" | "afternoon" | "late" | "any";
export type Priority = "price" | "balanced" | "convenience";

export type DateRange = {
  preset: DatePreset;
  start: string;
  end: string;
  label: string;
};

export type Constraints = {
  hotelMaxNightly: number;
  nearTransit: boolean;
  preferredDeparture: DepartureWindow;
  quietHotel: boolean;
};

export type Intent = {
  origin: string | null;
  destination: string | null;
  dates: DateRange | null;
  constraints: Constraints;
  priority: Priority;
  notes: string;
  status: TaskState;
  version: number;
};

export type FrozenIntent = Intent & {
  frozenAt: string;
  frozenVersion: number;
};

export type ConstraintDelta = {
  field: "hotelMaxNightly";
  from: number;
  to: number;
};

export type ProgressStage =
  | "idle"
  | "understanding"
  | "searching"
  | "comparing"
  | "writing";

export type ProgressEvent = {
  stage: ProgressStage;
  message: string;
  at: string;
  source: "webmcp" | "local_adapter";
};

export type HotelOption = {
  id: string;
  name: string;
  neighborhood: string;
  nightlyUsd: number;
  walkMinutesToStation: number;
  station: string;
  quietScore: number;
  notes: string;
  source: "demo_catalog";
};

export type FlightOption = {
  id: string;
  carrier: string;
  number: string;
  from: string;
  to: string;
  departLocal: string;
  arriveLocal: string;
  window: Exclude<DepartureWindow, "any">;
  durationMinutes: number;
  priceUsd: number;
  stops: number;
  source: "demo_catalog";
};

export type RankedPackage = {
  hotel: HotelOption;
  flight: FlightOption;
  score: number;
  why: string;
};

export type TaskResult = {
  taskId: string;
  comparedCount: number;
  catalogSource: "demo_catalog";
  catalogDisclaimer: string;
  best: RankedPackage;
  rejectedCheapest: {
    hotel: HotelOption;
    reason: string;
  } | null;
  alternatives: RankedPackage[];
  usedIntent: FrozenIntent;
  delta?: ConstraintDelta;
  explanation: string;
  completedAt: string;
};

export type ToolCallLog = {
  id: string;
  name: string;
  args: unknown;
  result: unknown;
  at: string;
  channel: "webmcp" | "local_adapter";
};

export type AppSnapshot = {
  intent: Intent;
  frozenIntent: FrozenIntent | null;
  previousFrozenIntent: FrozenIntent | null;
  taskId: string | null;
  humanApprovedAt: string | null;
  delegationToken: string | null;
  progress: ProgressEvent[];
  result: TaskResult | null;
  previousResult: TaskResult | null;
  delta: ConstraintDelta | null;
  error: string | null;
  webmcp: {
    available: boolean;
    api: "document.modelContext" | "navigator.modelContext" | "unavailable";
    registeredTools: string[];
    lastDiscovery: string | null;
  };
  toolCalls: ToolCallLog[];
  timestamps: {
    createdAt: string;
    updatedAt: string;
  };
};

export const DEFAULT_CONSTRAINTS: Constraints = {
  hotelMaxNightly: 200,
  nearTransit: false,
  preferredDeparture: "any",
  quietHotel: false,
};

export const CITIES = [
  { id: "Singapore", label: "Singapore", kicker: "Changi", tone: "singapore" },
  { id: "Tokyo", label: "Tokyo", kicker: "Haneda / Narita", tone: "tokyo" },
  { id: "Seoul", label: "Seoul", kicker: "Incheon", tone: "seoul" },
  { id: "Kyoto", label: "Kyoto", kicker: "via Osaka", tone: "kyoto" },
] as const;

export const ORIGINS = ["Singapore", "Tokyo", "Seoul"] as const;
export const DESTINATIONS = ["Tokyo", "Kyoto", "Seoul", "Singapore"] as const;
