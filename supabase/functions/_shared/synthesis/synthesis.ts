// SynthesisEngine — the LLM phrasing layer. Every call runs in SOLUNA_VOICE,
// validates its JSON against a schema, and falls back to a safe, on-voice
// deterministic result if the model is unavailable or trips a guardrail.

import { z } from "zod";
import { llm } from "../llm.ts";
import { LLMUnavailableError } from "../llm.ts";
import { SAFE_FALLBACK_READING, type SupportMode, supportModeDirective } from "../voice.ts";
import type { DayContext } from "./context.ts";
import { type AgreementResult, THEME_TITLES, type ThemeId } from "./agreement.ts";
import type { Blueprint } from "../engines/blueprint.ts";
import type { ChineseAnimal, ChineseElement, HDType, ZodiacSign } from "../engines/types.ts";
import type { SolunaShift } from "./types.ts";

// ─── daily reading ─────────────────────────────────────────────────
const dailyReadingSchema = z.object({
  heroText: z.string().min(20),
  agreement: z.object({
    summary: z.string(),
    detail: z.string(),
    perSystem: z.array(z.object({ system: z.string(), why: z.string() })),
  }),
  affirmation: z.string(),
  doEmbraceEase: z.object({ do: z.string(), embrace: z.string(), ease: z.string() }),
  energyCaption: z.string(),
});
export type DailyReading = z.infer<typeof dailyReadingSchema>;

export async function generateDailyReading(
  ctx: DayContext,
  agreement: AgreementResult,
  supportMode?: SupportMode,
): Promise<{ reading: DailyReading; usedFallback: boolean }> {
  const prompt = [
    `Write today's reading for ${ctx.preferredName}. Date: ${ctx.date}.`,
    `Blueprint: Sun ${ctx.summary.sunSign}, Moon ${ctx.summary.moonSign}, ` +
    `Rising ${ctx.summary.rising ?? "(needs birth time)"}, Life Path ${ctx.summary.lifePath}, ` +
    `${ctx.summary.element} ${ctx.summary.animal}, ` +
    `${ctx.summary.hdType ?? "(HD needs birth time)"} ${ctx.summary.hdProfile ?? ""}.`,
    `Today: Moon in ${ctx.transits.moon.sign} (${ctx.transits.moon.phase}), ` +
    `Personal Day ${ctx.personalDay}, Chinese ${ctx.chineseDaily.element} ${ctx.chineseDaily.animal}, ` +
    `Tarot card "${ctx.tarot.name}".`,
    `The systems converge on the theme "${agreement.topTheme.title}" ` +
    `(${agreement.topTheme.score} systems). Evidence: ` +
    agreement.topTheme.evidence.map((e) => `${e.system}: ${e.label}`).join("; ") + ".",
    "",
    "Return JSON with keys: heroText (2-3 warm sentences blending the systems, ending " +
    "with ONE concrete, small nudge for today), agreement {summary (one line naming how " +
    "many systems agree and on what), detail (a warm paragraph), perSystem [{system, why}] " +
    "(one tappable why per contributing system)}, affirmation (first person, kind), " +
    "doEmbraceEase {do, embrace, ease} (each a short phrase), energyCaption (3-6 words).",
  ].join("\n");

  try {
    const reading = await llm.completeJSON([{ role: "user", content: prompt }], dailyReadingSchema, {
      system: supportModeDirective(supportMode),
      temperature: 0.7,
      maxTokens: 900,
    });
    return { reading, usedFallback: false };
  } catch (_e) {
    return { reading: fallbackDailyReading(ctx, agreement), usedFallback: true };
  }
}

// ─── Soluna Shift (explainable, practical guidance) ────────────────
const shiftSchema = z.object({
  reframe: z.string().min(10),
  reset: z.string().min(5),
  braveTinyAction: z.string().min(5),
  journalPrompt: z.string().min(5),
});

