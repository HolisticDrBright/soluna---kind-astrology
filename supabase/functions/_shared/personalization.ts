/**
 * Personalization — "Tune Soluna to You".
 *
 * A DETERMINISTIC layer that learns HOW to communicate with each user from their
 * resonance feedback. It adjusts tone, detail, spirituality framing, action
 * style, focus examples, and which reflective lenses to lean on.
 *
 * It NEVER changes deterministic facts — natal placements, BaZi pillars,
 * numerology numbers, tarot draws, transits, compatibility math — or any safety
 * rule. Those live in the engines and are untouched by anything here. This module
 * only ever produces (a) profile preference fields and (b) a prose "memory" block
 * that is appended to prompts as guidance about delivery, not content.
 *
 * No LLM is used to derive the profile — the rules below are the source of truth.
 */

// ─── Vocabularies ──────────────────────────────────────────────────────────
export const RESONANCE_VALUES = ["yes", "partly", "no"] as const;
export type Resonance = (typeof RESONANCE_VALUES)[number];

export const SOURCE_TYPES = ["today", "ask", "focus", "compatibility", "tarot", "blueprint"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const REASON_TAGS = [
  "too_vague", "too_intense", "too_mystical", "not_practical_enough",
  "wrong_focus", "tone_didnt_fit", "wanted_more_depth", "wanted_more_support", "other",
] as const;
export type ReasonTag = (typeof REASON_TAGS)[number];

export const REFRAME_REQUESTS = [
  "make_it_more_practical", "make_it_gentler", "go_deeper", "make_it_less_mystical",
  "focus_on_relationships", "focus_on_work", "give_me_one_next_step",
] as const;
export type ReframeRequest = (typeof REFRAME_REQUESTS)[number];

/** Reflective lenses we may weight (never change). */
export const KNOWN_SYSTEMS = ["astrology", "bazi", "numerology", "tarot", "human_design", "chinese"] as const;

export interface ResonanceRow {
  resonance: Resonance;
  reason_tags: string[];
  reframe_requested: string | null;
  systems_referenced: string[];
  free_text: string | null;
}

export interface PersonalizationProfile {
  user_id: string;
  preferred_tone: string | null;
  detail_level: string | null;
  spirituality_level: string | null;
  action_style: string | null;
  preferred_focus_areas: string[];
  resonant_systems: string[];
  less_resonant_systems: string[];
  avoid_patterns: string[];
  helpful_patterns: string[];
  summary: string | null;
  feedback_count: number;
  updated_at: string;
}

/** The fields the deterministic rules derive (everything except user_id/updated_at). */
export type DerivedProfile = Omit<PersonalizationProfile, "user_id" | "updated_at">;

// A signal must appear at least this many times to shift a standing preference —
// keeps the profile gradual, never overfit to a single tap.
const REPEAT_THRESHOLD = 3;
// Explicit "reframe" requests (the user directly asked) move focus areas faster.
const FOCUS_THRESHOLD = 2;
// A lens must have been referenced in at least this many feedbacks before we
// label it (more/less) resonant.
const SYSTEM_MIN_APPEARANCES = 3;

function inc(map: Record<string, number>, key: string, by = 1): void {
  map[key] = (map[key] ?? 0) + by;
}

/**
 * Deterministically derive the personalization profile from a user's recent
 * resonance feedback. Pure function — same rows in, same profile out.
 */
export function recomputePersonalization(rows: ResonanceRow[]): DerivedProfile {
  const signal: Record<string, number> = {};
  const focus: Record<string, number> = {};
  const sysAppear: Record<string, number> = {};
  const sysYes: Record<string, number> = {};
  const sysLow: Record<string, number> = {};

  for (const row of rows) {
    const tags = new Set(row.reason_tags ?? []);
    const reframe = row.reframe_requested ?? "";

    // ── reason tags → directional signals ──
    if (tags.has("too_vague")) { inc(signal, "want_specific"); inc(signal, "want_detail"); }
    if (tags.has("too_mystical")) inc(signal, "want_grounded");
    if (tags.has("wanted_more_depth")) inc(signal, "want_detail");
    if (tags.has("too_intense")) inc(signal, "want_gentler");
    if (tags.has("not_practical_enough")) inc(signal, "want_practical");
    if (tags.has("tone_didnt_fit")) inc(signal, "tone_mismatch");
    if (tags.has("wanted_more_support")) inc(signal, "want_support");
    if (tags.has("wrong_focus")) inc(signal, "wrong_focus");

    // ── reframe requests are direct asks → strong, same-direction signals ──
    if (reframe === "make_it_more_practical") { inc(signal, "want_practical"); inc(signal, "want_specific"); }
    if (reframe === "make_it_gentler") inc(signal, "want_gentler");
    if (reframe === "go_deeper") inc(signal, "want_detail");
    if (reframe === "make_it_less_mystical") inc(signal, "want_grounded");
    if (reframe === "give_me_one_next_step") inc(signal, "want_one_step");
    if (reframe === "focus_on_relationships") inc(focus, "relationships");
    if (reframe === "focus_on_work") inc(focus, "work");

    // ── free text keywords nudge focus areas (light touch) ──
    const text = (row.free_text ?? "").toLowerCase();
    if (/\b(relationship|partner|love|dating|friend|family|marriage)\b/.test(text)) inc(focus, "relationships");
    if (/\b(work|job|career|school|study|exam|business)\b/.test(text)) inc(focus, "work");

    // ── per-system resonance tally ──
    for (const raw of row.systems_referenced ?? []) {
      const sys = String(raw);
      if (!(KNOWN_SYSTEMS as readonly string[]).includes(sys)) continue;
      inc(sysAppear, sys);
      if (row.resonance === "yes") inc(sysYes, sys);
      else inc(sysLow, sys); // "partly" or "no" both count as low resonance
    }
  }

  const at = (m: Record<string, number>, k: string) => m[k] ?? 0;
  const repeated = (k: string) => at(signal, k) >= REPEAT_THRESHOLD;

  // ── Resolve standing preferences (only when a signal repeats) ──
  let detailLevel: string | null = null;
  if (repeated("want_detail") || repeated("want_specific")) detailLevel = "deep";

  let spiritualityLevel: string | null = null;
  if (repeated("want_grounded")) spiritualityLevel = "grounded";

  let preferredTone: string | null = null;
  if (repeated("want_gentler")) preferredTone = "gentle";
  else if (repeated("want_support") || repeated("tone_mismatch")) preferredTone = "warm";

  let actionStyle: string | null = null;
  if (repeated("want_one_step")) actionStyle = "one_step";
  else if (repeated("want_practical")) actionStyle = "practical";

  const preferredFocusAreas = Object.keys(focus)
    .filter((k) => at(focus, k) >= FOCUS_THRESHOLD)
    .sort((a, b) => at(focus, b) - at(focus, a));

  // ── Systems: resonant vs less-resonant (gentle, needs enough signal) ──
  const resonantSystems: string[] = [];
  const lessResonantSystems: string[] = [];
  for (const sys of KNOWN_SYSTEMS) {
    if (at(sysAppear, sys) < SYSTEM_MIN_APPEARANCES) continue;
    const yes = at(sysYes, sys);
    const low = at(sysLow, sys);
    if (yes >= 2 && yes > low) resonantSystems.push(sys);
    else if (low >= 2 && low > yes) lessResonantSystems.push(sys);
  }

  // ── Patterns to avoid / lean into ──
  const avoidPatterns: string[] = [];
  if (repeated("want_grounded")) avoidPatterns.push("overly mystical phrasing");
  if (repeated("want_specific")) avoidPatterns.push("vague, non-specific language");
  if (repeated("tone_mismatch")) avoidPatterns.push("a tone that doesn't fit this person");

  const helpfulPatterns: string[] = [];
  if (repeated("want_practical") || repeated("want_one_step")) helpfulPatterns.push("a clear, concrete next step");
  if (repeated("want_support")) helpfulPatterns.push("emotional warmth and validation");
  if (repeated("want_detail")) helpfulPatterns.push("deeper, more thorough explanation");

  const derived: DerivedProfile = {
    preferred_tone: preferredTone,
    detail_level: detailLevel,
    spirituality_level: spiritualityLevel,
    action_style: actionStyle,
    preferred_focus_areas: preferredFocusAreas,
    resonant_systems: resonantSystems,
    less_resonant_systems: lessResonantSystems,
    avoid_patterns: avoidPatterns,
    helpful_patterns: helpfulPatterns,
    summary: null,
    feedback_count: rows.length,
  };
  derived.summary = buildPersonalizationSummary(derived);
  return derived;
}

/** A warm, deterministic one-paragraph summary built from resolved fields. */
export function buildPersonalizationSummary(p: DerivedProfile): string | null {
  // Nothing learned yet → no summary (keeps the prompt clean).
  const hasAny =
    p.preferred_tone || p.detail_level || p.spirituality_level || p.action_style ||
    p.preferred_focus_areas.length || p.resonant_systems.length ||
    p.less_resonant_systems.length || p.avoid_patterns.length || p.helpful_patterns.length;
  if (!hasAny) return null;

  const descriptors = [
    p.spirituality_level === "grounded" ? "grounded, practical" : p.spirituality_level === "mystical" ? "evocative" : null,
    p.detail_level === "deep" ? "in-depth" : p.detail_level === "concise" ? "concise" : null,
    p.preferred_tone === "gentle" ? "gentle" : p.preferred_tone === "warm" ? "emotionally warm" : null,
  ].filter(Boolean);

  let s = `This user prefers ${descriptors.length ? descriptors.join(", ") : "warm, balanced"} guidance`;
  if (p.action_style === "one_step") s += " with one clear next step";
  else if (p.action_style === "practical") s += " with practical, doable suggestions";
  s += ".";

  if (p.avoid_patterns.length) s += ` Avoid ${p.avoid_patterns.join(", ")}.`;
  if (p.preferred_focus_areas.length) s += ` Emphasize ${p.preferred_focus_areas.join(" and ")} examples when relevant.`;
  if (p.resonant_systems.length) s += ` They resonate most with ${p.resonant_systems.join(", ")}.`;
  if (p.less_resonant_systems.length) s += ` Hold ${p.less_resonant_systems.join(", ")} more lightly.`;
  s += " Keep every chart fact intact and never invent certainty.";
  return s;
}

/**
 * Render the "Personalization memory" block appended to synthesis prompts.
 * Returns "" when there's nothing learned yet, so prompts stay clean and the
 * block is included ONLY when a profile genuinely exists.
 */
export function personalizationMemoryBlock(p: PersonalizationProfile | null): string {
  if (!p || p.feedback_count <= 0) return "";
  const lines: string[] = [];

  if (p.preferred_tone === "gentle") lines.push("- Tone: gentle and soft; avoid intensity.");
  else if (p.preferred_tone === "warm") lines.push("- Tone: warm, validating, emotionally supportive.");

  if (p.detail_level === "deep") lines.push("- Depth: go deeper and more specific; avoid vagueness.");
  else if (p.detail_level === "concise") lines.push("- Depth: keep it concise and to the point.");

  if (p.spirituality_level === "grounded") lines.push("- Framing: keep it grounded and practical; go light on mystical language.");
  else if (p.spirituality_level === "mystical") lines.push("- Framing: a little more poetic/evocative is welcome.");

  if (p.action_style === "one_step") lines.push("- Action: end with ONE clear, doable next step.");
  else if (p.action_style === "practical") lines.push("- Action: include practical, actionable suggestions.");

  if (p.preferred_focus_areas.length) lines.push(`- Emphasize examples about: ${p.preferred_focus_areas.join(", ")}.`);
  if (p.resonant_systems.length) lines.push(`- Lean a little more on these lenses: ${p.resonant_systems.join(", ")}.`);
  if (p.less_resonant_systems.length) lines.push(`- Hold these lenses more lightly: ${p.less_resonant_systems.join(", ")}.`);
  if (p.avoid_patterns.length) lines.push(`- Avoid: ${p.avoid_patterns.join("; ")}.`);
  if (p.helpful_patterns.length) lines.push(`- They appreciate: ${p.helpful_patterns.join("; ")}.`);

  if (lines.length === 0 && !p.summary) return "";

  return [
    "Personalization memory (adjust HOW you communicate with this user — tone,",
    "emphasis, examples, and action style. NEVER change chart facts, placements,",
    "BaZi pillars, numbers, tarot cards, transits, compatibility, or certainty):",
    p.summary ?? "",
    ...lines,
    "Keep astrology, BaZi, numerology, tarot, Human Design-inspired, and Chinese",
    "astrology as reflective lenses, not fixed fate. Do not invent certainty or",
    "change any underlying data based on this — only the delivery.",
  ].filter(Boolean).join("\n");
}

/** Fetch a user's personalization profile (service-role read), or null. */
export async function fetchPersonalizationProfile(
  // deno-lint-ignore no-explicit-any
  sb: any,
  userId: string,
): Promise<PersonalizationProfile | null> {
  const { data } = await sb.from("personalization_profiles").select("*").eq("user_id", userId).maybeSingle();
  return (data as PersonalizationProfile | null) ?? null;
}
