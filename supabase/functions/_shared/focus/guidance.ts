// generateFocusGuidance / generateFocusCheckinGuidance — warm, practical,
// user-led guidance. Evidence chips are built DETERMINISTICALLY from the context
// that was actually included (never hallucinated); the LLM only writes the warm
// narrative. Crisis content short-circuits to safe, supportive escalation with
// NO astrological "prediction". Falls back cleanly when the LLM is unavailable.

import { z } from "zod";
import { llm } from "../llm.ts";
import { CRISIS_RESPONSE, supportModeDirective } from "../voice.ts";
import type { Confidence } from "../synthesis/types.ts";
import type {
  FocusCheckinGuidance,
  FocusContext,
  FocusEvidence,
  FocusGuidance,
} from "./types.ts";

// ─── deterministic, grounded evidence from the included context ────
export function focusEvidence(ctx: FocusContext): FocusEvidence[] {
  const ev: FocusEvidence[] = [];
  const bp = ctx.blueprint;
  const hdConf: Confidence = bp.timeKnown && bp.hdType ? "high" : "low";

  ev.push({
    system: "astrology",
    signal: `${bp.sunSign} Sun · ${bp.moonSign} Moon${bp.rising ? ` · ${bp.rising} Rising` : ""}`,
    detail: "Your core astrological signature shapes how this situation tends to land for you.",
    confidence: bp.timeKnown ? "high" : "medium",
    source: bp.timeKnown ? "Your natal chart." : "Sun & Moon exact; Rising needs your birth time.",
  });
  ev.push({
    system: "numerology",
    signal: `Life Path ${bp.lifePath}`,
    detail: "What you're here to learn colors what this moment is asking of you.",
    confidence: "high",
    source: "From your birth date.",
  });
  ev.push({
    system: "chinese",
    signal: `${bp.element} ${bp.animal}`,
    detail: "Your elemental temperament hints at your natural pace through this.",
    confidence: "high",
    source: "Your year pillar (exact from your birth date).",
  });
  if (bp.hdType) {
    ev.push({
      system: "human_design",
      signal: `${bp.hdType}${bp.hdAuthority ? ` · ${bp.hdAuthority} Authority` : ""}`,
      detail: "How you're built to decide is worth honoring here.",
      confidence: hdConf,
      source: bp.timeKnown ? "Computed from your exact birth time." : "Add your birth time for precision.",
    });
  }

  if (ctx.day) {
    ev.push({
      system: "biorhythm",
      signal: `Personal Day ${ctx.day.personalDay} · Moon in ${ctx.day.moonSign}`,
      detail: "Today's energy is part of the backdrop, not a verdict.",
      confidence: "medium",
      source: `Today's transits and your personal-day number.`,
    });
    ev.push({
      system: "tarot",
      signal: ctx.day.tarot,
      detail: "Your card of the day offers a gentle lens, nothing fixed.",
      confidence: "low",
      source: "Today's deterministic draw.",
    });
  }

  if (ctx.memoryThemes.length) {
    ev.push({
      system: "memory",
      signal: ctx.memoryThemes.map((t) => t.label).slice(0, 4).join(", "),
      detail: "Themes you asked Soluna to keep in mind.",
      confidence: "medium",
      source: "Your approved memory themes.",
    });
  }
  if (ctx.journalThemes.length) {
    ev.push({
      system: "journal",
      signal: ctx.journalThemes.slice(0, 4).join(", "),
      detail: "Recurring threads from your recent journaling.",
      confidence: "medium",
      source: "Summarized from your recent journal tags + titles (never the full entries).",
    });
  }
  if (ctx.savedReadings.length) {
    ev.push({
      system: "saved_reading",
      signal: ctx.savedReadings.slice(0, 3).join("; "),
      detail: "Guidance you found worth keeping.",
      confidence: "low",
      source: "Your saved readings.",
    });
  }
  if (ctx.askSnippets.length) {
    ev.push({
      system: "ask_history",
      signal: `${ctx.askSnippets.length} recent question${ctx.askSnippets.length === 1 ? "" : "s"} you've explored`,
      detail: "What you've been asking about lately gives helpful texture.",
      confidence: "low",
      source: "A limited, recent slice of your Ask history.",
    });
  }
  if (ctx.relationship) ev.push(...ctx.relationship.evidence);

  return ev;
}

