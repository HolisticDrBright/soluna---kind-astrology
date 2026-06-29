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

import type { AstrologyInput, AstrologyOutput, Aspect, HouseCusp, PlanetPosition, TransitAspect, TransitOutput } from "./astrology.ts";

export type AstrologyProviderId = "astrologyapi" | "prokerala" | "custom";

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];
const SIGN_SET = new Set(SIGNS);

/** Max time to wait on any astrology provider HTTP call before giving up and
 *  letting the engine degrade to a blocked chart. Without a timeout a hung or
 *  unreachable provider freezes the ENTIRE blueprint computation — and the
 *  onboarding "weaving" screen — until the platform kills the function. */
const PROVIDER_TIMEOUT_MS = 12_000;

/** Which provider is configured (explicit env wins, else auto-detect by creds). */
export function getConfiguredProvider(): AstrologyProviderId | null {
  const explicit = (Deno.env.get("ASTROLOGY_PROVIDER") ?? "").trim().toLowerCase();
  // Accept ASTROLOGY_API_PASSWORD as an alias for the key — Basic-Auth setups
  // are commonly stored as "user id + password", where the password IS the key.
  const hasAstrologyApiKey = !!(Deno.env.get("ASTROLOGY_API_KEY") ?? Deno.env.get("ASTROLOGY_API_PASSWORD"));
  if (explicit === "astrologyapi") return hasAstrologyApiKey ? "astrologyapi" : null;
  if (explicit === "prokerala") return prokeralaConfigured() ? "prokerala" : null;
  if (explicit === "custom") return customConfigured() ? "custom" : null;
  // Auto-detect when ASTROLOGY_PROVIDER is unset/blank.
  if (!explicit) {
    if (hasAstrologyApiKey && astrologyApiAutoDetect()) return "astrologyapi";
    if (prokeralaConfigured()) return "prokerala";
    if (customConfigured()) return "custom";
  }
  return null;
}

// Auto-detect astrologyapi only when the base URL is unset or its own host, so a
// "custom" endpoint that also uses ASTROLOGY_API_KEY isn't mis-routed.
function astrologyApiAutoDetect(): boolean {
  const base = (Deno.env.get("ASTROLOGY_API_BASE_URL") ?? "").toLowerCase();
  return base === "" || base.includes("astrologyapi.com");
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
  if (provider === "astrologyapi") return await fetchAstrologyApi(input);
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

// ─── astrologyapi.com provider (the production astrology source) ─────

/**
 * UTC offset (hours, east-positive) of an IANA timezone at a given local
 * wall-clock time — what AstrologyAPI's `tzone` field expects (e.g. 5.5 for IST).
 * Real timezone math via Intl; no hardcoded tables. Exported for tests.
 */
export function tzOffsetHours(timeZone: string, y: number, mo: number, d: number, h: number, mi: number): number {
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi, 0);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(new Date(utcGuess))) parts[p.type] = p.value;
  let hh = Number(parts.hour);
  if (hh === 24) hh = 0;
  const asZone = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), hh, Number(parts.minute), Number(parts.second));
  return Math.round(((asZone - utcGuess) / 3_600_000) * 100) / 100;
}

async function fetchAstrologyApi(input: AstrologyInput): Promise<AstrologyOutput> {
  const key = Deno.env.get("ASTROLOGY_API_KEY") ?? Deno.env.get("ASTROLOGY_API_PASSWORD");
  if (!key) throw new Error("ASTROLOGY_API_KEY is not configured");
  const base = (Deno.env.get("ASTROLOGY_API_BASE_URL") || "https://json.astrologyapi.com").replace(/\/$/, "");
  const userId = Deno.env.get("ASTROLOGY_API_USER_ID");

  const [y, mo, d] = input.date.split("-").map(Number);
  const timeMissing = input.time === null;
  const [h, mi] = (input.time ?? "12:00").split(":").map(Number);
  const tzone = tzOffsetHours(input.timezone, y, mo, d, h, mi);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-astrologyapi-key": key,
  };
  // Some AstrologyAPI plans authenticate with userId + apiKey over HTTP Basic.
  if (userId) headers["Authorization"] = `Basic ${btoa(`${userId}:${key}`)}`;

  const resp = await fetch(`${base}/v1/western_horoscope`, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    body: JSON.stringify({
      day: d,
      month: mo,
      year: y,
      hour: h,
      min: mi,
      lat: input.lat,
      lon: input.lng,
      tzone,
      house_type: input.houseSystem ?? "placidus",
      is_asteroids: "false",
    }),
  });
  if (!resp.ok) throw new Error(`astrologyapi western_horoscope ${resp.status}`);
  return normalizeAstrologyApi(await resp.json(), timeMissing);
}

