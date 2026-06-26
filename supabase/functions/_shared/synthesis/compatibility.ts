/**
 * generateCompatibility — knowledge-driven compatibility reading.
 *
 * Person A is the signed-in user: we use their REAL computed blueprint and run it
 * through the deterministic knowledge SELECTION layer (the same layer Ask and
 * Today use), so the reading is grounded in actual placements + tone/safety
 * rules — not an ad-hoc "mocked with LLM" prompt.
 *
 * Person B is a connection. We only ever have their birth DATE (optionally time)
 * and a display name, so we compute ONLY what is genuinely derivable from a date
 * without a chart provider and WITHOUT fabricating placements:
 *   - Sun sign  (a calendar date fully determines this — a real value)
 *   - Life Path (deterministic from the birth date)
 *   - Chinese zodiac animal (deterministic from the birth date)
 * We never invent their Moon, Rising, houses, or aspects. The reading is framed
 * honestly as a partial, reflective lens — never a full synastry verdict.
 *
 * The numeric score is computed deterministically from those REAL signals
 * (elemental harmony, Chinese trine affinity, Life Path resonance) and kept in a
 * warm band. The LLM only writes the prose — it never invents the number.
 */

import { llmCallJSON, type LLMMessage } from "../llm-client.ts";
import { logEvent } from "../supabase.ts";
import { selectKnowledge } from "../knowledge/selectKnowledge.ts";
import { formatKnowledgeForPrompt } from "../knowledge/formatKnowledgeForPrompt.ts";
import { computeNumerology } from "../engines/numerology.ts";
import { computeChinese } from "../engines/chinese.ts";
import { buildContext, dailyContextToKnowledge } from "./index.ts";
import {
  bandLabel,
  compatibilityScore,
  sunSignFromDate,
} from "./compatibility-scoring.ts";

export interface CompatibilityResult {
  score: number;
  label: string;
  whereYouFlow: string[];
  whereYouGrow: string[];
  howToSupport: string[];
  astrologyNote: string;
  numerologyNote: string;
  /** Honest, user-facing note about what this reading is (and isn't) based on. */
  confidenceNote: string;
  /** Transparency: exactly which real signals each side contributed. */
  basis: { you: string[]; them: string[] };
}

export interface OtherPerson {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime?: string | null;
  /** Already clamped by the caller to romance | friendship | work | family. */
  lens: string;
}

/** Only the prose fields the LLM is allowed to write. */
interface CompatibilityProse {
  label?: string;
  whereYouFlow?: string[];
  whereYouGrow?: string[];
  howToSupport?: string[];
  astrologyNote?: string;
  numerologyNote?: string;
}

// ─── Prose sanitisers (deterministic scoring lives in compatibility-scoring.ts) ─

function cleanStr(v: unknown): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
}

function cleanArr(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.map((x) => String(x).trim()).filter(Boolean);
  return out.length ? out : undefined;
}

// ─── Main ────────────────────────────────────────────────────────────────────

