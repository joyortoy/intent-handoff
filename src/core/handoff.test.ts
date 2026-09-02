import { describe, expect, it } from "vitest";
import { resolveDatePreset } from "./dates";
import { canDelegate, intentToProse } from "./intent";
import { rankPackages } from "./ranker";
import { canTransition } from "./stateMachine";
import { DEFAULT_CONSTRAINTS, type FrozenIntent } from "./types";

function frozen(overrides: Partial<FrozenIntent> = {}): FrozenIntent {
  return {
    origin: "Singapore",
    destination: "Tokyo",
    dates: resolveDatePreset("next_week", new Date("2026-09-02T00:00:00Z")),
    constraints: { ...DEFAULT_CONSTRAINTS, hotelMaxNightly: 200, nearTransit: true, preferredDeparture: "late" },
    priority: "balanced",
    notes: "",
    status: "DELEGATED",
    version: 1,
    frozenAt: "2026-09-02T00:00:00.000Z",
    frozenVersion: 1,
    ...overrides,
  };
}

describe("dates", () => {
  it("resolves next week from a Wednesday to the following Monday–Sunday", () => {
    const range = resolveDatePreset("next_week", new Date("2026-09-02T00:00:00Z"));
    expect(range.start).toBe("2026-09-07");
    expect(range.end).toBe("2026-09-13");
  });
});

describe("intent", () => {
  it("keeps structured state as source of truth and generates prose last", () => {
    const intent = frozen();
    expect(canDelegate(intent)).toBe(true);
    expect(intentToProse(intent)).toContain("Singapore");
    expect(intentToProse(intent)).toContain("Tokyo");
    expect(intentToProse(intent)).toContain("$200");
    expect(intentToProse(intent)).toContain("late");
  });
});

describe("state machine", () => {
  it("only allows deterministic transitions", () => {
    expect(canTransition("DRAFT", "READY")).toBe(true);
    expect(canTransition("READY", "DELEGATED")).toBe(true);
    expect(canTransition("DELEGATED", "RUNNING")).toBe(true);
    expect(canTransition("RUNNING", "COMPLETED")).toBe(true);
    expect(canTransition("COMPLETED", "REFINEMENT_REQUESTED")).toBe(true);
    expect(canTransition("COMPLETED", "DELEGATED")).toBe(false);
  });
});

describe("ranker", () => {
  it("picks a transit-near hotel under $200 and rejects the far cheapest", () => {
    const result = rankPackages(frozen());
    expect(result.catalogSource).toBe("demo_catalog");
    expect(result.comparedCount).toBe(14);
    expect(result.best.hotel.nightlyUsd).toBeLessThanOrEqual(200);
    expect(result.best.hotel.walkMinutesToStation).toBeLessThanOrEqual(10);
    expect(result.best.flight.window).toBe("late");
    expect(result.rejectedCheapest?.hotel.id).toBe("capsule-ueno");
    expect(result.explanation).toContain("24");
  });

  it("re-ranks on a $150 budget without dropping origin or transit", () => {
    const first = rankPackages(frozen());
    const second = rankPackages(
      frozen({
        constraints: { ...frozen().constraints, hotelMaxNightly: 150 },
      }),
      { field: "hotelMaxNightly", from: 200, to: 150 },
    );
    expect(second.best.hotel.nightlyUsd).toBeLessThanOrEqual(150);
    expect(second.usedIntent.origin).toBe("Singapore");
    expect(second.usedIntent.destination).toBe("Tokyo");
    expect(second.delta?.to).toBe(150);
    expect(second.best.hotel.id).not.toBe(first.best.hotel.id);
  });
});