/** Pure normalizer for AstrologyAPI's western_horoscope response. Exported for tests. */
// deno-lint-ignore no-explicit-any
export function normalizeAstrologyApi(data: any, timeMissing: boolean): AstrologyOutput {
  const planets: PlanetPosition[] = ((data?.planets ?? []) as unknown[]).map((raw) => {
    const p = raw as Record<string, unknown>;
    const full = num(p.full_degree ?? p.fullDegree);
    const hasNorm = p.norm_degree != null || p.normDegree != null;
    const degInSign = hasNorm ? num(p.norm_degree ?? p.normDegree) : ((full % 30) + 30) % 30;
    return {
      planet: String(p.name ?? ""),
      sign: coerceSign(p.sign, full),
      degree: round1(degInSign),
      house: timeMissing ? null : (p.house == null ? null : Number(p.house)),
      retrograde: p.is_retro === true || p.is_retro === "true",
    };
  }).filter((p) => p.planet);
  if (!planets.length) throw new Error("astrologyapi: no planets in response");

  const hasAsc = data?.ascendant != null;
  const mcRaw = data?.midheaven ?? data?.mc;
  const hasMc = mcRaw != null;
  const ascNum = hasAsc
    ? (typeof data.ascendant === "number" ? data.ascendant : num((data.ascendant as Record<string, unknown>).degree ?? (data.ascendant as Record<string, unknown>).full_degree))
    : 0;
  const mcNum = hasMc
    ? (typeof mcRaw === "number" ? mcRaw : num((mcRaw as Record<string, unknown>).degree ?? (mcRaw as Record<string, unknown>).full_degree))
    : 0;

  const houses: HouseCusp[] = ((data?.houses ?? []) as unknown[]).map((raw, i) => {
    const h = raw as Record<string, unknown>;
    const full = num(h.degree ?? h.full_degree);
    const id = h.house_id != null ? Number(h.house_id) : i + 1;
    return { house: id, sign: coerceSign(h.sign, full), degree: round1(((full % 30) + 30) % 30) };
  });

  const aspects: Aspect[] = ((data?.aspects ?? []) as unknown[]).map((raw) => {
    const a = raw as Record<string, unknown>;
    return {
      planetA: String(a.aspecting_planet ?? a.planet_a ?? a.planetA ?? ""),
      planetB: String(a.aspected_planet ?? a.planet_b ?? a.planetB ?? ""),
      type: String(a.type ?? a.aspect ?? "").toLowerCase(),
      orb: round1(num(a.orb)),
    };
  }).filter((a) => a.planetA && a.planetB && a.type);

  return {
    planets,
    ascendant: !timeMissing && hasAsc
      ? { sign: coerceSign(undefined, ascNum), degree: round1(((ascNum % 30) + 30) % 30) }
      : null,
    mc: !timeMissing && hasMc
      ? { sign: coerceSign(undefined, mcNum), degree: round1(((mcNum % 30) + 30) % 30) }
      : null,
    houses: timeMissing ? [] : houses,
    aspects,
    timeRequired: timeMissing,
    timeMissingNote: timeMissing ? NORMALIZE_TIME_NOTE : undefined,
    source: "provider",
    provider: "astrologyapi",
  };
}

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
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
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
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
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
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
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

// ─── Transits (current sky → natal) — capability-gated, never fabricated ─────
//
// Soluna's only ALWAYS-real transit is the Moon phase (computed deterministically
// from the date; see engines/moon-phase.ts). Full transit-to-natal data (planet
// transits, transit aspects, mercury retrograde) requires a provider endpoint
// that not every AstrologyAPI plan includes, so it is OFF by default and must be
// explicitly enabled once the maintainer confirms their plan supports it. We do
// NOT guess transit positions — when disabled, the app simply uses Moon phase.

export interface TransitCapability {
  enabled: boolean;
  reason: string;
}

