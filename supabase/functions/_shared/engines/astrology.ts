// AstrologyEngine — EngineAdapter pattern.
//   primary  = hosted ephemeris API (ASTROLOGY_API_BASE_URL/KEY)
//   fallback = circular-natal-horoscope-js (MIT, in-process, no network)
//
// We NEVER bundle the AGPL Swiss Ephemeris. The fallback is fully functional;
// the hosted adapter is an optional precision upgrade.
//
// Honesty: when birth time is unknown we still return planet signs (computed at
// local noon) but flag Ascendant/MC/houses as "needs birth time" and leave each
// planet's house null rather than guessing.

import pkg from "circular-natal-horoscope-js";
import type {
  AspectHit,
  AstrologyResult,
  BirthInput,
  HouseSystem,
  PlanetPosition,
  ZodiacSign,
} from "./types.ts";
import { unavailable } from "./types.ts";

// deno-lint-ignore no-explicit-any
const { Origin, Horoscope } = pkg as any;

const PLANETS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
];

const SIGNS: ZodiacSign[] = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function signFromLongitude(lon: number): ZodiacSign {
  return SIGNS[Math.floor(((lon % 360) + 360) % 360 / 30)];
}

function houseSystemKey(hs: HouseSystem): string {
  return hs === "whole-sign" ? "whole-sign" : hs === "porphyry" ? "porphyry" : "placidus";
}

// ─── fallback adapter (circular-natal-horoscope-js) ────────────────
function fallbackNatal(input: BirthInput): AstrologyResult {
  const [y, m, d] = input.date.split("-").map(Number);
  const timeKnown = !!input.time;
  let hour = 12, minute = 0;
  if (input.time) {
    const [hh, mm] = input.time.split(":").map(Number);
    hour = hh;
    minute = mm ?? 0;
  }
  const lat = input.lat ?? 0;
  const lng = input.lng ?? 0;
  const hasLocation = input.lat != null && input.lng != null;
  // Rising/MC/houses (and house placements) need BOTH an exact time AND a
  // location. Without them we never fake precision — we flag them instead.
  const canHouses = timeKnown && hasLocation;

  const origin = new Origin({
    year: y,
    month: m - 1, // library months are 0-indexed
    date: d,
    hour,
    minute,
    latitude: lat,
    longitude: lng,
  });
  const horoscope = new Horoscope({
    origin,
    houseSystem: houseSystemKey(input.houseSystem ?? "placidus"),
    zodiac: "tropical",
    aspectPoints: ["bodies"],
    aspectTypes: ["major"],
    language: "en",
  });

  // deno-lint-ignore no-explicit-any
  const bodies: any = horoscope.CelestialBodies;
  const planets: PlanetPosition[] = PLANETS.map((label) => {
    const b = bodies[label.toLowerCase()];
    const lon = b?.ChartPosition?.Ecliptic?.DecimalDegrees ?? 0;
    return {
      planet: label,
      sign: signFromLongitude(lon),
      longitude: round2(lon),
      degree: round2(((lon % 30) + 30) % 30),
      house: canHouses ? (b?.House?.id ?? null) : null,
      retrograde: !!b?.isRetrograde,
    };
  });

  const reason = !timeKnown && !hasLocation
    ? "needs your birth time and place to be accurate."
    : !timeKnown
    ? "needs your exact birth time to be accurate."
    : "needs your birth place (latitude & longitude) to be accurate.";
  let ascendant: AstrologyResult["ascendant"] = unavailable("Your Rising sign", reason);
  let midheaven: AstrologyResult["midheaven"] = unavailable("Your Midheaven", reason);
  let houses: AstrologyResult["houses"] = unavailable("Your house placements", reason);
  if (canHouses) {
    const ascLon = horoscope.Ascendant?.ChartPosition?.Ecliptic?.DecimalDegrees ?? 0;
    const mcLon = horoscope.Midheaven?.ChartPosition?.Ecliptic?.DecimalDegrees ?? 0;
    ascendant = { sign: signFromLongitude(ascLon), degree: round2(ascLon % 30) };
    midheaven = { sign: signFromLongitude(mcLon), degree: round2(mcLon % 30) };
    // deno-lint-ignore no-explicit-any
    houses = (horoscope.Houses ?? []).map((h: any) =>
      round2(h?.ChartPosition?.StartPosition?.Ecliptic?.DecimalDegrees ?? 0)
    );
  }

  // deno-lint-ignore no-explicit-any
  const rawAspects: any[] = horoscope.Aspects?.all ?? [];
  const aspects: AspectHit[] = rawAspects
    .filter((a) => isPlanet(a.point1Label) && isPlanet(a.point2Label))
    .map((a) => ({
      a: a.point1Label,
      b: a.point2Label,
      aspect: a.aspectKey,
      orb: round2(a.orb ?? 0),
    }));

  return {
    planets,
    ascendant,
    midheaven,
    houses,
    aspects,
    houseSystem: input.houseSystem ?? "placidus",
    timeKnown,
    locationKnown: hasLocation,
    source: "fallback",
    meta: {
      source: "verified_library",
      precision: canHouses ? "medium" : "low",
      userFacingNote: canHouses
        ? "Computed in-app from an open ephemeris library (Sun-sign accurate; for highest precision connect a hosted ephemeris API)."
        : "Planet signs are reliable, but Rising, Midheaven, and houses are unavailable until birth time and place are added.",
    },
  };
}

