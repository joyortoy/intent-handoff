import { useState } from "react";
import { formatDateRange, resolveDatePreset } from "../core/dates";
import { patchIntent } from "../core/store";
import { DESTINATIONS, ORIGINS, type DatePreset } from "../core/types";
import { AIRPORT } from "../ui/presentation";
import { useApp } from "./useApp";

type Field = "from" | "to" | "dates" | null;

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "next_week", label: "Next week" },
  { id: "this_weekend", label: "This weekend" },
  { id: "in_two_weeks", label: "In two weeks" },
];

export function SearchBar() {
  const snap = useApp();
  const intent = snap.intent;
  const frozen =
    snap.intent.status === "DELEGATED" ||
    snap.intent.status === "RUNNING" ||
    snap.intent.status === "RUNNING_REFINEMENT";
  const [open, setOpen] = useState<Field>(null);

  const from = intent.origin ? AIRPORT[intent.origin] : null;
  const to = intent.destination ? AIRPORT[intent.destination] : null;

  return (
    <div className="search-wrap" id="find">
      <div className={`search-card ${frozen ? "is-locked" : ""}`}>
        <button type="button" className={`search-field ${open === "from" ? "is-open" : ""}`} disabled={frozen} onClick={() => setOpen(open === "from" ? null : "from")} data-testid="search-from">
          <span className="search-label">From</span>
          <strong>{from ? `${from.city} (${from.code})` : "Where from?"}</strong>
        </button>
        <span className="search-split" />
        <button type="button" className={`search-field ${open === "to" ? "is-open" : ""}`} disabled={frozen} onClick={() => setOpen(open === "to" ? null : "to")} data-testid="search-to">
          <span className="search-label">To</span>
          <strong>{to ? `${to.city}, ${to.country} (${to.code})` : "Where to?"}</strong>
        </button>
        <span className="search-split" />
        <button type="button" className={`search-field ${open === "dates" ? "is-open" : ""}`} disabled={frozen} onClick={() => setOpen(open === "dates" ? null : "dates")} data-testid="search-dates">
          <span className="search-label">Dates</span>
          <strong>{intent.dates ? intent.dates.label : "When?"}</strong>
          {intent.dates ? <span className="search-hint">{formatDateRange(intent.dates).split(" · ")[1]}</span> : null}
        </button>
      </div>

      {open && !frozen ? (
        <div className="search-picker">
          {open === "from"
            ? ORIGINS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`picker-chip ${intent.origin === id ? "is-on" : ""}`}
                  data-testid={`origin-${id}`}
                  onClick={() => {
                    patchIntent({ origin: id });
                    setOpen("to");
                  }}
                >
                  {AIRPORT[id].city} <span>{AIRPORT[id].code}</span>
                </button>
              ))
            : null}
          {open === "to"
            ? DESTINATIONS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`picker-chip ${intent.destination === id ? "is-on" : ""}`}
                  data-testid={`destination-${id}`}
                  onClick={() => {
                    patchIntent({ destination: id });
                    setOpen("dates");
                  }}
                >
                  {AIRPORT[id].city} <span>{AIRPORT[id].code}</span>
                </button>
              ))
            : null}
          {open === "dates"
            ? DATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`picker-chip ${intent.dates?.preset === preset.id ? "is-on" : ""}`}
                  data-testid={`dates-${preset.id}`}
                  onClick={() => {
                    patchIntent({ dates: resolveDatePreset(preset.id) });
                    setOpen(null);
                  }}
                >
                  {preset.label}
                </button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
