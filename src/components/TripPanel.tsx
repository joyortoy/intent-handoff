import { canStart } from "../agent/planner";
import { constraintLines, consumerSummary } from "../core/intent";
import { hotelDisplay, hotelPhoto, hotelWalk } from "../ui/presentation";
import { HandoffButton } from "./HandoffButton";
import { useApp } from "./useApp";

export function TripPanel() {
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
      : null;

  const title =
    phase === "UPDATED"
      ? "Updated for your new budget"
      : complete
        ? "Your match"
        : phase === "DELEGATED"
          ? "Handed to JoyRelay"
          : working
            ? "Finding your best match..."
            : "Your trip";

  return (
    <aside className="trip" data-phase={phase} id="trip" aria-label="Your trip">
      <p className="trip-kicker">Current stay</p>
      <h2>{title}</h2>
      <TripSummary />
      {working ? <Progress /> : null}
      {complete && pendingBudget ? (
        <div className="delta-card">
          <p className="delta-kicker">Budget changed</p>
          <p className="delta-value">
            ${pendingBudget.from} → ${pendingBudget.to}
          </p>
          <p className="quiet">Destination, dates, transit, arrival and travel style stay the same.</p>
        </div>
      ) : null}
      {complete && snap.result ? <MatchCard compact={Boolean(pendingBudget)} /> : null}
      {!working && !complete ? (
        <div className="understand">
          <h3>What JoyRelay understands</h3>
          <p>{consumerSummary(snap.intent)}</p>
        </div>
      ) : null}
      {snap.error ? <p className="error">{snap.error}</p> : null}
      <div className="trip-actions">
        <HandoffButton />
        {!canStart().ok && !complete && !working ? <p className="quiet">{canStart().reason}</p> : null}
      </div>
    </aside>
  );
}

function TripSummary() {
  const snap = useApp();
  const intent = snap.frozenIntent ?? snap.intent;
  const lines = constraintLines(intent);

  return (
    <div className="trip-summary">
      <p className="route">
        <span>{intent.origin ?? "From"}</span>
        <span className="arrow">→</span>
        <span>{intent.destination ?? "To"}</span>
      </p>
      <p className="dates">{intent.dates ? intent.dates.label : "Choose dates"}</p>
      <ul className="checks">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function Progress() {
  const snap = useApp();
  const stages = [
    { id: "understanding", label: "Preferences understood" },
    { id: "comparing", label: "Comparing stays" },
    { id: "searching", label: "Searching best matches..." },
  ] as const;
  const done = new Set(snap.progress.map((item) => item.stage));

  return (
    <ol className="progress">
      {stages.map((stage) => (
        <li key={stage.id} className={done.has(stage.id) ? "is-done" : ""}>
          {done.has(stage.id) ? "✓ " : ""}
          {stage.label}
        </li>
      ))}
    </ol>
  );
}

function MatchCard({ compact = false }: { compact?: boolean }) {
  const snap = useApp();
  const result = snap.result!;
  const hotel = result.best.hotel;
  const rejected = result.rejectedCheapest;
  const updated = Boolean(result.delta);

  return (
    <article className="match">
      <div className="match-photo">
        <img src={hotelPhoto(hotel.id)} alt="" />
        <span className="badge">{updated ? "Updated match" : "Best match"}</span>
      </div>
      <div className="match-head">
        <h3>{hotelDisplay(hotel.id, hotel.name)}</h3>
        <p className="match-price">
          ${hotel.nightlyUsd} <span>/ night</span>
        </p>
      </div>
      <ul className="facts">
        <li>{hotelWalk(hotel.id, `${hotel.walkMinutesToStation} min from ${hotel.station}`)}</li>
        <li>Late arrival friendly</li>
        <li>Flight {result.best.flight.number}</li>
      </ul>
      {!compact ? (
        <>
          <h4>Why this matches you</h4>
          <p>
            {updated
              ? "Your destination, dates, transit preference, arrival preference and travel style stayed the same. Only the budget changed."
              : "You wanted a stay near transit, under $200, with late arrival flexibility."}
          </p>
        </>
      ) : null}
      {rejected && !updated && !compact ? (
        <div className="rejected">
          <img src={hotelPhoto(rejected.hotel.id)} alt="" />
          <div>
            <p className="rejected-kicker">Why not the cheapest?</p>
            <p className="rejected-name">{hotelDisplay(rejected.hotel.id, rejected.hotel.name)}</p>
            <p>
              ${rejected.hotel.nightlyUsd} / night · {hotelWalk(rejected.hotel.id, `${rejected.hotel.walkMinutesToStation} min from ${rejected.hotel.station}`)}
            </p>
            <p className="rejected-reason">Too far from transit based on your preference.</p>
          </div>
        </div>
      ) : null}
    </article>
  );
}
