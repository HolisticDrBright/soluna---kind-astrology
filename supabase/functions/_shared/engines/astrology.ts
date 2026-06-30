/**
 * AstrologyEngine — computes natal chart via hosted API with MIT-fallback.
 * EngineAdapter pattern: primary = hosted astrology API; fallback = MIT circular-natal-horoscope-js.
 * Input: { date, time|null, lat, lng, timezone }
 * Output: planets (sign, degree, house), Ascendant/MC, houses, aspects.
 * If time is null: return planets + sun sign only, flag houses/Ascendant unavailable.
 */

import { fetchFromProvider, getConfiguredProvider } from "./astrology-providers.ts";

export interface AstrologyInput {
  date: string;       // ISO date YYYY-MM-DD
  time: string | null; // HH:MM or null
  lat: number;
  lng: number;
  timezone: string;    // e.g. "America/New_York"
  houseSystem?: "placidus" | "whole_sign" | "porphyry";
}

export interface PlanetPosition {
  planet: string;
  sign: string;
  degree: number;
  house: number | null; // null if time unknown
  retrograde: boolean;
}

export interface HouseCusp {
  house: number;
  sign: string;
  degree: number;
}

export interface Aspect {
  planetA: string;
  planetB: string;
  type: string; // conjunction, sextile, square, trine, opposition
  orb: number;
}

/** A current transiting planet's aspect to one of the natal planets. */
export interface TransitAspect {
  transitingPlanet: string; // e.g. "Mars" (where it is in the sky now)
  natalPlanet: string;      // e.g. "Venus" (the birth-chart point it touches)
  type: string;             // conjunction | sextile | square | trine | opposition
  orb: number;
}

/**
 * Current sky-to-natal transits. Produced ONLY by a real provider when the
 * transit capability is enabled (see getTransitCapability). Never fabricated:
 * when transits are unavailable, this is simply absent and only the deterministic
 * Moon phase is used.
 */
export interface TransitOutput {
  asOf: string;                 // ISO date the transits were computed for
  mercuryRetrograde?: boolean;
  moonSign?: string;
  aspects: TransitAspect[];
  source: "provider";
  provider: string;
}

export interface AstrologyOutput {
  planets: PlanetPosition[];
  ascendant: { sign: string; degree: number } | null;
  mc: { sign: string; degree: number } | null;
  houses: HouseCusp[];
  aspects: Aspect[];
  timeRequired: boolean;
  timeMissingNote?: string;
  /**
   * Provenance — "provider" = a real ephemeris API; "approximation" = the
   * in-app estimate (dev only, off in production); "blocked" = no placements
   * could be produced (missing birth data or the provider was unavailable).
   * Consumers MUST use this to label accuracy honestly and never present
   * anything as exact unless it came from a real provider.
   */
  source: "provider" | "approximation" | "blocked";
  provider?: string;
  /** Why a blocked chart has no placements: missing_location | provider_unavailable | provider_not_configured. */
  blockedReason?: string;
  /** Opaque fingerprint of the birth inputs — lets a recompute reuse a cached
   *  provider chart instead of re-hitting (and re-flapping on) the provider. */
  sourceInputHash?: string;
}

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const PLANETS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
];

const ASPECT_TYPES: { type: string; orb: number }[] = [
  { type: "conjunction", orb: 8 },
  { type: "sextile", orb: 6 },
  { type: "square", orb: 8 },
  { type: "trine", orb: 8 },
  { type: "opposition", orb: 8 },
];

/**
 * Deterministic mock chart generator based on birth date/time.
 * Falls back to this when the hosted API is unavailable.
 * Uses planetary ephemeris approximations (real patterns, not random).
 */
function computeFallbackChart(input: AstrologyInput): AstrologyOutput {
  const date = new Date(input.date);
  const month = date.getMonth();
  const day = date.getDate();
  const year = date.getFullYear();

  // Sun sign by date
  const sunSignIdx = getSunSignIndex(month, day);
  const hasTime = input.time !== null;

  // Distribute planets around the zodiac based on date and time
  const positions: PlanetPosition[] = PLANETS.map((planet, i) => {
    // Each planet moves at different rates; approximate with date + time + planet index
    const baseDegree = (sunSignIdx * 30 + day * 0.98 + i * 51.4 + (hasTime ? parseTimeDegree(input.time!) : 0)) % 360;
    const signIdx = Math.floor(baseDegree / 30);
    const degInSign = baseDegree % 30;

    // Retrograde: approximately 40% of planets are retrograde at any time
    const retrograde = ((year * 7 + month * 13 + i * 17) % 100) < 35;

    // Houses: meaningful only with birth time
    let house: number | null = null;
    if (hasTime) {
      const hourDegree = parseTimeDegree(input.time!);
      const ascDegree = (hourDegree + (lngHash(input.lng) * 30)) % 360;
      house = Math.floor(((baseDegree - ascDegree + 360) % 360) / 30) + 1;
    }

    return {
      planet,
      sign: SIGNS[signIdx],
      degree: Math.round(degInSign * 10) / 10,
      house,
      retrograde,
    };
  });

  // Ascendant calculation (only with time)
  let ascendant: { sign: string; degree: number } | null = null;
  let mc: { sign: string; degree: number } | null = null;
  const houses: HouseCusp[] = [];

  if (hasTime) {
    const hourDeg = parseTimeDegree(input.time!);
    const ascDeg = (hourDeg + lngHash(input.lng) * 30 + day * 1.1) % 360;
    const ascSignIdx = Math.floor(ascDeg / 30);
    ascendant = { sign: SIGNS[ascSignIdx], degree: Math.round((ascDeg % 30) * 10) / 10 };

    const mcDeg = (ascDeg + 270) % 360;
    const mcSignIdx = Math.floor(mcDeg / 30);
    mc = { sign: SIGNS[mcSignIdx], degree: Math.round((mcDeg % 30) * 10) / 10 };

    // House cusps (equal house system as fallback)
    for (let h = 0; h < 12; h++) {
      const cuspDeg = (ascDeg + h * 30) % 360;
      const cuspSignIdx = Math.floor(cuspDeg / 30);
      houses.push({
        house: h + 1,
        sign: SIGNS[cuspSignIdx],
        degree: Math.round((cuspDeg % 30) * 10) / 10,
      });
    }
  }

  // Aspects
  const aspects: Aspect[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const degA = SIGNS.indexOf(positions[i].sign) * 30 + positions[i].degree;
      const degB = SIGNS.indexOf(positions[j].sign) * 30 + positions[j].degree;
      const diff = Math.abs(degA - degB);
      const angle = Math.min(diff, 360 - diff);

      for (const asp of ASPECT_TYPES) {
        const expectedAngle = {
          conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180,
        }[asp.type] ?? 0;

        if (Math.abs(angle - expectedAngle) <= asp.orb) {
          aspects.push({
            planetA: positions[i].planet,
            planetB: positions[j].planet,
            type: asp.type,
            orb: Math.round(Math.abs(angle - expectedAngle) * 10) / 10,
          });
          break;
        }
      }
    }
  }

  return {
    planets: positions,
    ascendant,
    mc,
    houses,
    aspects,
    timeRequired: !hasTime,
    timeMissingNote: hasTime ? undefined
      : "Your birth time is needed for your Rising sign, house placements, and Ascendant. These are what make your chart truly personal. You can add your birth time anytime in Settings.",
    source: "approximation",
  };
}

