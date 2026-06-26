/**
 * Synthesis Rules — the deterministic brain of the knowledge base.
 *
 * Pure functions, no I/O, no external imports (testable offline). Given a set of
 * matched cards + light context signals, it decides:
 *   - which synthesis tags AGREE across systems (raise confidence),
 *   - which tags are in TENSION (soften the advice),
 *   - the overall ConfidenceLabel,
 *   - and which safety categories the user's own words trigger.
 *
 * The LLM writes the words; THIS decides the shape. Same input -> same output.
 */

import type {
  ConfidenceLabel,
  KnowledgeCard,
  KnowledgeSystem,
  SafetyCategory,
  SynthesisTag,
} from "./types.ts";

// ─── Focus category -> relevant tags ───────────────────────────────
// Keys match the DB `focuses.category` check constraint.
export const FOCUS_CATEGORY_TAGS: Record<string, SynthesisTag[]> = {
  relationship: ["connection_love", "communication", "boundaries"],
  friendship: ["connection_love", "communication", "boundaries"],
  family: ["connection_love", "boundaries", "nurture_care"],
  work: ["work_focus", "planning_structure", "leadership"],
  school: ["work_focus", "learning_growth", "planning_structure"],
  big_decision: ["decision_clarity", "timing_patience", "self_worth"],
  money: ["planning_structure", "decision_clarity", "self_worth"],
  self_worth: ["self_worth", "stress_regulation", "nurture_care"],
  creativity: ["creativity", "freedom_independence", "self_worth"],
  spiritual_growth: ["change_release", "rest_recovery", "learning_growth"],
  personal: ["self_worth", "rest_recovery", "decision_clarity"],
};

// ─── Tension pairs ─────────────────────────────────────────────────
// When BOTH tags in a pair appear strongly, Soluna should hold the tension and
// soften (e.g. systems say "act" but signals say "rest").
export const TENSION_PAIRS: Array<[SynthesisTag, SynthesisTag]> = [
  ["action_initiative", "rest_recovery"],
  ["work_focus", "rest_recovery"],
  ["action_initiative", "timing_patience"],
  ["freedom_independence", "connection_love"],
  ["change_release", "planning_structure"],
];

/** Count how many DISTINCT systems contribute each tag. */
export function tallyTagsBySystem(cards: KnowledgeCard[]): Map<SynthesisTag, Set<KnowledgeSystem>> {
  const m = new Map<SynthesisTag, Set<KnowledgeSystem>>();
  for (const c of cards) {
    for (const t of c.synthesisTags) {
      if (!m.has(t)) m.set(t, new Set());
      m.get(t)!.add(c.system);
    }
  }
  return m;
}

export interface TagAgreement {
  tag: SynthesisTag;
  systems: KnowledgeSystem[];
  systemCount: number;
}

/** Tags where 2+ DISTINCT systems agree, sorted strongest first. */
export function agreementTags(cards: KnowledgeCard[]): TagAgreement[] {
  const tally = tallyTagsBySystem(cards);
  const out: TagAgreement[] = [];
  for (const [tag, systems] of tally) {
    if (systems.size >= 2) {
      out.push({ tag, systems: [...systems], systemCount: systems.size });
    }
  }
  out.sort((a, b) => b.systemCount - a.systemCount || a.tag.localeCompare(b.tag));
  return out;
}

export interface TagTension {
  a: SynthesisTag;
  b: SynthesisTag;
}

/**
 * Tensions present in the active tag set. `extraSignalTags` lets callers inject
 * non-card signals (e.g. "journals suggest burnout" -> rest_recovery) so a
 * push toward action can be detected as conflicting with lived context.
 */
export function tensionTags(cards: KnowledgeCard[], extraSignalTags: SynthesisTag[] = []): TagTension[] {
  const present = new Set<SynthesisTag>(extraSignalTags);
  for (const c of cards) for (const t of c.synthesisTags) present.add(t);
  const out: TagTension[] = [];
  for (const [a, b] of TENSION_PAIRS) {
    if (present.has(a) && present.has(b)) out.push({ a, b });
  }
  return out;
}

/**
 * Deterministic confidence label.
 *  - strong:     a tag agreed on by >= 3 systems, OR >= 2 distinct agreement tags, with no tension
 *  - supportive: at least one 2-system agreement (tension allowed but noted)
 *  - mixed:      tension present and no clear agreement, OR agreement cancelled by tension
 *  - reflective: little or no signal
 */
export function confidenceLabel(
  agreement: TagAgreement[],
  tension: TagTension[],
  matchedCardCount: number,
): ConfidenceLabel {
  const topSystemCount = agreement[0]?.systemCount ?? 0;
  const strongAgreement = topSystemCount >= 3 || agreement.length >= 2;
  const anyAgreement = agreement.length >= 1;
  const hasTension = tension.length > 0;

  if (matchedCardCount === 0) return "reflective";
  if (strongAgreement && !hasTension) return "strong";
  if (anyAgreement && !hasTension) return "supportive";
  if (anyAgreement && hasTension) return "mixed";
  if (hasTension) return "mixed";
  if (matchedCardCount >= 2) return "supportive";
  return "reflective";
}

