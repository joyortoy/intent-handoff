# Intent Handoff

**Click what you want. Let the agent take it from there.**

Websites already know what a person wants — origin, destination, budget, transit, flight window — because the person just clicked those things. Today an agent still has to reconstruct that context from a giant prompt. Intent Handoff accumulates ordinary UI interaction as structured state, exposes it through WebMCP tools, and lets an agent continue the task without asking “where are you going?”

## Why WebMCP?

Websites speak visually to humans. Agents usually scrape the DOM or ask the human to restate everything. This project makes the same live page state available as typed tools: `get_current_intent`, `get_selected_constraints`, `get_task_context`, `start_task`, `report_progress`, `search_trip_options`, `submit_result`, `apply_constraint_delta`, and `get_task_status`.

## Human + Agent Flow

Human interaction → structured intent → WebMCP → agent → execution → result → refinement

## Demo path (under 3 minutes)

1. Open the public URL in Chrome with WebMCP enabled, or ChatGPT’s in-app browser.
2. From **Singapore** → **Tokyo**.
3. Dates: **Next week**.
4. Hotel budget **≤ $200**. Toggle **Near train station**. Flight **Late**. Priority **Balance**.
5. Confirm **Your Intent** matches. Press **Let AI finish this →**.
6. Watch the tray become agent activity, then a result that cites your constraints.
7. Move budget **$200 → $150**. Press **Update results →**. Origin, dates, transit, and flight preference survive.

Debug overlay: append `?debug=true`.

## WebMCP Implementation

Tools are registered with the Imperative API:

```js
document.modelContext.registerTool({
  name,
  description,
  inputSchema,
  execute,
});
```

Feature detection uses `document.modelContext ?? navigator.modelContext`. ChatGPT’s in-app browser currently supports this imperative API on the top-level page (not declarative HTML tools, not iframe tools).

| Tool | Side effect | Purpose |
| --- | --- | --- |
| `get_current_intent` | read | Full structured intent. Source of truth. |
| `get_selected_constraints` | read | Preferences only. |
| `get_task_context` | read | Enough context to continue without reconstructing the UI. |
| `get_task_status` | read | Task id, state, progress, human approval. |
| `start_task` | write | DRAFT/READY → DELEGATED. Requires the human CTA token. |
| `report_progress` | write | Records a stage only when that stage actually runs. |
| `search_trip_options` | read | Searches the labeled **demo catalog**. |
| `submit_result` | write | Writes the comparison into the result panel. |
| `apply_constraint_delta` | write | `$200 → $150` on the existing frozen intent. Does not restart. |

### Deviations (honest)

- **No purchases.** Research/comparison only.
- **Catalog is demo data**, clearly labeled. Ranking is deterministic. WebMCP tool registration and invocation are real.
- `report_progress` / `submit_result` mutate **page state**. They do not claim a hidden cloud agent runtime.
- If the browser has no `modelContext`, the same `execute` handlers still run via a local adapter and the UI says so. We do not fake `executeTool`.
- `navigator.modelContext` is a fallback for older Chrome origin-trial builds. Current spec lives on `document.modelContext`.
- We do not use the declarative HTML API (unsupported in ChatGPT’s browser).
- Cross-tab automation is not claimed. Intent handoff is the product.

## Architecture

UI → Intent Store → Intent Normalizer → WebMCP Tool Layer → Task State Machine → Agent Adapter → Result Store → UI

States: `DRAFT → READY → DELEGATED → RUNNING → COMPLETED → REFINEMENT_REQUESTED → RUNNING_REFINEMENT → UPDATED` (plus `FAILED`).

## Setup

```bash
git clone https://github.com/joyortoy/intent-handoff.git
cd intent-handoff
npm install
npm test
npm run dev
```

Open http://127.0.0.1:5173

No API keys are required. See `.env.example`.

## Deployment

```bash
npm run deploy
```

Cloudflare Workers static assets, SPA routing, `compatibility_date: 2026-09-02`. Public HTTPS on `*.workers.dev`.

## Known limitations

- WebMCP is an origin trial / ChatGPT site-tools preview. Ordinary Chrome without the flag will still run the demo through the labeled local adapter.
- Inventory is a 14-hotel / 8-flight demo catalog, not live availability.
- The in-page planner is a truthful execution adapter that calls the same tools a ChatGPT/Codex agent would call. It is not a generic autonomous browser.

## License

MIT
