/**
 * Soluna Knowledge Base — shared schema (the contract).
 *
 * Pure TypeScript, ZERO external imports, so it can be unit-tested with
 * `deno test` offline and imported by any Edge Function without network access.
 *
 * Every knowledge entry is a `KnowledgeCard`. Cards are intentionally concise so
 * a handful can be injected into an LLM prompt without exploding token usage.
 *
 * IMPORTANT (legal / tone):
 * - All content is ORIGINAL, Soluna-owned interpretation. Do not paste text from
 *   copyrighted astrology / Human Design / tarot sources or competitor apps.
 * - Human Design concepts are framed as "Human Design-inspired" reflective
 *   language, never as a deterministic or licensed system.
 * - Nothing here claims scientific certainty. These are reflective frameworks.
 */

// ─── Controlled vocabularies ───────────────────────────────────────

/** Which knowledge system a card belongs to. */
export type KnowledgeSystem =
  | "western_astrology"
  | "numerology"
  | "eastern_astrology"
  | "bazi"
  | "human_design_inspired"
  | "tarot"
  | "tone"
  | "action";

/**
 * Synthesis tags are the BRIDGE between systems. The selection layer compares
 * tags across systems to find agreement ("two systems both point to rest") and
 * tension ("astrology says act, journals say burnout"). Keep this list small and
 * stable — it is the shared language of the whole knowledge base.
 */
export const SYNTHESIS_TAGS = [
  "communication",
  "action_initiative",
  "rest_recovery",
  "connection_love",
  "boundaries",
  "work_focus",
  "change_release",
  "self_worth",
  "creativity",
  "decision_clarity",
  "timing_patience",
  "grief_processing",
  "stress_regulation",
  "planning_structure",
  "freedom_independence",
  "nurture_care",
  "learning_growth",
  "leadership",
] as const;

export type SynthesisTag = (typeof SYNTHESIS_TAGS)[number];

/**
 * Reusable, emotionally-safe action types (see 08-action-library.md / the
 * action-library data file). The LLM writes the final wording; the selection
 * layer only decides which TYPES are appropriate.
 */
export const ACTION_TYPES = [
  "journal_prompt",
  "boundary_script",
  "relationship_repair",
  "decision_clarity",
  "focus_exercise",
  "nervous_system_reset",
  "values_check",
  "gratitude_reframe",
  "next_step_plan",
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

/**
 * Confidence label for a synthesised reading. The selection layer assigns one
 * deterministically from how many independent systems agree.
 *
 *  strong      — multiple systems independently point the same way
 *  supportive  — one clear signal, lightly echoed elsewhere
 *  mixed       — systems disagree; hold the tension, don't force a verdict
 *  reflective  — not enough signal; offer a question, not a conclusion
 */
export type ConfidenceLabel = "strong" | "supportive" | "mixed" | "reflective";

export const CONFIDENCE_LABELS: Record<ConfidenceLabel, string> = {
  strong: "Strong pattern",
  supportive: "Supportive pattern",
  mixed: "Mixed pattern",
  reflective: "Reflective prompt only",
};

/** Categories of safety concern the selection layer can flag. */
export type SafetyCategory =
  | "medical"
  | "legal"
  | "financial"
  | "self_harm_crisis"
  | "abuse_safety"
  | "third_party_speculation"
  | "fatalistic_request";

// ─── The card ──────────────────────────────────────────────────────

export interface KnowledgeCard {
  /** Stable unique id, e.g. "wa.sun.aries" or "num.lifepath.7". */
  id: string;
  system: KnowledgeSystem;
  /** Machine key within the system, e.g. "sun_aries", "life_path_7". */
  key: string;
  /** Short human title, e.g. "Aries Sun". */
  title: string;
  /** 1-2 sentence plain-language meaning. No jargon dumps. */
  plainMeaning: string;
  /** Affirming strengths this placement / number / card tends to carry. */
  strengths: string[];
  /** Growth edges — framed as opportunities, never as flaws or weaknesses. */
  growthEdges: string[];
  /** Action TYPES that tend to help here (must be valid ActionType values). */
  supportiveActions: ActionType[];
  /** Phrasings the LLM must avoid for this card (anti-patterns). */
  avoidSaying: string[];
  /** Synthesis tags used for cross-system agreement / tension detection. */
  synthesisTags: SynthesisTag[];
  /** Honest notes on certainty for this card (uncertainty-aware). */
  confidenceNotes: string[];
  /** Card-specific safety reminders, if any. */
  safetyNotes: string[];
}

// ─── Validation (used by tests + at load time) ─────────────────────

const SYS_SET = new Set<string>([
  "western_astrology",
  "numerology",
  "eastern_astrology",
  "bazi",
  "human_design_inspired",
  "tarot",
  "tone",
  "action",
]);
const TAG_SET = new Set<string>(SYNTHESIS_TAGS);
const ACTION_SET = new Set<string>(ACTION_TYPES);

export interface CardValidationError {
  id: string;
  problems: string[];
}

/**
 * Deterministic schema validation. Returns an array of problems (empty = valid).
 * Kept dependency-free so tests run offline.
 */
export function validateCard(card: Partial<KnowledgeCard>): string[] {
  const problems: string[] = [];
  const reqStr = (v: unknown, name: string) => {
    if (typeof v !== "string" || v.trim().length === 0) problems.push(`${name} must be a non-empty string`);
  };
  const reqArr = (v: unknown, name: string) => {
    if (!Array.isArray(v)) problems.push(`${name} must be an array`);
  };

  reqStr(card.id, "id");
  reqStr(card.key, "key");
  reqStr(card.title, "title");
  reqStr(card.plainMeaning, "plainMeaning");
  if (!card.system || !SYS_SET.has(card.system)) problems.push(`system "${card.system}" is not a valid KnowledgeSystem`);

  reqArr(card.strengths, "strengths");
  reqArr(card.growthEdges, "growthEdges");
  reqArr(card.supportiveActions, "supportiveActions");
  reqArr(card.avoidSaying, "avoidSaying");
  reqArr(card.synthesisTags, "synthesisTags");
  reqArr(card.confidenceNotes, "confidenceNotes");
  reqArr(card.safetyNotes, "safetyNotes");

  for (const t of card.synthesisTags ?? []) {
    if (!TAG_SET.has(t)) problems.push(`synthesisTag "${t}" is not in SYNTHESIS_TAGS`);
  }
  for (const a of card.supportiveActions ?? []) {
    if (!ACTION_SET.has(a)) problems.push(`supportiveAction "${a}" is not a valid ActionType`);
  }
  // Keep cards prompt-sized: guard against runaway token usage.
  if ((card.plainMeaning?.length ?? 0) > 400) problems.push("plainMeaning is too long (>400 chars) — keep cards prompt-sized");

  return problems;
}

/** Validate a whole deck; returns only the cards that have problems. */
export function validateDeck(cards: Partial<KnowledgeCard>[]): CardValidationError[] {
  const errors: CardValidationError[] = [];
  const seen = new Set<string>();
  for (const c of cards) {
    const problems = validateCard(c);
    if (c.id) {
      if (seen.has(c.id)) problems.push(`duplicate id "${c.id}"`);
      seen.add(c.id);
    }
    if (problems.length) errors.push({ id: c.id ?? "(no id)", problems });
  }
  return errors;
}
