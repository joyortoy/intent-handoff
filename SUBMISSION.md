# Submission — WebMCP Handoff

### Why is this a strong fit for WebMCP?

A person can point at an exact part of a webpage much faster than they can describe it. WebMCP Handoff turns that gesture into structured, agent-readable state: target URL, text snapshot, pixel position, nearby text, and the human's instruction. `get_handoff_context` transfers that state without forcing the human to restate it.

### What is the user experience?

The human connects a page, clicks a target, and writes one instruction. A visible popup then explains exactly what will be handed to the AI and provides a copy button. Nothing runs silently. After the human sends that message, the AI accepts the confirmation token, works in a separate top-level target tab, and writes progress and the result back into the original floating panel.

### How is WebMCP implemented?

The top-level page registers four imperative tools with `document.modelContext.registerTool` and a `navigator.modelContext` compatibility fallback. Read and write effects are declared in tool metadata. The context tool marks connected page content as untrusted. `start_handoff` requires the token minted by the human action. Progress and completion calls mutate the same visible page state the human sees.

### What changed from the prototype?

The prototype sent instructions to a hidden `/v1/chat/completions` endpoint and rendered the answer in a chat bubble. That looked agentic but was not a WebMCP handoff. The submitted version removes that backend entirely: the AI in ChatGPT Work or Codex is the agent, and the website provides the shared context and result channel through real Site Tools.
