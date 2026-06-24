// detectAgreement — the MOAT. A DETERMINISTIC pass (not the LLM) that scores
// where the systems converge into a small theme set. Each system independently
// votes for a theme; the theme backed by the most DISTINCT systems is the
// "systems agree" highlight. The LLM only phrases the result — it never decides
// the agreement.

import type { DayContext } from "./context.ts";
import type { ChineseElement, ZodiacSign } from "../engines/types.ts";

export type ThemeId = "rest" | "action" | "connection" | "focus" | "change";

export const THEME_TITLES: Record<ThemeId, string> = {
  rest: "Rest & Reflection",
  action: "Action & Initiative",
  connection: "Connection & Love",
  focus: "Focus & Work",
  change: "Change & Release",
};

export type EvidenceSystem = "astrology" | "numerology" | "chinese" | "humanDesign" | "biorhythm";

export interface ThemeEvidence {
  system: EvidenceSystem;
  label: string;
  signal: string;
  /** A fuller, structured explanation (so the UI never parses prose). */
  detail: string;
  /** 0..1 — how strongly this system points at the theme. */
  confidence: number;
  theme: ThemeId;
}

export interface ScoredTheme {
  id: ThemeId;
  title: string;
  score: number; // number of DISTINCT systems pointing here
  evidence: ThemeEvidence[];
}

export interface AgreementResult {
  topTheme: ScoredTheme;
  themes: ScoredTheme[];
}

/** Structured "systems agree" payload for the Today drawer + daily reading row. */
export interface AgreementEvidence {
  theme: ThemeId;
  title: string;
  score: number;
  systems: { system: EvidenceSystem; label: string; signal: string; detail: string; confidence: number }[];
  combinedTakeaway: string;
}

const PERSONAL_DAY_THEME: Record<number, ThemeId> = {
  1: "action", 2: "connection", 3: "connection", 4: "focus", 5: "change",
  6: "connection", 7: "rest", 8: "focus", 9: "change", 11: "rest", 22: "focus",
};

const FIRE: ZodiacSign[] = ["Aries", "Leo", "Sagittarius"];
const EARTH: ZodiacSign[] = ["Taurus", "Virgo", "Capricorn"];
const WATER: ZodiacSign[] = ["Cancer", "Scorpio", "Pisces"];

function moonSignTheme(sign: ZodiacSign): ThemeId {
  if (WATER.includes(sign)) return "rest";
  if (FIRE.includes(sign)) return "action";
  if (EARTH.includes(sign)) return "focus";
  return "connection"; // air signs (Gemini, Libra, Aquarius)
}

function moonPhaseTheme(phase: string): ThemeId {
  if (phase === "New Moon") return "action";
  if (phase === "Full Moon") return "change";
  if (phase.startsWith("Waning")) return "rest";
  return "focus"; // waxing -> building
}

const ELEMENT_THEME: Record<ChineseElement, ThemeId> = {
  Water: "rest", Fire: "action", Earth: "focus", Metal: "change", Wood: "action",
};

function authorityTheme(authority: string | null): ThemeId {
  switch (authority) {
    case "Emotional":
    case "Lunar":
      return "rest";
    case "Sacral":
    case "Splenic":
    case "Ego":
      return "action";
    default:
      return "connection"; // Self-Projected / Mental / unknown
  }
}

function detailFor(signal: string, theme: ThemeId): string {
  return `${signal} For you today, that leans toward ${THEME_TITLES[theme].toLowerCase()}.`;
}

export function detectAgreement(ctx: DayContext): AgreementResult {
  const evidence: ThemeEvidence[] = [];
  const add = (e: Omit<ThemeEvidence, "detail"> & { detail?: string }) =>
    evidence.push({ ...e, detail: e.detail ?? detailFor(e.signal, e.theme) });

  // Numerology — Personal Day
  add({
    system: "numerology",
    label: `Personal Day ${ctx.personalDay}`,
    signal: personalDaySignal(ctx.personalDay),
    confidence: 0.85,
    theme: PERSONAL_DAY_THEME[ctx.personalDay] ?? "focus",
  });

  // Astrology — Moon sign + Moon phase (one system, up to two themes)
  add({
    system: "astrology",
    label: `Moon in ${ctx.transits.moon.sign}`,
    signal: `The Moon in ${ctx.transits.moon.sign} colors the emotional weather of the day.`,
    confidence: 0.8,
    theme: moonSignTheme(ctx.transits.moon.sign),
  });
  add({
    system: "astrology",
    label: ctx.transits.moon.phase,
    signal: `The ${ctx.transits.moon.phase} marks where you are in the lunar cycle.`,
    confidence: 0.65,
    theme: moonPhaseTheme(ctx.transits.moon.phase),
  });

  // Chinese — daily element
  add({
    system: "chinese",
    label: `${ctx.chineseDaily.element} ${ctx.chineseDaily.animal} day`,
    signal: `Today carries ${ctx.chineseDaily.element} ${ctx.chineseDaily.animal} energy.`,
    confidence: 0.7,
    theme: ELEMENT_THEME[ctx.chineseDaily.element],
  });

  // Human Design — stable bias from authority
  add({
    system: "humanDesign",
    label: `${ctx.summary.hdAuthority ?? "Your"} Authority`,
    signal: hdSignal(ctx.summary.hdAuthority),
    confidence: ctx.summary.hdAuthority ? 0.85 : 0.5,
    theme: authorityTheme(ctx.summary.hdAuthority),
  });

  // Biorhythm — dominant cycle (only if clearly dominant)
  const bio = biorhythmTheme(ctx.biorhythm);
  if (bio) add(bio);

  // Score each theme by DISTINCT contributing systems.
  const themes: ScoredTheme[] = (Object.keys(THEME_TITLES) as ThemeId[]).map((id) => {
    const ev = evidence.filter((e) => e.theme === id);
    const distinctSystems = new Set(ev.map((e) => e.system)).size;
    return { id, title: THEME_TITLES[id], score: distinctSystems, evidence: ev };
  });

  themes.sort((a, b) => b.score - a.score || b.evidence.length - a.evidence.length);
  return { topTheme: themes[0], themes: themes.filter((t) => t.score > 0) };
}

