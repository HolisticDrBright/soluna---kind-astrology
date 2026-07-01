/**
 * Vimshottari Dasha — the Vedic "planetary period" timeline (Jyotish). This is
 * the calendar of your life in Vedic astrology: each stretch is ruled by one of
 * the nine grahas, and the ruling planet colours that whole chapter.
 *
 * The timeline is FIXED at birth (derived from the Moon's nakshatra), so we fetch
 * it ONCE and cache it by the birth-input fingerprint — exactly like the natal
 * Vedic chart it rides alongside (it's nested on VedicOutput.dasha, so it needs
 * no new column). What changes day to day is only WHICH period is active, and
 * that is pure date math the frontend recomputes from the stored timeline — so a
 * cached blueprint never shows a stale "current period".
 *
 * Provider-backed (FreeAstroAPI, /api/v2/vedic/dasha), so we NEVER fabricate it:
 *   - no provider configured  → source "unavailable" (provider_not_configured)
 *   - provider call fails      → source "unavailable" (provider_unavailable)
 *   - no birth location        → source "unavailable" (missing_location)
 *   - no usable periods parsed  → source "unavailable" (provider_unavailable)
 */

import { withProviderRetry } from "./astrology-providers.ts";
import type { VedicInput } from "./vedic.ts";
import { vedicInputHash } from "./vedic.ts";

const PROVIDER_TIMEOUT_MS = 12_000;

/** One Dasha period (a Mahadasha, or an Antardasha nested inside it). */
export interface DashaPeriod {
  /** Ruling graha, e.g. "Venus". */
  planet: string;
  /** ISO date (YYYY-MM-DD) the period begins. */
  start: string;
  /** ISO date (YYYY-MM-DD) the period ends. */
  end: string;
  /** Antardashas (sub-periods) within a Mahadasha, when the provider returns them. */
  subPeriods?: DashaPeriod[];
}

/** The active Maha/Antar as of a given day (recomputable from the timeline). */
export interface CurrentDasha {
  maha: { planet: string; start: string; end: string } | null;
  antar: { planet: string; start: string; end: string } | null;
}

export type DashaSource = "provider" | "unavailable";

export interface DashaOutput {
  /** Which Dasha system this is (Vimshottari is the default and by far the most used). */
  system: string;
  /** The full Mahadasha timeline, each with its Antardashas when available. */
  timeline: DashaPeriod[];
  /** Active periods as of the compute date — a convenience/fallback; the UI recomputes for "today". */
  current: CurrentDasha | null;
  source: DashaSource;
  provider?: string;
  missingInputs: string[];
  unavailableReason?: string;
  confidenceNotes: string[];
  sourceInputHash: string;
}

// ── small helpers ──
// deno-lint-ignore no-explicit-any
function pick(o: any, ...keys: string[]): unknown {
  if (!o || typeof o !== "object") return undefined;
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  return undefined;
}
function str(v: unknown): string {
  return v === undefined || v === null ? "" : String(v);
}

/**
 * Normalize a provider date to YYYY-MM-DD. Accepts "YYYY-MM-DD",
 * "YYYY-MM-DDTHH:MM:SSZ", and anything Date can parse; returns "" when unusable
 * (so the caller can drop a malformed period rather than invent a date).
 */
