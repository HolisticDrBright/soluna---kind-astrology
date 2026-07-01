/**
 * Shadbala — the Vedic "six-fold strength" of the planets. It measures how
 * clearly each graha can express its significations in a chart. We surface it
 * gently: the strongest planet is an area of natural ease; the weakest is an
 * area you may cultivate consciously. Never a verdict, never fate — a reflective
 * lens, and pointedly NOT about health, longevity, or worth.
 *
 * Like the natal chart and the Dasha timeline, Shadbala is FIXED at birth, so we
 * fetch it once and nest it on VedicOutput.strength (no new column), cached by
 * the birth-input fingerprint. Provider-backed (FreeAstroAPI /api/v2/vedic/
 * strength), so we NEVER fabricate it — it degrades to "unavailable" on any of:
 * no provider / provider failure / no birth location / no usable scores parsed.
 */

import { withProviderRetry } from "./astrology-providers.ts";
import type { VedicInput } from "./vedic.ts";
import { vedicInputHash } from "./vedic.ts";

const PROVIDER_TIMEOUT_MS = 12_000;

export interface PlanetStrength {
  /** Graha, e.g. "Jupiter". */
  planet: string;
  /** Total strength (provider units — often Rupas; kept as-is, shown as relative). */
  score: number;
  /** 1 = strongest. Assigned by us from the scores so ranking is always consistent. */
  rank: number;
  /** Provider's own grade when present (e.g. "strong"); never invented. */
  grade?: string;
}

export type StrengthSource = "provider" | "unavailable";

