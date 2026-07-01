/**
 * Vedic (sidereal / Jyotish) astrology engine — a DISTINCT lens from the Western
 * tropical chart. Provider-backed (FreeAstroAPI, sidereal endpoint), so we NEVER
 * fabricate it:
 *   - no provider configured  → source "unavailable" (provider_not_configured)
 *   - provider call fails      → source "unavailable" (provider_unavailable)
 *   - no birth location        → source "unavailable" (missing_location)
 *   - birth time missing        → partial: no ascendant/houses (never invented)
 *
 * This is sidereal (Lahiri ayanamsha) — its signs are intentionally different from
 * the Western chart. Its distinctive depth is the nakshatras (lunar mansions),
 * Rahu/Ketu (the lunar nodes), and the Saturn cycle (Sade Sati). Kept on the
 * blueprint and cached by an input fingerprint so the provider isn't paid twice.
 */

import { coerceSign, withProviderRetry } from "./astrology-providers.ts";
import type { DashaOutput } from "./vedic-dasha.ts";

const PROVIDER_TIMEOUT_MS = 12_000;

export interface VedicInput {
  date: string;             // YYYY-MM-DD
  time: string | null;      // HH:MM or null
  lat?: number | null;
  lng?: number | null;
  timezone?: string | null; // IANA; never default to UTC
}

export interface VedicPlanet {
  planet: string;
  sign: string;
  /** Degree within the sign (0–30). */
  degree: number;
  house: number | null;     // null when birth time is missing
  retrograde: boolean;
  /** Nakshatra (lunar mansion), e.g. "Ardra". */
  nakshatra?: string;
  /** Ruling planet of the nakshatra, e.g. "Rahu". */
  nakshatraLord?: string;
  /** Quarter of the nakshatra (1–4). */
  pada?: number;
}

export type VedicSource = "provider" | "unavailable";

export interface VedicOutput {
  ascendant: { sign: string; degree: number; nakshatra?: string; nakshatraLord?: string } | null;
  planets: VedicPlanet[];
  houses: { house: number; sign: string }[];
  /** The Moon's nakshatra — the heart of a Vedic reading. */
  moonNakshatra?: string;
  /** Saturn's 7.5-year cycle relative to the natal Moon, when the provider returns it. */
  sadeSati?: { active: boolean; phase: string | null; note: string } | null;
  /** Vimshottari Dasha timeline (planetary periods). Fixed at birth; nested here
   *  so it persists with the chart and needs no new column. See ./vedic-dasha.ts. */
  dasha?: DashaOutput;
  /** Ayanamsha used (e.g. "lahiri"). */
  ayanamsha?: string;
  source: VedicSource;
  provider?: string;
  partial: boolean;
  missingInputs: string[];
  unavailableReason?: string;
  confidenceNotes: string[];
  sourceInputHash: string;
}

export interface VedicFetchCtx {
  hash: string;
  missingInputs: string[];
  hasTime: boolean;
  provider?: string;
}

