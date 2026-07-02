/**
 * DailyCosmos — the genuinely-daily signals for "what the sky is doing today,"
 * personalized to the user's natal chart where possible. Provider-backed
 * (FreeAstroAPI) with HONEST degradation — we never fabricate transits:
 *   - Personal horoscope (Western transits) : POST /api/v3/horoscope/daily/personal
 *   - Moon phase + moon sign                 : GET  /api/v1/moon/phase
 *   - BaZi day pillar (today's energy)       : GET  /api/v1/chinese/today
 *
 * Each signal is fetched independently and degrades to null on failure (the Moon
 * always falls back to the local, deterministic computeMoonPhase so a moon card is
 * always available). Pure normalizers are exported for offline tests.
 *
 * NOTE: this is daily/transit data, distinct from the NATAL blueprint. It is not
 * cached by a birth-input hash — it changes every day — so callers should cache it
 * per (user, date), e.g. on the daily_readings row.
 */

import { computeMoonPhase } from "./moon-phase.ts";
import { withProviderRetry } from "./astrology-providers.ts";

const PROVIDER_TIMEOUT_MS = 12_000;

// ── shared FreeAstroAPI config (same key/base as BaZi/Vedic/astrology) ──
function freeAstroKey(): string | undefined {
  return Deno.env.get("FREEASTRO_API") ?? Deno.env.get("BAZI_API_KEY") ?? Deno.env.get("FREEASTRO_API_KEY");
}
function freeAstroBase(): string {
  return (Deno.env.get("FREEASTRO_ASTRO_BASE_URL") || "https://api.freeastroapi.com").replace(/\/$/, "");
}
export function dailyCosmosConfigured(): boolean {
  return !!freeAstroKey();
}

