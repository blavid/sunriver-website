import type { CalendarSeason, SeasonRank } from "./content-types";

export const CALENDAR_SEASONS = ["winter", "spring", "summer", "fall"] as const;

type Ranked = { seasonRank?: SeasonRank };

/**
 * TV sort for one season. Lower `seasonRank` first.
 * A missing rank sorts after every ranked activity, then by source index.
 * The website does not call this.
 */
export function compareSeasonRank(
  season: CalendarSeason,
  a: Ranked,
  b: Ranked,
  indexA: number,
  indexB: number,
): number {
  const rankA = a.seasonRank?.[season];
  const rankB = b.seasonRank?.[season];
  if (rankA === undefined || rankB === undefined) {
    if (rankA === undefined && rankB === undefined) return indexA - indexB;
    return rankA === undefined ? 1 : -1;
  }
  if (rankA !== rankB) return rankA - rankB;
  return indexA - indexB;
}