// ── input fingerprint (opaque; used only to detect "same birth data") ──
export function vedicInputHash(input: VedicInput): string {
  const raw = `${input.date}|${input.time ?? ""}|${input.lat ?? ""}|${input.lng ?? ""}|${input.timezone ?? ""}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) >>> 0;
  return `vedic_${h.toString(16)}`;
}

// ── small helpers ──
// deno-lint-ignore no-explicit-any
function pick(o: any, ...keys: string[]): unknown {
  if (!o || typeof o !== "object") return undefined;
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  return undefined;
}
function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
/** Prefer a full sign-name string (sign / sign_id), else derive from the absolute degree. */
// deno-lint-ignore no-explicit-any
function vedicSign(o: any, abs: number): string {
  const signStr = (typeof o?.sign_id === "string" ? o.sign_id : undefined) ?? (typeof o?.sign === "string" ? o.sign : undefined);
  return coerceSign(signStr, abs);
}
// deno-lint-ignore no-explicit-any
function nakName(v: any): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v || undefined;
  return (str(pick(v, "name")) || undefined);
}
function str(v: unknown): string {
  return v === undefined || v === null ? "" : String(v);
}

function unavailableVedic(reason: string, hash: string, note: string, missingInputs: string[] = []): VedicOutput {
  return {
    ascendant: null,
    planets: [],
    houses: [],
    source: "unavailable",
    partial: false,
    missingInputs,
    confidenceNotes: [note],
    unavailableReason: reason,
    sourceInputHash: hash,
  };
}

/**
 * Pure normalizer for a FreeAstroAPI sidereal/Vedic chart → VedicOutput. Exported
 * for tests. Throws when the response has no usable planets so the caller degrades.
 */
// deno-lint-ignore no-explicit-any
export function normalizeVedic(data: any, ctx: VedicFetchCtx): VedicOutput {
  const timeMissing = !ctx.hasTime;
  const rawPlanets: unknown[] = data?.planets ?? [];
  const planets: VedicPlanet[] = rawPlanets.map((raw) => {
    const p = raw as Record<string, unknown>;
    const abs = num(p.absolute_degree ?? p.abs_pos);
    const degInSign = p.degree_in_sign ?? p.pos ?? p.degree;
    const degree = degInSign != null ? num(degInSign) : (((abs % 30) + 30) % 30);
    return {
      planet: str(p.name ?? p.id),
      sign: vedicSign(p, abs),
      degree: round1(((degree % 30) + 30) % 30),
      house: timeMissing ? null : (p.house == null ? null : Number(p.house)),
      retrograde: p.is_retrograde === true || p.retrograde === true,
      nakshatra: nakName(p.nakshatra),
      nakshatraLord: (str(pick(p, "nakshatra_lord", "nakshatraLord")) || undefined),
      pada: p.pada == null ? undefined : Number(p.pada),
    };
  }).filter((p) => p.planet);
  if (!planets.length) throw new Error("vedic: no planets in response");

  const ascRaw = data?.ascendant as Record<string, unknown> | undefined;
  const ascAbs = num(pick(ascRaw, "absolute_degree", "abs_pos", "degree"));
  const ascendant = !timeMissing && ascRaw
    ? {
        sign: vedicSign(ascRaw, ascAbs),
        degree: round1(((ascAbs % 30) + 30) % 30),
        nakshatra: nakName(ascRaw.nakshatra),
        nakshatraLord: (str(pick(ascRaw.nakshatra as Record<string, unknown> | undefined, "lord")) || undefined),
      }
    : null;

  const houses = timeMissing ? [] : ((data?.houses ?? []) as unknown[]).map((raw, i) => {
    const h = raw as Record<string, unknown>;
    const id = h.house != null ? Number(h.house) : i + 1;
    return { house: id, sign: vedicSign(h, num(pick(h, "absolute_degree", "abs_pos"))) };
  });

  const moon = planets.find((p) => p.planet.toLowerCase() === "moon");
  const sadeRaw = data?.sade_sati as Record<string, unknown> | undefined;
  const sadeSati = sadeRaw
    ? {
        active: sadeRaw.active === true,
        phase: (str(pick(sadeRaw, "phase")) || null),
        note: (str(pick(sadeRaw, "description")) || (sadeRaw.active === true ? "Sade Sati is active." : "Sade Sati is not active.")),
      }
    : null;

  const meta = data?.metadata as Record<string, unknown> | undefined;

  return {
    ascendant,
    planets,
    houses,
    moonNakshatra: moon?.nakshatra,
    sadeSati,
    ayanamsha: (str(pick(meta, "ayanamsha")) || undefined),
    source: "provider",
    provider: ctx.provider ?? "freeastroapi",
    partial: ctx.missingInputs.length > 0,
    missingInputs: ctx.missingInputs,
    confidenceNotes: [
      "Vedic (sidereal) astrology is a separate tradition from your Western chart — its signs are intentionally different. A reflective lens for self-insight, never fixed fate.",
      ...(ctx.missingInputs.includes("birth_time") ? ["No birth time on file, so the Ascendant and houses are omitted (never guessed)."] : []),
    ],
    sourceInputHash: ctx.hash,
  };
}

/** Call the FreeAstroAPI sidereal endpoint. Throws on failure (caller degrades). */
async function fetchVedic(input: VedicInput, ctx: VedicFetchCtx): Promise<VedicOutput> {
  const key = Deno.env.get("FREEASTRO_API") ?? Deno.env.get("BAZI_API_KEY") ?? Deno.env.get("FREEASTRO_API_KEY");
  if (!key) throw new Error("FreeAstroAPI key (FREEASTRO_API / BAZI_API_KEY) is not configured");
  const base = (Deno.env.get("FREEASTRO_ASTRO_BASE_URL") || "https://api.freeastroapi.com").replace(/\/$/, "");
  // NOTE: the Vedic surface is API v2 (not v1) — /api/v2/vedic/chart.
  let endpoint = (Deno.env.get("VEDIC_API_ENDPOINT") || "/api/v2/vedic/chart").trim();
  if (!endpoint.startsWith("/")) endpoint = `/${endpoint}`;
  const url = `${base}${endpoint}`;

  const [y, mo, d] = input.date.split("-").map(Number);
  const [h, mi] = (input.time ?? "12:00").split(":").map(Number);

  // Matches FreeAstroAPI's verified /api/v2/vedic/chart contract: discrete date +
  // lat/lng (timezone derived from the coordinates server-side) plus the sidereal
  // settings the response echoes back.
  const body: Record<string, unknown> = {
    year: y, month: mo, day: d,
    lat: input.lat, lng: input.lng,
    ayanamsha: "lahiri",
    house_system: "whole_sign",
    node_type: "mean",
  };
  if (ctx.hasTime) { body.hour = h; body.minute = mi; }

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
    console.error(`vedic provider ${resp.status} at ${url} :: ${errBody.slice(0, 300)}`);
    throw new Error(`vedic provider ${resp.status} (${url})`);
  }
  return normalizeVedic(await resp.json(), ctx);
}

/** Whether a Vedic provider is configured (same FreeAstroAPI key as BaZi/astrology). */
export function vedicConfigured(): boolean {
  return !!(Deno.env.get("FREEASTRO_API") ?? Deno.env.get("BAZI_API_KEY") ?? Deno.env.get("FREEASTRO_API_KEY"));
}

/**
 * Compute (or reuse a cached) Vedic chart. `opts.cachedVedic` lets the persist
 * layer skip the provider when the birth inputs are unchanged (calls cost money).
 */
export async function computeVedic(
  input: VedicInput,
  opts?: { cachedVedic?: VedicOutput | null },
): Promise<VedicOutput> {
  const hash = vedicInputHash(input);

  const cached = opts?.cachedVedic;
  if (cached && cached.source === "provider" && cached.sourceInputHash === hash) {
    return cached;
  }

  if (!vedicConfigured()) {
    return unavailableVedic(
      "provider_not_configured",
      hash,
      "A Vedic / sidereal chart needs a configured provider; it unlocks when one is connected.",
    );
  }

  // Only a resolved birth place is required. The provider derives the timezone
  // from lat/lng server-side (exactly like BaZi, which works without a timezone),
  // and we don't even send a `timezone` field — so requiring one here would block
  // the chart for no functional reason. Coordinates alone are enough.
  const hasLocation = Number.isFinite(input.lat) && Number.isFinite(input.lng);
  if (!hasLocation) {
    return unavailableVedic(
      "missing_location",
      hash,
      "A Vedic / sidereal chart needs a resolved birth place; add your birth city to unlock it.",
      ["birth_location"],
    );
  }

  const missingInputs: string[] = [];
  const hasTime = !!input.time;
  if (!hasTime) missingInputs.push("birth_time");

  try {
    return await fetchVedic(input, { hash, missingInputs, hasTime });
  } catch (err) {
    console.error("Vedic provider failed — returning unavailable (never fabricated):", err);
    return unavailableVedic(
      "provider_unavailable",
      hash,
      "We couldn't reach the Vedic provider just now, so the sidereal chart is unavailable.",
    );
  }
}

/** True when the chart carries real provider data. */
export function hasRealVedic(v: VedicOutput | null | undefined): boolean {
  return !!v && v.source === "provider" && v.planets.length > 0;
}
