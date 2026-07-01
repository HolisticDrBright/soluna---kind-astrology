/**
 * Vedic Match (Guna Milan / Ashtakoota) — the traditional eight-fold compatibility
 * of two people's Moon nakshatras, scored out of 36. Soluna uses it ONLY as a
 * gentle, reflective lens on natural rapport — NEVER as a marriage verdict, a
 * reason to stay or leave, or a prediction of fated outcomes. It appears only for
 * the romance lens and only when BOTH people have a real birth chart (date + time
 * + place), mirroring how BaZi compatibility is gated.
 *
 * Provider-backed (FreeAstroAPI /api/v2/vedic/match). We compute the warm,
 * non-fated interpretation OURSELVES from the numeric score, so the provider's own
 * (often marriage-verdict) conclusion text is never surfaced. Honest degradation:
 * unavailable on no provider / provider failure / missing data / unparseable score.
 */

import { withProviderRetry } from "./astrology-providers.ts";

const PROVIDER_TIMEOUT_MS = 12_000;

export interface VedicMatchBirth {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number | null;
  city: string | null;
  timezone: string | null;
  lat?: number | null;
  lng?: number | null;
  timeKnown: boolean;
}

export interface KootaScore {
  name: string;
  got: number;
  max: number;
}

export type VedicMatchSource = "provider" | "unavailable";

export interface VedicMatchOutput {
  /** Guna Milan points obtained (0..36). */
  score: number | null;
  /** Maximum points (traditionally 36). */
  maxScore: number;
  /** Per-koota breakdown when the provider returns it. */
  kootas: KootaScore[];
  /** Our own warm, non-fated one-liner derived from the score. */
  note: string;
  source: VedicMatchSource;
  provider?: string;
  unavailableReason?: string;
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

/** Warm, reflective band — deliberately NOT a marriage verdict. */
export function matchBandNote(score: number, maxScore: number): string {
  const pct = maxScore > 0 ? score / maxScore : 0;
  const base = `Guna Milan, a traditional Vedic harmony lens, reads ${score} of ${maxScore} points between your Moon nakshatras`;
  if (pct >= 0.75) return `${base} — a naturally easy, harmonious resonance. Hold it lightly: it's a reflective lens on rapport, never a verdict.`;
  if (pct >= 0.5) return `${base} — a warm, workable harmony with room to grow together. A reflective lens on rapport, never a verdict.`;
  return `${base} — more contrast to navigate, differences that simply ask for extra understanding. It's a reflective lens, never a verdict on the relationship.`;
}

/**
 * Pure normalizer for a FreeAstroAPI Guna-Milan response → VedicMatchOutput.
 * Tolerant of several key names for the total and the koota breakdown. Throws
 * when no usable score is present so the caller degrades (never fabricated).
 * Exported for tests.
 */
// deno-lint-ignore no-explicit-any
export function normalizeVedicMatch(data: any, ctx: { provider?: string }): VedicMatchOutput {
  const root = pick(data, "guna_milan", "gunaMilan", "ashtakoota", "ashtakuta", "match", "result", "data") ?? data;

  const score = numOrNull(pick(root, "total_points", "totalPoints", "total", "obtained_points", "obtainedPoints", "score", "points", "received_points", "guna_milan_total"));
  const maxScore = numOrNull(pick(root, "maximum_points", "maximumPoints", "max_points", "maxPoints", "total_max", "max")) ?? 36;
  if (score === null) throw new Error("vedic-match: no total score in response");

  const kootasRaw = pick(root, "kootas", "koota", "kutas", "kuta", "ashtakoota_details", "details", "breakdown");
  const kootas: KootaScore[] = Array.isArray(kootasRaw)
    ? (kootasRaw as unknown[]).map((raw) => {
        const k = raw as Record<string, unknown>;
        const name = str(pick(k, "name", "koota", "kuta", "type", "label"));
        const got = numOrNull(pick(k, "got", "obtained", "points", "received", "score", "value"));
        const max = numOrNull(pick(k, "max", "maximum", "max_points", "total"));
        return name && got !== null ? { name, got, max: max ?? 0 } : null;
      }).filter((k): k is KootaScore => k !== null)
    : [];

  return {
    score,
    maxScore,
    kootas,
    note: matchBandNote(score, maxScore),
    source: "provider",
    provider: ctx.provider ?? "freeastroapi",
  };
}

function unavailableMatch(reason: string): VedicMatchOutput {
  return { score: null, maxScore: 36, kootas: [], note: "", source: "unavailable", unavailableReason: reason };
}

export function vedicMatchConfigured(): boolean {
  return !!(Deno.env.get("FREEASTRO_API") ?? Deno.env.get("BAZI_API_KEY") ?? Deno.env.get("FREEASTRO_API_KEY"));
}

/** True when a birth dataset is complete enough for a Moon-nakshatra match. */
export function matchReady(b: VedicMatchBirth | null | undefined): boolean {
  return !!b && b.timeKnown && Number.isFinite(b.lat) && Number.isFinite(b.lng);
}

// deno-lint-ignore no-explicit-any
function birthBlock(b: VedicMatchBirth): Record<string, any> {
  return {
    year: b.year, month: b.month, day: b.day,
    hour: b.hour ?? 12, minute: b.minute ?? 0,
    lat: b.lat, lng: b.lng,
    city: b.city,
    tz_str: b.timezone || "AUTO",
  };
}

/**
 * Compute Guna Milan for two people. Returns "unavailable" (never throws) when
 * the provider isn't configured, either birth dataset is incomplete, or the call
 * fails — the compatibility reading continues without the Vedic note.
 */
export async function computeVedicMatch(a: VedicMatchBirth, b: VedicMatchBirth): Promise<VedicMatchOutput> {
  if (!vedicMatchConfigured()) return unavailableMatch("provider_not_configured");
  if (!matchReady(a) || !matchReady(b)) return unavailableMatch("incomplete_birth_data");

  const key = Deno.env.get("FREEASTRO_API") ?? Deno.env.get("BAZI_API_KEY") ?? Deno.env.get("FREEASTRO_API_KEY");
  const base = (Deno.env.get("FREEASTRO_ASTRO_BASE_URL") || "https://api.freeastroapi.com").replace(/\/$/, "");
  let endpoint = (Deno.env.get("VEDIC_MATCH_API_ENDPOINT") || "/api/v2/vedic/match").trim();
  if (!endpoint.startsWith("/")) endpoint = `/${endpoint}`;
  const url = `${base}${endpoint}`;

  // Both people's birth blocks, under common alias keys (the provider reads the
  // pair it recognizes). ayanamsha keeps it sidereal, matching the Vedic chart.
  const pa = birthBlock(a);
  const pb = birthBlock(b);
  const body: Record<string, unknown> = {
    person1: pa, person2: pb,
    ayanamsha: "lahiri",
  };

  try {
    const resp = await withProviderRetry(() =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key! },
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        body: JSON.stringify(body),
      })
    );
    if (!resp.ok) {
      const errBody = await resp.text().catch(() => "");
      console.error(`vedic-match provider ${resp.status} at ${url} :: ${errBody.slice(0, 300)}`);
      return unavailableMatch("provider_unavailable");
    }
    return normalizeVedicMatch(await resp.json(), {});
  } catch (err) {
    console.error("Vedic match provider failed — omitting (never fabricated):", err);
    return unavailableMatch("provider_unavailable");
  }
}

/** True when the match carries real provider data. */
export function hasRealMatch(m: VedicMatchOutput | null | undefined): boolean {
  return !!m && m.source === "provider" && m.score !== null;
}
