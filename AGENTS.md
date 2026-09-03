# Codex

JoyRelay is a hotel-discovery page that hands structured trip intent to an agent through WebMCP site tools.

## Live URL

https://intent-handoff.joyhuiqi.workers.dev

Open this URL as a top-level tab in ChatGPT’s built-in browser (GPT-5.6 Sol or Terra, site tools enabled). Do not load it in an iframe. Codex should discover the page tools instead of scraping the UI.

## After the human presses Let AI finish this →

Call `get_current_intent`, then `search_trip_options`, then `submit_result`. Do not ask for origin, destination, dates, or budget. Those are already in structured intent.

For `$200 → $150`, keep the same task and call `apply_constraint_delta` only if the page has not already applied it, then search and submit again.

## Local

```bash
npm install
npm test
npm run dev
```