// ─── User-input safety scan ────────────────────────────────────────
// Detects categories in the USER'S message that should reshape the response
// (route to support, refuse a directive, etc.). Conservative by design.

interface InputRule {
  category: SafetyCategory;
  pattern: RegExp;
}

const INPUT_RULES: InputRule[] = [
  { category: "self_harm_crisis", pattern: /\b(kill myself|end my life|suicid|don't want to (be alive|live)|self[- ]?harm|hurt myself|cut myself|no reason to live|want to die)\b/i },
  { category: "abuse_safety", pattern: /\b(hits me|hitting me|abus|threatens me|afraid of (him|her|them|my partner)|not safe at home|violent)\b/i },
  { category: "medical", pattern: /\b(diagnos|should i (take|stop)|my medication|symptom|is this (cancer|covid)|mental illness|am i (depressed|bipolar))\b/i },
  { category: "legal", pattern: /\b(should i sue|sign this contract|custody|my lawyer|press charges|is it legal)\b/i },
  { category: "financial", pattern: /\b(should i (buy|sell|invest)|my savings|stock|crypto|put money into|quit my job for money)\b/i },
  { category: "third_party_speculation", pattern: /\b(does (he|she|they) (secretly )?(love|hate|want) me|what is (he|she|they) thinking|is (he|she|they) cheating)\b/i },
  { category: "fatalistic_request", pattern: /\b(when will i die|am i cursed|is my relationship doomed|will i (ever )?(be alone|fail))\b/i },
];

export function scanUserInputSafety(message: string): SafetyCategory[] {
  const found = new Set<SafetyCategory>();
  for (const r of INPUT_RULES) {
    if (r.pattern.test(message)) found.add(r.category);
  }
  return [...found];
}

/** Human-readable, safe guidance for each detected safety category. */
export const SAFETY_GUIDANCE: Record<SafetyCategory, string> = {
  self_harm_crisis: "Set cosmic framing aside. Respond with warmth and presence, acknowledge how hard this is, and gently encourage reaching out to a trusted person, a therapist, or a crisis line. Do not analyse placements.",
  abuse_safety: "Prioritise the user's real-world safety over any reading. Validate them, avoid 'repair' advice toward an unsafe person, and gently point to real support resources.",
  medical: "Do not diagnose or advise on symptoms, conditions, or medication. Offer emotional support and suggest a qualified professional.",
  legal: "Do not give legal directives. Acknowledge the stress and suggest a qualified professional for the legal specifics.",
  financial: "Do not tell the user to buy, sell, or invest. You may explore feelings and values; direct money decisions to a qualified advisor.",
  third_party_speculation: "Don't claim to know another person's private thoughts or intentions. Redirect to the user's own feelings, needs, and next step.",
  fatalistic_request: "Don't predict doom, death, or fixed fate. Reframe toward what is open and within the user's influence right now.",
};

// ─── Free-text -> tags (privacy-safe distillation) ─────────────────
// Used to distil short journal/activity text into SYNTHESIS_TAGS WITHOUT ever
// passing the raw text downstream into a prompt.
const TEXT_TAG_HINTS: Array<[RegExp, SynthesisTag]> = [
  [/\b(talk|say|tell|conversation|express|words?)\b/i, "communication"],
  [/\b(start|begin|launch|take action|go for it)\b/i, "action_initiative"],
  [/\b(tired|exhaust|burn ?out|rest|overwhelmed|depleted)\b/i, "rest_recovery"],
  [/\b(love|partner|relationship|dating|lonely|connect)\b/i, "connection_love"],
  [/\b(boundary|boundaries|say no|space|protect myself)\b/i, "boundaries"],
  [/\b(work|job|study|exam|project|deadline|career)\b/i, "work_focus"],
  [/\b(let go|moving on|release|ending|transition|change)\b/i, "change_release"],
  [/\b(worth|enough|confidence|deserve|self[- ]?esteem)\b/i, "self_worth"],
  [/\b(create|art|writing|making|design|idea)\b/i, "creativity"],
  [/\b(decide|choice|decision|crossroads)\b/i, "decision_clarity"],
  [/\b(waiting|timing|patience|too soon|rushed)\b/i, "timing_patience"],
  [/\b(grief|loss|mourning|passed away|miss them)\b/i, "grief_processing"],
  [/\b(stress|anxious|panic|nervous|overwhelmed)\b/i, "stress_regulation"],
  [/\b(plan|organis|organiz|structure|schedule)\b/i, "planning_structure"],
];

export function tagsFromText(text: string): SynthesisTag[] {
  const out = new Set<SynthesisTag>();
  for (const [re, tag] of TEXT_TAG_HINTS) if (re.test(text)) out.add(tag);
  return [...out];
}
