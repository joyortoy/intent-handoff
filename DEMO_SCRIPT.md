# Demo script — WebMCP Handoff

Target: 90 seconds.

1. Open the live URL as a top-level ChatGPT desktop tab and show the available Site Tools.
2. Connect `https://example.com` or another public page.
3. Press **Instruction to AI**, click a target, and write: “Explain this section in one sentence.”
4. Point out the popup: “The website has not secretly started an agent. It created an explicit handoff message.”
5. Copy and send the message to Codex.
6. Show Codex call `get_handoff_context` and receive the target URL, click coordinates, page snapshot, and exact instruction.
7. Show the floating panel update through `report_handoff_progress`, then finish through `submit_handoff_result`.

Closing line: **“A click becomes shared, structured context—not another prompt the human has to reconstruct.”**