// ─── crisis-safe guidance (no LLM, no astrology "prediction") ──────
function crisisGuidance(): FocusGuidance {
  return {
    whatSolunaNotices:
      "What you're carrying sounds really heavy, and I'm genuinely glad you put words to it.",
    deeperPattern:
      "Right now the most important thing isn't a chart — it's making sure you're safe and not alone with this.",
    watchFor: "Please be gentle with yourself; you don't have to hold all of this by yourself.",
    tryThisNext:
      "Reach out to someone you trust, or to a trained person who can help right now.",
    reflectionPrompt: "Who is one person you could reach toward today?",
    followUpQuestion: "Would it help to talk through who you might reach out to?",
    evidence: [] as FocusEvidence[],
    safetyNote: CRISIS_RESPONSE,
    suggestedMemoryTheme: null,
  };
}

// ─── LLM narrative ─────────────────────────────────────────────────
const narrativeSchema = z.object({
  whatSolunaNotices: z.string().min(10),
  deeperPattern: z.string().min(10),
  watchFor: z.string().min(5),
  tryThisNext: z.string().min(5),
  relationshipGuidance: z.string().optional(),
  reflectionPrompt: z.string().min(5),
  followUpQuestion: z.string().min(5),
  suggestedMemoryTheme: z.object({ label: z.string(), description: z.string() }).nullable().optional(),
});

const FOCUS_TONE_RULES =
  "This is SOLUNA FOCUS — guidance for a real situation the person is navigating. " +
  "Be warm, practical, and USER-LED: offer perspective and options, never commands. " +
  "Never deterministic — no fate, no 'the universe says you must', no fear, no doom. " +
  "Do not imitate any motivational speaker or public figure. No medical, legal, or " +
  "financial certainty. Ground everything in THEIR data; if something is missing, be honest.";

function contextDigest(ctx: FocusContext): string {
  const b = ctx.blueprint;
  const lines = [
    `Category: ${ctx.input.category}. They wrote: "${ctx.input.problemText}"`,
    `Blueprint: ${b.sunSign} Sun, ${b.moonSign} Moon, ${b.rising ?? "Rising unknown"}, Life Path ${b.lifePath}, ` +
    `${b.element} ${b.animal}, ${b.hdType ?? "HD needs birth time"}${b.hdAuthority ? ` (${b.hdAuthority})` : ""}.`,
  ];
  if (ctx.day) {
    lines.push(`Today: Personal Day ${ctx.day.personalDay}, Moon in ${ctx.day.moonSign} (${ctx.day.moonPhase}), ` +
      `${ctx.day.chineseDaily}, card ${ctx.day.tarot}.`);
  }
  if (ctx.memoryThemes.length) lines.push(`Approved memory themes: ${ctx.memoryThemes.map((t) => t.label).join(", ")}.`);
  if (ctx.journalThemes.length) lines.push(`Recent journal themes: ${ctx.journalThemes.join(", ")}.`);
  if (ctx.savedReadings.length) lines.push(`Saved readings: ${ctx.savedReadings.join("; ")}.`);
  if (ctx.askSnippets.length) lines.push(`Recently asked about: ${ctx.askSnippets.join(" | ")}.`);
  if (ctx.relationship) {
    lines.push(`Selected ${ctx.relationship.kind} "${ctx.relationship.name}" (${ctx.relationship.lens} lens). ` +
      `Shared dynamics: ${ctx.relationship.evidence.map((e) => e.signal).join("; ") || "limited"}. ` +
      `Do NOT reference any private notes about them.`);
  }
  if (ctx.priorGuidance) lines.push(`Earlier you told them: "${ctx.priorGuidance.tryThisNext}".`);
  return lines.join("\n");
}

function fallbackNarrative(ctx: FocusContext) {
  const b = ctx.blueprint;
  return {
    whatSolunaNotices:
      `${ctx.preferredName}, it takes courage to name what you're navigating around ${ctx.input.category.replace("_", " ")}. ` +
      `With your ${b.sunSign} Sun and Life Path ${b.lifePath}, you tend to feel this kind of thing deeply — that's a strength, not a flaw.`,
    deeperPattern:
      "Underneath the immediate worry there's usually a value you're trying to protect. Naming that value tends to make the next step clearer.",
    watchFor:
      "Watch for the urge to solve everything at once, or to decide based on pressure rather than what genuinely feels right to you.",
    tryThisNext:
      "Pick one small, reversible step you could take in the next day or two — something that honors what matters to you without forcing the outcome.",
    relationshipGuidance: ctx.relationship
      ? `With ${ctx.relationship.name}, lead with curiosity over conclusions — ask before assuming, and name what you appreciate.`
      : undefined,
    reflectionPrompt: "What would the most grounded version of me do here — not the most fearful, and not the most idealistic?",
    followUpQuestion: "When you imagine taking that small step, what comes up — relief, resistance, or something else?",
    suggestedMemoryTheme: null,
  };
}