export function toISODate(v: unknown): string {
  const s = str(v).trim();
  if (!s) return "";
  // Fast path: already an ISO date (optionally with a time component).
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // Fallback: let Date parse it, then format in UTC (dasha dates are day-precision).
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return "";
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Title-case a graha name ("venus" / "VENUS" → "Venus"). */
function planetName(v: unknown): string {
  const s = str(v).trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// deno-lint-ignore no-explicit-any
function parsePeriod(raw: any): DashaPeriod | null {
  if (!raw || typeof raw !== "object") return null;
  const planet = planetName(pick(raw, "planet", "lord", "name", "dasha_lord", "dashaLord", "graha"));
  const start = toISODate(pick(raw, "start", "start_date", "startDate", "from", "start_time", "begin"));
  const end = toISODate(pick(raw, "end", "end_date", "endDate", "to", "end_time", "finish"));
  if (!planet || !start || !end) return null;
  const subRaw = pick(raw, "antardashas", "antardasha", "antar", "bhuktis", "bhukti", "sub_periods", "subPeriods", "children");
  const subPeriods = Array.isArray(subRaw)
    ? subRaw.map(parsePeriod).filter((p): p is DashaPeriod => p !== null)
    : undefined;
  return { planet, start, end, ...(subPeriods && subPeriods.length ? { subPeriods } : {}) };
}

/**
 * Pure normalizer for a FreeAstroAPI Vimshottari-dasha response → DashaOutput.
 * Exported for tests. Throws when no usable periods are present so the caller
 * degrades to "unavailable" (never fabricated).
 */
// deno-lint-ignore no-explicit-any
export function normalizeDasha(data: any, ctx: { hash: string; missingInputs: string[]; provider?: string; asOfISO: string }): DashaOutput {
  // The Mahadasha list can live under several keys depending on the provider surface.
  const listRaw = pick(data, "dashas", "dasha_periods", "dashaPeriods", "periods", "mahadashas", "mahadasha", "timeline", "data") ?? data?.result?.dashas;
  const list: unknown[] = Array.isArray(listRaw) ? listRaw : [];
  const timeline = list.map(parsePeriod).filter((p): p is DashaPeriod => p !== null);
  if (!timeline.length) throw new Error("dasha: no periods in response");
  timeline.sort((a, b) => a.start.localeCompare(b.start));

  const system = str(pick(data, "system", "dasha_system", "dashaSystem")) || "Vimshottari";

  return {
    system,
    timeline,
    current: selectCurrentDasha(timeline, ctx.asOfISO),
    source: "provider",
    provider: ctx.provider ?? "freeastroapi",
    missingInputs: ctx.missingInputs,
    confidenceNotes: [
      "Vimshottari Dasha maps your life into planetary chapters, each coloured by its ruling graha. A reflective lens for timing and theme — never fixed fate.",
      ...(ctx.missingInputs.includes("birth_time")
        ? ["Without an exact birth time the period boundaries are approximate (they hinge on the Moon's precise position)."]
        : []),
    ],
    sourceInputHash: ctx.hash,
  };
}

/**
 * Pure: find the Maha (and its Antar) active on `todayISO`. ISO dates compare
 * correctly as strings. Returns nulls when today falls outside the timeline.
 * A period is active for [start, end).
 */
export function selectCurrentDasha(timeline: DashaPeriod[], todayISO: string): CurrentDasha {
  const maha = timeline.find((p) => p.start <= todayISO && todayISO < p.end) ?? null;
  if (!maha) return { maha: null, antar: null };
  const antarRaw = (maha.subPeriods ?? []).find((p) => p.start <= todayISO && todayISO < p.end) ?? null;
  return {
    maha: { planet: maha.planet, start: maha.start, end: maha.end },
    antar: antarRaw ? { planet: antarRaw.planet, start: antarRaw.start, end: antarRaw.end } : null,
  };
}

function unavailableDasha(reason: string, hash: string, note: string, missingInputs: string[] = []): DashaOutput {
  return {
    system: "Vimshottari",
    timeline: [],
    current: null,
    source: "unavailable",
    missingInputs,
    confidenceNotes: [note],
    unavailableReason: reason,
    sourceInputHash: hash,
  };
}

/** Whether the Dasha provider is configured (same FreeAstroAPI key as the Vedic chart). */
export function dashaConfigured(): boolean {
  return !!(Deno.env.get("FREEASTRO_API") ?? Deno.env.get("BAZI_API_KEY") ?? Deno.env.get("FREEASTRO_API_KEY"));
}

/** Call the FreeAstroAPI Vimshottari-dasha endpoint. Throws on failure (caller degrades). */
async function fetchDasha(input: VedicInput, ctx: { hash: string; missingInputs: string[]; hasTime: boolean; asOfISO: string }): Promise<DashaOutput> {
  const key = Deno.env.get("FREEASTRO_API") ?? Deno.env.get("BAZI_API_KEY") ?? Deno.env.get("FREEASTRO_API_KEY");
  if (!key) throw new Error("FreeAstroAPI key (FREEASTRO_API / BAZI_API_KEY) is not configured");
  const base = (Deno.env.get("FREEASTRO_ASTRO_BASE_URL") || "https://api.freeastroapi.com").replace(/\/$/, "");
  let endpoint = (Deno.env.get("VEDIC_DASHA_API_ENDPOINT") || "/api/v2/vedic/dasha").trim();
  if (!endpoint.startsWith("/")) endpoint = `/${endpoint}`;
  const url = `${base}${endpoint}`;

  const [y, mo, d] = input.date.split("-").map(Number);
  const [h, mi] = (input.time ?? "12:00").split(":").map(Number);

  // Same sidereal contract as /api/v2/vedic/chart (lat/lng → timezone server-side).
  const body: Record<string, unknown> = {
    year: y, month: mo, day: d,
    lat: input.lat, lng: input.lng,
    ayanamsha: "lahiri",
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
    console.error(`dasha provider ${resp.status} at ${url} :: ${errBody.slice(0, 300)}`);
    throw new Error(`dasha provider ${resp.status} (${url})`);
  }
  return normalizeDasha(await resp.json(), { hash: ctx.hash, missingInputs: ctx.missingInputs, asOfISO: ctx.asOfISO });
}

/**
 * Compute (or reuse a cached) Vimshottari Dasha timeline. `opts.cachedDasha`
 * lets the persist layer skip the provider when the birth inputs are unchanged —
 * the timeline is fixed at birth, so a cache hit is the common case.
 */
export async function computeVedicDasha(
  input: VedicInput,
  opts?: { cachedDasha?: DashaOutput | null; asOfISO?: string },
): Promise<DashaOutput> {
  const hash = vedicInputHash(input);
  const asOfISO = opts?.asOfISO ?? new Date().toISOString().split("T")[0];

  const cached = opts?.cachedDasha;
  if (cached && cached.source === "provider" && cached.sourceInputHash === hash && cached.timeline?.length) {
    // Reuse the fixed timeline; just refresh which period is "current" for today.
    return { ...cached, current: selectCurrentDasha(cached.timeline, asOfISO) };
  }

  if (!dashaConfigured()) {
    return unavailableDasha(
      "provider_not_configured",
      hash,
      "Your Vedic planetary periods (Dasha) unlock when a provider is connected.",
    );
  }

  const hasLocation = Number.isFinite(input.lat) && Number.isFinite(input.lng);
  if (!hasLocation) {
    return unavailableDasha(
      "missing_location",
      hash,
      "Your Dasha timeline needs a resolved birth place; add your birth city to unlock it.",
      ["birth_location"],
    );
  }

  const missingInputs: string[] = [];
  const hasTime = !!input.time;
  if (!hasTime) missingInputs.push("birth_time");

  try {
    return await fetchDasha(input, { hash, missingInputs, hasTime, asOfISO });
  } catch (err) {
    console.error("Dasha provider failed — returning unavailable (never fabricated):", err);
    return unavailableDasha(
      "provider_unavailable",
      hash,
      "We couldn't reach the Vedic provider just now, so your Dasha timeline is unavailable.",
    );
  }
}

/** True when the timeline carries real provider data. */
export function hasRealDasha(d: DashaOutput | null | undefined): boolean {
  return !!d && d.source === "provider" && d.timeline.length > 0;
}
