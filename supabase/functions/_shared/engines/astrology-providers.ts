/**
 * Real astrology provider adapters, selected by ASTROLOGY_PROVIDER.
 *   - "prokerala" → OAuth2 client-credentials, western natal chart
 *   - "custom"    → a JSON endpoint you control (ASTROLOGY_API_BASE_URL/natal-chart)
 *
 * These produce a normalized AstrologyOutput tagged `source: "provider"`. The
 * engine only calls them when real coordinates exist, and degrades honestly (to
 * the labeled in-app approximation) on any failure — never silent fake precision.
 *
 * Pure normalizers are exported for offline unit tests; the fetchers wrap them.
 */

import type { AstrologyInput, AstrologyOutput, Aspect, HouseCusp, PlanetPosition } from "./astrology.ts";

export type AstrologyProviderId = "prokerala" | "custom";

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];
const SIGN_SET = new Set(SIGNS);

/** Which provider is configured (explicit env wins, else auto-detect by creds). */
export function getConfiguredProvider(): AstrologyProviderId | null {
  const explicit = (Deno.env.get("ASTROLOGY_PROVIDER") ?? "").trim().toLowerCase();
  if (explicit === "prokerala" && prokeralaConfigured()) return "prokerala";
  if (explicit === "custom" && customConfigured()) return "custom";
  // Auto-detect when ASTROLOGY_PROVIDER is unset/blank.
  if (!explicit) {
    if (prokeralaConfigured()) return "prokerala";
    if (customConfigured()) return "custom";
  }
  return null;
}

function prokeralaConfigured(): boolean {
  return !!Deno.env.get("PROKERALA_CLIENT_ID") && !!Deno.env.get("PROKERALA_CLIENT_SECRET");
}
function customConfigured(): boolean {
  return !!Deno.env.get("ASTROLOGY_API_BASE_URL");
}

/** Dispatch to the configured provider. Throws on any failure (engine degrades). */
export async function fetchFromProvider(
  provider: AstrologyProviderId,
  input: AstrologyInput,
): Promise<AstrologyOutput> {
  if (provider === "prokerala") return await fetchProkerala(input);
  return await fetchCustom(input);
}