export async function generateFocusGuidance(
  ctx: FocusContext,
): Promise<{ guidance: FocusGuidance; usedFallback: boolean }> {
  if (ctx.crisis) {
    return { guidance: crisisGuidance(), usedFallback: false };
  }

  const evidence = focusEvidence(ctx);
  const wantsRelationship = !!ctx.relationship;
  const prompt = [
    contextDigest(ctx),
    "",
    "Return JSON {whatSolunaNotices (warm reflection of what they shared), deeperPattern " +
    "(the pattern underneath, framed kindly), watchFor (a gentle heads-up, not a warning), " +
    "tryThisNext (ONE small, doable, user-led next step)," +
    (wantsRelationship ? " relationshipGuidance (one warm, constructive line about the selected person)," : "") +
    " reflectionPrompt (one question for them), followUpQuestion (an inviting question to continue), " +
    "suggestedMemoryTheme (ONLY if a clear recurring theme emerges, as {label, description} they can " +
    "choose to save — otherwise null)}.",
  ].join("\n");

  try {
    const parsed = await llm.completeJSON([{ role: "user", content: prompt }], narrativeSchema, {
      system: `${FOCUS_TONE_RULES}\n\n${supportModeDirective(ctx.input.supportMode)}`,
      temperature: 0.7,
      maxTokens: 800,
    });
    return {
      guidance: {
        ...parsed,
        relationshipGuidance: wantsRelationship ? parsed.relationshipGuidance : undefined,
        evidence,
        suggestedMemoryTheme: parsed.suggestedMemoryTheme ?? null,
      },
      usedFallback: false,
    };
  } catch (_e) {
    return { guidance: { ...fallbackNarrative(ctx), evidence }, usedFallback: true };
  }
}

// ─── check-in update ───────────────────────────────────────────────
const checkinSchema = z.object({
  whatShifted: z.string().min(5),
  nextStep: z.string().min(5),
  keepPauseOrResolve: z.enum(["keep", "pause", "resolve"]),
  reflectionPrompt: z.string().min(5),
});

const CHECKIN_LEAD: Record<string, string> = {
  better: "It sounds like something eased — that's worth noticing.",
  still_unclear: "Still foggy is okay; clarity often arrives in layers.",
  harder_than_expected: "That it's harder than expected isn't failure — it's information.",
  took_the_step: "You took the step. However it landed, that took something real.",
  not_yet: "Not yet is a complete answer. Timing is part of wisdom.",
};

function fallbackCheckin(ctx: FocusContext, status: string): FocusCheckinGuidance {
  return {
    whatShifted: CHECKIN_LEAD[status] ?? "Thanks for checking back in — that self-awareness matters.",
    nextStep: "Choose one small, kind thing you can do next that keeps you moving at your own pace.",
    keepPauseOrResolve: "keep",
    reflectionPrompt: "What's one thing you understand about this now that you didn't before?",
    evidence: focusEvidence(ctx),
  };
}

export async function generateFocusCheckinGuidance(
  ctx: FocusContext,
  checkinStatus: string,
  checkinText: string | undefined,
): Promise<{ guidance: FocusCheckinGuidance; usedFallback: boolean }> {
  const evidence = focusEvidence(ctx);
  const prompt = [
    contextDigest(ctx),
    `Check-in status: ${checkinStatus}.${checkinText ? ` They added: "${checkinText}"` : ""}`,
    ctx.priorGuidance ? `Your earlier suggestion was: "${ctx.priorGuidance.tryThisNext}".` : "",
    "",
    "Return JSON {whatShifted (acknowledge what changed since last time), nextStep (one small, " +
    "user-led next step), keepPauseOrResolve (suggest 'keep', 'pause', or 'resolve' — never force " +
    "resolve; default to 'keep'), reflectionPrompt (one question)}.",
  ].join("\n");
  try {
    const parsed = await llm.completeJSON([{ role: "user", content: prompt }], checkinSchema, {
      system: `${FOCUS_TONE_RULES}\n\n${supportModeDirective(ctx.input.supportMode)}`,
      temperature: 0.7,
      maxTokens: 500,
    });
    return { guidance: { ...parsed, evidence }, usedFallback: false };
  } catch (_e) {
    return { guidance: fallbackCheckin(ctx, checkinStatus), usedFallback: true };
  }
}
