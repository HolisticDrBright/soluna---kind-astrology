/**
 * BaZi / Four Pillars engine — provider-backed Eastern astrology DEPTH layer.
 *
 * This is NOT the lightweight birth-year Chinese zodiac (see chinese.ts). A real
 * BaZi chart needs accurate birth date, time, and place, and is computed by a real
 * provider (FreeAstroAPI; see bazi-providers.ts). We NEVER fabricate pillars:
 *   - no provider configured      → source "unavailable" (provider_not_configured)
 *   - provider call fails         → source "unavailable" (provider_unavailable)
 *   - birth time missing          → partial: no hour pillar (never invented)
 *   - birth location missing      → partial: no true-solar-time precision
 *
 * The normalized BaziOutput is stored on the blueprint and cached by an input
 * fingerprint so we never pay the provider twice for the same birth data.
 */

import { getBaziCapability, fetchBazi } from "./bazi-providers.ts";

export interface BaziInput {
  date: string;             // YYYY-MM-DD
  time: string | null;      // HH:MM or null
  lat?: number | null;
  lng?: number | null;
  timezone?: string | null; // IANA, e.g. "Asia/Shanghai"; never default to UTC
}

export interface BaziPillar {
  /** Heavenly stem (provider's notation — may be CJK or romanized). */
  stem: string;
  /** Earthly branch. */
  branch: string;
  /** Element of the stem (Wood/Fire/Earth/Metal/Water), if provided. */
  element: string;
  /** Yin/Yang polarity of the stem, if provided. */
  yinYang?: string;
  /** Zodiac animal of the branch, if provided. */
  animal?: string;
  /** Hidden stems inside the branch, if provided. */
  hiddenStems: string[];
  /** Ten God of this pillar's stem relative to the Day Master, if provided. */
  tenGod?: string;
}

export interface BaziLuckPillar {
  startAge: number | null;
  startYear?: number | null;
  stem: string;
  branch: string;
  element?: string;
  tenGod?: string;
}

export type BaziSource = "provider" | "unavailable";

export interface BaziOutput {
  pillars: {
    year: BaziPillar | null;
    month: BaziPillar | null;
    day: BaziPillar | null;   // the Day Master lives here (day.stem)
    hour: BaziPillar | null;  // null whenever birth time is missing
  };
  dayMaster: { stem: string; element: string; yinYang: string } | null;
  /** "strong" | "weak" | "balanced" | provider string, when available. */
  dayMasterStrength: string | null;
  /** Distinct Ten Gods present across the chart. */
  tenGods: string[];
  /** Five-element balance (wood/fire/earth/metal/water → count or weight). */
  fiveElementBalance: Record<string, number>;
  /** Useful / supportive ("yong shen") elements, when the provider returns them. */
  favorableElements: string[];
  unfavorableElements: string[];
  interactions: {
    clashes: string[];
    combinations: string[];
    harms: string[];
    punishments: string[];
  };
  /** Luck pillars / Da Yun (decade luck), when enabled and returned. */
  luckPillars: BaziLuckPillar[];
  trueSolarTime: { applied: boolean; adjustedTime?: string | null; note?: string };
  // ── provenance ──
  source: BaziSource;
  provider?: string;
  /** True when some inputs were missing (e.g. no birth time/location). */
  partial: boolean;
  /** e.g. ["birth_time", "birth_location"]. */
  missingInputs: string[];
  /** Honest, uncertainty-aware notes for the reading layer. */
  confidenceNotes: string[];
  /** Why a chart is unavailable (provider_not_configured | provider_unavailable). */
  unavailableReason?: string;
  /** Fingerprint of the birth inputs, used to cache and avoid repeat charges. */
  sourceInputHash: string;
}

// ── input fingerprint (opaque; used only to detect "same birth data") ──
export function baziInputHash(input: BaziInput): string {
  const raw = `${input.date}|${input.time ?? ""}|${input.lat ?? ""}|${input.lng ?? ""}|${input.timezone ?? ""}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) >>> 0;
  return `bazi_${h.toString(16)}`;
}

function unavailableBazi(reason: string, hash: string, note: string, missingInputs: string[] = []): BaziOutput {
  return {
    pillars: { year: null, month: null, day: null, hour: null },
    dayMaster: null,
    dayMasterStrength: null,
    tenGods: [],
    fiveElementBalance: {},
    favorableElements: [],
    unfavorableElements: [],
    interactions: { clashes: [], combinations: [], harms: [], punishments: [] },
    luckPillars: [],
    trueSolarTime: { applied: false },
    source: "unavailable",
    partial: false,
    missingInputs,
    confidenceNotes: [note],
    unavailableReason: reason,
    sourceInputHash: hash,
  };
}

/**
 * Compute (or reuse a cached) BaZi chart. `opts.cachedBazi` lets the persist layer
 * skip the provider when the birth inputs are unchanged — BaZi calls cost money.
 */
export async function computeBazi(
  input: BaziInput,
  opts?: { cachedBazi?: BaziOutput | null },
): Promise<BaziOutput> {
  const hash = baziInputHash(input);

  // Cache hit: same birth data + we already have a real chart → no charge.
  const cached = opts?.cachedBazi;
  if (cached && cached.source === "provider" && cached.sourceInputHash === hash) {
    return cached;
  }

  const cap = getBaziCapability();
  if (!cap.enabled) {
    return unavailableBazi(
      "provider_not_configured",
      hash,
      "A full BaZi / Four Pillars chart needs a configured provider; Soluna is using the lighter Chinese-zodiac lens for now.",
    );
  }

  const hasTimezone = typeof input.timezone === "string" && input.timezone.trim().length > 0;
  if (!hasTimezone) {
    return unavailableBazi(
      "missing_timezone",
      hash,
      "A full BaZi / Four Pillars chart needs a resolved birth timezone; Soluna will not default to UTC because that can create false chart precision.",
      ["birth_timezone"],
    );
  }

  const missingInputs: string[] = [];
  const hasTime = !!input.time;
  const hasLocation = Number.isFinite(input.lat) && Number.isFinite(input.lng);
  if (!hasTime) missingInputs.push("birth_time");
  if (!hasLocation) missingInputs.push("birth_location");

  try {
    const out = await fetchBazi(input, { hash, missingInputs, hasTime, hasLocation });
    return out;
  } catch (err) {
    console.error("BaZi provider failed — returning unavailable (never fabricated):", err);
    return unavailableBazi(
      "provider_unavailable",
      hash,
      "We couldn't reach the BaZi provider just now, so the full Four Pillars view is unavailable. Your Chinese-zodiac lens still applies.",
    );
  }
}

/** True when the chart carries real provider pillars (full or partial). */
export function hasRealBazi(b: BaziOutput | null | undefined): boolean {
  return !!b && b.source === "provider" && !!b.pillars.day;
}