// ─── shared normalization helpers (pure) ───────────────────────────

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function coerceSign(raw: unknown, degree?: number): string {
  if (typeof raw === "string") {
    const cap = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    if (SIGN_SET.has(cap)) return cap;
  }
  if (typeof degree === "number" && Number.isFinite(degree)) {
    return SIGNS[Math.floor((((degree % 360) + 360) % 360) / 30)];
  }
  return "";
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const NORMALIZE_TIME_NOTE =
  "Your birth time is needed for your Rising sign, house placements, and Ascendant. " +
  "These are what make your chart truly personal. You can add it anytime in Settings.";

// ─── custom provider ───────────────────────────────────────────────

async function fetchCustom(input: AstrologyInput): Promise<AstrologyOutput> {
  const base = Deno.env.get("ASTROLOGY_API_BASE_URL")!;
  const key = Deno.env.get("ASTROLOGY_API_KEY");
  const resp = await fetch(`${base.replace(/\/$/, "")}/natal-chart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({
      date: input.date,
      time: input.time,
      lat: input.lat,
      lng: input.lng,
      timezone: input.timezone,
      house_system: input.houseSystem ?? "placidus",
    }),
  });
  if (!resp.ok) throw new Error(`custom astrology API ${resp.status}`);
  return normalizeCustom(await resp.json(), input.time === null);
}

/** Pure normalizer for the custom endpoint shape. Exported for tests. */
// deno-lint-ignore no-explicit-any
export function normalizeCustom(data: any, timeMissing: boolean): AstrologyOutput {
  const planets: PlanetPosition[] = ((data?.planets ?? []) as unknown[]).map((raw) => {
    const p = raw as Record<string, unknown>;
    const degree = num(p.degree);
    return {
      planet: String(p.name ?? p.planet ?? ""),
      sign: coerceSign(p.sign, degree),
      degree: round1(degree),
      house: timeMissing ? null : (p.house == null ? null : Number(p.house)),
      retrograde: !!p.retrograde,
    };
  }).filter((p) => p.planet);
  if (!planets.length) throw new Error("custom astrology API: no planets");

  const houses: HouseCusp[] = ((data?.houses ?? []) as unknown[]).map((raw, i) => {
    const h = raw as Record<string, unknown>;
    return { house: i + 1, sign: coerceSign(h.sign, num(h.degree)), degree: round1(num(h.degree)) };
  });
  const aspects: Aspect[] = ((data?.aspects ?? []) as unknown[]).map((raw) => {
    const a = raw as Record<string, unknown>;
    return {
      planetA: String(a.planetA ?? a.planet_a ?? ""),
      planetB: String(a.planetB ?? a.planet_b ?? ""),
      type: String(a.type ?? ""),
      orb: round1(num(a.orb)),
    };
  }).filter((a) => a.planetA && a.planetB && a.type);

  return {
    planets,
    ascendant: !timeMissing && data?.ascendant
      ? { sign: coerceSign(data.ascendant.sign, num(data.ascendant.degree)), degree: round1(num(data.ascendant.degree)) }
      : null,
    mc: !timeMissing && data?.mc
      ? { sign: coerceSign(data.mc.sign, num(data.mc.degree)), degree: round1(num(data.mc.degree)) }
      : null,
    houses: timeMissing ? [] : houses,
    aspects,
    timeRequired: timeMissing,
    timeMissingNote: timeMissing ? NORMALIZE_TIME_NOTE : undefined,
    source: "provider",
    provider: "custom",
  };
}

// ─── prokerala provider ────────────────────────────────────────────

let prokeralaToken: { value: string; expiresAt: number } | null = null;

async function prokeralaAccessToken(): Promise<string> {
  if (prokeralaToken && prokeralaToken.expiresAt > Date.now() + 30_000) return prokeralaToken.value;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: Deno.env.get("PROKERALA_CLIENT_ID")!,
    client_secret: Deno.env.get("PROKERALA_CLIENT_SECRET")!,
  });
  const resp = await fetch("https://api.prokerala.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!resp.ok) throw new Error(`prokerala token ${resp.status}`);
  const json = await resp.json();
  if (!json?.access_token) throw new Error("prokerala token: missing access_token");
  prokeralaToken = {
    value: json.access_token,
    expiresAt: Date.now() + num(json.expires_in ?? 3600) * 1000,
  };
  return prokeralaToken.value;
}

async function fetchProkerala(input: AstrologyInput): Promise<AstrologyOutput> {
  const token = await prokeralaAccessToken();
  const datetime = `${input.date}T${input.time ?? "12:00"}:00`;
  const params = new URLSearchParams({
    profile: "western",
    ayanamsa: "0", // tropical
    coordinates: `${input.lat},${input.lng}`,
    datetime,
    house_system: input.houseSystem ?? "placidus",
    la: "en",
  });
  const resp = await fetch(`https://api.prokerala.com/v2/astrology/western-chart-info?${params}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!resp.ok) throw new Error(`prokerala natal ${resp.status}`);
  return normalizeProkerala(await resp.json(), input.time === null);
}

/** Pure normalizer for a Prokerala western chart response. Exported for tests. */
// deno-lint-ignore no-explicit-any
export function normalizeProkerala(json: any, timeMissing: boolean): AstrologyOutput {
  const data = json?.data ?? json;
  const rawPlanets: unknown[] = data?.planet_positions ?? data?.planets ?? [];
  const planets: PlanetPosition[] = rawPlanets.map((raw) => {
    const p = raw as Record<string, unknown>;
    const degree = num(p.degree ?? p.longitude);
    return {
      planet: String(p.name ?? p.planet ?? ""),
      sign: coerceSign(p.sign ?? p.rasi, degree),
      degree: round1(((degree % 30) + 30) % 30),
      house: timeMissing ? null : (p.house == null ? null : Number(p.house)),
      retrograde: !!(p.is_retrograde ?? p.retrograde),
    };
  }).filter((p) => p.planet);
  if (!planets.length) throw new Error("prokerala: no planets in response");

  const asc = data?.ascendant ?? data?.angles?.ascendant;
  const mc = data?.midheaven ?? data?.mc ?? data?.angles?.midheaven;
  const houses: HouseCusp[] = ((data?.houses ?? data?.house_cusps ?? []) as unknown[]).map((raw, i) => {
    const h = raw as Record<string, unknown>;
    const deg = num(h.degree ?? h.longitude);
    return { house: i + 1, sign: coerceSign(h.sign, deg), degree: round1(((deg % 30) + 30) % 30) };
  });
  const aspects: Aspect[] = ((data?.aspects ?? []) as unknown[]).map((raw) => {
    const a = raw as Record<string, unknown>;
    return {
      planetA: String(a.planet_a ?? a.aspecting_planet ?? a.planetA ?? ""),
      planetB: String(a.planet_b ?? a.aspected_planet ?? a.planetB ?? ""),
      type: String(a.type ?? a.aspect ?? "").toLowerCase(),
      orb: round1(num(a.orb)),
    };
  }).filter((a) => a.planetA && a.planetB && a.type);

  return {
    planets,
    ascendant: !timeMissing && asc
      ? { sign: coerceSign(asc.sign, num(asc.degree ?? asc.longitude)), degree: round1(num(asc.degree ?? ((num(asc.longitude) % 30) + 30) % 30)) }
      : null,
    mc: !timeMissing && mc
      ? { sign: coerceSign(mc.sign, num(mc.degree ?? mc.longitude)), degree: round1(num(mc.degree ?? ((num(mc.longitude) % 30) + 30) % 30)) }
      : null,
    houses: timeMissing ? [] : houses,
    aspects,
    timeRequired: timeMissing,
    timeMissingNote: timeMissing ? NORMALIZE_TIME_NOTE : undefined,
    source: "provider",
    provider: "prokerala",
  };
}
