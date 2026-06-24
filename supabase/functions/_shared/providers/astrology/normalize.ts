// Pure normalization helpers shared by every astrology provider. Kept free of
// network/IO so they're fully unit-testable against representative payloads.

import type { AspectHit, ZodiacSign } from "../../engines/types.ts";
import type { NormalizedPlanet } from "./types.ts";

export const SIGNS: ZodiacSign[] = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const SIGN_SET = new Set(SIGNS);

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function signFromLongitude(lon: number): ZodiacSign {
  return SIGNS[Math.floor((((lon % 360) + 360) % 360) / 30)];
}

export function degreeInSign(lon: number): number {
  return round2(((lon % 30) + 30) % 30);
}

/** Accept a provider sign string if valid, else derive from longitude. */
export function coerceSign(raw: unknown, lon: number): ZodiacSign {
  if (typeof raw === "string") {
    const cap = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    if (SIGN_SET.has(cap as ZodiacSign)) return cap as ZodiacSign;
  }
  return signFromLongitude(lon);
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

// Canonical planet names we keep; providers vary in casing/aliases.
const PLANET_ALIASES: Record<string, string> = {
  sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", mars: "Mars",
  jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune",
  pluto: "Pluto", rahu: "NorthNode", ketu: "SouthNode",
  "north node": "NorthNode", "south node": "SouthNode", chiron: "Chiron",
};

export function canonicalPlanet(name: string): string {
  const key = (name ?? "").trim().toLowerCase();
  return PLANET_ALIASES[key] ?? capitalize(name ?? "");
}

const ASPECT_NAMES = new Set(["conjunction", "sextile", "square", "trine", "opposition"]);

/**
 * Normalize one provider planet record. `longitudeKeys`/`signKeys` let each
 * provider point at its own field names; we always recompute degree-in-sign.
 */
export function normalizePlanet(
  // deno-lint-ignore no-explicit-any
  raw: any,
  opts: { nameKeys?: string[]; lonKeys?: string[]; signKeys?: string[]; houseKeys?: string[] } = {},
): NormalizedPlanet | null {
  const name = pick(raw, opts.nameKeys ?? ["name", "planet"]);
  if (!name) return null;
  const lon = num(pick(raw, opts.lonKeys ?? ["longitude", "full_degree", "fullDegree", "norm_degree"]));
  const house = pick(raw, opts.houseKeys ?? ["house", "house_number", "houseNumber"]);
  return {
    planet: canonicalPlanet(String(name)),
    sign: coerceSign(pick(raw, opts.signKeys ?? ["sign", "zodiac"]), lon),
    longitude: round2(lon),
    degree: degreeInSign(lon),
    house: house == null ? null : Number(house),
    retrograde: !!(raw.is_retrograde ?? raw.isRetro ?? raw.retrograde ?? raw.retro),
  };
}

/** Normalize an aspect record into the app's AspectHit shape, or null. */
// deno-lint-ignore no-explicit-any
export function normalizeAspect(raw: any): AspectHit | null {
  const a = pick(raw, ["a", "point1", "aspecting_planet", "planet1", "from"]);
  const b = pick(raw, ["b", "point2", "aspected_planet", "planet2", "to"]);
  const aspectRaw = String(pick(raw, ["aspect", "type", "aspect_type"]) ?? "").toLowerCase();
  if (!a || !b || !ASPECT_NAMES.has(aspectRaw)) return null;
  return {
    a: canonicalPlanet(String(a)),
    b: canonicalPlanet(String(b)),
    aspect: aspectRaw as AspectHit["aspect"],
    orb: round2(num(pick(raw, ["orb", "orb_degree", "orbit"]))),
  };
}

// ── tiny helpers ──
// deno-lint-ignore no-explicit-any
function pick(obj: any, keys: string[]): unknown {
  if (!obj) return undefined;
  for (const k of keys) if (obj[k] != null) return obj[k];
  return undefined;
}
function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
