import { useEffect } from "react";
import { registerWebMcpTools } from "./webmcp/register";
import { DebugPanel } from "./components/DebugPanel";
import { IntentTray } from "./components/IntentTray";
import { Planner } from "./components/Planner";
import { isDebug, useApp } from "./components/useApp";

export default function App() {
  const snap = useApp();

  useEffect(() => {
    void registerWebMcpTools();
  }, []);

  return (
    <div className="shell" data-phase={snap.intent.status}>
      <div className="grain" aria-hidden="true" />
      <header className="mast">
        <div>
          <p className="eyebrow">WebMCP · Human → Agent</p>
          <h1>Intent Handoff</h1>
          <p className="tagline">Click what you want. Let the agent take it from there.</p>
        </div>
        <div className="mast-meta">
          <WebMcpPill />
          <p className="mast-note">No prompt required. Structured intent is the source of truth.</p>
        </div>
      </header>

      <main className="layout">
        <Planner />
        <IntentTray />
      </main>

      {isDebug() ? <DebugPanel /> : null}
    </div>
  );
}

function WebMcpPill() {
  const snap = useApp();
  const live = snap.webmcp.available;
  return (
    <span className={`pill ${live ? "pill-live" : "pill-fallback"}`}>
      <span className="dot" />
      {live ? `WebMCP live · ${snap.webmcp.api}` : "WebMCP tools registered · waiting for browser API"}
    </span>
  );
}
