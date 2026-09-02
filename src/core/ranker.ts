import { CATALOG_DISCLAIMER, FLIGHTS, HOTELS } from "./catalog";
import type { ConstraintDelta, FrozenIntent, HotelOption, RankedPackage, TaskResult } from "./types";

const TRANSIT_LIMIT_MINUTES = 10;

function hotelScore(hotel: HotelOption, intent: FrozenIntent): number | null {
  if (hotel.nightlyUsd > intent.constraints.hotelMaxNightly) return null;
  if (intent.constraints.nearTransit && hotel.walkMinutesToStation > TRANSIT_LIMIT_MINUTES) {
    return null;
  }

  let score = 40;
  score += Math.max(0, 16 - hotel.walkMinutesToStation) * (intent.priority === "convenience" ? 3 : 2);
  score += Math.max(0, intent.constraints.hotelMaxNightly - hotel.nightlyUsd) / (intent.priority === "price" ? 6 : 12);
  if (intent.constraints.quietHotel) score += hotel.quietScore * 4;
  if (intent.priority === "balanced") {
    score += Math.max(0, 12 - Math.abs(intent.constraints.hotelMaxNightly - 25 - hotel.nightlyUsd) / 8);
  }
  return score;
}

function flightScore(flight: { window: string; priceUsd: number; stops: number }, intent: FrozenIntent): number {
  let score = 20;
  if (intent.constraints.preferredDeparture !== "any") {
    score += flight.window === intent.constraints.preferredDeparture ? 24 : -18;
  }
  score += intent.priority === "price" ? (500 - flight.priceUsd) / 8 : (500 - flight.priceUsd) / 18;
  score += flight.stops === 0 ? 10 : -12;
  return score;
}

export function searchTripOptions(intent: FrozenIntent) {
  const hotels = HOTELS.map((hotel) => ({ hotel, score: hotelScore(hotel, intent) }))
    .filter((row): row is { hotel: HotelOption; score: number } => row.score != null)
    .sort((a, b) => b.score - a.score);

  const flights = FLIGHTS.map((flight) => ({ flight, score: flightScore(flight, intent) })).sort(
    (a, b) => b.score - a.score,
  );

  return {
    source: "demo_catalog" as const,
    disclaimer: CATALOG_DISCLAIMER,
    hotels,
    flights,
    comparedCount: HOTELS.length,
  };
}

export function rankPackages(intent: FrozenIntent, delta?: ConstraintDelta): TaskResult {
  const searched = searchTripOptions(intent);
  const cheapestInBudget = [...HOTELS]
    .filter((hotel) => hotel.nightlyUsd <= intent.constraints.hotelMaxNightly)
    .sort((a, b) => a.nightlyUsd - b.nightlyUsd)[0];

  const packages: RankedPackage[] = [];
  for (const hotelRow of searched.hotels.slice(0, 6)) {
    for (const flightRow of searched.flights.slice(0, 4)) {
      packages.push({
        hotel: hotelRow.hotel,
        flight: flightRow.flight,
        score: hotelRow.score * 1.4 + flightRow.score,
        why: explain(hotelRow.hotel, flightRow.flight, intent),
      });
    }
  }

  packages.sort((a, b) => b.score - a.score);
  const best = packages[0];
  if (!best) {
    throw new Error("No packages survived the current constraints.");
  }

  const rejected =
    cheapestInBudget && cheapestInBudget.id !== best.hotel.id
      ? {
          hotel: cheapestInBudget,
          reason: rejectReason(cheapestInBudget, intent),
        }
      : null;

  return {
    taskId: "",
    comparedCount: HOTELS.length,
    catalogSource: "demo_catalog",
    catalogDisclaimer: CATALOG_DISCLAIMER,
    best,
    rejectedCheapest: rejected,
    alternatives: packages.slice(1, 4),
    usedIntent: intent,
    delta,
    explanation: narrative(best, rejected, intent, delta),
    completedAt: new Date().toISOString(),
  };
}

function explain(
  hotel: HotelOption,
  flight: { number: string; departLocal: string; window: string },
  intent: FrozenIntent,
): string {
  const transit = intent.constraints.nearTransit
    ? `${hotel.walkMinutesToStation} min from ${hotel.station}`
    : `${hotel.neighborhood}`;
  return `${hotel.name} at $${hotel.nightlyUsd}/night, ${transit}. Flight ${flight.number} departs ${flight.departLocal} (${flight.window}).`;
}

function rejectReason(hotel: HotelOption, intent: FrozenIntent): string {
  if (intent.constraints.nearTransit && hotel.walkMinutesToStation > TRANSIT_LIMIT_MINUTES) {
    return `I rejected the cheapest option (${hotel.name}, $${hotel.nightlyUsd}) because it was ${hotel.walkMinutesToStation} minutes from the nearest station.`;
  }
  if (intent.constraints.quietHotel && hotel.quietScore < 3) {
    return `I rejected ${hotel.name} because it is not quiet enough for the note you added.`;
  }
  return `I rejected ${hotel.name} because it scored worse on your ${intent.priority} priority.`;
}

function narrative(
  best: RankedPackage,
  rejected: TaskResult["rejectedCheapest"],
  intent: FrozenIntent,
  delta?: ConstraintDelta,
): string {
  const deltaLine = delta
    ? ` This ranking used your updated hotel budget of $${delta.to} (was $${delta.from}), keeping origin, destination, dates, transit, and flight preferences.`
    : "";
  const rejectLine = rejected ? ` ${rejected.reason}` : "";
  return `Best match is ${best.hotel.name} at $${best.hotel.nightlyUsd}/night, ${best.hotel.walkMinutesToStation} min from ${best.hotel.station}, with ${best.flight.number} departing ${best.flight.departLocal}. It is the strongest balance of your $${intent.constraints.hotelMaxNightly} budget${intent.constraints.nearTransit ? " and transit preference" : ""}.${deltaLine}${rejectLine}`;
}