// Warm, grounded, non-fear deterministic Shifts keyed to the day's theme.
const FALLBACK_SHIFTS: Record<ThemeId, Omit<SolunaShift, "supportMode">> = {
  rest: {
    reframe:
      "Today isn't asking you to push — it's offering permission to slow down. Lower output isn't falling behind; it's how you refill.",
    reset: "Sit comfortably, close your eyes, and take five slow breaths — longer on the exhale than the inhale.",
    braveTinyAction: "Say a gentle no to one thing that would only drain you today.",
    journalPrompt: "Where am I running on empty, and what would refilling actually look like?",
  },
  action: {
    reframe:
      "There's a fresh current under today, and a small beginning is enough to catch it. You don't need the whole plan — just the first move.",
    reset: "Stand up, roll your shoulders back, and take three energizing breaths before you begin.",
    braveTinyAction: "Take the first two-minute step toward something you've been putting off.",
    journalPrompt: "What would I start today if I trusted it would work out?",
  },
  connection: {
    reframe:
      "Today leans toward people, and warmth shared is warmth doubled. Connection isn't a detour from your goals — it's part of them.",
    reset: "Bring to mind one person who feels like home, and let yourself feel grateful for them for a moment.",
    braveTinyAction: "Send a genuine message to someone you've been meaning to reach.",
    journalPrompt: "Who do I want to feel closer to, and what's one small way to bridge the distance?",
  },
  focus: {
    reframe:
      "Today rewards a gentle kind of focus — one clear thing done well beats ten half-done. Narrowing in is a gift to yourself, not a limit.",
    reset: "Clear one distraction from your space and take a slow breath before choosing what matters most.",
    braveTinyAction: "Pick the single most important task and give it ten undistracted minutes.",
    journalPrompt: "If I could only finish one thing today, what would make me proudest?",
  },
  change: {
    reframe:
      "Something is ready to be set down. Release isn't loss — it's making room for what fits the you you're becoming.",
    reset: "Breathe in slowly, and on the exhale picture letting go of one small thing you've outgrown.",
    braveTinyAction: "Let go of one small thing — a task, a tab, a worry — you've been carrying out of habit.",
    journalPrompt: "What am I ready to release, and what might open up if I do?",
  },
};

function fallbackShift(themeId: ThemeId, supportMode?: SupportMode): SolunaShift {
  const base = FALLBACK_SHIFTS[themeId] ?? FALLBACK_SHIFTS.focus;
  return { ...base, supportMode };
}

/**
 * The Soluna Shift: turns the day's reading into an explainable reframe, a tiny
 * reset, one brave action, and a journal prompt — in the chosen support mode.
 * Always returns something safe and on-voice, even offline.
 */
export async function generateSolunaShift(
  ctx: DayContext,
  agreement: AgreementResult,
  supportMode?: SupportMode,
): Promise<{ shift: SolunaShift; usedFallback: boolean }> {
  const t = agreement.topTheme;
  const prompt = [
    `Write today's "Soluna Shift" for ${ctx.preferredName} — practical, explainable guidance.`,
    `The systems converge on "${t.title}" (${t.score} systems). Today: Moon in ` +
    `${ctx.transits.moon.sign} (${ctx.transits.moon.phase}), Personal Day ${ctx.personalDay}, ` +
    `${ctx.chineseDaily.element} ${ctx.chineseDaily.animal}, card "${ctx.tarot.name}".`,
    "",
    "Return JSON {reframe (a kind, grounded reframe of today's energy, 1-2 sentences), " +
    "reset (a concrete ~2-minute grounding or breathing practice), braveTinyAction (ONE " +
    "small, doable, slightly brave action for today), journalPrompt (one reflective " +
    "question)}. Keep it warm and non-fear-based. Do NOT imitate any specific public " +
    "figure or motivational speaker, and do not give medical, financial, or legal advice.",
  ].join("\n");
  try {
    const parsed = await llm.completeJSON([{ role: "user", content: prompt }], shiftSchema, {
      system: supportModeDirective(supportMode),
      temperature: 0.7,
      maxTokens: 400,
    });
    return { shift: { ...parsed, supportMode }, usedFallback: false };
  } catch (_e) {
    return { shift: fallbackShift(t.id, supportMode), usedFallback: true };
  }
}

