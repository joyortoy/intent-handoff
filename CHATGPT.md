# ChatGPT / Codex — how to use this site

Open the live app in ChatGPT’s in-app browser (GPT-5.6 Sol or Terra; site tools enabled):

https://intent-handoff.joyhuiqi.workers.dev

1. Let the human click Singapore → Tokyo, Next week, ≤ $200, Near train station, Late, Balance.
2. They press **Let AI finish this →**. That mints a confirmation token and calls `start_task`.
3. Discover site tools. Call, in order:
   - `get_current_intent`
   - `get_task_context`
   - `get_task_status`
   - `search_trip_options`
   - `report_progress` only for stages that are actually happening
   - `submit_result`
4. For the second turn, the human changes budget to $150 and presses **Update results →**. Then call `apply_constraint_delta` with `{ "field": "hotelMaxNightly", "to": 150 }` if the page has not already applied it, then search and submit again.

Do not ask where they are going. The page already knows.

Chrome with `chrome://flags/#enable-webmcp-testing` can inspect the same tools via `document.modelContext.getTools()`.