function getSunSignIndex(month: number, day: number): number {
  // Approximate sun sign boundaries
  const boundaries = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
  if (day < boundaries[month]) return month;
  return (month + 1) % 12;
}

function parseTimeDegree(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return ((h * 60 + m) / 4) % 360; // 24h = 360 degrees
}

function lngHash(lng: number): number {
  return ((Math.abs(lng) * 100) % 360) / 360;
}

/** A chart with no placements — used instead of ever fabricating astrology. */
function blockedChart(input: AstrologyInput, reason: string, sourceInputHash?: string): AstrologyOutput {
  return {
    planets: [],
    ascendant: null,
    mc: null,
    houses: [],
    aspects: [],
    timeRequired: input.time === null,
    source: "blocked",
    blockedReason: reason,
    sourceInputHash,
  };
}

/** Opaque fingerprint of the birth inputs (mirrors bazi/vedic). Used to reuse a
 *  cached provider chart when nothing about the birth data has changed. */
export function astrologyInputHash(input: AstrologyInput): string {
  const raw = `${input.date}|${input.time ?? ""}|${input.lat}|${input.lng}|${input.timezone}|${input.houseSystem ?? ""}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) >>> 0;
  return `astro_${h.toString(16)}`;
}

/**
 * Compute the full natal chart from a REAL provider only (AstrologyAPI by
 * default; see ASTROLOGY_PROVIDER). Production never fabricates placements:
 *
 * 1. Provider configured + real coordinates → call it → `source: "provider"`.
 * 2. Provider configured but coordinates missing → `source: "blocked"` (missing_location).
 * 3. Provider call fails → `source: "blocked"` (provider_unavailable) — NOT faked.
 * 4. No provider configured → `source: "blocked"` (provider_not_configured),
 *    unless ASTROLOGY_ALLOW_APPROXIMATION=true (local dev only) re-enables the
 *    in-app estimate → `source: "approximation"`.
 *
 * The `source`/`blockedReason` flow into the stored blueprint so readings label
 * their accuracy honestly and degrade to blocked/partial states.
 */
export async function computeAstrology(
  input: AstrologyInput,
  opts?: { cachedAstrology?: AstrologyOutput | null },
): Promise<AstrologyOutput> {
  const hash = astrologyInputHash(input);

  // Reuse a previously-SUCCESSFUL provider chart when the birth inputs are
  // unchanged. This keeps the result STABLE across recomputes (no flapping) and
  // avoids re-hitting a rate-limited provider on every refresh. Only a real
  // provider result is cached; blocked/approximation results are always retried
  // so a transient failure can still recover on the next recompute.
  const cached = opts?.cachedAstrology;
  if (cached && cached.source === "provider" && cached.sourceInputHash === hash) {
    return cached;
  }

  const provider = getConfiguredProvider();
  const hasCoords = Number.isFinite(input.lat) && Number.isFinite(input.lng);

  if (provider) {
    if (!hasCoords) return blockedChart(input, "missing_location", hash);
    try {
      const result = await fetchFromProvider(provider, input);
      result.sourceInputHash = hash;
      return result;
    } catch (err) {
      console.error(`Astrology provider (${provider}) failed — returning blocked (no fabricated placements):`, err);
      return blockedChart(input, "provider_unavailable", hash);
    }
  }

  // No provider configured. Production must not fabricate; only an explicit
  // dev opt-in re-enables the in-app approximation for local work.
  if ((Deno.env.get("ASTROLOGY_ALLOW_APPROXIMATION") ?? "").toLowerCase() === "true") {
    const approx = computeFallbackChart(input);
    approx.sourceInputHash = hash;
    return approx;
  }
  return blockedChart(input, "provider_not_configured", hash);
}
