import { useState } from "react";
import { canStart, delegateToAgent, refineWithBudget } from "../agent/planner";
import { constraintLines, intentToProse } from "../core/intent";
import { restoreDraft } from "../core/store";
import { useApp } from "./useApp";

export function IntentTray() {
  const snap = useApp();
  const phase = snap.intent.status;
  const working = phase === "DELEGATED" || phase === "RUNNING" || phase === "RUNNING_REFINEMENT";
  const complete = phase === "COMPLETED" || phase === "UPDATED";
  const pendingBudget =
    snap.result && snap.intent.constraints.hotelMaxNightly !== snap.result.usedIntent.constraints.hotelMaxNightly
      ? {
          from: snap.result.usedIntent.constraints.hotelMaxNightly,
          to: snap.intent.constraints.hotelMaxNightly,
        }
      : snap.delta && phase === "REFINEMENT_REQUESTED"
        ? snap.delta
        : null;

  return (
    <aside className="tray" data-phase={phase} aria-label="Your intent">
      <div className="tray-head">
        <p className="section-kicker">02 · Shared state</p>
        <h2>
          {phase === "UPDATED"
            ? "Updated"
            : complete
              ? "Task complete"
              : working
                ? "AI is working"
                : "Your Intent"}
        </h2>
        <p className="quiet">
          {complete
            ? "The recommendation is bound to the preferences you clicked — not a reconstructed prompt."
            : working
              ? "Control moved from configuration to agent execution."
              : "Updated live as you click."}
        </p>
      </div>

      <IntentSummary />

      {working ? <Activity /> : null}
      {complete && snap.result ? <ResultCard /> : null}
      {snap.error ? <p className="error">{snap.error}</p> : null}

      {!working && !complete ? <AskPreview /> : null}
      {pendingBudget && complete ? (
        <div className="delta">
          <p className="delta-label">Changed</p>
          <p>
            Hotel budget
            <strong>
              ${pendingBudget.from} → ${pendingBudget.to}
            </strong>
          </p>
        </div>
      ) : null}

      <TrayActions pendingBudget={pendingBudget} />
    </aside>
  );
}

function IntentSummary() {
  const snap = useApp();
  const intent = snap.frozenIntent ?? snap.intent;
  const lines = constraintLines(intent);

  return (
    <div className="intent-card">
      <p className="route">
        <span>{intent.origin ?? "Origin"}</span>
        <span className="arrow">→</span>
        <span>{intent.destination ?? "Destination"}</span>
      </p>
      <p className="dates">{intent.dates ? `${intent.dates.label}` : "Choose dates"}</p>
      <ul className="checks">
        {lines.map((line) => (
          <li key={line}>
            <span className="tick" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AskPreview() {
  const snap = useApp();
  return (
    <div className="ask">
      <h3>What I'll ask the agent</h3>
      <blockquote>{intentToProse(snap.intent)}</blockquote>
      <p className="quiet">Readable copy only. The agent receives structured JSON via WebMCP.</p>
    </div>
  );
}

function Activity() {
  const snap = useApp();
  const stages = [
    { id: "understanding", label: "Understanding your preferences" },
    { id: "searching", label: "Searching options" },
    { id: "comparing", label: "Comparing tradeoffs" },
    { id: "writing", label: "Writing the result" },
  ] as const;
  const done = new Set(snap.progress.map((item) => item.stage));
  const latest = snap.progress[snap.progress.length - 1];

  return (
    <div className="activity">
      <ol>
        {stages.map((stage) => {
          const isDone = done.has(stage.id);
          const isCurrent = latest?.stage === stage.id && !["COMPLETED", "UPDATED"].includes(snap.intent.status);
          return (
            <li key={stage.id} className={isDone ? "is-done" : isCurrent ? "is-current" : ""}>
              <span className="mark">{isDone ? "✓" : ""}</span>
              {stage.label}
            </li>
          );
        })}
      </ol>
      {latest ? <p className="quiet">{latest.message}</p> : null}
      <p className="source-tag">
        {snap.webmcp.available
          ? "Progress is emitted by real tool calls (report_progress)."
          : "Progress is emitted by the same tool execute handlers. WebMCP browser API is not present in this session."}
      </p>
    </div>
  );
}

function ResultCard() {
  const snap = useApp();
  const result = snap.result!;
  return (
    <div className="result">
      <p className="result-kicker">I compared {result.comparedCount} options.</p>
      <h3>Best match</h3>
      <p className="hotel">{result.best.hotel.name}</p>
      <ul className="stats">
        <li>${result.best.hotel.nightlyUsd}/night</li>
        <li>{result.best.hotel.walkMinutesToStation} min from {result.best.hotel.station}</li>
        <li>
          {result.best.flight.number} · {result.best.flight.departLocal} {result.best.flight.window} departure
        </li>
      </ul>
      <h4>Why this won</h4>
      <p>{result.explanation}</p>
      <p className="catalog-note">{result.catalogDisclaimer}</p>
    </div>
  );
}

function TrayActions({
  pendingBudget,
}: {
  pendingBudget: { from: number; to: number } | null;
}) {
  const snap = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gate = canStart();
  const complete = snap.intent.status === "COMPLETED" || snap.intent.status === "UPDATED";
  const working =
    snap.intent.status === "DELEGATED" ||
    snap.intent.status === "RUNNING" ||
    snap.intent.status === "RUNNING_REFINEMENT";

  async function start() {
    const check = canStart();
    if (!check.ok) {
      setError(check.reason ?? "Finish required selections.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await delegateToAgent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delegation failed");
    } finally {
      setBusy(false);
    }
  }

  async function refine() {
    if (!pendingBudget) return;
    setBusy(true);
    setError(null);
    try {
      await refineWithBudget(pendingBudget.to);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refinement failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cta-block">
      {error ? <p className="error">{error}</p> : null}
      {!complete && !working ? (
        <button type="button" className="cta" disabled={busy || !gate.ok} onClick={() => void start()}>
          {busy ? "Handing off…" : "Let AI finish this →"}
        </button>
      ) : null}
      {complete && pendingBudget ? (
        <button type="button" className="cta" disabled={busy} onClick={() => void refine()}>
          {busy ? "Updating…" : "Update results →"}
        </button>
      ) : null}
      {complete ? (
        <button type="button" className="ghost" onClick={() => restoreDraft()}>
          Refine from scratch
        </button>
      ) : null}
      {!gate.ok && !complete && !working ? <p className="quiet">{gate.reason}</p> : null}
      <p className="trust">Execution starts only after this explicit handoff. No purchases. Research only.</p>
    </div>
  );
}
