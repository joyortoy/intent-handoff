import { getSnapshot, patchIntent } from "../core/store";
import type { DepartureWindow, Priority } from "../core/types";
import { useApp } from "./useApp";

export function Preferences() {
  const snap = useApp();
  const frozen =
    snap.intent.status === "DELEGATED" ||
    snap.intent.status === "RUNNING" ||
    snap.intent.status === "RUNNING_REFINEMENT";
  const c = snap.intent.constraints;

  return (
    <section className="prefs" aria-label="What matters to you">
      <h2>What matters to you?</h2>
      <fieldset disabled={frozen} className="pref-grid">
        <legend className="sr-only">Stay preferences</legend>
        <article className={`pref-card ${c.hotelMaxNightly ? "is-set" : ""}`}>
          <h3>Budget</h3>
          <p>Per night</p>
          <div className="pills">
            {[150, 200, 250].map((amount) => (
              <button
                key={amount}
                type="button"
                className={`pill-btn ${c.hotelMaxNightly === amount ? "is-on" : ""}`}
                data-testid={`budget-${amount}`}
                onClick={() =>
                  patchIntent({
                    constraints: { ...getSnapshot().intent.constraints, hotelMaxNightly: amount },
                  })
                }
              >
                ≤ ${amount}
              </button>
            ))}
          </div>
        </article>
        <article className={`pref-card ${c.nearTransit ? "is-set" : ""}`}>
          <h3>Location</h3>
          <p>How close to transit</p>
          <div className="pills">
            <button
              type="button"
              className={`pill-btn ${c.nearTransit ? "is-on" : ""}`}
              data-testid="location-transit"
              onClick={() =>
                patchIntent({ constraints: { ...getSnapshot().intent.constraints, nearTransit: true } })
              }
            >
              Near train station
            </button>
            <button
              type="button"
              className={`pill-btn ${!c.nearTransit ? "is-on" : ""}`}
              onClick={() =>
                patchIntent({ constraints: { ...getSnapshot().intent.constraints, nearTransit: false } })
              }
            >
              Flexible
            </button>
          </div>
        </article>
        <article className={`pref-card ${c.preferredDeparture !== "any" ? "is-set" : ""}`}>
          <h3>Arrival</h3>
          <p>Preferred landing window</p>
          <div className="pills">
            {(
              [
                ["late", "Late arrival preferred"],
                ["afternoon", "Afternoon"],
                ["early", "Early"],
              ] as Array<[DepartureWindow, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`pill-btn ${c.preferredDeparture === id ? "is-on" : ""}`}
                data-testid={`arrival-${id}`}
                onClick={() =>
                  patchIntent({
                    constraints: { ...getSnapshot().intent.constraints, preferredDeparture: id },
                  })
                }
              >
                {label}
              </button>
            ))}
          </div>
        </article>
        <article className={`pref-card ${snap.intent.priority ? "is-set" : ""}`}>
          <h3>Travel style</h3>
          <p>How we should rank stays</p>
          <div className="pills">
            {(
              [
                ["balanced", "Balanced"],
                ["price", "Price"],
                ["convenience", "Convenience"],
              ] as Array<[Priority, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`pill-btn ${snap.intent.priority === id ? "is-on" : ""}`}
                data-testid={`style-${id}`}
                onClick={() => patchIntent({ priority: id })}
              >
                {label}
              </button>
            ))}
          </div>
        </article>
      </fieldset>
    </section>
  );
}