export async function generateCompatibility(
  userId: string,
  other: OtherPerson,
): Promise<CompatibilityResult> {
  const today = new Date().toISOString().split("T")[0];
  const ctx = await buildContext(userId, today);

  // User's REAL blueprint -> deterministic knowledge selection (same layer Ask/Today use).
  const selection = selectKnowledge({
    ...dailyContextToKnowledge(ctx),
    connection: { involved: true, lens: other.lens },
  });
  const { knowledgeBlock, responseGuide: _responseGuide, safetyDirective } =
    formatKnowledgeForPrompt(selection);

  // User-side real basics.
  const youSun = ctx.astrology?.planets.find((p) => p.planet === "Sun")?.sign;
  const youMoon = ctx.astrology?.planets.find((p) => p.planet === "Moon")?.sign;
  const youLifePath = ctx.numerology?.lifePath;
  const youAnimal = ctx.chinese?.animal;

  // Connection-side: ONLY what a birth date (and name) genuinely yields. No chart.
  let themSun: string | undefined;
  let themLifePath: number | undefined;
  let themAnimal: string | undefined;
  const parsed = new Date(`${other.birthDate}T12:00:00Z`);
  if (!isNaN(parsed.getTime())) {
    themSun = sunSignFromDate(parsed);
    try {
      // Life Path is derived from the birth DATE, so it is accurate even though we
      // only have a display name (the name-based numbers are intentionally unused).
      themLifePath = computeNumerology({ fullBirthName: other.name || "Friend", birthDate: parsed }).lifePath;
    } catch { /* leave undefined rather than guess */ }
    try {
      themAnimal = computeChinese({ birthDate: parsed, birthTime: other.birthTime ?? null }).animal;
    } catch { /* leave undefined rather than guess */ }
  }

  // Deterministic score from REAL signals — the LLM never invents the number.
  const score = compatibilityScore({ youSun, themSun, youAnimal, themAnimal, youLifePath, themLifePath });

  const youBasis = [
    youSun ? `Sun ${youSun}` : null,
    youMoon ? `Moon ${youMoon}` : null,
    youLifePath ? `Life Path ${youLifePath}` : null,
    youAnimal ? `${youAnimal} (Chinese zodiac)` : null,
  ].filter(Boolean) as string[];
  const themBasis = [
    themSun ? `Sun ${themSun}` : null,
    themLifePath ? `Life Path ${themLifePath}` : null,
    themAnimal ? `${themAnimal} (Chinese zodiac)` : null,
  ].filter(Boolean) as string[];

  const confidenceNote =
    `This blends your full blueprint with ${other.name}'s Sun sign, Life Path, and Chinese zodiac animal — the parts a birth date can show. It's a reflective lens, not a full synastry (that would need their birth time and place).`;

  // Knowledge-grounded, repair-oriented prompt that is honest about partial data.
  const contextSystem = [
    `You are Soluna, writing a ${other.lens} compatibility reflection for ${ctx.userName} about their connection with ${other.name}.`,
    "",
    `${ctx.userName}'s real placements: ${youBasis.join(", ") || "limited blueprint available"}.`,
    `${other.name}'s known basics (from birth date only): ${themBasis.join(", ") || "birth date only"}.`,
    `A relationship resonance score of ${score}/100 has ALREADY been computed from these real placements — do not restate or change the number; let your tone match its spirit.`,
    "",
    knowledgeBlock,
    "",
    "COMPATIBILITY GUARDRAILS (critical):",
    "- Frame every difference as a growth invitation — never doom, fear, or a verdict.",
    "- Use repair-oriented language: curiosity over blame.",
    `- You only know ${other.name}'s Sun sign, Life Path, and Chinese animal — NOT their full chart. Never invent their Moon, Rising, or inner world.`,
    "- Never speculate about the other person's private thoughts, feelings, or motives.",
    "- Never advise ending the relationship. Keep it a gentle, reflective lens.",
    safetyDirective,
  ].filter(Boolean).join("\n");

  const messages: LLMMessage[] = [
    { role: "system", content: contextSystem },
    {
      role: "user",
      content: `Write the ${other.lens} compatibility reflection. Return valid JSON ONLY:
{
  "label": "2-4 word supportive label",
  "whereYouFlow": ["3-4 areas of natural ease, grounded in the placements above"],
  "whereYouGrow": ["3-4 growth areas framed as gentle invitations"],
  "howToSupport": ["3 warm, concrete ways to support each other"],
  "astrologyNote": "ONE honest sentence about the Sun-sign lens (acknowledge it is partial without their full chart)",
  "numerologyNote": "ONE sentence about how your Life Path numbers relate"
}`,
    },
  ];

  const proseFallback: CompatibilityProse = {
    label: bandLabel(score),
    whereYouFlow: [
      "You each bring a different rhythm, and there's room for both to breathe.",
      "Small, honest check-ins go a long way between you.",
    ],
    whereYouGrow: [
      "Letting differences stay interesting instead of something to fix.",
      "Naming what you need out loud, kindly, before it builds up.",
    ],
    howToSupport: [
      "Lead with curiosity when something puzzles you.",
      "Celebrate one small thing they did this week.",
      "Give space without it meaning distance.",
    ],
    astrologyNote: themSun && youSun
      ? `Your ${youSun} Sun and ${other.name}'s ${themSun} Sun offer one lens here — a partial view without their full chart.`
      : "Sun signs offer one gentle lens here, not the whole picture.",
    numerologyNote: youLifePath && themLifePath
      ? `Life Path ${youLifePath} and ${themLifePath} each carry their own pace; noticing the difference is the gift.`
      : "Your numbers each carry their own pace — there's room to learn each other's.",
  };

  const prose = await llmCallJSON<CompatibilityProse>(messages, proseFallback, {
    maxTokens: 700,
    temperature: 0.7,
  });

  // Score, confidence, and basis stay deterministic; the LLM only supplies prose.
  const result: CompatibilityResult = {
    score,
    label: cleanStr(prose.label) ?? bandLabel(score),
    whereYouFlow: cleanArr(prose.whereYouFlow) ?? proseFallback.whereYouFlow!,
    whereYouGrow: cleanArr(prose.whereYouGrow) ?? proseFallback.whereYouGrow!,
    howToSupport: cleanArr(prose.howToSupport) ?? proseFallback.howToSupport!,
    astrologyNote: cleanStr(prose.astrologyNote) ?? proseFallback.astrologyNote!,
    numerologyNote: cleanStr(prose.numerologyNote) ?? proseFallback.numerologyNote!,
    confidenceNote,
    basis: { you: youBasis, them: themBasis },
  };

  await logEvent("compatibility_generated", {
    lens: other.lens,
    score,
    confidence: selection.confidenceLabel,
    knowledgeCards: selection.selectedKnowledgeCards.length,
    hasUserChart: !!youSun,
    themBasisCount: themBasis.length,
  }, userId);

  return result;
}
