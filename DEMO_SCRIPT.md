# Demo script — Intent Handoff

Target: 2 minutes 30 seconds. Speak slowly. Show the tray, not the code, until 1:05.

## 0:00–0:15 · Problem

“Today, when we want an agent to continue something we’re doing online, we often have to explain the context again. We already clicked Singapore, Tokyo, next week, two hundred dollars. Then we write a prompt as if none of that happened.”

## 0:15–0:45 · Human selects

Click Singapore. Click Tokyo. Next week. Budget 200. Near train station. Late departure. Balance.

Say: **“I haven’t written a prompt.”**

## 0:45–1:05 · Your Intent

Point at the tray.

“The website converted those clicks into structured intent. This sentence is for me. The agent will not parse the sentence. It will call `get_current_intent`.”

## 1:05–1:20 · Handoff

Press **Let AI finish this →**.

If WebMCP is live, show the pill and, if time, `?debug=true` tool log: `start_task`, `get_current_intent`.

“Control just moved from configuration to the agent. The human had to press this. Nothing ran silently.”

## 1:20–1:50 · Agent

Show Understanding / Searching / Comparing.

“The agent is not asking where I’m going. It already has Singapore, Tokyo, next week, two hundred, near transit, late flight.”

## 1:50–2:10 · Result

“Best match cites the budget and the station walk. The cheapest hotel was rejected because it was twenty-four minutes from the station. That preference survived the handoff.”

## 2:10–2:25 · Second turn

Drag budget to $150. Show **Changed $200 → $150**. Press **Update results →**.

“It kept Tokyo, next week, late flight, near the station. Only the budget moved.”

## 2:25–2:30 · End

**“WebMCP turns interface interaction into a language humans and agents can share.”**
