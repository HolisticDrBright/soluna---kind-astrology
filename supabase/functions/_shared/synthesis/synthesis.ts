// SynthesisEngine — the LLM phrasing layer. Every call runs in SOLUNA_VOICE,
// validates its JSON against a schema, and falls back to a safe, on-voice
// deterministic result if the model is unavailable or trips a guardrail.

import { z } from "zod";
import { llm } from "../llm.ts";
import { LLMUnavailableError } from "../llm.ts";
import { SAFE_FALLBACK_READING } from "../voice.ts";
import type { DayContext } from "./context.ts";
import type { AgreementResult } from "./agreement.ts";
import type { Blueprint } from "../engines/blueprint.ts";
import type { ChineseAnimal, ZodiacSign } from "../engines/types.ts";

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
      temperature: 0.7,
      maxTokens: 900,
    });
    return { reading, usedFallback: false };
  } catch (_e) {
    return { reading: fallbackDailyReading(ctx, agreement), usedFallback: true };
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

const compatibilitySchema = z.object({
  label: z.string(),
  blendedSummary: z.string(),
  whereYouFlow: z.string(),
  whereYouGrow: z.string(),
  howToLove: z.array(z.string()),
  tip: z.string(),
});
export type CompatibilityBody = z.infer<typeof compatibilitySchema> & CompatScores & { lens: string };

export async function generateCompatibility(
  self: { name: string; sunSign: ZodiacSign; lifePath: number; animal: ChineseAnimal },
  other: { name: string; sunSign: ZodiacSign; lifePath: number; animal: ChineseAnimal },
  lens: string,
): Promise<{ body: CompatibilityBody; usedFallback: boolean }> {
  const scores = compatibilityScore(self, other);
  const prompt =
    `Describe the ${lens} compatibility between ${self.name} (${self.sunSign} sun, Life Path ` +
    `${self.lifePath}, ${self.animal}) and ${other.name} (${other.sunSign} sun, Life Path ` +
    `${other.lifePath}, ${other.animal}). Blended scores — astrology ${scores.astrologyScore}, ` +
    `numerology ${scores.numerologyScore}, Chinese ${scores.chineseScore}, overall ` +
    `${scores.overall}. Frame constructively (no doom; differences are growth, not flaws). ` +
    `Return JSON {label (2-4 word vibe), blendedSummary, whereYouFlow, whereYouGrow, ` +
    `howToLove (3 short actionable items), tip (one ${lens}-specific suggestion)}.`;
  try {
    const parsed = await llm.completeJSON(
      [{ role: "user", content: prompt }],
      compatibilitySchema,
      { temperature: 0.7, maxTokens: 700 },
    );
    return { body: { ...parsed, ...scores, lens }, usedFallback: false };
  } catch (_e) {
    return {
      body: {
        label: scores.overall >= 80 ? "Naturally easy" : scores.overall >= 65 ? "Warm & workable" : "Growth pairing",
        blendedSummary:
          `Across astrology, numerology, and Chinese astrology, your ${lens} connection with ` +
          `${other.name} blends to about ${scores.overall}%. Every pairing has its own rhythm — ` +
          `yours included.`,
        whereYouFlow: "You share real common ground that makes being together feel easy.",
        whereYouGrow: "Your differences are invitations to stretch gently toward each other.",
        howToLove: [
          "Lead with curiosity about how they see the world",
          "Name what you appreciate out loud",
          "Give each other room to be fully yourselves",
        ],
        tip: "Keep the connection warm with small, consistent gestures.",
        ...scores,
        lens,
      },
      usedFallback: true,
    };
  }
}

// ─── chat (Ask Soluna) helpers ─────────────────────────────────────
export function buildChatSystem(blueprint: Blueprint, memory: string[]): string {
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

export { LLMUnavailableError };
