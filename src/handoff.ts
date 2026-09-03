export function buildHandoffMessage(confirmation: string): string {
  return [
    "Continue the handoff I prepared in the currently open WebMCP Handoff page.",
    "",
    "Use that page's Site Tools. Do not ask me to repeat the URL, clicked target, or instruction—the page already holds that context.",
    "",
    "1. Call get_handoff_context.",
    `2. Call start_handoff with ${JSON.stringify({ confirmation })}.`,
    "3. Open the returned targetPage.url as a separate top-level tab. Prefer its Site Tools when available; otherwise use normal browser interaction.",
    "4. Keep the WebMCP Handoff tab open and call report_handoff_progress with truthful updates.",
    "5. When the work is actually finished or clearly blocked, call submit_handoff_result with a concise summary and the correct completed value.",
  ].join("\n");
}
