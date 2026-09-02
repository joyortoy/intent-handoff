import { formatDateRange, resolveDatePreset } from "../core/dates";
import { getSnapshot, patchIntent } from "../core/store";
import { CITIES, DESTINATIONS, ORIGINS, type DatePreset, type DepartureWindow, type Priority } from "../core/types";
import { useApp } from "./useApp";

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "next_week", label: "Next week" },
  { id: "this_weekend", label: "This weekend" },
  { id: "in_two_weeks", label: "In two weeks" },
];

const DEPARTURES: { id: DepartureWindow; label: string; hint: string }[] = [
  { id: "early", label: "Early", hint: "Before noon" },
  { id: "afternoon", label: "Afternoon", hint: "12:00–18:00" },
  { id: "late", label: "Late", hint: "After 18:00" },
];

const PRIORITIES: { id: Priority; label: string; hint: string }[] = [
  { id: "price", label: "Price", hint: "Cheapest viable" },
  { id: "balanced", label: "Balance", hint: "Price + convenience" },
  { id: "convenience", label: "Convenience", hint: "Time and location" },
];

export function Planner() {
  const snap = useApp();
  const frozen = snap.intent.status === "DELEGATED" || snap.intent.status === "RUNNING" || snap.intent.status === "RUNNING_REFINEMENT";
  const intent = snap.intent;

  return (
    <section className="planner" aria-label="Trip configuration">
      <p className="section-kicker">01 · Human</p>
      <h2>Build the trip by clicking.</h2>
      <p className="lede">
        You are not writing a prompt. Each control writes structured intent the agent will inherit.
      </p>

      <fieldset disabled={frozen} className="stack">
        <legend className="sr-only">Trip preferences</legend>

        <div className="block">
          <h3>From</h3>
          <div className="city-grid">
            {ORIGINS.map((id) => {
              const city = CITIES.find((item) => item.id === id)!;
              return (
                <button
                  key={id}
                  type="button"
                  className={`city-card tone-${city.tone} ${intent.origin === id ? "is-on" : ""}`}
                  onClick={() => patchIntent({ origin: id })}
                >
                  <span className="city-kicker">{city.kicker}</span>
                  <span className="city-name">{city.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="block">
          <h3>To</h3>
          <div className="city-grid">
            {DESTINATIONS.map((id) => {
              const city = CITIES.find((item) => item.id === id)!;
              return (
                <button
                  key={id}
                  type="button"
                  className={`city-card tone-${city.tone} ${intent.destination === id ? "is-on" : ""}`}
                  onClick={() => patchIntent({ destination: id })}
                >
                  <span className="city-kicker">{city.kicker}</span>
                  <span className="city-name">{city.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="block">
          <h3>When</h3>
          <div className="chips">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`chip ${intent.dates?.preset === preset.id ? "is-on" : ""}`}
                onClick={() => patchIntent({ dates: resolveDatePreset(preset.id) })}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {intent.dates ? <p className="quiet">{formatDateRange(intent.dates)}</p> : null}
        </div>

        <div className="block">
          <div className="block-head">
            <h3>Hotel budget</h3>
            <strong className="budget-readout">≤ ${intent.constraints.hotelMaxNightly}</strong>
          </div>
          <div className="chips">
            {[150, 200, 250].map((amount) => (
              <button
                key={amount}
                type="button"
                className={`chip ${intent.constraints.hotelMaxNightly === amount ? "is-on" : ""}`}
                onClick={() => {
                  const current = getSnapshot().intent.constraints;
                  patchIntent({ constraints: { ...current, hotelMaxNightly: amount } });
                }}
              >
                ≤ ${amount}
              </button>
            ))}
          </div>
          <input
            className="slider"
            type="range"
            min={80}
            max={320}
            step={10}
            value={intent.constraints.hotelMaxNightly}
            onChange={(event) => {
              const current = getSnapshot().intent.constraints;
              patchIntent({ constraints: { ...current, hotelMaxNightly: Number(event.target.value) } });
            }}
          />
          <div className="slider-marks">
            <span>$80</span>
            <span>$150</span>
            <span>$200</span>
            <span>$320</span>
          </div>
        </div>

        <div className="block">
          <h3>Stay</h3>
          <div className="chips">
            <button
              type="button"
              className={`chip ${intent.constraints.nearTransit ? "is-on" : ""}`}
              aria-pressed={intent.constraints.nearTransit}
              onClick={() => {
                const current = getSnapshot().intent.constraints;
                patchIntent({ constraints: { ...current, nearTransit: !current.nearTransit } });
              }}
            >
              Near train station
            </button>
            <button
              type="button"
              className={`chip ${intent.constraints.quietHotel ? "is-on" : ""}`}
              aria-pressed={intent.constraints.quietHotel}
              onClick={() => {
                const current = getSnapshot().intent.constraints;
                patchIntent({ constraints: { ...current, quietHotel: !current.quietHotel } });
              }}
            >
              Quiet hotel
            </button>
          </div>
        </div>

        <div className="block">
          <h3>Flight</h3>
          <div className="choice-grid">
            {DEPARTURES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`choice ${intent.constraints.preferredDeparture === item.id ? "is-on" : ""}`}
                onClick={() =>
                  patchIntent({
                    constraints: { ...intent.constraints, preferredDeparture: item.id },
                  })
                }
              >
                <strong>{item.label}</strong>
                <span>{item.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="block">
          <h3>Priority</h3>
          <div className="choice-grid">
            {PRIORITIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`choice ${intent.priority === item.id ? "is-on" : ""}`}
                onClick={() => patchIntent({ priority: item.id })}
              >
                <strong>{item.label}</strong>
                <span>{item.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="block">
          <h3>Anything else?</h3>
          <p className="quiet">Optional. Supplements structured state rather than replacing it.</p>
          <textarea
            className="notes"
            rows={3}
            placeholder="Quiet hotel. Window seat. Avoid red-eyes if possible."
            value={intent.notes}
            onChange={(event) => patchIntent({ notes: event.target.value })}
          />
        </div>
      </fieldset>
    </section>
  );
}

