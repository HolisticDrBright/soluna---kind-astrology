/**
 * Solar Return — the "year ahead" chart. Once a year, on your birthday, the Sun
 * returns to the exact spot it held when you were born; the chart cast for that
 * moment is a traditional lens on the themes of the coming year. Unlike the natal
 * blueprint (fixed for life) and the Vedic timeline (fixed at birth), the solar
 * return chart is NEW EACH YEAR — so it's cached per (birth, return-year) and
 * refreshed when the year rolls over.
 *
 * Provider-backed (FreeAstroAPI /api/v1/western/solar/calculate). We NEVER
 * fabricate it — it degrades to "unavailable" on: no provider / provider failure
 * / no birth location / NO BIRTH TIME (a solar return hinges on the exact return
 * moment, so without a birth time its Ascendant and houses would be meaningless).
 */

import { coerceSign, withProviderRetry } from "./astrology-providers.ts";

const PROVIDER_TIMEOUT_MS = 12_000;

export interface SolarReturnInput {
  year: number;   // birth year
  month: number;  // birth month 1-12
  day: number;    // birth day
  hour: number | null;
  minute: number | null;
  city: string | null;
  timezone: string | null;
  timeKnown: boolean;
  lat?: number | null;
  lng?: number | null;
}

export type SolarReturnSource = "provider" | "unavailable";

export interface SolarReturnOutput {
  /** The birthday year this reading covers (the return year). */
  year: number;
  /** When the Sun returned (ISO), when the provider gives it. */
  returnDate: string | null;
  /** The solar-return Ascendant — the "rising sign of your year". */
  ascendantSign: string | null;
  /** The house the return Sun falls in — the life area this year emphasizes (1-12). */
  sunHouse: number | null;
  /** The return Moon's sign — the year's emotional weather. */
  moonSign: string | null;
  source: SolarReturnSource;
  provider?: string;
  missingInputs: string[];
  unavailableReason?: string;
  confidenceNotes: string[];
  /** Fingerprint of (birth inputs + return year) so the cache is per-year. */
  sourceInputHash: string;
}

