// Builds explainable "system chips" — the structured evidence behind any piece
// of guidance — in ONE canonical shape (system/signal/detail/confidence/source)
// so Today, Ask, Synthesis, Compatibility, and Bond all explain themselves the
// same way. Confidence is mapped to a coarse label here, once.

import type { AgreementResult, EvidenceSystem, ScoredTheme } from "./agreement.ts";
import type { DayContext } from "./context.ts";
import type { BlueprintSummary } from "../engines/blueprint.ts";
import type { SharedFacets } from "./synthesis.ts";
import type { Confidence, Evidence, EvidenceSystemId } from "./types.ts";

/** Map the agreement's numeric confidence (0..1) to a coarse label. */
export function confidenceLabel(n: number): Confidence {
  if (n >= 0.8) return "high";
  if (n >= 0.6) return "medium";
  return "low";
}

const SYSTEM_ID: Record<EvidenceSystem, EvidenceSystemId> = {
  astrology: "astrology",
  numerology: "numerology",
  chinese: "chinese",
  humanDesign: "human_design",
  biorhythm: "biorhythm",
};

/**
 * Cross-system evidence chips for a day, grounded in the same deterministic
 * signals that drive "systems agree" — plus the card of the day. Highest
 * confidence first; de-duplicated by system+signal.
 */
export function dailyEvidence(ctx: DayContext, agreement: AgreementResult): Evidence[] {
  const seen = new Set<string>();
  const chips: Evidence[] = [];
  // Every evidence item belongs to exactly one theme, so flattening the scored
  // themes yields each signal once.
  for (const theme of agreement.themes) {
    for (const e of theme.evidence) {
      const key = `${e.system}:${e.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      chips.push({
        system: SYSTEM_ID[e.system],
        signal: e.label,
        detail: e.detail,
        confidence: confidenceLabel(e.confidence),
        source: e.source,
      });
    }
  }
  // Tarot card of the day (deterministic draw) rounds out the picture.
  if (ctx.tarot) {
    chips.push({
      system: "tarot",
      signal: ctx.tarot.name,
      detail: ctx.tarot.uprightMeaning,
      confidence: "low",
      source: `Your card of the day, drawn deterministically for ${ctx.date}.`,
    });
  }
  const rank: Record<Confidence, number> = { high: 0, medium: 1, low: 2 };
  return chips.sort((a, b) => rank[a.confidence] - rank[b.confidence]);
}

/** Explainable chips for a single converging theme (used by /synthesis). */
export function themeEvidence(theme: ScoredTheme): Evidence[] {
  return theme.evidence.map((e) => ({
    system: SYSTEM_ID[e.system],
    signal: e.label,
    detail: e.detail,
    confidence: confidenceLabel(e.confidence),
    source: e.source,
  }));
}

/**
 * Blueprint-grounded chips for the systems an Ask answer drew on, so the chat
 * can show "why" without re-deriving anything. timeKnown gates HD/Rising.
 */
export function askEvidence(summary: BlueprintSummary, systemIds: string[]): Evidence[] {
  const out: Evidence[] = [];
  const has = (s: string) => systemIds.includes(s);
  if (has("astrology")) {
    const rising = summary.rising
      ? `, ${summary.rising} Rising`
      : "";
    out.push({
      system: "astrology",
      signal: `${summary.sunSign} Sun · ${summary.moonSign} Moon${rising}`,
      detail: "Your core astrological signature shapes how this theme tends to land for you.",
      confidence: summary.timeKnown ? "high" : "medium",
      source: summary.timeKnown
        ? "Your natal chart (birth date, time, and place)."
        : "Your Sun and Moon are exact; Rising needs your birth time.",
    });
  }
  if (has("numerology")) {
    out.push({
      system: "numerology",
      signal: `Life Path ${summary.lifePath} · Expression ${summary.expression}`,
      detail: "Your numerology speaks to the throughline of what you're here to learn and express.",
      confidence: "high",
      source: "Calculated from your birth date and full birth name.",
    });
  }
  if (has("chinese")) {
    out.push({
      system: "chinese",
      signal: `${summary.element} ${summary.animal}`,
      detail: "Your Chinese pillar adds an elemental temperament to the read.",
      confidence: "high",
      source: "Your year pillar, exact from your birth date.",
    });
  }
  if (has("human_design")) {
    out.push({
      system: "human_design",
      signal: summary.hdType
        ? `${summary.hdType}${summary.hdAuthority ? ` · ${summary.hdAuthority} Authority` : ""}`
        : "Human Design",
      detail: "Your Human Design points to how you're built to make aligned decisions.",
      confidence: summary.hdType ? "high" : "low",
      source: summary.hdType
        ? "Computed from your exact birth time."
        : "Add your birth time to unlock your full Human Design.",
    });
  }
  return out;
}

/**
 * Evidence chips for a two-person bond, built ONLY from facets BOTH partners
 * chose to share (privacy-respecting). Pure — no LLM.
 */
export function bondEvidence(a: SharedFacets, b: SharedFacets): Evidence[] {
  const out: Evidence[] = [];
  if (a.sun && b.sun) {
    out.push({
      system: "astrology",
      signal: `${a.sun} & ${b.sun} suns`,
      detail: "Your core solar temperaments set the overall tone of how you meet each other.",
      confidence: "high",
      source: "Both of your Sun signs (exact from birth dates).",
    });
  }
  if (a.moon && b.moon) {
    out.push({
      system: "astrology",
      signal: `${a.moon} & ${b.moon} moons`,
      detail: "Your Moons shape how you each like to give and receive care.",
      confidence: "medium",
      source: "Both Moon signs; most precise when birth times are set.",
    });
  }
  if (a.lifePath && b.lifePath) {
    out.push({
      system: "numerology",
      signal: `Life Paths ${a.lifePath} & ${b.lifePath}`,
      detail: "Your Life Paths speak to what each of you is here to learn and value.",
      confidence: "high",
      source: "Both Life Path numbers (exact from birth dates).",
    });
  }
  if (a.chinese && b.chinese) {
    out.push({
      system: "chinese",
      signal: `${a.chinese} & ${b.chinese}`,
      detail: "Your Chinese signs add an elemental flavor to how you pace and play together.",
      confidence: "high",
      source: "Both year pillars (exact from birth dates).",
    });
  }
  if (a.hdType && b.hdType) {
    out.push({
      system: "human_design",
      signal: `${a.hdType} & ${b.hdType}`,
      detail: "Your Human Design types describe how each of you is built to engage and decide.",
      confidence: "high",
      source: "Both types (need each birth time to be precise).",
    });
  }
  return out;
}

/** Honest confidence notes for a bond, based on what each chart is missing. */
export function bondConfidenceNotes(a: BlueprintSummary, b: BlueprintSummary): string[] {
  const notes = [
    "Sun signs, Life Path numbers, and Chinese signs are exact from your birth dates.",
  ];
  if (!a.timeKnown || !b.timeKnown) {
    notes.push(
      "One or both birth times aren't set yet, so the Moon and Human Design parts are approximate — " +
      "add them for a deeper read.",
    );
  }
  return notes;
}
