/**
 * DailyCosmos normalizers — prove that the FreeAstroAPI daily responses (moon
 * phase, personal daily horoscope, BaZi "today" day pillar) map into the stable,
 * UI-friendly shapes, and degrade safely on empty/partial input. Pure functions,
 * so this runs offline. Fixtures are trimmed from real provider responses.
 */

import { assert, assertEquals } from "../test_util.ts";
import { normalizeMoon, normalizeHoroscope, normalizeBaziToday } from "../engines/daily-cosmos.ts";

// ── Moon ──────────────────────────────────────────────────────────
const MOON_SAMPLE = {
  type: "svg",
  content: "<svg/>",
  full_data: {
    phase: { name: "Full Moon", phase_angle_deg: 180.03, illumination: 0.9988, age_days: 14.8, is_waxing: false },
    zodiac: { sign: "Capricorn", degree: 8.27, zodiac_type: "tropical" },
    next_phases: { new_moon: "2026-07-14T08:26:11Z", full_moon: "2026-07-29T14:26:49Z" },
  },
};

Deno.test("normalizeMoon: maps phase, sign, illumination, waxing, next phases", () => {
  const m = normalizeMoon(MOON_SAMPLE);
  assertEquals(m.phase, "Full Moon");
  assertEquals(m.sign, "Capricorn");
  assertEquals(m.illumination, 0.9988);
  assertEquals(m.isWaxing, false);
  assertEquals(m.ageDays, 14.8);
  assertEquals(m.nextNewMoon, "2026-07-14T08:26:11Z");
  assertEquals(m.source, "provider");
});

Deno.test("normalizeMoon: missing fields degrade without throwing", () => {
  const m = normalizeMoon({});
  assertEquals(m.phase, "Moon");
  assertEquals(m.sign, null);
  assertEquals(m.illumination, 0);
});

// ── Personal daily horoscope ──────────────────────────────────────
const HORO_SAMPLE = {
  data: {
    sign: "taurus",
    scores: { overall: 52, love: 31, career: 49, money: 74, health: 52 },
    score_factors: [
      { dimension: "overall", type: "aggregate", reason: { main: "weighted average" } },
      { dimension: "love", type: "dimension", reason: { main: "Saturn Conjunction Natal Venus fuses with intense bonding." } },
      { dimension: "career", type: "dimension", reason: { main: "Saturn Square Natal Neptune highlights pressure to refine goals." } },
    ],
    lucky: { color: { key: "white", label: "White" }, number: 61, time_window: { display: "6am - 4pm" } },
    content: { theme: "Stability", keywords: ["Stability", "Stability"] },
    astro: {
      moon_sign: { key: "capricorn", label: "Capricorn" },
      moon_phase: { key: "full_moon", label: "Full Moon" },
      highlights: [
        { type: "moon_sign", label: "Moon in Capricorn" },
        { type: "moon_phase", label: "Full Moon" },
        { type: "sky_aspect", label: "Moon Square Saturn" },
      ],
    },
    personal: {
      transits_top: [
        { label: "Sun Opposition Natal Uranus", score: 96.1 },
        { label: "Sun Conjunction Natal Jupiter", score: 87.7 },
      ],
      focus_areas: ["Mind & Decisions", "Identity & Direction", "Structure & Career"],
      confidence_score: 95,
      day_context: { supportive_vs_challenging: { supportive: 11, challenging: 13 } },
    },
  },
};

Deno.test("normalizeHoroscope: maps scores, theme, transits, moon, lucky, reasons", () => {
  const h = normalizeHoroscope(HORO_SAMPLE);
  assertEquals(h.sign, "Taurus");
  assertEquals(h.theme, "Stability");
  assertEquals(h.keywords, ["Stability"]); // de-duplicated
  assertEquals(h.scores.money, 74);
  assertEquals(h.scores.love, 31);
  assert(h.reasons.love?.includes("Saturn Conjunction"), "love reason carried through");
  assertEquals(h.lucky.color, "White");
  assertEquals(h.lucky.number, 61);
  assertEquals(h.lucky.timeWindow, "6am - 4pm");
  assertEquals(h.moonSign, "Capricorn");
  assertEquals(h.moonPhase, "Full Moon");
  assertEquals(h.highlights.length, 3);
  assertEquals(h.topTransits[0].label, "Sun Opposition Natal Uranus");
  assertEquals(h.focusAreas.length, 3);
  assertEquals(h.confidence, 95);
  assertEquals(h.supportive, 11);
  assertEquals(h.challenging, 13);
});

Deno.test("normalizeHoroscope: empty input degrades to zeros/nulls without throwing", () => {
  const h = normalizeHoroscope({});
  assertEquals(h.scores.overall, 0);
  assertEquals(h.topTransits.length, 0);
  assertEquals(h.moonSign, null);
});

// ── BaZi today (day pillar) ───────────────────────────────────────
const BAZI_SAMPLE = {
  timestamp: "2026-06-30T19:41:41",
  pillars: [
    { label: "year", info: { stem: { name: "Bing", element: "Fire", polarity: "Yang" }, branch: { name: "Wu", element: "Fire", zodiac: "Horse" } } },
    { label: "month", info: { stem: { name: "Jia", element: "Wood", polarity: "Yang" }, branch: { name: "Wu", element: "Fire", zodiac: "Horse" } } },
    { label: "day", info: { stem: { name: "Yi", element: "Wood", polarity: "Yin" }, branch: { name: "Hai", element: "Water", zodiac: "Pig" } } },
    { label: "hour", info: { stem: { name: "Bing", element: "Fire", polarity: "Yang" }, branch: { name: "Xu", element: "Earth", zodiac: "Dog" } } },
  ],
};

Deno.test("normalizeBaziToday: extracts the DAY pillar (today's energy)", () => {
  const b = normalizeBaziToday(BAZI_SAMPLE);
  assert(b !== null);
  assertEquals(b!.dayStem, "Yi");
  assertEquals(b!.dayStemElement, "Wood");
  assertEquals(b!.dayBranch, "Hai");
  assertEquals(b!.dayBranchElement, "Water");
  assertEquals(b!.animal, "Pig");
  assertEquals(b!.polarity, "Yin");
});

Deno.test("normalizeBaziToday: no pillars → null (never fabricated)", () => {
  assertEquals(normalizeBaziToday({}), null);
  assertEquals(normalizeBaziToday({ pillars: [] }), null);
});
