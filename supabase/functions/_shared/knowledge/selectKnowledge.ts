/**
 * selectKnowledge — the deterministic knowledge SELECTION layer.
 *
 * Given the user's REAL computed data + light context, it picks the relevant
 * knowledge cards and computes agreement / tension / confidence / safety. It is
 * pure and deterministic: same input -> same output, fully unit-testable. The
 * LLM later writes the words, but never chooses the knowledge.
 *
 * Privacy: this layer only receives the CURRENT user's data plus minimised
 * "hints" (already-distilled tags/labels), never raw journals or another
 * person's private chart. A connection contributes only "involved + lens".
 */

import {
  ACTION_TYPES,
  agreementTags,
  cardByKeyInSystem,
  confidenceLabel,
  CONFIDENCE_LABELS,
  FOCUS_CATEGORY_TAGS,
  SAFETY_GUIDANCE,
  scanUserInputSafety,
  tensionTags,
  type ActionType,
  type ConfidenceLabel,
  type KnowledgeCard,
  type SafetyCategory,
  type SynthesisTag,
  type TagAgreement,
  type TagTension,
} from "./index.ts";

// ─── Input (structural; decoupled from engine internals) ───────────

export interface KnowledgeContext {
  astrology?: {
    planets?: Array<{ planet: string; sign: string; house?: number | null }>;
    ascendant?: { sign: string | null } | null;
    /** Natal house cusps — present only when birth time is known. */
    houses?: Array<{ house: number; sign: string }>;
    /** Natal aspects between planets, when the provider supplies them. */
    aspects?: Array<{ planetA: string; planetB: string; type: string; orb?: number }>;
    /** True only when birth time is accurate enough for houses/angles. */
    hasAccurateTime?: boolean;
  } | null;
  numerology?: {
    lifePath?: number;
    personalDay?: number;
    personalYear?: number;
    expression?: number;
    soulUrge?: number;
  } | null;
  /** Lightweight birth-year Chinese zodiac (always available from the date). */
  chinese?: { animal?: string; element?: string; yinYang?: string } | null;
  /**
   * Full provider-backed BaZi / Four Pillars. `present` is true ONLY when a real
   * provider chart exists — selection never produces BaZi cards otherwise.
   */
  bazi?: {
    present: boolean;
    dayMaster?: { element?: string; yinYang?: string } | null;
    dayMasterStrength?: string | null;
    tenGods?: string[];
    favorableElements?: string[];
    fiveElementBalance?: Record<string, number>;
    pillars?: { year?: boolean; month?: boolean; day?: boolean; hour?: boolean };
    hasLuckPillars?: boolean;
  } | null;
  vedic?: {
    present: boolean;
    /** The Moon's nakshatra (the heart of a Vedic reading), e.g. "Ardra". */
    moonNakshatra?: string;
    /** The Ascendant's nakshatra, if known. */
    ascendantNakshatra?: string;
    sadeSatiActive?: boolean;
  } | null;
  humanDesign?: {
    type?: string;
    authority?: string;
    profile?: string;
    definedCenters?: string[];
    undefinedCenters?: string[];
  } | null;
  /** Tarot draw, if any. Provide key ("the_fool") or name ("The Fool"). */
  tarot?: { key?: string; name?: string } | null;
  /** Current sky, if known. */
  transits?: { mercuryRetrograde?: boolean; moonPhase?: string; moonSign?: string } | null;
  /** Active focus/problem. category matches focuses.category. */
  focus?: { category?: string; problemText?: string } | null;
  /** A connection is involved — lens only, never the other person's data. */
  connection?: { involved: boolean; lens?: string } | null;
  /** The user's own words (for safety scanning). */
  userMessage?: string;
  /** Pre-distilled theme tags from recent journals (minimised, not raw text). */
  journalThemeTags?: SynthesisTag[];
  /** Pre-distilled tags from recent activity (e.g. repeated Ask topics). */
  activityTags?: SynthesisTag[];
}

export interface SafetyWarning {
  category: SafetyCategory;
  guidance: string;
}