type BioEvidence = { system: "biorhythm"; label: string; signal: string; confidence: number; theme: ThemeId };

function biorhythmTheme(b: DayContext["biorhythm"]): BioEvidence | null {
  const { physical, emotional, intellectual } = b;
  const max = Math.max(physical, emotional, intellectual);
  const min = Math.min(physical, emotional, intellectual);
  const base = { system: "biorhythm" as const, confidence: 0.6 };
  if (max < -0.3) {
    return { ...base, label: "Biorhythm low ebb", signal: "All three biorhythm cycles are in a low ebb — a natural rest window.", theme: "rest" };
  }
  if (max < 0.3) return null; // nothing clearly dominant
  if (max === physical) {
    return { ...base, label: "Physical high", signal: "Your physical biorhythm is cresting — good energy for doing.", theme: "action" };
  }
  if (max === emotional) {
    return { ...base, label: "Emotional high", signal: "Your emotional biorhythm is high — warmth and connection flow easily.", theme: "connection" };
  }
  if (max === intellectual && min !== max) {
    return { ...base, label: "Intellectual high", signal: "Your intellectual biorhythm is sharp — a focused, clear-thinking day.", theme: "focus" };
  }
  return null;
}

/** Build the structured "systems agree" payload from the top theme. */
export function buildAgreementEvidence(result: AgreementResult, llmTakeaway?: string): AgreementEvidence {
  const t = result.topTheme;
  const systems = t.evidence.map((e) => ({
    system: e.system,
    label: e.label,
    signal: e.signal,
    detail: e.detail,
    confidence: e.confidence,
  }));
  const deterministic = `${t.score} of your systems point toward ${t.title.toLowerCase()} today. ` +
    t.evidence.map((e) => e.signal).join(" ");
  return {
    theme: t.id,
    title: t.title,
    score: t.score,
    systems,
    combinedTakeaway: llmTakeaway && llmTakeaway.length > 0 ? llmTakeaway : deterministic,
  };
}

function personalDaySignal(pd: number): string {
  const map: Record<number, string> = {
    1: "Personal Day 1 plants a fresh seed — a day for beginnings.",
    2: "Personal Day 2 favors partnership, patience, and gentle connection.",
    3: "Personal Day 3 is expressive and social — share your voice.",
    4: "Personal Day 4 is about foundations and steady, grounded work.",
    5: "Personal Day 5 invites change, movement, and a little adventure.",
    6: "Personal Day 6 centers love, care, and home.",
    7: "Personal Day 7 is for inner listening and reflection.",
    8: "Personal Day 8 brings capable, empowered focus.",
    9: "Personal Day 9 is completion energy — release and honor a cycle.",
  };
  return map[pd] ?? "Today's number invites a steady, intentional rhythm.";
}

function hdSignal(authority: string | null): string {
  switch (authority) {
    case "Emotional":
      return "Your Emotional Authority asks you to wait for clarity through the feeling wave — no rushing.";
    case "Sacral":
      return "Your Sacral Authority responds in the moment — follow the gut yes.";
    case "Splenic":
      return "Your Splenic Authority speaks once, quietly and in the now — trust the first knowing.";
    case "Ego":
      return "Your Ego Authority follows what you genuinely have the heart and will for.";
    case "Self-Projected":
      return "Your Self-Projected Authority finds clarity by talking it out and hearing your own truth.";
    case "Lunar":
      return "Your Lunar Authority unfolds over a full cycle — let big choices breathe.";
    default:
      return "Your design invites you to honor your own timing.";
  }
}
