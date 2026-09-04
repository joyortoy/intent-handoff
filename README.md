# WebMCP Handoff

**Point at what matters. Write one instruction. Let the AI continue from there.**

WebMCP Handoff restores the original general-purpose interface: connect a public page, click the exact target, write what the AI should do, and receive a visible message to send to ChatGPT Work or Codex. The page keeps the URL, snapshot, clicked coordinates, nearby text, and instruction as structured state. The human does not have to reconstruct that context in a prompt.

**Live demo:** https://intent-handoff.joyhuiqi.workers.dev

## Why WebMCP?

A chat bubble that secretly calls an API is not a handoff. This site registers real top-level Site Tools through `document.modelContext.registerTool`:

| Tool | Purpose |
| --- | --- |
| `get_handoff_context` | Returns the connected page, snapshot, clicked target, and human instruction. |
| `start_handoff` | Accepts the explicit human confirmation token from the popup. |
| `report_handoff_progress` | Writes truthful progress back into the floating panel. |
| `submit_handoff_result` | Writes the verified outcome and marks the handoff complete or blocked. |

The AI receives context through tools, not by scraping this UI. It opens the returned target URL as a separate top-level tab, prefers that target's Site Tools when available, and can otherwise use normal browser interaction. The handoff tab stays open so progress and the final result can be written back.

## Demo

1. Open the live URL as a top-level tab in ChatGPT desktop.
2. Use GPT-5.6 Sol or Terra and enable **Settings → Browser → Permissions → Site tools**.
3. Paste a public HTTPS URL and press **Connect**.
4. Press **Instruction to AI**, then click the exact target on the page.
5. Write the instruction. A popup appears; no task has started yet.
6. Press **Copy instruction**, paste it into the current ChatGPT Work or Codex conversation, and send it.
7. The AI calls the page tools, works on the target in a separate top-level tab, and writes progress/result back here.

Append `?demo=true` to start with Example Domain already connected for recordings.

## Local development

```bash
npm install
npm test
npm run build
npx wrangler dev
```

No OpenAI API key is required. The Cloudflare Worker only fetches a bounded text snapshot of the public HTTPS page selected by the human. It does not call `/v1/chat/completions` or pretend that an in-page bubble is the agent.

## Limits

- Some sites block iframe display. Their text snapshot still appears, and the generated handoff tells the AI to open the target as a separate top-level tab.
- Connected content is untrusted. The read tool declares `untrustedContentHint`, and the AI must not treat page text as permission or instructions.
- The snapshot endpoint accepts public HTTPS HTML/text pages only and caps fetched content.
- The human must explicitly send the popup message before `start_handoff` can succeed.

## License

MIT