export interface KnowledgeSelection {
  selectedKnowledgeCards: KnowledgeCard[];
  synthesisTags: SynthesisTag[];
  agreementSignals: TagAgreement[];
  tensionSignals: TagTension[];
  confidenceLabel: ConfidenceLabel;
  confidenceLabelText: string;
  safetyWarnings: SafetyWarning[];
  suggestedActionTypes: ActionType[];
}

// ─── Static maps ───────────────────────────────────────────────────

const SIGN_ELEMENT: Record<string, "fire" | "earth" | "air" | "water"> = {
  aries: "fire", leo: "fire", sagittarius: "fire",
  taurus: "earth", virgo: "earth", capricorn: "earth",
  gemini: "air", libra: "air", aquarius: "air",
  cancer: "water", scorpio: "water", pisces: "water",
};

// Personal/social planets that have dedicated planet-in-sign cards.
const PLANET_IN_SIGN = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

// Aspect type → knowledge card key (only the five core aspects).
const ASPECT_KEYS: Record<string, string> = {
  conjunction: "aspect_conjunction",
  sextile: "aspect_sextile",
  square: "aspect_square",
  trine: "aspect_trine",
  opposition: "aspect_opposition",
};

// Chinese zodiac animal → its harmony trine card key.
const TRINE_OF: Record<string, string> = {
  rat: "trine_1", dragon: "trine_1", monkey: "trine_1",
  ox: "trine_2", snake: "trine_2", rooster: "trine_2",
  tiger: "trine_3", horse: "trine_3", dog: "trine_3",
  rabbit: "trine_4", goat: "trine_4", pig: "trine_4",
};

// HD-inspired center name → card-key base. Only existing cards get selected
// (missing defined/open variants simply resolve to nothing).
const HD_CENTER_KEY: Record<string, string> = {
  "solar plexus": "solar_plexus", "sacral": "sacral", "throat": "throat",
  "g": "g", "g center": "g", "identity": "g", "self": "g",
  "heart": "heart", "ego": "heart", "will": "heart",
  "spleen": "spleen", "splenic": "spleen",
  "head": "head_ajna", "ajna": "head_ajna", "mind": "head_ajna",
  "root": "root",
};

const ELEMENTS = ["wood", "fire", "earth", "metal", "water"];

// Ten God name (provider may send English / pinyin / CJK) → BaZi card key.
const TEN_GOD_KEY: Record<string, string> = {
  "companion": "ten_god_companion", "friend": "ten_god_companion", "peer": "ten_god_companion", "bi jian": "ten_god_companion", "比肩": "ten_god_companion",
  "rob wealth": "ten_god_rob_wealth", "jie cai": "ten_god_rob_wealth", "劫财": "ten_god_rob_wealth",
  "eating god": "ten_god_eating_god", "shi shen": "ten_god_eating_god", "食神": "ten_god_eating_god",
  "hurting officer": "ten_god_hurting_officer", "shang guan": "ten_god_hurting_officer", "伤官": "ten_god_hurting_officer",
  "direct wealth": "ten_god_direct_wealth", "zheng cai": "ten_god_direct_wealth", "正财": "ten_god_direct_wealth",
  "indirect wealth": "ten_god_indirect_wealth", "pian cai": "ten_god_indirect_wealth", "偏财": "ten_god_indirect_wealth",
  "direct officer": "ten_god_direct_officer", "zheng guan": "ten_god_direct_officer", "正官": "ten_god_direct_officer",
  "seven killings": "ten_god_seven_killings", "seven killing": "ten_god_seven_killings", "qi sha": "ten_god_seven_killings", "七杀": "ten_god_seven_killings",
  "direct resource": "ten_god_direct_resource", "zheng yin": "ten_god_direct_resource", "正印": "ten_god_direct_resource",
  "indirect resource": "ten_god_indirect_resource", "pian yin": "ten_god_indirect_resource", "偏印": "ten_god_indirect_resource",
};

function tenGodKey(name: string): string | undefined {
  return TEN_GOD_KEY[name.toLowerCase().replace(/_/g, " ").trim()];
}
function strengthKey(s?: string | null): string | undefined {
  const v = (s ?? "").toLowerCase();
  if (!v) return undefined;
  if (v.includes("strong")) return "strength_strong";
  if (v.includes("weak")) return "strength_weak";
  return "strength_balanced";
}