/**
 * Whether real transit-to-natal data can be fetched. Requires BOTH a configured
 * provider AND an explicit opt-in (ASTROLOGY_TRANSITS_ENABLED=true) plus the
 * exact endpoint the plan exposes (ASTROLOGY_TRANSITS_ENDPOINT). Honest by
 * default: returns disabled with a reason instead of pretending.
 */
export function getTransitCapability(): TransitCapability {
  const provider = getConfiguredProvider();
  if (!provider) return { enabled: false, reason: "No astrology provider is configured." };
  const optedIn = (Deno.env.get("ASTROLOGY_TRANSITS_ENABLED") ?? "").toLowerCase() === "true";
  if (!optedIn) {
    return {
      enabled: false,
      reason: "Transit-to-natal endpoints are off. Set ASTROLOGY_TRANSITS_ENABLED=true once your plan's transit endpoint is confirmed; until then only the deterministic Moon phase is used.",
    };
  }
  if (!Deno.env.get("ASTROLOGY_TRANSITS_ENDPOINT")) {
    return { enabled: false, reason: "ASTROLOGY_TRANSITS_ENABLED is set but ASTROLOGY_TRANSITS_ENDPOINT (the plan's transit path) is missing." };
  }
  return { enabled: true, reason: "Transit endpoint configured." };
}

/**
 * Pure normalizer for a transit response into TransitOutput. Exported for tests.
 * Accepts a generic shape ({ transit_relation | aspects: [...] }) so it can be
 * pointed at whatever transit endpoint a plan provides without code changes.
 */
// deno-lint-ignore no-explicit-any
export function normalizeTransits(data: any, asOf: string, provider = "astrologyapi"): TransitOutput {
  const rawAspects: unknown[] = data?.transit_relation ?? data?.aspects ?? data?.transits ?? [];
  const aspects: TransitAspect[] = rawAspects.map((raw) => {
    const a = raw as Record<string, unknown>;
    return {
      transitingPlanet: String(a.transit_planet ?? a.transiting_planet ?? a.aspecting_planet ?? a.planet_a ?? ""),
      natalPlanet: String(a.natal_planet ?? a.aspected_planet ?? a.planet_b ?? ""),
      type: String(a.type ?? a.aspect ?? "").toLowerCase(),
      orb: round1(num(a.orb)),
    };
  }).filter((a) => a.transitingPlanet && a.natalPlanet && a.type);

  return {
    asOf,
    mercuryRetrograde: data?.mercury_retrograde === true || data?.mercury_retrograde === "true" || undefined,
    moonSign: data?.moon_sign ? coerceSign(data.moon_sign) : undefined,
    aspects,
    source: "provider",
    provider,
  };
}

/**
 * Fetch current transits — ONLY when getTransitCapability().enabled. Throws
 * otherwise (callers fall back to Moon-phase-only). The endpoint path comes from
 * ASTROLOGY_TRANSITS_ENDPOINT so the maintainer points it at their plan's route.
 */
export async function fetchCurrentTransits(input: AstrologyInput, asOf: string): Promise<TransitOutput> {
  const cap = getTransitCapability();
  if (!cap.enabled) throw new Error(`transits disabled: ${cap.reason}`);

  const key = Deno.env.get("ASTROLOGY_API_KEY");
  if (!key) throw new Error("ASTROLOGY_API_KEY is not configured");
  const base = (Deno.env.get("ASTROLOGY_API_BASE_URL") || "https://json.astrologyapi.com").replace(/\/$/, "");
  const endpoint = Deno.env.get("ASTROLOGY_TRANSITS_ENDPOINT")!.replace(/^\//, "");
  const userId = Deno.env.get("ASTROLOGY_API_USER_ID");

  const [y, mo, d] = input.date.split("-").map(Number);
  const [h, mi] = (input.time ?? "12:00").split(":").map(Number);
  const tzone = tzOffsetHours(input.timezone, y, mo, d, h, mi);

  const headers: Record<string, string> = { "Content-Type": "application/json", "x-astrologyapi-key": key };
  if (userId) headers["Authorization"] = `Basic ${btoa(`${userId}:${key}`)}`;

  const resp = await fetch(`${base}/${endpoint}`, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    body: JSON.stringify({ day: d, month: mo, year: y, hour: h, min: mi, lat: input.lat, lon: input.lng, tzone }),
  });
  if (!resp.ok) throw new Error(`astrology transits ${resp.status}`);
  return normalizeTransits(await resp.json(), asOf);
}
