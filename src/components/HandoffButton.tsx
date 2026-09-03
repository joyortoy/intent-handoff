import { useState } from "react";
import { canStart, delegateToAgent, refineWithBudget } from "../agent/planner";
import { useApp } from "./useApp";

export function HandoffButton({ compact = false }: { compact?: boolean }) {
  const snap = useApp();
  const [busy, setBusy] = useState(false);
  const gate = canStart();
  const complete = snap.intent.status === "COMPLETED" || snap.intent.status === "UPDATED";
  const working =
    snap.intent.status === "DELEGATED" ||
    snap.intent.status === "RUNNING" ||
    snap.intent.status === "RUNNING_REFINEMENT";
  const pendingBudget =
    snap.result && snap.intent.constraints.hotelMaxNightly !== snap.result.usedIntent.constraints.hotelMaxNightly
      ? snap.intent.constraints.hotelMaxNightly
      : null;
  const testId = compact ? "handoff-header" : "handoff-cta";

  if (working) {
    return (
      <button type="button" className={`cta ${compact ? "cta-compact" : ""}`} data-testid={testId} disabled>
        Finding stays…
      </button>
    );
  }

  if (complete && pendingBudget != null) {
    return (
      <button
        type="button"
        className={`cta ${compact ? "cta-compact" : ""}`}
        data-testid={testId}
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void refineWithBudget(pendingBudget).finally(() => setBusy(false));
        }}
      >
        {busy ? "Updating…" : "Update results →"}
      </button>
    );
  }

  if (complete) return null;

  return (
    <button
      type="button"
      className={`cta ${compact ? "cta-compact" : ""}`}
      data-testid={testId}
      disabled={busy || !gate.ok}
      onClick={() => {
        if (!gate.ok) return;
        setBusy(true);
        void delegateToAgent().finally(() => setBusy(false));
      }}
    >
      {busy ? "Handing off…" : "Let AI finish this →"}
    </button>
  );
}