const HD_TYPE_KEY: Record<string, string> = {
  "generator": "type_generator",
  "manifesting generator": "type_manifesting_generator",
  "manifestor": "type_manifestor",
  "projector": "type_projector",
  "reflector": "type_reflector",
};

const HD_AUTHORITY_KEY: Record<string, string> = {
  "emotional": "authority_emotional",
  "emotional/solar plexus": "authority_emotional",
  "solar plexus": "authority_emotional",
  "sacral": "authority_sacral",
  "splenic": "authority_splenic",
  "spleen": "authority_splenic",
  "ego": "authority_ego",
  "heart": "authority_ego",
  "self-projected": "authority_self_projected",
  "self projected": "authority_self_projected",
  "g": "authority_self_projected",
  "mental": "authority_mental",
  "none": "authority_mental",
  "lunar": "authority_lunar",
};

const LENS_TAGS: Record<string, SynthesisTag[]> = {
  romance: ["connection_love"],
  romantic: ["connection_love"],
  friendship: ["connection_love", "communication"],
  family: ["nurture_care", "connection_love"],
  work: ["work_focus", "communication"],
  colleague: ["work_focus", "communication"],
  growth: ["learning_growth", "change_release"],
};

// Light keyword -> tag map for scanning free-text focus problem statements.
const TEXT_TAG_HINTS: Array<[RegExp, SynthesisTag]> = [
  [/\b(talk|say|tell|conversation|express|word)/i, "communication"],
  [/\b(start|begin|launch|go for it|take action|do it)/i, "action_initiative"],
  [/\b(tired|exhaust|burn ?out|rest|overwhelm|depleted)/i, "rest_recovery"],
  [/\b(love|partner|relationship|date|connect|lonely)/i, "connection_love"],
  [/\b(boundary|no\b|say no|space|protect|limit)/i, "boundaries"],
  [/\b(work|job|study|exam|project|deadline|career)/i, "work_focus"],
  [/\b(let go|change|move on|release|ending|transition)/i, "change_release"],
  [/\b(worth|enough|confidence|deserve|self[- ]?esteem)/i, "self_worth"],
  [/\b(create|art|write|make|design|idea)/i, "creativity"],
  [/\b(decide|choice|decision|should i|crossroad)/i, "decision_clarity"],
  [/\b(wait|timing|patience|rush|too soon)/i, "timing_patience"],
  [/\b(grief|loss|mourn|died|death of|miss them)/i, "grief_processing"],
  [/\b(stress|anxious|panic|calm|nervous|overwhelm)/i, "stress_regulation"],
  [/\b(plan|organi|structure|schedule|step by step)/i, "planning_structure"],
];

// ─── Helpers ───────────────────────────────────────────────────────

function push(cards: KnowledgeCard[], seen: Set<string>, c?: KnowledgeCard) {
  if (c && !seen.has(c.id)) {
    seen.add(c.id);
    cards.push(c);
  }
}

function textHintTags(text: string): SynthesisTag[] {
  const out = new Set<SynthesisTag>();
  for (const [re, tag] of TEXT_TAG_HINTS) if (re.test(text)) out.add(tag);
  return [...out];
}

// ─── Main selection ────────────────────────────────────────────────

