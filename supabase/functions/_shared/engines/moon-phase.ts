/**
 * MoonPhaseEngine — deterministic lunar phase from a calendar date.
 *
 * The Moon's phase is a real astronomical quantity that depends ONLY on the date
 * (it is the same for everyone on Earth on a given day), so computing it is not
 * fabrication — unlike a natal Moon SIGN, which needs an ephemeris and is left to
 * the provider. This is a standard synodic-month approximation, accurate to about
 * a day, which is plenty for naming the phase. Pure + offline-testable.
 */

export type MoonPhaseName =
  | "New Moon"
  | "Waxing Crescent"
  | "First Quarter"
  | "Waxing Gibbous"
  | "Full Moon"
  | "Waning Gibbous"
  | "Last Quarter"
  | "Waning Crescent";

export interface MoonPhaseOutput {
  phase: MoonPhaseName;
  /** Approximate illuminated fraction, 0 (new) … 1 (full). */
  illumination: number;
  /** Days since the last new moon (0 … ~29.53). */
  ageDays: number;
  /** Coarse bucket used to select a knowledge card. */
  bucket: "new" | "waxing" | "full" | "waning";
}

const SYNODIC_MONTH = 29.530588853; // mean length of a lunar cycle in days
// A known reference new moon: 2000-01-06 18:14 UTC.
const REF_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const MS_PER_DAY = 86_400_000;

/** Compute the Moon's phase for the given instant (date-only precision is fine). */
export function computeMoonPhase(date: Date): MoonPhaseOutput {
  const days = (date.getTime() - REF_NEW_MOON_MS) / MS_PER_DAY;
  let ageDays = days % SYNODIC_MONTH;
  if (ageDays < 0) ageDays += SYNODIC_MONTH;

  const frac = ageDays / SYNODIC_MONTH; // 0 (new) … 1 (next new)
  // Illuminated fraction follows a cosine from new (0) to full (1) and back.
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * frac)) / 2) * 100) / 100;

  // Eight named phases, each CENTERED on its key point (the +0.5 offset puts the
  // New/Full/Quarter moments at the middle of their phase, not the edge).
  const i = Math.floor(frac * 8 + 0.5) % 8;
  const phase: MoonPhaseName = (
    ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"] as const
  )[i];

  const bucket: MoonPhaseOutput["bucket"] =
    i === 0 ? "new" : i < 4 ? "waxing" : i === 4 ? "full" : "waning";

  return { phase, illumination, ageDays: Math.round(ageDays * 100) / 100, bucket };
}
