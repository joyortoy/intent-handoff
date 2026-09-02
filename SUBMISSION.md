# Submission — Intent Handoff

### Why is this use case a strong fit for WebMCP?

Travel planning is a pile of constraints the human already expressed in the interface: origin, destination, dates, a nightly cap, transit, departure window, and a priority. WebMCP is the missing language for that state. Instead of an agent reverse-engineering cards and sliders, it calls `get_current_intent()` and receives the exact structured object the website accumulated. The fit is **structured intent transfer**, not browser actuation.

### How does this create a better user experience?

The human never has to translate “what I just clicked” into a second essay for the model. The tray shows the structured intent and a human-readable paraphrase, then an explicit **Let AI finish this →** handoff. After the result, changing one number (`$200 → $150`) updates the ranking while everything else survives. That is faster, calmer, and more trustworthy than prompt reconstruction.

### What can humans and agents do together that was difficult before?

Humans are good at preference, taste, and constraint-setting through UI. Agents are good at comparison across a catalog. Before WebMCP, those two skills did not share memory. Here they do: the site freezes a versioned intent, the agent reads it as tools, and a later delta is applied to the same object. The human does not re-explain Tokyo, next week, late departure, or “near a station.”

### How was WebMCP implemented?

We used the **Imperative API** (`document.modelContext.registerTool`, with `navigator.modelContext` as a documented fallback). Each tool has a JSON Schema `inputSchema` and an `execute` function that reads or writes the same in-page store the UI uses. Registration uses `AbortSignal` for lifecycle. When `getTools` / `executeTool` exist, the in-page planner invokes tools through that API so the demo is a real WebMCP round-trip, not a parallel fake. ChatGPT’s documented limitations are respected: no declarative HTML tools, no iframe-registered tools. Execution never purchases anything. Demo catalog results are labeled as demo catalog. Silent execution is impossible: `start_task` requires the token minted by the human CTA.