export function selectKnowledge(ctx: KnowledgeContext): KnowledgeSelection {
  const cards: KnowledgeCard[] = [];
  const seen = new Set<string>();

  // 1. Astrology — sun, moon (by element), rising, planet-in-sign, houses, aspects.
  //    Everything here is gated on REAL provider data; nothing is ever guessed.
  if (ctx.astrology) {
    const planets = ctx.astrology.planets ?? [];
    const sun = planets.find((p) => p.planet === "Sun");
    if (sun) push(cards, seen, cardByKeyInSystem("western_astrology", `sun_${sun.sign.toLowerCase()}`));
    const moon = planets.find((p) => p.planet === "Moon");
    if (moon) {
      const el = SIGN_ELEMENT[moon.sign.toLowerCase()];
      if (el) push(cards, seen, cardByKeyInSystem("western_astrology", `moon_${el}`));
    }
    if (ctx.astrology.ascendant?.sign) {
      push(cards, seen, cardByKeyInSystem("western_astrology", "rising_core"));
    }

    // Planet-in-sign for the personal/social planets (real signs only).
    for (const planet of PLANET_IN_SIGN) {
      const p = planets.find((pl) => pl.planet === planet);
      if (p?.sign) push(cards, seen, cardByKeyInSystem("western_astrology", `${planet.toLowerCase()}_${p.sign.toLowerCase()}`));
    }

    // Houses require an accurate birth time. Select the houses the Sun and Moon
    // fall in (the most personal). The provider returns no houses without a
    // birth time, so this never fabricates an angle.
    if (ctx.astrology.hasAccurateTime && (ctx.astrology.houses?.length ?? 0) > 0) {
      for (const luminary of ["Sun", "Moon"]) {
        const lp = planets.find((pl) => pl.planet === luminary);
        if (lp?.house) push(cards, seen, cardByKeyInSystem("western_astrology", `house_${lp.house}`));
      }
    }

    // Aspects between natal planets, when the provider supplies them. Take the
    // two tightest-orb aspects involving a personal planet, mapped to their type.
    const aspects = (ctx.astrology.aspects ?? []).filter((a) => ASPECT_KEYS[(a.type ?? "").toLowerCase()]);
    const personal = new Set(["Sun", "Moon", "Mercury", "Venus", "Mars"]);
    aspects
      .filter((a) => personal.has(a.planetA) || personal.has(a.planetB))
      .sort((a, b) => (a.orb ?? 99) - (b.orb ?? 99))
      .slice(0, 2)
      .forEach((a) => push(cards, seen, cardByKeyInSystem("western_astrology", ASPECT_KEYS[a.type.toLowerCase()])));
  }

  // 2. Transits — moon phase (deterministic/real), plus provider-only signals
  //    (mercury retrograde) when supplied. Never fabricated.
  if (ctx.transits) {
    if (ctx.transits.mercuryRetrograde) push(cards, seen, cardByKeyInSystem("western_astrology", "mercury_retrograde"));
    const phase = ctx.transits.moonPhase?.toLowerCase() ?? "";
    if (phase.includes("new")) {
      push(cards, seen, cardByKeyInSystem("western_astrology", "new_moon"));
    } else if (phase.includes("full")) {
      push(cards, seen, cardByKeyInSystem("western_astrology", "full_moon"));
    } else if (phase.includes("waxing") || phase.includes("first quarter")) {
      push(cards, seen, cardByKeyInSystem("western_astrology", "waxing_moon"));
    } else if (phase.includes("waning") || phase.includes("last quarter")) {
      push(cards, seen, cardByKeyInSystem("western_astrology", "waning_moon"));
    }
  }

  // 3. Numerology — life path + personal day.
  if (ctx.numerology) {
    if (ctx.numerology.lifePath) push(cards, seen, cardByKeyInSystem("numerology", `life_path_${ctx.numerology.lifePath}`));
    if (ctx.numerology.personalDay) push(cards, seen, cardByKeyInSystem("numerology", `personal_day_${ctx.numerology.personalDay}`));
  }

  // 4. Chinese — animal, element, polarity, and the animal's harmony trine.
  if (ctx.chinese) {
    if (ctx.chinese.animal) {
      const animal = ctx.chinese.animal.toLowerCase();
      push(cards, seen, cardByKeyInSystem("eastern_astrology", `animal_${animal}`));
      if (TRINE_OF[animal]) push(cards, seen, cardByKeyInSystem("eastern_astrology", TRINE_OF[animal]));
    }
    if (ctx.chinese.element) push(cards, seen, cardByKeyInSystem("eastern_astrology", `element_${ctx.chinese.element.toLowerCase()}`));
    if (ctx.chinese.yinYang) push(cards, seen, cardByKeyInSystem("eastern_astrology", `polarity_${ctx.chinese.yinYang.toLowerCase()}`));
  }

  // 4b. BaZi / Four Pillars — ONLY from a real provider-backed chart. Capped so
  //     the deep Eastern layer doesn't crowd the rest. Never from the lightweight
  //     Chinese zodiac (that's handled above).
  if (ctx.bazi?.present) {
    const bz: (KnowledgeCard | undefined)[] = [];
    const get = (key: string) => cardByKeyInSystem("bazi", key);
    bz.push(get("bazi_core"));
    const dm = ctx.bazi.dayMaster;
    if (dm?.element && dm?.yinYang) bz.push(get(`day_master_${dm.yinYang.toLowerCase()}_${dm.element.toLowerCase()}`));
    const sk = strengthKey(ctx.bazi.dayMasterStrength);
    if (sk) bz.push(get(sk));
    // Element balance: the most over- and under-represented elements.
    const bal = ctx.bazi.fiveElementBalance ?? {};
    const entries = ELEMENTS.map((e) => [e, bal[e] ?? 0] as const);
    const present = entries.filter(([, n]) => n > 0);
    if (present.length) {
      const max = present.reduce((a, b) => (b[1] > a[1] ? b : a));
      const min = entries.reduce((a, b) => (b[1] < a[1] ? b : a));
      if (max[1] >= 3) bz.push(get(`element_excess_${max[0]}`));
      if (min[1] === 0) bz.push(get(`element_deficient_${min[0]}`));
    }
    for (const el of (ctx.bazi.favorableElements ?? []).slice(0, 1)) bz.push(get(`favorable_${el.toLowerCase()}`));
    for (const g of (ctx.bazi.tenGods ?? [])) {
      const k = tenGodKey(g);
      if (k) bz.push(get(k));
    }
    if (ctx.bazi.pillars?.day) bz.push(get("pillar_day"));
    if (ctx.bazi.hasLuckPillars) bz.push(get("luck_pillar_core"));
    // Cap BaZi contribution so synthesis stays cross-system balanced.
    bz.filter(Boolean).slice(0, 7).forEach((c) => push(cards, seen, c));
  }

  // 4c. Vedic / sidereal — ONLY from a real provider-backed chart. Distinct from
  //     both the Chinese zodiac and BaZi. Keyed by the Moon's nakshatra (the heart
  //     of a Vedic reading), with Sade Sati when active. Capped for balance.
  if (ctx.vedic?.present) {
    const vd: (KnowledgeCard | undefined)[] = [];
    const get = (key: string) => cardByKeyInSystem("vedic", key);
    const nakKey = (n?: string) => n ? `nak_${n.toLowerCase().trim().replace(/[^a-z]+/g, "_").replace(/^_+|_+$/g, "")}` : null;
    vd.push(get("vedic_core"));
    const mk = nakKey(ctx.vedic.moonNakshatra);
    if (mk) vd.push(get(mk));
    const ak = nakKey(ctx.vedic.ascendantNakshatra);
    if (ak && ak !== mk) vd.push(get(ak));
    if (ctx.vedic.sadeSatiActive) vd.push(get("sade_sati_active"));
    // Cap Vedic contribution so synthesis stays cross-system balanced.
    vd.filter(Boolean).slice(0, 5).forEach((c) => push(cards, seen, c));
  }

  // 5. Human Design-inspired — type, authority, profile, a couple of centers.
  if (ctx.humanDesign) {
    const t = ctx.humanDesign.type?.toLowerCase().trim();
    if (t && HD_TYPE_KEY[t]) push(cards, seen, cardByKeyInSystem("human_design_inspired", HD_TYPE_KEY[t]));
    const a = ctx.humanDesign.authority?.toLowerCase().trim();
    if (a && HD_AUTHORITY_KEY[a]) push(cards, seen, cardByKeyInSystem("human_design_inspired", HD_AUTHORITY_KEY[a]));
    const prof = ctx.humanDesign.profile?.replace("/", "_").trim();
    if (prof) push(cards, seen, cardByKeyInSystem("human_design_inspired", `profile_${prof}`));
    // Centers: select defined ("consistent") and open ("amplified") cards that
    // exist, capped so HD doesn't flood the selection. Open centers come first —
    // they're usually the most advice-relevant ("not yours to carry") themes.
    const centerCards: (KnowledgeCard | undefined)[] = [];
    for (const c of ctx.humanDesign.undefinedCenters ?? []) {
      const base = HD_CENTER_KEY[c.toLowerCase().trim()];
      if (base) centerCards.push(cardByKeyInSystem("human_design_inspired", `center_${base}_open`));
    }
    for (const c of ctx.humanDesign.definedCenters ?? []) {
      const base = HD_CENTER_KEY[c.toLowerCase().trim()];
      if (base) centerCards.push(cardByKeyInSystem("human_design_inspired", `center_${base}_defined`));
    }
    centerCards.filter(Boolean).slice(0, 3).forEach((c) => push(cards, seen, c));
  }

  // 6. Tarot draw.
  if (ctx.tarot) {
    const key = ctx.tarot.key ?? ctx.tarot.name?.toLowerCase().replace(/\s+/g, "_");
    if (key) push(cards, seen, cardByKeyInSystem("tarot", key));
  }

  // Snapshot the "real data" cards before focus-biasing — agreement is computed
  // on actual blueprint, not on topic cards we pulled in to cover the question.
  const blueprintCards = [...cards];

  // 7. Focus / problem — category tags + free-text hints bias which cards to add.
  const focusTags = new Set<SynthesisTag>();
  if (ctx.focus?.category && FOCUS_CATEGORY_TAGS[ctx.focus.category]) {
    for (const tg of FOCUS_CATEGORY_TAGS[ctx.focus.category]) focusTags.add(tg);
  }
  if (ctx.focus?.problemText) for (const tg of textHintTags(ctx.focus.problemText)) focusTags.add(tg);

  // Connection lens (no third-party data — lens only).
  if (ctx.connection?.involved) {
    const lensTags = LENS_TAGS[(ctx.connection.lens ?? "").toLowerCase()] ?? ["connection_love"];
    for (const tg of lensTags) focusTags.add(tg);
  }

  // Pull up to 3 blueprint cards that resonate with the focus tags to the front
  // (already selected ones just get prioritised; we don't add off-system noise).
  // Extra non-card signals that can create tension (journals, activity, focus).
  const extraSignalTags: SynthesisTag[] = [
    ...(ctx.journalThemeTags ?? []),
    ...(ctx.activityTags ?? []),
    ...focusTags,
  ];

  // 8. Agreement + tension + confidence (deterministic).
  const agreement = agreementTags(blueprintCards);
  const tension = tensionTags(blueprintCards, extraSignalTags);
  const label = confidenceLabel(agreement, tension, blueprintCards.length);

  // 9. Safety scan of the user's own words.
  const safetyCats = ctx.userMessage ? scanUserInputSafety(ctx.userMessage) : [];
  const safetyWarnings: SafetyWarning[] = safetyCats.map((category) => ({
    category,
    guidance: SAFETY_GUIDANCE[category],
  }));

  // 10. Synthesis tags (ordered by frequency across selected cards + signals).
  const tagFreq = new Map<SynthesisTag, number>();
  for (const c of cards) for (const tg of c.synthesisTags) tagFreq.set(tg, (tagFreq.get(tg) ?? 0) + 1);
  for (const tg of extraSignalTags) tagFreq.set(tg, (tagFreq.get(tg) ?? 0) + 1);
  const synthesisTagsOut = [...tagFreq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tg]) => tg);

  // 11. Suggested action types.
  let suggestedActionTypes = pickActions(cards, focusTags);
  const crisis = safetyCats.includes("self_harm_crisis") || safetyCats.includes("abuse_safety");
  if (crisis) {
    // In crisis, suppress directive actions — lead with grounding + real support.
    suggestedActionTypes = ["nervous_system_reset"];
  }

  return {
    selectedKnowledgeCards: cards,
    synthesisTags: synthesisTagsOut,
    agreementSignals: agreement,
    tensionSignals: tension,
    confidenceLabel: label,
    confidenceLabelText: CONFIDENCE_LABELS[label],
    safetyWarnings,
    suggestedActionTypes,
  };
}

function pickActions(cards: KnowledgeCard[], focusTags: Set<SynthesisTag>): ActionType[] {
  const freq = new Map<ActionType, number>();
  for (const c of cards) {
    const weight = c.synthesisTags.some((t) => focusTags.has(t)) ? 2 : 1;
    for (const a of c.supportiveActions) freq.set(a, (freq.get(a) ?? 0) + weight);
  }
  const ranked = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || ACTION_TYPES.indexOf(a[0]) - ACTION_TYPES.indexOf(b[0]))
    .map(([a]) => a)
    .slice(0, 4);
  // Always offer at least one safe, universal action.
  if (ranked.length === 0) return ["journal_prompt"];
  return ranked;
}
