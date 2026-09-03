# ChatGPT / Codex — how to use this site

Open the live app as a **top-level tab** in ChatGPT’s desktop built-in browser.

**Model:** GPT-5.6 Sol or GPT-5.6 Terra (Luna has WebMCP disabled)  
**URL:** https://intent-handoff.joyhuiqi.workers.dev

Turn on **Enable site tools** (Settings → Browser → Permissions). In the address bar, open **Site tools → Available site tools** and confirm these are listed:

`get_current_intent`, `get_selected_constraints`, `get_task_context`, `get_task_status`, `start_task`, `report_progress`, `search_trip_options`, `submit_result`, `apply_constraint_delta`

## Human first, then Codex

1. Human selects Singapore → Tokyo, Next week, ≤ $200, Near train station, Late arrival, Balanced.
2. Human presses **Let AI finish this →**. That mints the confirmation token and calls `start_task`.
3. Codex must **not** ask where they are going. Call, in order:
   - `get_current_intent`
   - `get_task_context`
   - `report_progress` with `{ "stage": "understanding", "message": "Preferences understood" }`
   - `report_progress` with `{ "stage": "searching", "message": "Searching demo catalog" }`
   - `search_trip_options`
   - `report_progress` with `{ "stage": "comparing", "message": "Comparing stays" }`
   - `submit_result` with `{ "useEngine": true }`
4. Human changes budget to $150 and presses **Update results →**.
5. Codex then calls `get_current_intent`, `search_trip_options`, and `submit_result` again. If the page has not already applied the delta, call `apply_constraint_delta` with `{ "field": "hotelMaxNightly", "to": 150 }` first.

Do not reconstruct the trip from the DOM. The structured intent is the source of truth.

Chrome with `chrome://flags/#enable-webmcp-testing` can inspect the same tools via `document.modelContext`.
