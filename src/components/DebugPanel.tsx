import { getSnapshot, resetDemo } from "../core/store";
import { TOOLS } from "../webmcp/tools";
import { useApp } from "./useApp";

export function DebugPanel() {
  const snap = useApp();
  return (
    <section className="debug" aria-label="Debug">
      <div className="debug-head">
        <h2>Debug</h2>
        <p>Hidden from the demo unless ?debug=true</p>
        <button type="button" onClick={() => resetDemo()}>
          Reset
        </button>
      </div>
      <div className="debug-grid">
        <pre>{JSON.stringify(getSnapshot().intent, null, 2)}</pre>
        <div>
          <h3>WebMCP</h3>
          <p>API: {snap.webmcp.api}</p>
          <p>Available: {String(snap.webmcp.available)}</p>
          <p>Task: {snap.taskId ?? "—"}</p>
          <p>State: {snap.intent.status}</p>
          <p>Updated: {snap.timestamps.updatedAt}</p>
          <h3>Registered tools</h3>
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
      <h3>Agent result</h3>
      <pre>{JSON.stringify(snap.result, null, 2)}</pre>
    </section>
  );
}