function fallbackDailyReading(_ctx: DayContext, agreement: AgreementResult): DailyReading {
  const t = agreement.topTheme;
  return {
    heroText:
      `${SAFE_FALLBACK_READING} Today especially, several of your systems lean toward ` +
      `${t.title.toLowerCase()} — a gentle place to start is to honor that.`,
    agreement: {
      summary: `${t.score} of your systems point to ${t.title.toLowerCase()} today.`,
      detail: t.evidence.map((e) => e.signal).join(" "),
      perSystem: t.evidence.map((e) => ({ system: e.system, why: e.signal })),
    },
    affirmation: "I trust the rhythm of my own life, and I move at a pace that's kind to me.",
    doEmbraceEase: {
      do: themeDo(t.id),
      embrace: t.title,
      ease: "Pressure to do everything at once",
    },
    energyCaption: t.title,
  };
}

function themeDo(id: string): string {
  switch (id) {
    case "rest": return "Take ten quiet minutes just for you";
    case "action": return "Take one small step toward what excites you";
    case "connection": return "Reach out to someone who feels like home";
    case "focus": return "Give one task your full, undistracted attention";
    case "change": return "Let go of one small thing you've outgrown";
    default: return "Do one kind thing for yourself today";
  }
}

// ─── single-item insight ───────────────────────────────────────────
const insightSchema = z.object({ body: z.string().min(20), why: z.string().min(10) });
export type Insight = z.infer<typeof insightSchema>;

export async function generateInsight(item: {
  system: string;
  label: string;
  detail: Record<string, unknown>;
  preferredName?: string;
}): Promise<{ insight: Insight; usedFallback: boolean }> {
  const prompt =
    `Write a warm interpretation of this ${item.system} placement for ` +
    `${item.preferredName ?? "this person"}: "${item.label}". ` +
    `Details: ${JSON.stringify(item.detail)}. ` +
    `Return JSON {body (2 supportive paragraphs, growth-oriented, specific), ` +
    `why (one plain sentence explaining the mechanic — "you're seeing this because...")}.`;
  try {
    const insight = await llm.completeJSON([{ role: "user", content: prompt }], insightSchema, {
      temperature: 0.6,
      maxTokens: 500,
    });
    return { insight, usedFallback: false };
  } catch (_e) {
    return {
      insight: {
        body:
          `${item.label} is one of the threads in your blueprint. It points to a real ` +
          `strength you can lean on, and a gentle edge to keep growing into. Take what ` +
          `resonates and leave the rest.`,
        why: `You're seeing this because it's part of your ${item.system} chart.`,
      },
      usedFallback: true,
    };
  }
}

// ─── compatibility ─────────────────────────────────────────────────
const ELEMENT_OF: Record<ZodiacSign, "fire" | "earth" | "air" | "water"> = {
  Aries: "fire", Leo: "fire", Sagittarius: "fire",
  Taurus: "earth", Virgo: "earth", Capricorn: "earth",
  Gemini: "air", Libra: "air", Aquarius: "air",
  Cancer: "water", Scorpio: "water", Pisces: "water",
};

function elementHarmony(a: ZodiacSign, b: ZodiacSign): number {
  const e1 = ELEMENT_OF[a], e2 = ELEMENT_OF[b];
  if (e1 === e2) return 86;
  const pair = new Set([e1, e2]);
  if (pair.has("fire") && pair.has("air")) return 90;
  if (pair.has("earth") && pair.has("water")) return 90;
  if (pair.has("fire") && pair.has("water")) return 62;
  if (pair.has("air") && pair.has("earth")) return 66;
  return 70;
}

const TRINES: ChineseAnimal[][] = [
  ["Rat", "Dragon", "Monkey"],
  ["Ox", "Snake", "Rooster"],
  ["Tiger", "Horse", "Dog"],
  ["Rabbit", "Goat", "Pig"],
];
const CLASHES: Array<[ChineseAnimal, ChineseAnimal]> = [
  ["Rat", "Horse"], ["Ox", "Goat"], ["Tiger", "Monkey"],
  ["Rabbit", "Rooster"], ["Dragon", "Dog"], ["Snake", "Pig"],
];