function isPlanet(label: string): boolean {
  return PLANETS.includes(label);
}

// ─── hosted adapter (optional precision upgrade) ───────────────────
// Expects the provider to return a normalized JSON body. Adapt the parsing to
// your chosen API (Astrologer / Prokerala / AstroAPI). Throws on any problem so
// computeAstrology() can fall back gracefully.
async function hostedNatal(input: BirthInput): Promise<AstrologyResult> {
  const base = Deno.env.get("ASTROLOGY_API_BASE_URL");
  const key = Deno.env.get("ASTROLOGY_API_KEY");
  if (!base) throw new Error("hosted astrology API not configured");

  const res = await fetch(`${base.replace(/\/$/, "")}/natal`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(key ? { authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({
      date: input.date,
      time: input.time,
      latitude: input.lat,
      longitude: input.lng,
      timezone: input.timezone,
      house_system: input.houseSystem ?? "placidus",
    }),
  });
  if (!res.ok) throw new Error(`hosted astrology API ${res.status}`);
  const data = await res.json();

  // Minimal validation; require at least planets[].
  if (!Array.isArray(data?.planets)) throw new Error("hosted astrology API: unexpected shape");
  const timeKnown = !!input.time;
  const hasLocation = input.lat != null && input.lng != null;
  // Even with a hosted API, angles + houses are only real with both time AND
  // place. We gate them rather than passing through whatever the API guessed.
  const canHouses = timeKnown && hasLocation;
  // deno-lint-ignore no-explicit-any
  const planets: PlanetPosition[] = data.planets.map((p: any) => {
    const lon = Number(p.longitude ?? 0);
    return {
      planet: cap(p.name ?? p.planet ?? ""),
      sign: (p.sign as ZodiacSign) ?? signFromLongitude(lon),
      longitude: round2(lon),
      degree: round2(((lon % 30) + 30) % 30),
      house: canHouses ? (p.house ?? null) : null,
      retrograde: !!p.retrograde,
    };
  });
  const reason = !timeKnown && !hasLocation
    ? "needs your birth time and place to be accurate."
    : !timeKnown
    ? "needs your exact birth time to be accurate."
    : "needs your birth place (latitude & longitude) to be accurate.";
  return {
    planets,
    ascendant: canHouses && data.ascendant
      ? { sign: data.ascendant.sign, degree: round2(Number(data.ascendant.degree ?? 0)) }
      : unavailable("Your Rising sign", reason),
    midheaven: canHouses && data.midheaven
      ? { sign: data.midheaven.sign, degree: round2(Number(data.midheaven.degree ?? 0)) }
      : unavailable("Your Midheaven", reason),
    houses: canHouses && Array.isArray(data.houses)
      ? data.houses
      : unavailable("Your house placements", reason),
    aspects: Array.isArray(data.aspects) ? data.aspects : [],
    houseSystem: input.houseSystem ?? "placidus",
    timeKnown,
    locationKnown: hasLocation,
    source: "api",
    meta: {
      source: "hosted_api",
      precision: canHouses ? "high" : "medium",
      userFacingNote: canHouses
        ? undefined
        : "Computed from a precise ephemeris, but Rising, Midheaven, and houses stay hidden until birth time and place are added.",
    },
  };
}

/**
 * Raw ecliptic longitudes for the 10 planets + North Node at a given moment.
 * Used by the Human Design engine (which needs precise longitudes, not signs).
 * Always uses the in-process ephemeris for determinism.
 */
export function celestialLongitudes(input: BirthInput): Record<string, number> {
  const [y, m, d] = input.date.split("-").map(Number);
  let hour = 12, minute = 0;
  if (input.time) {
    const [hh, mm] = input.time.split(":").map(Number);
    hour = hh;
    minute = mm ?? 0;
  }
  const origin = new Origin({
    year: y,
    month: m - 1,
    date: d,
    hour,
    minute,
    latitude: input.lat ?? 0,
    longitude: input.lng ?? 0,
  });
  const horoscope = new Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
    aspectPoints: [],
    aspectTypes: [],
    language: "en",
  });
  // deno-lint-ignore no-explicit-any
  const bodies: any = horoscope.CelestialBodies;
  // deno-lint-ignore no-explicit-any
  const points: any = horoscope.CelestialPoints;
  const out: Record<string, number> = {};
  for (const label of PLANETS) {
    out[label] = bodies[label.toLowerCase()]?.ChartPosition?.Ecliptic?.DecimalDegrees ?? 0;
  }
  out["NorthNode"] = points?.northnode?.ChartPosition?.Ecliptic?.DecimalDegrees ?? 0;
  return out;
}