// ── small helpers ──
// deno-lint-ignore no-explicit-any
function rec(v: any): Record<string, unknown> | undefined {
  return v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : undefined;
}
function str(v: unknown): string {
  return v === undefined || v === null ? "" : String(v);
}
function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}
function numOrNull(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ── Birth input for the personal horoscope ──
export interface HoroscopeBirth {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number | null;
  city: string | null;
  timezone: string | null; // IANA, or null → "AUTO"
  timeKnown: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Moon
// ═══════════════════════════════════════════════════════════════════

export interface MoonToday {
  phase: string;
  /** Tropical zodiac sign the Moon is in today, when the provider returns it. */
  sign: string | null;
  illumination: number; // 0..1
  isWaxing: boolean;
  ageDays: number;
  nextNewMoon: string | null;
  nextFullMoon: string | null;
  source: "provider" | "local";
}

/** Pure normalizer for GET /api/v1/moon/phase → MoonToday. */
// deno-lint-ignore no-explicit-any
export function normalizeMoon(data: any): MoonToday {
  const fd = rec(data?.full_data) ?? rec(data) ?? {};
  const phase = rec(fd.phase) ?? {};
  const zodiac = rec(fd.zodiac) ?? {};
  const next = rec(fd.next_phases) ?? {};
  return {
    phase: str(phase.name) || "Moon",
    sign: zodiac.sign ? cap(str(zodiac.sign)) : null,
    illumination: numOrNull(phase.illumination) ?? 0,
    isWaxing: phase.is_waxing === true,
    ageDays: numOrNull(phase.age_days) ?? 0,
    nextNewMoon: next.new_moon ? str(next.new_moon) : null,
    nextFullMoon: next.full_moon ? str(next.full_moon) : null,
    source: "provider",
  };
}

/** Local, deterministic Moon (no provider) — always available as a fallback. */
function localMoon(dateISO: string): MoonToday {
  const m = computeMoonPhase(new Date(`${dateISO}T12:00:00Z`));
  return {
    phase: m.phase,
    sign: null, // a moon SIGN needs an ephemeris; never guessed
    illumination: m.illumination,
    isWaxing: m.bucket === "new" || m.bucket === "waxing",
    ageDays: m.ageDays,
    nextNewMoon: null,
    nextFullMoon: null,
    source: "local",
  };
}

async function fetchMoon(dateISO: string): Promise<MoonToday> {
  const key = freeAstroKey();
  if (!key) return localMoon(dateISO);
  const url = `${freeAstroBase()}/api/v1/moon/phase?date=${dateISO}&lat=0&lon=0&include_zodiac=true&include_rise_set=false&include_visuals=false`;
  try {
    const resp = await withProviderRetry(() =>
      fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json", "x-api-key": key },
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      })
    );
    if (!resp.ok) throw new Error(`moon provider ${resp.status}`);
    return normalizeMoon(await resp.json());
  } catch (err) {
    console.error("moon provider failed — using local moon phase:", err);
    return localMoon(dateISO);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Personal daily horoscope (Western transits to the natal chart)
// ═══════════════════════════════════════════════════════════════════

export interface DailyHoroscope {
  sign: string;
  theme: string;
  keywords: string[];
  scores: { overall: number; love: number; career: number; money: number; health: number };
  /** Plain-language "why" per life area, from the provider's score_factors. */
  reasons: { love: string | null; career: string | null; money: string | null; health: string | null };
  lucky: { color: string | null; number: number | null; timeWindow: string | null };
  moonSign: string | null;
  moonPhase: string | null;
  highlights: string[];
  /** Top personal transits today, plain labels (e.g. "Sun Conjunction Natal Jupiter"). */
  topTransits: { label: string; score: number | null }[];
  focusAreas: string[];
  confidence: number | null;
  supportive: number | null;
  challenging: number | null;
}

/** Pull the `reason.main` for a given score dimension out of score_factors[]. */
// deno-lint-ignore no-explicit-any
function reasonFor(factors: any[], dimension: string): string | null {
  const f = (Array.isArray(factors) ? factors : []).find((x) => rec(x)?.dimension === dimension && rec(x)?.type === "dimension");
  const reason = rec(rec(f)?.reason);
  return reason?.main ? str(reason.main) : null;
}

/** Pure normalizer for POST /api/v3/horoscope/daily/personal → DailyHoroscope. */
// deno-lint-ignore no-explicit-any
export function normalizeHoroscope(raw: any): DailyHoroscope {
  const d = rec(raw?.data) ?? rec(raw) ?? {};
  const scores = rec(d.scores) ?? {};
  const content = rec(d.content) ?? {};
  const lucky = rec(d.lucky) ?? {};
  const luckyColor = rec(lucky.color);
  const luckyWindow = rec(lucky.time_window);
  const astro = rec(d.astro) ?? {};
  const moonSign = rec(astro.moon_sign);
  const moonPhase = rec(astro.moon_phase);
  const highlights = (Array.isArray(astro.highlights) ? astro.highlights : [])
    .map((h: unknown) => str(rec(h)?.label)).filter(Boolean);
  const personal = rec(d.personal) ?? {};
  const transits = (Array.isArray(personal.transits_top) ? personal.transits_top : [])
    .slice(0, 5)
    .map((t: unknown) => ({ label: str(rec(t)?.label), score: numOrNull(rec(t)?.score) }))
    .filter((t: { label: string }) => t.label);
  const focusAreas = (Array.isArray(personal.focus_areas) ? personal.focus_areas : []).map(str).filter(Boolean);
  const svc = rec(rec(personal.day_context)?.supportive_vs_challenging);
  const keywords = [...new Set((Array.isArray(content.keywords) ? content.keywords : []).map(str).filter(Boolean))];

  return {
    sign: cap(str(d.sign)),
    theme: str(content.theme),
    keywords,
    scores: {
      overall: numOrNull(scores.overall) ?? 0,
      love: numOrNull(scores.love) ?? 0,
      career: numOrNull(scores.career) ?? 0,
      money: numOrNull(scores.money) ?? 0,
      health: numOrNull(scores.health) ?? 0,
    },
    reasons: {
      love: reasonFor(d.score_factors as unknown[], "love"),
      career: reasonFor(d.score_factors as unknown[], "career"),
      money: reasonFor(d.score_factors as unknown[], "money"),
      health: reasonFor(d.score_factors as unknown[], "health"),
    },
    lucky: {
      color: luckyColor?.label ? str(luckyColor.label) : null,
      number: numOrNull(lucky.number),
      timeWindow: luckyWindow?.display ? str(luckyWindow.display) : null,
    },
    moonSign: moonSign?.label ? str(moonSign.label) : null,
    moonPhase: moonPhase?.label ? str(moonPhase.label) : null,
    highlights,
    topTransits: transits,
    focusAreas,
    confidence: numOrNull(personal.confidence_score),
    supportive: numOrNull(svc?.supportive),
    challenging: numOrNull(svc?.challenging),
  };
}

async function fetchPersonalHoroscope(birth: HoroscopeBirth, dateISO: string): Promise<DailyHoroscope | null> {
  const key = freeAstroKey();
  if (!key) return null;
  // The natal chart needs a place; without it we honestly skip (never fabricate).
  if (!birth.city) return null;
  const tz = birth.timezone || "AUTO";
  const body = {
    birth: {
      year: birth.year,
      month: birth.month,
      day: birth.day,
      hour: birth.timeKnown ? (birth.hour ?? 12) : 12,
      minute: birth.timeKnown ? (birth.minute ?? 0) : 0,
      city: birth.city,
      tz_str: tz,
    },
    date: dateISO,
    tz_str: tz,
  };
  try {
    const resp = await withProviderRetry(() =>
      fetch(`${freeAstroBase()}/api/v3/horoscope/daily/personal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key },
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        body: JSON.stringify(body),
      })
    );
    if (!resp.ok) throw new Error(`horoscope provider ${resp.status}`);
    return normalizeHoroscope(await resp.json());
  } catch (err) {
    console.error("personal horoscope provider failed — omitting (never fabricated):", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// BaZi day pillar (today's energy)
// ═══════════════════════════════════════════════════════════════════

export interface BaziToday {
  dayStem: string;        // e.g. "Yi"
  dayStemElement: string; // e.g. "Wood" — the day's heavenly-stem energy
  dayBranch: string;      // e.g. "Hai"
  dayBranchElement: string; // e.g. "Water"
  animal: string;         // e.g. "Pig"
  polarity: string;       // e.g. "Yin"
}

/** Pure normalizer for GET /api/v1/chinese/today → BaziToday (day pillar). */
// deno-lint-ignore no-explicit-any
export function normalizeBaziToday(data: any): BaziToday | null {
  const pillars = Array.isArray(data?.pillars) ? data.pillars : [];
  const day = pillars.find((p: unknown) => rec(p)?.label === "day");
  const info = rec(rec(day)?.info);
  const stem = rec(info?.stem);
  const branch = rec(info?.branch);
  if (!stem && !branch) return null;
  return {
    dayStem: cap(str(stem?.name)),
    dayStemElement: cap(str(stem?.element)),
    dayBranch: cap(str(branch?.name)),
    dayBranchElement: cap(str(branch?.element)),
    animal: cap(str(branch?.zodiac)),
    polarity: cap(str(stem?.polarity)),
  };
}

async function fetchBaziToday(): Promise<BaziToday | null> {
  const key = freeAstroKey();
  if (!key) return null;
  try {
    const resp = await withProviderRetry(() =>
      fetch(`${freeAstroBase()}/api/v1/chinese/today`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "x-api-key": key },
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      })
    );
    if (!resp.ok) throw new Error(`bazi today provider ${resp.status}`);
    return normalizeBaziToday(await resp.json());
  } catch (err) {
    console.error("bazi today provider failed — omitting (never fabricated):", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Orchestrator
// ═══════════════════════════════════════════════════════════════════

export interface DailyCosmos {
  moon: MoonToday;
  horoscope: DailyHoroscope | null;
  baziToday: BaziToday | null;
}

/**
 * Fetch today's transit signals, personalized where possible. Each runs
 * independently; failures degrade to null (Moon always falls back to local).
 * Never throws and never fabricates.
 */
/** The compact signal shape the synthesis prompt consumes (DailyContext.dailyCosmos).
 *  Accepts either a fresh DailyCosmos or the jsonb fields off a cached
 *  daily_readings row, so mood reframes can reuse the day's already-fetched
 *  cosmos instead of paying three more provider calls. */
// deno-lint-ignore no-explicit-any
export function dailyCosmosSignals(moon: any, horoscope: any, baziToday: any): {
  moonPhase: string;
  moonSign: string | null;
  theme: string | null;
  topTransit: string | null;
  focusAreas: string[];
  baziDayElement: string | null;
  baziAnimal: string | null;
} {
  return {
    moonPhase: str(moon?.phase) || "",
    moonSign: moon?.sign != null ? str(moon.sign) : null,
    theme: horoscope?.theme != null ? str(horoscope.theme) : null,
    topTransit: horoscope?.topTransits?.[0]?.label != null ? str(horoscope.topTransits[0].label) : null,
    focusAreas: Array.isArray(horoscope?.focusAreas) ? horoscope.focusAreas.map(str) : [],
    baziDayElement: baziToday?.dayStemElement != null ? str(baziToday.dayStemElement) : null,
    baziAnimal: baziToday?.animal != null ? str(baziToday.animal) : null,
  };
}

/** Map a birth_profiles row into the horoscope provider's birth input. Shared by
 *  the /today endpoint and the daily-reading cron so both produce identical
 *  personalization. */
export function toHoroscopeBirth(bp: Record<string, unknown>): HoroscopeBirth | null {
  if (!bp.birth_date) return null;
  const [y, m, d] = String(bp.birth_date).split("-").map(Number);
  const timeStr = bp.birth_time ? String(bp.birth_time) : null;
  const [hh, mm] = timeStr ? timeStr.split(":").map(Number) : [null, null];
  return {
    year: y,
    month: m,
    day: d,
    hour: hh,
    minute: mm,
    city: bp.birth_place_label ? String(bp.birth_place_label) : null,
    timezone: bp.timezone ? String(bp.timezone) : null,
    timeKnown: bp.time_known !== false && !!timeStr,
  };
}

export async function computeDailyCosmos(
  birth: HoroscopeBirth | null,
  dateISO: string,
): Promise<DailyCosmos> {
  const [moon, horoscope, baziToday] = await Promise.all([
    fetchMoon(dateISO),
    birth ? fetchPersonalHoroscope(birth, dateISO) : Promise.resolve(null),
    fetchBaziToday(),
  ]);
  return { moon, horoscope, baziToday };
}
