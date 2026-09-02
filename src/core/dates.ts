import type { DatePreset, DateRange } from "./types";

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function mondayOf(d: Date): Date {
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = copy.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + offset);
  return copy;
}

export function resolveDatePreset(preset: DatePreset, now = new Date()): DateRange {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (preset === "this_weekend") {
    const day = today.getUTCDay();
    const toSaturday = (6 - day + 7) % 7;
    const saturday = new Date(today);
    saturday.setUTCDate(today.getUTCDate() + toSaturday);
    const sunday = new Date(saturday);
    sunday.setUTCDate(saturday.getUTCDate() + 1);
    return {
      preset,
      start: isoDay(saturday),
      end: isoDay(sunday),
      label: "This weekend",
    };
  }

  const thisMonday = mondayOf(today);
  const nextMonday = new Date(thisMonday);
  nextMonday.setUTCDate(thisMonday.getUTCDate() + (preset === "in_two_weeks" ? 14 : 7));
  const nextSunday = new Date(nextMonday);
  nextSunday.setUTCDate(nextMonday.getUTCDate() + 6);

  return {
    preset,
    start: isoDay(nextMonday),
    end: isoDay(nextSunday),
    label: preset === "in_two_weeks" ? "In two weeks" : "Next week",
  };
}

export function formatDateRange(range: DateRange | null): string {
  if (!range) return "Dates unset";
  const start = new Date(`${range.start}T00:00:00Z`);
  const end = new Date(`${range.end}T00:00:00Z`);
  const fmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${range.label} · ${fmt.format(start)}–${fmt.format(end)}`;
}