// ── helpers ──
// deno-lint-ignore no-explicit-any
function pick(o: any, ...keys: string[]): unknown {
  if (!o || typeof o !== "object") return undefined;
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  return undefined;
}
function str(v: unknown): string {
  return v === undefined || v === null ? "" : String(v);
}
function numOrNull(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * The birthday year whose solar-return chart is currently in effect. If this
 * year's birthday has already passed, that's the active return year; otherwise
 * it's last year's. Pure — exported for tests.
 */
export function currentSolarYear(birthMonth: number, birthDay: number, todayISO: string): number {
  const [ty, tm, td] = todayISO.split("-").map(Number);
  const passed = tm > birthMonth || (tm === birthMonth && td >= birthDay);
  return passed ? ty : ty - 1;
}

export function solarReturnInputHash(input: SolarReturnInput, returnYear: number): string {
  const raw = `${input.year}|${input.month}|${input.day}|${input.hour ?? ""}|${input.minute ?? ""}|${input.city ?? ""}|${input.timezone ?? ""}|${input.lat ?? ""}|${input.lng ?? ""}|SR${returnYear}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) >>> 0;
  return `solar_${h.toString(16)}`;
}

/**
 * Pure normalizer for a FreeAstroAPI solar-return chart → SolarReturnOutput.
 * Tolerant of a few response shapes (planets array or map; ascendant nested or
 * flat). Throws when it can't find a usable Ascendant so the caller degrades
 * (a solar return without a rising sign isn't a meaningful year-ahead).
 * Exported for tests.
 */
// deno-lint-ignore no-explicit-any
export function normalizeSolarReturn(data: any, ctx: { hash: string; returnYear: number; missingInputs: string[]; provider?: string }): SolarReturnOutput {
  const chart = pick(data, "solar_return", "solarReturn", "chart", "data", "result") ?? data;

  // Ascendant — accept { ascendant: { sign } } | { ascendant: "Leo" } | { asc: {...} }.
  const ascRaw = pick(chart, "ascendant", "asc", "lagna", "rising");
  let ascendantSign: string | null = null;
  if (ascRaw && typeof ascRaw === "object") {
    const s = str(pick(ascRaw, "sign", "sign_name", "name"));
    const abs = numOrNull(pick(ascRaw, "absolute_degree", "abs_pos", "degree"));
    ascendantSign = s ? coerceSign(s, abs ?? 0) : (abs != null ? coerceSign(undefined, abs) : null);
  } else if (typeof ascRaw === "string" && ascRaw) {
    ascendantSign = coerceSign(ascRaw, 0);
  }
  if (!ascendantSign) throw new Error("solar-return: no ascendant in response");

  // Planets — array of { name, sign, house } or a map keyed by planet name.
  const planetsRaw = pick(chart, "planets", "bodies");
  const planetList: Record<string, unknown>[] = Array.isArray(planetsRaw)
    ? planetsRaw as Record<string, unknown>[]
    : (planetsRaw && typeof planetsRaw === "object"
      ? Object.entries(planetsRaw as Record<string, unknown>).map(([name, v]) => ({ name, ...(v && typeof v === "object" ? v : { value: v }) }))
      : []);
  const findPlanet = (want: string) =>
    planetList.find((p) => str(pick(p, "name", "planet", "id")).toLowerCase() === want);

  const sun = findPlanet("sun");
  const sunHouse = sun ? numOrNull(pick(sun, "house", "house_number", "houseNumber")) : null;
  const moon = findPlanet("moon");
  const moonSignRaw = moon ? str(pick(moon, "sign", "sign_name", "name")) : "";
  const moonAbs = moon ? numOrNull(pick(moon, "absolute_degree", "abs_pos")) : null;
  const moonSign = moonSignRaw ? coerceSign(moonSignRaw, moonAbs ?? 0) : null;

  const returnDate = str(pick(chart, "return_date", "returnDate", "datetime", "return_datetime", "date")) || null;

  return {
    year: ctx.returnYear,
    returnDate,
    ascendantSign,
    sunHouse: sunHouse != null && sunHouse >= 1 && sunHouse <= 12 ? sunHouse : null,
    moonSign,
    source: "provider",
    provider: ctx.provider ?? "freeastroapi",
    missingInputs: ctx.missingInputs,
    confidenceNotes: [
      "Your Solar Return chart is cast for the moment the Sun returns to its birth position this year — a traditional lens on the year's themes. Reflective, not fixed fate.",
    ],
    sourceInputHash: ctx.hash,
  };
}

function unavailableSolar(reason: string, hash: string, returnYear: number, note: string, missingInputs: string[] = []): SolarReturnOutput {
  return {
    year: returnYear,
    returnDate: null,
    ascendantSign: null,
    sunHouse: null,
    moonSign: null,
    source: "unavailable",
    missingInputs,
    confidenceNotes: [note],
    unavailableReason: reason,
    sourceInputHash: hash,
  };
}

export function solarReturnConfigured(): boolean {
  return !!(Deno.env.get("FREEASTRO_API") ?? Deno.env.get("BAZI_API_KEY") ?? Deno.env.get("FREEASTRO_API_KEY"));
}

/** Call the FreeAstroAPI solar-return endpoint. Throws on failure (caller degrades). */
async function fetchSolarReturn(input: SolarReturnInput, returnYear: number, ctx: { hash: string; missingInputs: string[] }): Promise<SolarReturnOutput> {
  const key = Deno.env.get("FREEASTRO_API") ?? Deno.env.get("BAZI_API_KEY") ?? Deno.env.get("FREEASTRO_API_KEY");
  if (!key) throw new Error("FreeAstroAPI key (FREEASTRO_API / BAZI_API_KEY) is not configured");
  const base = (Deno.env.get("FREEASTRO_ASTRO_BASE_URL") || "https://api.freeastroapi.com").replace(/\/$/, "");
  let endpoint = (Deno.env.get("SOLAR_RETURN_API_ENDPOINT") || "/api/v1/western/solar/calculate").trim();
  if (!endpoint.startsWith("/")) endpoint = `/${endpoint}`;
  const url = `${base}${endpoint}`;

  const tz = input.timezone || "AUTO";
  // Mirrors the FreeAstroAPI western "birth block" contract used by the personal
  // horoscope, plus the return year (and return location = birth location).
  const body: Record<string, unknown> = {
    birth: {
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hour ?? 12,
      minute: input.minute ?? 0,
      city: input.city,
      tz_str: tz,
    },
    year: returnYear,
    return_year: returnYear,
    tz_str: tz,
  };
  if (Number.isFinite(input.lat)) body.lat = input.lat;
  if (Number.isFinite(input.lng)) body.lng = input.lng;

  const resp = await withProviderRetry(() =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      body: JSON.stringify(body),
    })
  );
  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "");
    console.error(`solar-return provider ${resp.status} at ${url} :: ${errBody.slice(0, 300)}`);
    throw new Error(`solar-return provider ${resp.status} (${url})`);
  }
  return normalizeSolarReturn(await resp.json(), { hash: ctx.hash, returnYear, missingInputs: ctx.missingInputs });
}

/**
 * Compute (or reuse a cached) Solar Return for the currently-active return year.
 * `opts.cached` lets the caller skip the provider when the same year is already
 * on file (the chart only changes on the birthday).
 */
export async function computeSolarReturn(
  input: SolarReturnInput,
  opts?: { cached?: SolarReturnOutput | null; todayISO?: string },
): Promise<SolarReturnOutput> {
  const todayISO = opts?.todayISO ?? new Date().toISOString().split("T")[0];
  const returnYear = currentSolarYear(input.month, input.day, todayISO);
  const hash = solarReturnInputHash(input, returnYear);

  const cached = opts?.cached;
  if (cached && cached.source === "provider" && cached.sourceInputHash === hash) {
    return cached;
  }

  if (!solarReturnConfigured()) {
    return unavailableSolar("provider_not_configured", hash, returnYear,
      "Your year-ahead (Solar Return) reading unlocks when a provider is connected.");
  }

  const hasLocation = Number.isFinite(input.lat) && Number.isFinite(input.lng) || !!input.city;
  if (!hasLocation) {
    return unavailableSolar("missing_location", hash, returnYear,
      "A Solar Return needs a resolved birth place; add your birth city to unlock your year ahead.", ["birth_location"]);
  }
  if (!input.timeKnown) {
    return unavailableSolar("missing_birth_time", hash, returnYear,
      "A Solar Return hinges on the exact moment the Sun returns, so it needs your birth time. Add it to unlock your year ahead.", ["birth_time"]);
  }

  try {
    return await fetchSolarReturn(input, returnYear, { hash, missingInputs: [] });
  } catch (err) {
    console.error("Solar-return provider failed — returning unavailable (never fabricated):", err);
    return unavailableSolar("provider_unavailable", hash, returnYear,
      "We couldn't reach the provider just now, so your year-ahead reading is unavailable.");
  }
}

/** True when the reading carries real provider data. */
export function hasRealSolarReturn(s: SolarReturnOutput | null | undefined): boolean {
  return !!s && s.source === "provider" && !!s.ascendantSign;
}
