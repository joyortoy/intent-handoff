import { getSnapshot, resetDemo } from "../core/store";
import { TOOLS } from "../webmcp/tools";
import { useApp } from "./useApp";

export function DebugPanel() {
  const snap = useApp();
  return (
    <section className="debug" aria-label="Debug">
      <div className="debug-head">
        <h2>Debug</h2>
        <p>Visible only with ?debug=true</p>
        <button type="button" onClick={() => resetDemo()}>
          Reset
        </button>
      </div>
      <div className="debug-grid">
        <div>
          <h3>Structured intent</h3>
          <pre>{JSON.stringify(getSnapshot().intent, null, 2)}</pre>
        </div>
        <div>
          <h3>Task</h3>
          <p>ID: {snap.taskId ?? "—"}</p>
          <p>Status: {snap.intent.status}</p>
          <p>Version: {snap.intent.version}</p>
          <p>WebMCP API: {snap.webmcp.api}</p>
          <p>Available: {String(snap.webmcp.available)}</p>
          <h3>Constraint delta</h3>
          <pre>{JSON.stringify(snap.delta, null, 2)}</pre>
          <h3>WebMCP tools</h3>
          <ul>
            {TOOLS.map((tool) => (
              <li key={tool.name}>{tool.name}</li>
            ))}
          </ul>
        </div>
      </div>
      <h3>Tool calls</h3>
      <ol className="call-log">
        {snap.toolCalls.map((call) => (
          <li key={call.id}>
            <code>
              {call.at} · {call.channel} · {call.name}
            </code>
          </li>
        ))}
      </ol>
      <h3>Result payload</h3>
      <pre>{JSON.stringify(snap.result, null, 2)}</pre>
    </section>
  );
}