function animalHarmony(a: ChineseAnimal, b: ChineseAnimal): number {
  if (a === b) return 80;
  if (TRINES.some((g) => g.includes(a) && g.includes(b))) return 90;
  if (CLASHES.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return 58;
  return 72;
}

function lifePathHarmony(a: number, b: number): number {
  if (a === b) return 82;
  const diff = Math.abs(a - b);
  return Math.max(58, 90 - diff * 5);
}

export interface CompatScores {
  overall: number;
  astrologyScore: number;
  numerologyScore: number;
  chineseScore: number;
}

/** Deterministic blended score so the number is stable across requests. */
export function compatibilityScore(
  a: { sunSign: ZodiacSign; lifePath: number; animal: ChineseAnimal },
  b: { sunSign: ZodiacSign; lifePath: number; animal: ChineseAnimal },
): CompatScores {
  const astrologyScore = elementHarmony(a.sunSign, b.sunSign);
  const numerologyScore = lifePathHarmony(a.lifePath, b.lifePath);
  const chineseScore = animalHarmony(a.animal, b.animal);
  const overall = Math.round(astrologyScore * 0.4 + numerologyScore * 0.3 + chineseScore * 0.3);
  return { overall, astrologyScore, numerologyScore, chineseScore };
}

// Structured output: arrays the UI renders directly, plus deterministic
// per-system evidence + a confidence derived from how much the systems agree.
const compatibilitySchema = z.object({
  label: z.string(),
  blendedSummary: z.string(),
  whereYouFlow: z.array(z.string()).min(1),
  whereYouGrow: z.array(z.string()).min(1),
  howToSupport: z.array(z.string()).min(1),
  tip: z.string(),
});

export interface CompatEvidence {
  system: "astrology" | "numerology" | "chinese" | "humanDesign";
  score: number | null; // null when the dimension isn't a scored number (e.g. HD)
  signal: string;
}

/** A person's facets for compatibility. Moon + HD are optional (need birth time). */
export interface CompatPerson {
  name: string;
  sunSign: ZodiacSign;
  moonSign?: ZodiacSign | null;
  lifePath: number;
  animal: ChineseAnimal;
  element?: ChineseElement;
  hdType?: HDType | null;
  timeKnown?: boolean;
}

/** Honest, deterministic notes grounded in the ACTUAL placements (not LLM prose). */
export interface CompatNotes {
  astrologyNote: string;
  numerologyNote: string;
  chineseNote: string;
  humanDesignNote: string;
  confidenceNotes: string[];
  sources: string[];
}

export type CompatibilityBody =
  & z.infer<typeof compatibilitySchema>
  & CompatScores
  & CompatNotes
  & { lens: string; score: number; confidence: number; evidenceBySystem: CompatEvidence[] };

function compatEvidence(self: CompatPerson, other: CompatPerson, scores: CompatScores): CompatEvidence[] {
  const phrase = (s: number) => (s >= 80 ? "strong harmony" : s >= 65 ? "easy complement" : "growth tension");
  const ev: CompatEvidence[] = [
    { system: "astrology", score: scores.astrologyScore, signal: `Your sun signs show ${phrase(scores.astrologyScore)}.` },
    { system: "numerology", score: scores.numerologyScore, signal: `Your Life Path numbers show ${phrase(scores.numerologyScore)}.` },
    { system: "chinese", score: scores.chineseScore, signal: `Your Chinese signs show ${phrase(scores.chineseScore)}.` },
  ];
  // Human Design is a qualitative dynamic, not a scalar — include it as evidence
  // only when both birth times are known.
  if (self.hdType && other.hdType && self.timeKnown !== false && other.timeKnown !== false) {
    ev.push({ system: "humanDesign", score: null, signal: hdDynamic(self.hdType, other.hdType) });
  }
  return ev;
}

/** Confidence: high when the three systems agree, lower when they diverge. */
function compatConfidence(scores: CompatScores): number {
  const vals = [scores.astrologyScore, scores.numerologyScore, scores.chineseScore];
  const spread = Math.max(...vals) - Math.min(...vals);
  return Math.round(Math.min(0.95, Math.max(0.5, 0.95 - spread / 100)) * 100) / 100;
}

const SIGN_ELEMENT_LABEL: Record<"fire" | "earth" | "air" | "water", string> = {
  fire: "Fire", earth: "Earth", air: "Air", water: "Water",
};

/** A warm, true description of how two HD types tend to interact. Symmetric. */
function hdDynamic(a: HDType, b: HDType): string {
  const hasSacral = (t: HDType) => t === "Generator" || t === "Manifesting Generator";
  const set = new Set<HDType>([a, b]);
  if (set.has("Reflector")) {
    return "One of you is a Reflector, who samples the energy around them — a calm, consistent shared environment helps this bond feel safe and clear.";
  }
  if (set.has("Manifestor")) {
    return "Manifestor energy initiates; the kindest key here is informing each other before acting, so momentum feels shared rather than surprising.";
  }
  if (set.has("Projector") && (hasSacral(a) || hasSacral(b))) {
    return "A natural guide-and-engine pairing: the Projector sees the other clearly, and their response gives the Projector something real to work with — best when invitations and recognition flow both ways.";
  }
  if (a === "Projector" && b === "Projector") {
    return "Two Projectors see each other well — just remember you both thrive on genuine invitation and recognition, so offer it generously.";
  }
  if (hasSacral(a) && hasSacral(b)) {
    return "You both carry sustainable life-force energy — you can build and sustain a lot together when you each follow what genuinely lights you up.";
  }
  return "Your Human Design types bring different rhythms — honoring each other's strategy keeps the energy easy between you.";
}

/** Build deterministic, honest per-system notes + confidence + sources. */
function buildCompatNotes(self: CompatPerson, other: CompatPerson, scores: CompatScores): CompatNotes {
  const harmony = (s: number) => (s >= 80 ? "flow easily" : s >= 65 ? "complement each other" : "stretch each other to grow");
  const selfEl = SIGN_ELEMENT_LABEL[ELEMENT_OF[self.sunSign]];
  const otherEl = SIGN_ELEMENT_LABEL[ELEMENT_OF[other.sunSign]];

  let astrologyNote =
    `${self.sunSign} (${selfEl}) and ${other.sunSign} (${otherEl}) suns ${harmony(scores.astrologyScore)}.`;
  const bothMoon = self.moonSign && other.moonSign;
  const moonReliable = bothMoon && self.timeKnown !== false && other.timeKnown !== false;
  if (bothMoon) {
    astrologyNote += moonReliable
      ? ` Emotionally, your ${self.moonSign} and ${other.moonSign} moons shape how you each feel cared for.`
      : ` Moon signs (${self.moonSign}/${other.moonSign}) add emotional depth, but add birth times to confirm them.`;
  }

  const numerologyNote = self.lifePath === other.lifePath
    ? `You share Life Path ${self.lifePath} — a deep, mirroring resonance in what you're each here to learn.`
    : `Life Path ${self.lifePath} and ${other.lifePath} ${harmony(scores.numerologyScore)} on what matters most to each of you.`;

  const sameTrine = scores.chineseScore >= 88;
  const clash = scores.chineseScore <= 60;
  const chineseNote = sameTrine
    ? `Your ${self.animal} and ${other.name}'s ${other.animal} fall in the same trine — a famously easy, allied pairing.`
    : clash
    ? `${self.animal} and ${other.animal} sit opposite on the zodiac wheel — spirited, and a real chance to grow through difference.`
    : `${self.animal} and ${other.animal} get along with a little understanding — neither allied nor opposed.`;

  const hdKnown = self.hdType && other.hdType && self.timeKnown !== false && other.timeKnown !== false;
  const humanDesignNote = hdKnown
    ? hdDynamic(self.hdType!, other.hdType!)
    : "Add both birth times and we can compare your Human Design types — it adds a rich layer about how your energies actually mesh.";

  const sources = [
    "Sun-sign elemental harmony (astrology)",
    "Life Path numbers (numerology)",
    "Chinese zodiac trine/clash (Chinese astrology)",
  ];
  if (hdKnown) sources.push("Human Design type dynamic");

  const confidenceNotes: string[] = [
    "This blend is grounded in Sun signs, Life Path numbers, and Chinese signs — exact from birth dates.",
  ];
  if (!bothMoon || !moonReliable) {
    confidenceNotes.push("Add birth times for both of you to include Moon-sign emotional compatibility.");
  }
  if (!hdKnown) {
    confidenceNotes.push("Human Design comparison needs both birth times — it's not in this score yet.");
  }

  return { astrologyNote, numerologyNote, chineseNote, humanDesignNote, confidenceNotes, sources };
}

export async function generateCompatibility(
  self: CompatPerson,
  other: CompatPerson,
  lens: string,
): Promise<{ body: CompatibilityBody; usedFallback: boolean }> {
  const scores = compatibilityScore(self, other);
  const notes = buildCompatNotes(self, other, scores);
  const structured = {
    ...scores,
    ...notes,
    lens,
    score: scores.overall,
    confidence: compatConfidence(scores),
    evidenceBySystem: compatEvidence(self, other, scores),
  };
  const prompt =
    `Describe the ${lens} compatibility between ${self.name} (${self.sunSign} sun, Life Path ` +
    `${self.lifePath}, ${self.animal}${self.hdType ? `, ${self.hdType}` : ""}) and ${other.name} ` +
    `(${other.sunSign} sun, Life Path ${other.lifePath}, ${other.animal}` +
    `${other.hdType ? `, ${other.hdType}` : ""}). Blended scores — astrology ${scores.astrologyScore}, ` +
    `numerology ${scores.numerologyScore}, Chinese ${scores.chineseScore}, overall ` +
    `${scores.overall}. Grounding notes you should stay consistent with: ${notes.astrologyNote} ` +
    `${notes.numerologyNote} ${notes.chineseNote} ${notes.humanDesignNote} ` +
    `Frame constructively (no doom; differences are growth, not flaws). ` +
    `Return JSON {label (2-4 word vibe), blendedSummary, whereYouFlow (2-3 short items), ` +
    `whereYouGrow (2-3 short items), howToSupport (3 short actionable items), ` +
    `tip (one ${lens}-specific suggestion)}.`;
  try {
    const parsed = await llm.completeJSON(
      [{ role: "user", content: prompt }],
      compatibilitySchema,
      { temperature: 0.7, maxTokens: 700 },
    );
    return { body: { ...parsed, ...structured }, usedFallback: false };
  } catch (_e) {
    return {
      body: {
        label: scores.overall >= 80 ? "Naturally easy" : scores.overall >= 65 ? "Warm & workable" : "Growth pairing",
        blendedSummary:
          `Across astrology, numerology, and Chinese astrology, your ${lens} connection with ` +
          `${other.name} blends to about ${scores.overall}%. Every pairing has its own rhythm — yours included.`,
        whereYouFlow: [
          "You share real common ground that makes being together feel easy.",
          "There's a natural warmth when you're in sync.",
        ],
        whereYouGrow: [
          "Your differences are invitations to stretch gently toward each other.",
          "Pace and style may differ — name it kindly when it shows up.",
        ],
        howToSupport: [
          "Lead with curiosity about how they see the world",
          "Name what you appreciate out loud",
          "Give each other room to be fully yourselves",
        ],
        tip: "Keep the connection warm with small, consistent gestures.",
        ...structured,
      },
      usedFallback: true,
    };
  }
}

// ─── chat (Ask Soluna) helpers ─────────────────────────────────────
export interface ChatSystemOpts {
  /** User-curated memory themes (only ENABLED ones are passed in). */
  themes?: { label: string; description?: string | null }[];
  supportMode?: SupportMode;
}

export function buildChatSystem(
  blueprint: Blueprint,
  memory: string[],
  opts: ChatSystemOpts = {},
): string {
  const s = blueprint.summary;
  const lines = [
    "You are answering as Soluna in a 1:1 chat. Reconcile multiple systems and",
    "answer in voice. Reference the person's actual blueprint below. Keep replies",
    "conversational and warm, not essay-length unless asked.",
    "",
    `Their blueprint: Sun ${s.sunSign}, Moon ${s.moonSign}, Rising ${s.rising ?? "(needs birth time)"}, ` +
    `Life Path ${s.lifePath}, Expression ${s.expression}, ${s.element} ${s.animal}, ` +
    `${s.hdType ?? "(HD needs birth time)"} ${s.hdProfile ?? ""} ${s.hdAuthority ? s.hdAuthority + " authority" : ""}.`,
  ];
  if (memory.length) {
    lines.push("", "What you remember about them:", ...memory.map((m) => `- ${m}`));
  }
  // Only themes the user explicitly enabled are ever surfaced here.
  if (opts.themes?.length) {
    lines.push(
      "",
      "Themes they've asked you to keep in mind (use ONLY these, gently):",
      ...opts.themes.map((t) => `- ${t.label}${t.description ? `: ${t.description}` : ""}`),
    );
  }
  const directive = supportModeDirective(opts.supportMode);
  if (directive) lines.push("", directive);
  return lines.join("\n");
}

const memorySchema = z.object({ facts: z.array(z.string()) });

/** Pull durable, non-sensitive facts worth remembering from a user message. */
export async function extractMemoryFacts(userMessage: string): Promise<string[]> {
  try {
    const { facts } = await llm.completeJSON(
      [{
        role: "user",
        content:
          `From this message, extract 0-3 durable facts worth remembering long-term about the ` +
          `person (goals, relationships, recurring themes). Skip anything sensitive (health, ` +
          `finances) or one-off. Message: "${userMessage}". Return JSON {facts: string[]}.`,
      }],
      memorySchema,
      { temperature: 0.2, maxTokens: 200 },
    );
    return facts.slice(0, 3);
  } catch (_e) {
    return [];
  }
}

// ─── bond (two-person daily) reading ───────────────────────────────
export interface SharePrefs {
  shareSun?: boolean;
  shareMoon?: boolean;
  shareNumbers?: boolean;
  shareChinese?: boolean;
  shareHumanDesign?: boolean;
}

export interface SharedFacets {
  name: string;
  sun?: string;
  moon?: string;
  lifePath?: number;
  chinese?: string;
  hdType?: string;
}

interface BondSummary {
  sunSign: string;
  moonSign: string;
  lifePath: number;
  element: string;
  animal: string;
  hdType: string | null;
}

/** Reduce a blueprint summary to only the facets a user agreed to share. */
export function shareFacets(name: string, summary: BondSummary, prefs: SharePrefs): SharedFacets {
  return {
    name,
    sun: prefs.shareSun !== false ? summary.sunSign : undefined,
    moon: prefs.shareMoon !== false ? summary.moonSign : undefined,
    lifePath: prefs.shareNumbers !== false ? summary.lifePath : undefined,
    chinese: prefs.shareChinese !== false ? `${summary.element} ${summary.animal}` : undefined,
    hdType: prefs.shareHumanDesign !== false ? (summary.hdType ?? undefined) : undefined,
  };
}

const bondSchema = z.object({
  togetherText: z.string().min(20),
  flowGrow: z.object({ flow: z.string(), grow: z.string() }),
  sharedWeather: z.string(),
});
export type BondReading = z.infer<typeof bondSchema>;

function facetLine(f: SharedFacets): string {
  const parts: string[] = [];
  if (f.sun) parts.push(`Sun ${f.sun}`);
  if (f.moon) parts.push(`Moon ${f.moon}`);
  if (f.lifePath) parts.push(`Life Path ${f.lifePath}`);
  if (f.chinese) parts.push(f.chinese);
  if (f.hdType) parts.push(f.hdType);
  return parts.length ? parts.join(", ") : "(details kept private)";
}

export async function generateBondReading(
  a: SharedFacets,
  b: SharedFacets,
  lens: string,
  weather: { moonPhase: string; moonSign: string },
): Promise<{ reading: BondReading; usedFallback: boolean }> {
  const prompt = [
    `Write today's two-person Bond reading for ${a.name} and ${b.name} (${lens} bond).`,
    `${a.name}: ${facetLine(a)}.`,
    `${b.name}: ${facetLine(b)}.`,
    `Today's shared sky: Moon in ${weather.moonSign} (${weather.moonPhase}).`,
    "",
    "Return JSON {togetherText (2-3 warm sentences on how to support each other TODAY, " +
    "ending with ONE concrete shared nudge), flowGrow {flow (where you naturally flow " +
    "together), grow (a gentle shared growth edge, framed kindly as an invitation)}, " +
    "sharedWeather (one warm line about today's shared energy)}.",
  ].join("\n");
  try {
    const reading = await llm.completeJSON([{ role: "user", content: prompt }], bondSchema, {
      temperature: 0.7,
      maxTokens: 600,
    });
    return { reading, usedFallback: false };
  } catch (_e) {
    return {
      reading: {
        togetherText:
          `Today is a lovely day for ${a.name} and ${b.name} to check in with each other. ` +
          `Lead with curiosity and warmth — a small, genuine gesture goes a long way. ` +
          `One nudge: ask each other one honest question today, and really listen.`,
        flowGrow: {
          flow: "You share real common ground that makes connecting feel easy and natural.",
          grow: "Your differences are gentle invitations to understand each other more deeply.",
        },
        sharedWeather: `The Moon in ${weather.moonSign} softly colors the mood you share today.`,
      },
      usedFallback: true,
    };
  }
}

// ─── bond ritual (daily relationship guidance) ─────────────────────
const bondRitualSchema = z.object({
  supportEachOtherToday: z.string().min(10),
  bestDayForDeepConversation: z.string().min(3),
  possibleMisread: z.string().min(10),
  sharedJournalPrompt: z.string().min(10),
});
export type BondRitualBody = z.infer<typeof bondRitualSchema>;

function fallbackBondRitual(a: SharedFacets, b: SharedFacets): BondRitualBody {
  return {
    supportEachOtherToday:
      `Today, the kindest thing ${a.name} and ${b.name} can do is listen without rushing ` +
      `to fix. A small, genuine check-in goes further than any grand gesture.`,
    bestDayForDeepConversation:
      "When you both have unhurried time this week — even twenty quiet minutes with phones away is plenty.",
    possibleMisread:
      "If one of you goes quiet, it can read as distance when it's really just a need to recharge — ask before assuming.",
    sharedJournalPrompt:
      "What's one thing we each appreciated about the other this week, and one thing we'd love a little more of?",
  };
}

/**
 * A daily relationship "ritual" for a linked bond: how to support each other,
 * the best window for a deep talk, a likely misread to soften, and a shared
 * journaling prompt. Constructive and never fatalistic; the caller attaches the
 * lens, evidence chips, and any confidence notes.
 */
export async function generateBondRitual(
  a: SharedFacets,
  b: SharedFacets,
  lens: string,
  weather: { moonPhase: string; moonSign: string },
): Promise<{ ritual: BondRitualBody; usedFallback: boolean }> {
  const prompt = [
    `Write today's relationship "ritual" for ${a.name} and ${b.name} (${lens} bond).`,
    `${a.name}: ${facetLine(a)}.`,
    `${b.name}: ${facetLine(b)}.`,
    `Today's shared sky: Moon in ${weather.moonSign} (${weather.moonPhase}).`,
    "",
    "Return JSON {supportEachOtherToday (2 warm, specific sentences on how to show up for " +
    "each other today), bestDayForDeepConversation (a grounded suggestion for when a deeper " +
    "talk may land well — a day or a kind of moment; do NOT overstate certainty), " +
    "possibleMisread (one gentle, constructive heads-up about how a difference could be " +
    "misread, with how to soften it), sharedJournalPrompt (one question they can each answer)}. " +
    "Keep it constructive and never fatalistic; no doom, no predictions about the relationship ending.",
  ].join("\n");
  try {
    const ritual = await llm.completeJSON([{ role: "user", content: prompt }], bondRitualSchema, {
      temperature: 0.7,
      maxTokens: 500,
    });
    return { ritual, usedFallback: false };
  } catch (_e) {
    return { ritual: fallbackBondRitual(a, b), usedFallback: true };
  }
}

export { LLMUnavailableError };
