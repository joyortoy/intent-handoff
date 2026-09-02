import { describe, expect, it } from "vitest";
import { resolveDatePreset } from "../core/dates";
import { getSnapshot, markHumanApproved, patchIntent, resetDemo } from "../core/store";
import { getTool } from "./tools";

describe("tool loop", () => {
  it("hands structured intent to ranking without a prompt", async () => {
    resetDemo();
    patchIntent({
      origin: "Singapore",
      destination: "Tokyo",
      dates: resolveDatePreset("next_week", new Date("2026-09-02T00:00:00Z")),
      constraints: {
        hotelMaxNightly: 200,
        nearTransit: true,
        preferredDeparture: "late",
        quietHotel: false,
      },
      priority: "balanced",
    });

    const { token } = markHumanApproved();
    const started = (await getTool("start_task").execute({ confirmation: token })) as { status: string };
    expect(started.status).toBe("DELEGATED");

    const intent = (await getTool("get_current_intent").execute({})) as {
      intent: { origin: string; destination: string; constraints: { hotelMaxNightly: number } };
    };
    expect(intent.intent.origin).toBe("Singapore");
    expect(intent.intent.destination).toBe("Tokyo");
    expect(intent.intent.constraints.hotelMaxNightly).toBe(200);

    await getTool("report_progress").execute({ stage: "searching", message: "searching catalog" });
    await getTool("search_trip_options").execute({});
    await getTool("submit_result").execute({ useEngine: true });
    expect(getSnapshot().intent.status).toBe("COMPLETED");
    expect(getSnapshot().result?.best.hotel.walkMinutesToStation).toBeLessThanOrEqual(10);

    await getTool("apply_constraint_delta").execute({ field: "hotelMaxNightly", to: 150 });
    await getTool("submit_result").execute({ useEngine: true });
    expect(getSnapshot().intent.status).toBe("UPDATED");
    expect(getSnapshot().result?.best.hotel.nightlyUsd).toBeLessThanOrEqual(150);
    expect(getSnapshot().result?.usedIntent.origin).toBe("Singapore");
  });
});