export interface StrengthOutput {
  planets: PlanetStrength[];
  strongest: PlanetStrength | null;
  weakest: PlanetStrength | null;
  source: StrengthSource;
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
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function planetName(v: unknown): string {
  const s = str(v).trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
/** Pull a numeric strength total out of a planet entry, tolerant of key names. */
// deno-lint-ignore no-explicit-any
function totalScore(o: any): number | null {
  const raw = pick(o, "total_rupas", "totalRupas", "total_shadbala", "totalShadbala", "shadbala", "total", "strength", "score", "value", "sum", "bala");
  if (raw === undefined) return null;
  // The chosen field may itself be a number, or a nested object like { rupas: 7.5 }.
  if (raw && typeof raw === "object") {
    const inner = pick(raw, "rupas", "value", "total", "score");
    const n = Number(inner);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Pure normalizer for a FreeAstroAPI Shadbala response → StrengthOutput. Accepts
 * either an array of planet entries or an object map keyed by planet name.
 * Exported for tests. Throws when no usable scores parse (caller degrades).
 */
// deno-lint-ignore no-explicit-any
export function normalizeStrength(
  data: any,
  ctx: { hash: string; missingInputs: string[]; provider?: string },
): StrengthOutput {
  const container = pick(data, "shadbala", "strengths", "strength", "planets", "planet_strengths", "planetStrengths", "data", "result") ?? data;

  const entries: { planet: string; score: number; grade?: string }[] = [];
  if (Array.isArray(container)) {
    for (const raw of container) {
      const planet = planetName(pick(raw, "planet", "name", "graha", "id"));
      const score = totalScore(raw);
      if (planet && score !== null) entries.push({ planet, score, grade: str(pick(raw, "grade", "label", "status")) || undefined });
    }
  } else if (container && typeof container === "object") {
    for (const [k, raw] of Object.entries(container as Record<string, unknown>)) {
      const planet = planetName(k);
      if (!planet) continue;
      const score = typeof raw === "number" ? raw : totalScore(raw);
      if (score !== null) {
        const grade = raw && typeof raw === "object" ? (str(pick(raw, "grade", "label", "status")) || undefined) : undefined;
        entries.push({ planet, score, grade });
      }
    }
  }
  if (!entries.length) throw new Error("strength: no planet scores in response");

  // Rank by score descending; rank is ours so it's always consistent and 1-based.
  entries.sort((a, b) => b.score - a.score);
  const planets: PlanetStrength[] = entries.map((e, i) => ({
    planet: e.planet,
    score: round2(e.score),
    rank: i + 1,
    ...(e.grade ? { grade: e.grade } : {}),
  }));

  return {
    planets,
    strongest: planets[0] ?? null,
    weakest: planets[planets.length - 1] ?? null,
    source: "provider",
    provider: ctx.provider ?? "freeastroapi",
    missingInputs: ctx.missingInputs,
    confidenceNotes: [
      "Shadbala measures how clearly each planet can express itself in your chart. Your strongest planet is an area of natural ease; your developing planet is one to nurture with intention — a reflective lens, never a verdict on your worth or your health.",
      ...(ctx.missingInputs.includes("birth_time")
        ? ["Without an exact birth time these strengths are approximate (several components depend on precise timing)."]
        : []),
    ],
    sourceInputHash: ctx.hash,
  };
}

function unavailableStrength(reason: string, hash: string, note: string, missingInputs: string[] = []): StrengthOutput {
  return {
    planets: [],
    strongest: null,
    weakest: null,
    source: "unavailable",
    missingInputs,
    confidenceNotes: [note],
    unavailableReason: reason,
    sourceInputHash: hash,
  };
}

/** Whether the strength provider is configured (same FreeAstroAPI key as the Vedic chart). */
export function strengthConfigured(): boolean {
  return !!(Deno.env.get("FREEASTRO_API") ?? Deno.env.get("BAZI_API_KEY") ?? Deno.env.get("FREEASTRO_API_KEY"));
}

/** Call the FreeAstroAPI Shadbala endpoint. Throws on failure (caller degrades). */
async function fetchStrength(input: VedicInput, ctx: { hash: string; missingInputs: string[]; hasTime: boolean }): Promise<StrengthOutput> {
  const key = Deno.env.get("FREEASTRO_API") ?? Deno.env.get("BAZI_API_KEY") ?? Deno.env.get("FREEASTRO_API_KEY");
  if (!key) throw new Error("FreeAstroAPI key (FREEASTRO_API / BAZI_API_KEY) is not configured");
  const base = (Deno.env.get("FREEASTRO_ASTRO_BASE_URL") || "https://api.freeastroapi.com").replace(/\/$/, "");
  let endpoint = (Deno.env.get("VEDIC_STRENGTH_API_ENDPOINT") || "/api/v2/vedic/strength").trim();
  if (!endpoint.startsWith("/")) endpoint = `/${endpoint}`;
  const url = `${base}${endpoint}`;

  const [y, mo, d] = input.date.split("-").map(Number);
  const [h, mi] = (input.time ?? "12:00").split(":").map(Number);

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
    console.error(`strength provider ${resp.status} at ${url} :: ${errBody.slice(0, 300)}`);
    throw new Error(`strength provider ${resp.status} (${url})`);
  }
  return normalizeStrength(await resp.json(), { hash: ctx.hash, missingInputs: ctx.missingInputs });
}

/**
 * Compute (or reuse a cached) Shadbala. `opts.cachedStrength` lets the persist
 * layer skip the provider when the birth inputs are unchanged (it's fixed at birth).
 */
export async function computeVedicStrength(
  input: VedicInput,
  opts?: { cachedStrength?: StrengthOutput | null },
): Promise<StrengthOutput> {
  const hash = vedicInputHash(input);

  const cached = opts?.cachedStrength;
  if (cached && cached.source === "provider" && cached.sourceInputHash === hash && cached.planets?.length) {
    return cached;
  }

  if (!strengthConfigured()) {
    return unavailableStrength(
      "provider_not_configured",
      hash,
      "Your Vedic planetary strengths (Shadbala) unlock when a provider is connected.",
    );
  }

  const hasLocation = Number.isFinite(input.lat) && Number.isFinite(input.lng);
  if (!hasLocation) {
    return unavailableStrength(
      "missing_location",
      hash,
      "Planetary strengths need a resolved birth place; add your birth city to unlock them.",
      ["birth_location"],
    );
  }

  const missingInputs: string[] = [];
  const hasTime = !!input.time;
  if (!hasTime) missingInputs.push("birth_time");

  try {
    return await fetchStrength(input, { hash, missingInputs, hasTime });
  } catch (err) {
    console.error("Shadbala provider failed — returning unavailable (never fabricated):", err);
    return unavailableStrength(
      "provider_unavailable",
      hash,
      "We couldn't reach the Vedic provider just now, so your planetary strengths are unavailable.",
    );
  }
}

/** True when the strengths carry real provider data. */
export function hasRealStrength(s: StrengthOutput | null | undefined): boolean {
  return !!s && s.source === "provider" && s.planets.length > 0;
}
