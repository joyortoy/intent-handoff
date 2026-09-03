import { describe, expect, it } from "vitest";
import { buildHandoffMessage } from "./handoff";

describe("handoff message", () => {
  it("tells the AI to read page context instead of asking the human again", () => {
    const message = buildHandoffMessage("confirm_123");
    expect(message).toContain("get_handoff_context");
    expect(message).toContain('start_handoff with {"confirmation":"confirm_123"}');
    expect(message).toContain("report_handoff_progress");
    expect(message).toContain("submit_handoff_result");
    expect(message).toContain("Do not ask me to repeat");
  });
});