/** Primary -> fallback adapter chain. */
export async function computeAstrology(input: BirthInput): Promise<AstrologyResult> {
  if (Deno.env.get("ASTROLOGY_API_BASE_URL")) {
    try {
      return await hostedNatal(input);
    } catch (_e) {
      // fall through to the in-process engine
    }
  }
  return fallbackNatal(input);
}

// ─── transits + moon phase (cosmic weather) ────────────────────────
export interface TransitSnapshot {
  date: string;
  planets: PlanetPosition[];
  moon: { phase: string; emoji: string; sign: ZodiacSign; illumination: number };
}

const MOON_PHASES: Array<[string, string]> = [
  ["New Moon", "🌑"], ["Waxing Crescent", "🌒"], ["First Quarter", "🌓"],
  ["Waxing Gibbous", "🌔"], ["Full Moon", "🌕"], ["Waning Gibbous", "🌖"],
  ["Last Quarter", "🌗"], ["Waning Crescent", "🌘"],
];

export function computeTransits(forDate: string): TransitSnapshot {
  // Positions at ~noon UTC (Greenwich); location barely affects planet
  // longitudes at sign granularity, which is all cosmic weather needs.
  const result = fallbackNatal({ date: forDate, time: "12:00", lat: 51.48, lng: 0 });
  const sun = result.planets.find((p) => p.planet === "Sun")!;
  const moon = result.planets.find((p) => p.planet === "Moon")!;
  const angle = (((moon.longitude - sun.longitude) % 360) + 360) % 360;
  const phaseIdx = Math.floor(((angle + 22.5) % 360) / 45);
  const [phase, emoji] = MOON_PHASES[phaseIdx];
  const illumination = round2((1 - Math.cos((angle * Math.PI) / 180)) / 2);
  return {
    date: forDate,
    planets: result.planets,
    moon: { phase, emoji, sign: moon.sign, illumination },
  };
}

/** Aspects between transiting planets and the natal chart. */
export function aspectsToNatal(
  natal: PlanetPosition[],
  transiting: PlanetPosition[],
): AspectHit[] {
  const ASPECTS: Array<[AspectHit["aspect"], number, number]> = [
    ["conjunction", 0, 6], ["sextile", 60, 4], ["square", 90, 6],
    ["trine", 120, 6], ["opposition", 180, 6],
  ];
  const hits: AspectHit[] = [];
  for (const t of transiting) {
    for (const n of natal) {
      let diff = Math.abs(t.longitude - n.longitude) % 360;
      if (diff > 180) diff = 360 - diff;
      for (const [name, angle, orb] of ASPECTS) {
        if (Math.abs(diff - angle) <= orb) {
          hits.push({ a: `t.${t.planet}`, b: `n.${n.planet}`, aspect: name, orb: round2(Math.abs(diff - angle)) });
        }
      }
    }
  }
  return hits;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}
