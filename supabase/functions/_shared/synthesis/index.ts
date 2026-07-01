/**
 * SynthesisEngine — the "systems agree" detection and LLM phrasing.
 * 
 * 1. buildContext(userId, date): assemble blueprint + today's transits + 
 *    Personal Day + Chinese daily + tarot card into compact structured context.
 * 2. detectAgreement(context): DETERMINISTIC pass scoring thematic overlap across
 *    systems into theme sets with per-system evidence + agreement score.
 * 3. generateDailyReading(context, agreement): LLM call (SOLUNA_VOICE) returning
 *    JSON: blended hero reading, "systems agree" highlight, affirmation, Do/Embrace/Ease.
 * 4. generateInsight(item): warm interpretation for blueprint item + "why" mechanic.
 * 5. chat(userId, message): Ask Soluna — streams tokens, persists messages + memory.
 * 6. compatibility(profileA, profileB, lens): blended synastry, constructive framing.
 */

import { llmCall, llmCallJSON, type LLMMessage } from "../llm-client.ts";
import { THEMES, THEME_TAKEAWAYS, type Theme } from "../constants.ts";
import { getSupabaseAdmin, logEvent } from "../supabase.ts";
import type { AstrologyOutput } from "../engines/astrology.ts";
import type { NumerologyOutput } from "../engines/numerology.ts";
import type { ChineseOutput } from "../engines/chinese.ts";
import type { BaziOutput } from "../engines/bazi.ts";
import { hasRealBazi } from "../engines/bazi.ts";
import { hasRealVedic, type VedicOutput } from "../engines/vedic.ts";
import type { HumanDesignOutput } from "../engines/human-design.ts";
import type { BiorhythmOutput } from "../engines/biorhythm.ts";
import { cardOfTheDay } from "../engines/tarot.ts";
import { computeMoonPhase } from "../engines/moon-phase.ts";
import { selectKnowledge, type KnowledgeContext } from "../knowledge/selectKnowledge.ts";
import { formatKnowledgeForPrompt } from "../knowledge/formatKnowledgeForPrompt.ts";
import { tagsFromText } from "../knowledge/synthesis-rules.ts";
import { gatherDynamicContext } from "./knowledge-context.ts";
import { fetchPersonalizationProfile, personalizationMemoryBlock } from "../personalization.ts";
import { buildDailyFallbackParts, formatDateLabel } from "./daily-fallback.ts";

// ─── Types ─────────────────────────────────────────────────────

export interface DailyContext {
  userId: string;
  date: string;
  userName: string;
  astrology: AstrologyOutput | null;
  numerology: NumerologyOutput | null;
  chinese: ChineseOutput | null;
  bazi: BaziOutput | null;
  vedic: VedicOutput | null;
  humanDesign: HumanDesignOutput | null;
  biorhythm: BiorhythmOutput | null;
  tarotCard: { name: string; meaning: string; arcana: string } | null;
  houseSystem: string;
  /** Current Moon phase for the reading date — deterministic, real astronomy. */
  moonPhase: string | null;
  /** "Personalization memory" prompt block (how to communicate with this user).
   *  Adjusts delivery only — never any chart fact. Empty string when none. */
  personalizationMemory: string | null;
  /** Genuinely-daily transit signals (real, provider-backed) for TODAY, set by the
   *  /today path to ground the reading in today's actual sky. Null elsewhere. */
  dailyCosmos?: {
    moonPhase: string;
    moonSign: string | null;
    theme: string | null;
    topTransit: string | null;
    focusAreas: string[];
    baziDayElement: string | null;
    baziAnimal: string | null;
  } | null;
}

export interface AgreementResult {
  theme: Theme;
  label: string;
  score: number; // how many DISTINCT systems agree (≥2)
  /** Plain-language meaning of this cross-system convergence (reflective, not fate). */
  takeaway: string;
  evidence: Array<{ system: string; signal: string; detail: string }>;
}

export interface DailyReading {
  heroText: string;
  agreement: {
    highlight: string;
    systems: Array<{ system: string; what: string }>;
  };
  affirmation: string;
  doEmbraceEase: { do: string[]; embrace: string[]; easeUpOn: string[] };
  concreteNudge: string;
}

export interface InsightResult {
  body: string;
  why: string;
  strengths: string[];
  growthEdge: string;
}

// ─── DailyContext -> KnowledgeContext mapping ──────────────────

/** Map the assembled blueprint into the structural shape selectKnowledge wants. */
export function dailyContextToKnowledge(ctx: DailyContext): KnowledgeContext {
  return {
    astrology: ctx.astrology
      ? {
          planets: (ctx.astrology.planets ?? []).map((p) => ({ planet: p.planet, sign: p.sign, house: p.house })),
          ascendant: ctx.astrology.ascendant ? { sign: ctx.astrology.ascendant.sign } : null,
          // Houses + aspects are precision-sensitive: only pass them from a REAL
          // provider chart (never the dev approximation), so they're never guessed.
          houses: ctx.astrology.source === "provider"
            ? (ctx.astrology.houses ?? []).map((h) => ({ house: h.house, sign: h.sign }))
            : [],
          aspects: ctx.astrology.source === "provider"
            ? (ctx.astrology.aspects ?? []).map((a) => ({ planetA: a.planetA, planetB: a.planetB, type: a.type, orb: a.orb }))
            : [],
          hasAccurateTime: ctx.astrology.source === "provider" && ctx.astrology.timeRequired === false,
        }
      : null,
    numerology: ctx.numerology
      ? {
          lifePath: ctx.numerology.lifePath,
          personalDay: ctx.numerology.personalDay,
          personalYear: ctx.numerology.personalYear,
          expression: ctx.numerology.expression,
          soulUrge: ctx.numerology.soulUrge,
        }
      : null,
    chinese: ctx.chinese
      ? { animal: ctx.chinese.animal, element: ctx.chinese.element, yinYang: ctx.chinese.yinYang }
      : null,
    // BaZi is included ONLY when a real provider chart exists — never the
    // lightweight zodiac, never fabricated.
    bazi: hasRealBazi(ctx.bazi)
      ? {
          present: true,
          dayMaster: ctx.bazi!.dayMaster
            ? { element: ctx.bazi!.dayMaster.element, yinYang: ctx.bazi!.dayMaster.yinYang }
            : null,
          dayMasterStrength: ctx.bazi!.dayMasterStrength,
          tenGods: ctx.bazi!.tenGods,
          favorableElements: ctx.bazi!.favorableElements,
          fiveElementBalance: ctx.bazi!.fiveElementBalance,
          pillars: {
            year: !!ctx.bazi!.pillars.year,
            month: !!ctx.bazi!.pillars.month,
            day: !!ctx.bazi!.pillars.day,
            hour: !!ctx.bazi!.pillars.hour,
          },
          hasLuckPillars: ctx.bazi!.luckPillars.length > 0,
        }
      : null,
    // Vedic is included ONLY when a real provider chart exists — its knowledge
    // (nakshatras, Sade Sati) is selected from the Moon's nakshatra.
    vedic: hasRealVedic(ctx.vedic)
      ? {
          present: true,
          moonNakshatra: ctx.vedic!.moonNakshatra,
          ascendantNakshatra: ctx.vedic!.ascendant?.nakshatra,
          sadeSatiActive: ctx.vedic!.sadeSati?.active === true,
        }
      : null,
    humanDesign: ctx.humanDesign
      ? {
          type: ctx.humanDesign.type,
          authority: ctx.humanDesign.authority,
          profile: (ctx.humanDesign as { profile?: string }).profile,
          definedCenters: ctx.humanDesign.definedCenters,
          undefinedCenters: ctx.humanDesign.undefinedCenters,
        }
      : null,
    tarot: ctx.tarotCard ? { name: ctx.tarotCard.name } : null,
    // Moon phase is deterministic real astronomy; safe to pass as a transit signal.
    transits: ctx.moonPhase ? { moonPhase: ctx.moonPhase } : null,
  };
}

// ─── buildContext ──────────────────────────────────────────────

export async function buildContext(userId: string, dateStr: string): Promise<DailyContext> {
  const sb = getSupabaseAdmin();

  // Get user profile
  const { data: profile } = await sb.from("profiles")
    .select("preferred_name, full_name")
    .eq("id", userId)
    .single();

  // Get blueprint
  const { data: blueprint } = await sb.from("blueprints")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Get birth profile for house system
  const { data: birthProfile } = await sb.from("birth_profiles")
    .select("house_system")
    .eq("user_id", userId)
    .single();

  const tarotCard = cardOfTheDay(userId, dateStr);
  // Moon phase is real astronomy derived from the date alone (no provider needed).
  const moonPhase = computeMoonPhase(new Date(`${dateStr}T12:00:00Z`)).phase;

  // Personalization memory — how THIS user likes to be communicated with. It only
  // ever adjusts delivery (tone/emphasis/examples/action), never any chart fact.
  const personalizationProfile = await fetchPersonalizationProfile(sb, userId);
  const personalizationMemory = personalizationMemoryBlock(personalizationProfile) || null;

  return {
    userId,
    date: dateStr,
    userName: profile?.preferred_name ?? profile?.full_name ?? "friend",
    astrology: blueprint?.astrology as AstrologyOutput | null ?? null,
    numerology: blueprint?.numerology as NumerologyOutput | null ?? null,
    chinese: blueprint?.chinese as ChineseOutput | null ?? null,
    bazi: (blueprint?.bazi as BaziOutput | null) ?? null,
    vedic: (blueprint?.vedic as VedicOutput | null) ?? null,
    humanDesign: blueprint?.human_design as HumanDesignOutput | null ?? null,
    biorhythm: blueprint?.biorhythm_seed as BiorhythmOutput | null ?? null,
    tarotCard: tarotCard ? { name: tarotCard.name, meaning: tarotCard.meaning, arcana: tarotCard.arcana } : null,
    houseSystem: (birthProfile?.house_system as string) ?? "placidus",
    moonPhase,
    personalizationMemory,
  };
}

// ─── detectAgreement (DETERMINISTIC) ────────────────────────────

const THEME_SIGNALS: Record<Theme, Array<{ fn: (ctx: DailyContext) => boolean; system: string; detail: string }>> = {
  rest_reflection: [
    { fn: (ctx) => {
      const moon = ctx.astrology?.planets.find(p => p.planet === "Moon");
      return moon?.sign === "Cancer" || moon?.sign === "Pisces" || moon?.sign === "Taurus" || false;
    }, system: "astrology", detail: "Moon in a receptive water or earth sign suggests inward, reflective energy" },
    { fn: (ctx) => (ctx.numerology?.personalDay ?? 0) === 7 || (ctx.numerology?.personalDay ?? 0) === 2, system: "numerology", detail: "Personal Day 7 or 2 invites introspection and quiet" },
    { fn: (ctx) => {
      const hd = ctx.humanDesign;
      return hd?.type === "Reflector" || hd?.type === "Projector" || false;
    }, system: "human_design", detail: "Your Design type points toward reflection rather than initiation today" },
    { fn: (ctx) => {
      const animal = ctx.chinese?.animal;
      return animal === "Rabbit" || animal === "Goat" || false;
    }, system: "chinese", detail: "Your Chinese zodiac animal carries reflective, gentle energy" },
    { fn: (ctx) => {
      const moon = ctx.vedic?.planets?.find(p => p.planet === "Moon")?.sign;
      return moon === "Cancer" || moon === "Pisces" || moon === "Scorpio" || moon === "Taurus";
    }, system: "vedic", detail: "Your sidereal (Vedic) Moon sits in a receptive sign — an inward, restorative pull" },
  ],
  action_initiative: [
    { fn: (ctx) => {
      const sun = ctx.astrology?.planets.find(p => p.planet === "Sun");
      return sun?.sign === "Aries" || sun?.sign === "Leo" || sun?.sign === "Sagittarius" || false;
    }, system: "astrology", detail: "Sun in a fire sign brings bold, action-oriented energy" },
    { fn: (ctx) => (ctx.numerology?.personalDay ?? 0) === 1 || (ctx.numerology?.personalDay ?? 0) === 8, system: "numerology", detail: "Personal Day 1 or 8 favors initiative and decisive action" },
    { fn: (ctx) => {
      const hd = ctx.humanDesign;
      return hd?.type === "Manifestor" || hd?.type === "Manifesting Generator" || false;
    }, system: "human_design", detail: "Your Design type is wired for initiating action" },
    { fn: (ctx) => {
      const animal = ctx.chinese?.animal;
      return animal === "Dragon" || animal === "Tiger" || animal === "Horse" || false;
    }, system: "chinese", detail: "Your Chinese zodiac animal carries bold, active energy" },
    { fn: (ctx) => {
      const sun = ctx.vedic?.planets?.find(p => p.planet === "Sun")?.sign;
      return sun === "Aries" || sun === "Leo" || sun === "Sagittarius";
    }, system: "vedic", detail: "Your sidereal (Vedic) Sun is in a fire sign — initiative comes naturally" },
  ],
  connection_love: [
    { fn: (ctx) => {
      const venus = ctx.astrology?.planets.find(p => p.planet === "Venus");
      return venus?.sign === "Libra" || venus?.sign === "Taurus" || venus?.sign === "Pisces" || false;
    }, system: "astrology", detail: "Venus in a relationship-oriented sign draws attention to connection" },
    { fn: (ctx) => (ctx.numerology?.personalDay ?? 0) === 2 || (ctx.numerology?.personalDay ?? 0) === 6, system: "numerology", detail: "Personal Day 2 or 6 highlights relationships and harmony" },
    { fn: (ctx) => {
      const hd = ctx.humanDesign;
      return hd?.definedCenters.includes("G") || hd?.definedCenters.includes("Solar Plexus") || false;
    }, system: "human_design", detail: "Defined G or Solar Plexus centers emphasize connection and emotional truth" },
    { fn: (ctx) => {
      const animal = ctx.chinese?.animal;
      return animal === "Pig" || animal === "Rabbit" || animal === "Dog" || false;
    }, system: "chinese", detail: "Your Chinese zodiac animal carries relational, loyal energy" },
    { fn: (ctx) => {
      const venus = ctx.vedic?.planets?.find(p => p.planet === "Venus")?.sign;
      return venus === "Libra" || venus === "Taurus" || venus === "Pisces";
    }, system: "vedic", detail: "Your sidereal (Vedic) Venus favors harmony and close connection" },
  ],
  focus_work: [
    { fn: (ctx) => {
      const sun = ctx.astrology?.planets.find(p => p.planet === "Sun");
      return sun?.sign === "Capricorn" || sun?.sign === "Virgo" || sun?.sign === "Taurus" || false;
    }, system: "astrology", detail: "Sun in an earth sign favors grounded, productive focus" },
    { fn: (ctx) => (ctx.numerology?.personalDay ?? 0) === 4 || (ctx.numerology?.personalDay ?? 0) === 8, system: "numerology", detail: "Personal Day 4 or 8 supports building, structure, and achievement" },
    { fn: (ctx) => {
      const hd = ctx.humanDesign;
      return hd?.type === "Generator" || hd?.type === "Manifesting Generator" || false;
    }, system: "human_design", detail: "Your Generator type thrives when channeled into satisfying work" },
    { fn: (ctx) => {
      const animal = ctx.chinese?.animal;
      return animal === "Ox" || animal === "Rooster" || false;
    }, system: "chinese", detail: "Your Chinese zodiac animal carries diligent, hardworking energy" },
    { fn: (ctx) => {
      const sun = ctx.vedic?.planets?.find(p => p.planet === "Sun")?.sign;
      const saturn = ctx.vedic?.planets?.find(p => p.planet === "Saturn")?.sign;
      return sun === "Capricorn" || sun === "Virgo" || sun === "Taurus" || saturn === "Capricorn" || saturn === "Aquarius" || saturn === "Libra";
    }, system: "vedic", detail: "Grounded sidereal (Vedic) placements point to discipline and steady work" },
  ],
  change_release: [
    { fn: (ctx) => {
      const pluto = ctx.astrology?.planets.find(p => p.planet === "Pluto");
      return pluto?.sign === "Scorpio" || pluto?.sign === "Aquarius" || false;
    }, system: "astrology", detail: "Pluto in a transformative sign signals deep change and release" },
    { fn: (ctx) => (ctx.numerology?.personalDay ?? 0) === 9 || (ctx.numerology?.personalDay ?? 0) === 5, system: "numerology", detail: "Personal Day 9 or 5 signals completion, change, and freedom" },
    { fn: (ctx) => {
      const hd = ctx.humanDesign;
      return hd?.type === "Reflector" || (hd?.undefinedCenters?.length ?? 0) >= 6 || false;
    }, system: "human_design", detail: "Many undefined centers suggest openness to change and transformation" },
    { fn: (ctx) => {
      const animal = ctx.chinese?.animal;
      return animal === "Snake" || animal === "Monkey" || false;
    }, system: "chinese", detail: "Your Chinese zodiac animal carries transformative, adaptive energy" },
    { fn: (ctx) => {
      const moon = ctx.vedic?.planets?.find(p => p.planet === "Moon")?.sign;
      const mars = ctx.vedic?.planets?.find(p => p.planet === "Mars")?.sign;
      return moon === "Scorpio" || mars === "Scorpio";
    }, system: "vedic", detail: "A sidereal (Vedic) Scorpio placement points to transformation and release" },
  ],
};

export function detectAgreement(ctx: DailyContext): AgreementResult[] {
  const results: AgreementResult[] = [];

  for (const theme of THEMES) {
    const signals = THEME_SIGNALS[theme];
    const evidence: Array<{ system: string; signal: string; detail: string }> = [];

    for (const sig of signals) {
      try {
        if (sig.fn(ctx)) {
          evidence.push({ system: sig.system, signal: "aligned", detail: sig.detail });
        }
      } catch {
        // Skip signals that fail due to missing data
      }
    }

    // Only a GENUINE cross-system convergence counts — 2+ DISTINCT systems, not
    // two signals from the same lens. The score is the distinct-system count.
    const systemCount = new Set(evidence.map((e) => e.system)).size;
    if (systemCount >= 2) {
      results.push({
        theme,
        label: theme.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" & "),
        score: systemCount,
        takeaway: THEME_TAKEAWAYS[theme],
        evidence,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}

// ─── generateDailyReading ──────────────────────────────────────

/** Delivery-tone shift for the "what support do you need today?" selector.
 *  Adjusts ONLY the voice/emphasis — never any chart fact. */
const SUPPORT_TONES: Record<string, string> = {
  Gentle: "Take an especially soft, reassuring, tender tone — like a warm, kind friend. Lower the pressure; emphasize self-compassion and rest.",
  Clear: "Take a clear, direct, plain-spoken tone. Cut through the fog and name what matters most today, simply and without hedging.",
  Motivating: "Take an energizing, encouraging tone. Emphasize momentum and one empowering action — a gentle push toward what's possible.",
  Reflective: "Take a contemplative, spacious tone. Offer a question or two to sit with, and go a little deeper and slower.",
  Practical: "Take a grounded, practical tone. Emphasize concrete, doable steps the person can actually take today.",
};
const SUPPORT_OPENERS: Record<string, string> = {
  Gentle: "Be gentle with yourself today. ",
  Clear: "Here's today, plainly. ",
  Motivating: "Today's a day to build momentum. ",
  Reflective: "Today invites a little reflection. ",
  Practical: "Let's keep today practical. ",
};

export async function generateDailyReading(
  ctx: DailyContext,
  agreement: AgreementResult[],
  opts?: { supportMode?: string },
): Promise<DailyReading> {
  const supportMode = opts?.supportMode && SUPPORT_TONES[opts.supportMode] ? opts.supportMode : undefined;
  const toneInstruction = supportMode
    ? `\nTONE FOR TODAY: The reader asked for ${supportMode} support. ${SUPPORT_TONES[supportMode]} Keep every fact the same; only shift the delivery.\n`
    : "";
  const sunSign = ctx.astrology?.planets.find(p => p.planet === "Sun")?.sign ?? "";
  const moonSign = ctx.astrology?.planets.find(p => p.planet === "Moon")?.sign ?? "";
  const lifePath = ctx.numerology?.lifePath ?? 0;
  const personalDay = ctx.numerology?.personalDay ?? 0;
  const hdType = ctx.humanDesign?.type ?? "";
  const chineseAnimal = ctx.chinese?.animal ?? "";

  const topAgreement = agreement[0];
  const agreementText = topAgreement
    ? `Your systems agree today (${topAgreement.score}/4): ${topAgreement.evidence.map(e => `${e.system} — ${e.detail}`).join(" | ")}`
    : "Today's systems bring a mix of energies — each offering a different lens on your day.";

  const tarotCard = ctx.tarotCard;
  const tarotText = tarotCard ? `Your card today: ${tarotCard.name}. ${tarotCard.meaning}` : "";

  // Human-readable date to anchor the prompt to TODAY (see ./daily-fallback.ts).
  const dateLabel = formatDateLabel(ctx.date);

  // Today's REAL sky (provider transits) when available, else the local moon phase.
  // These are the genuinely-daily signals that make the reading change day to day.
  const dc = ctx.dailyCosmos;
  const todaySky = dc
    ? [
      `- Moon: ${dc.moonPhase}${dc.moonSign ? ` in ${dc.moonSign}` : ""}`,
      dc.theme ? `- Today's theme (from your real transits): ${dc.theme}` : "",
      dc.topTransit ? `- Notable transit today: ${dc.topTransit}` : "",
      dc.focusAreas.length ? `- Today's focus areas: ${dc.focusAreas.join(", ")}` : "",
      (dc.baziAnimal || dc.baziDayElement)
        ? `- BaZi day energy: ${[dc.baziAnimal, dc.baziDayElement].filter(Boolean).join(" · ")}`
        : "",
    ].filter(Boolean).join("\n")
    : (ctx.moonPhase ? `- Moon phase today: ${ctx.moonPhase}` : "");

  // Knowledge selection for the daily reading (deterministic; blueprint-driven).
  const dailySelection = selectKnowledge(dailyContextToKnowledge(ctx));
  const { knowledgeBlock: dailyKnowledge } = formatKnowledgeForPrompt(dailySelection);

  const messages: LLMMessage[] = [
    {
      role: "user",
      content: `Write today's daily reading for ${ctx.userName}. Use the warm Soluna voice.

CONTEXT:
- Today's date: ${dateLabel}
${todaySky}
- Sun: ${sunSign}, Moon: ${moonSign}
- Life Path: ${lifePath}, Personal Day: ${personalDay}
- Human Design Type: ${hdType}
- Chinese Zodiac: ${chineseAnimal}
- Systems Agreement: ${agreementText}
${tarotText ? `- Tarot: ${tarotText}` : ""}

${dailyKnowledge}
${ctx.personalizationMemory ? `\n${ctx.personalizationMemory}\n` : ""}
This reading is for ${dateLabel} specifically. The affirmation and gentle nudges
(do / embrace / ease up) should feel fresh for TODAY — shaped by today's moon
phase and Personal Day — not generic lines that could apply to any day.
${toneInstruction}
Return valid JSON:
{
  "heroText": "3-4 warm sentences blending these systems into a personal daily message",
  "agreement": {
    "highlight": "one line about what systems agree on",
    "systems": [{"system": "astrology", "what": "one line what astrology says today"}]
  },
  "affirmation": "a short, supportive affirmation",
  "doEmbraceEase": {
    "do": ["3 kind suggestions for what to do today"],
    "embrace": ["3 things to embrace"],
    "easeUpOn": ["3 things to ease up on"]
  },
  "concreteNudge": "ONE concrete, doable action for today"
}`,
    },
  ];

  // Date-rotated fallback. If the AI call is unavailable, the daily affirmation
  // and gentle nudges still change day to day instead of freezing on one line.
  // Deterministic by date, supportive generic language — never fabricated chart
  // data. (See ./daily-fallback.ts.)
  const rotated = buildDailyFallbackParts(ctx.date);
  const fallback: DailyReading = {
    heroText: `${supportMode ? SUPPORT_OPENERS[supportMode] : ""}Today, ${ctx.userName}, ${ctx.moonPhase ? `the ${ctx.moonPhase.toLowerCase()} moon invites` : "the cosmic weather invites"} you to move through your day with gentleness and awareness. Your ${sunSign} Sun and ${moonSign} Moon create a unique blend of clarity and intuition — trust both. Even a small moment of presence can shift how the whole day feels.`,
    agreement: {
      highlight: "Your systems are blending their voices — listen for the harmony.",
      systems: [],
    },
    affirmation: rotated.affirmation,
    doEmbraceEase: rotated.doEmbraceEase,
    concreteNudge: rotated.concreteNudge,
  };

  return await llmCallJSON(messages, fallback, { maxTokens: 800, temperature: 0.7 });
}

// ─── generateInsight ───────────────────────────────────────────

export async function generateInsight(
  system: string,
  itemKey: string,
  detail: Record<string, unknown>,
): Promise<InsightResult> {
  const messages: LLMMessage[] = [
    {
      role: "user",
      content: `Write a warm, supportive interpretation for this ${system} placement. Use the Soluna voice.

DETAILS:
System: ${system}
Key: ${itemKey}
Data: ${JSON.stringify(detail)}

Return valid JSON:
{
  "body": "2-3 warm paragraphs interpreting this placement in plain, beautiful language",
  "why": "one plain-sentence explanation of what's causing this / the underlying mechanic",
  "strengths": ["4-5 strengths this placement gives the person"],
  "growthEdge": "one gentle growth edge (never 'weakness' — frame positively as an opportunity)"
}`,
    },
  ];

  const fallback: InsightResult = {
    body: `This ${system} placement is a quiet but powerful part of your cosmic blueprint. It shapes how you move through the world in ways you might not always notice — like the current beneath the surface of a river. When you honor this energy, it can become a steady source of strength rather than something to work against.`,
    why: `This comes from your ${system} chart — a map based on your birth data that reflects the cosmic patterns active at the moment you arrived.`,
    strengths: ["Inner wisdom", "Unique perspective", "Emotional depth", "Creative resilience", "Natural intuition"],
    growthEdge: "This energy grows stronger when you give it space to express itself — try letting it lead in small ways and see what unfolds.",
  };

  return await llmCallJSON(messages, fallback, { maxTokens: 600, temperature: 0.7 });
}

// ─── chat ──────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  systemsReferenced?: string[];
}

export async function generateChatResponse(
  userId: string,
  userMessage: string,
  conversationHistory: ChatMessage[],
): Promise<{ content: string; systemsReferenced: string[] }> {
  const ctx = await buildContext(userId, new Date().toISOString().split("T")[0]);

  // Dynamic, privacy-minimised context: recent journal THEMES (not raw text),
  // the active focus, and (if the user owns it) the referenced connection's lens.
  const dyn = await gatherDynamicContext(userId);

  // Distil the user's own recent messages into activity tags (already in memory;
  // no extra DB read, and raw content never leaves this function as a "theme").
  const activityTags = [
    ...new Set(
      conversationHistory
        .filter((m) => m.role === "user")
        .slice(-6)
        .flatMap((m) => tagsFromText(m.content)),
    ),
  ];

  // DETERMINISTIC knowledge selection (the LLM writes words, not this).
  const selection = selectKnowledge({
    ...dailyContextToKnowledge(ctx),
    focus: dyn.focus,
    connection: dyn.connection,
    journalThemeTags: dyn.journalThemeTags,
    activityTags,
    userMessage,
  });
  const { knowledgeBlock, responseGuide, safetyDirective } = formatKnowledgeForPrompt(selection);

  const blueprintSummary = [
    ctx.astrology ? `Sun: ${ctx.astrology.planets.find(p => p.planet === "Sun")?.sign}, Moon: ${ctx.astrology.planets.find(p => p.planet === "Moon")?.sign}, Rising: ${ctx.astrology.ascendant?.sign ?? "unknown"}` : null,
    ctx.numerology ? `Life Path: ${ctx.numerology.lifePath}, Expression: ${ctx.numerology.expression}` : null,
    ctx.chinese ? `${ctx.chinese.animal} (${ctx.chinese.element})` : null,
    ctx.humanDesign ? `Type: ${ctx.humanDesign.type}, Authority: ${ctx.humanDesign.authority}` : null,
  ].filter(Boolean).join(" | ");

  // One context system message. SOLUNA_VOICE is prepended inside llmCall; the
  // llm-client fix means this second system message is now reliably delivered on
  // Anthropic too. We pass the user's own focus text, but NEVER raw journals or
  // another person's chart — only distilled knowledge + signal labels.
  const contextSystem = [
    `You are Soluna, speaking to ${ctx.userName}.`,
    blueprintSummary ? `Their blueprint: ${blueprintSummary}.` : "",
    dyn.focus?.problemText ? `Active focus (${dyn.focus.category}): "${dyn.focus.problemText}".` : "",
    dyn.connection?.involved ? `A relationship is involved (lens: ${dyn.connection.lens}). Do not speculate about the other person's private thoughts or motives.` : "",
    ctx.personalizationMemory ? `\n${ctx.personalizationMemory}` : "",
    "",
    knowledgeBlock,
    "",
    responseGuide,
    safetyDirective,
  ].filter(Boolean).join("\n");

  const messages: LLMMessage[] = [
    { role: "system", content: contextSystem },
    ...conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  try {
    const resp = await llmCall(messages, { maxTokens: 700, temperature: 0.7 });

    await logEvent("ask_message", {
      messageLength: userMessage.length,
      responseLength: resp.content.length,
      confidence: selection.confidenceLabel,
      knowledgeCards: selection.selectedKnowledgeCards.length,
      safetyFlags: selection.safetyWarnings.map((w) => w.category),
    }, userId);

    return {
      content: resp.content,
      systemsReferenced: systemsFromSelection(selection, resp.content),
    };
  } catch (err) {
    // Surface the REAL cause (LLM provider/key error, or a context-build failure)
    // in the function logs — otherwise this is invisible and misreads as a
    // "blueprint" problem when it's usually the AI call.
    console.error("generateChatResponse failed (LLM call or context build):", err);
    await logEvent("ask_error", { error: String(err) }, userId);
    return {
      content: "I had trouble reaching my guidance just now — give me a moment and try again.",
      systemsReferenced: [],
    };
  }
}

/** Real systems actually used (from selection) unioned with text mentions. */
function systemsFromSelection(
  selection: { selectedKnowledgeCards: Array<{ system: string }> },
  text: string,
): string[] {
  const fromCards = selection.selectedKnowledgeCards
    .map((c) => (c.system === "western_astrology" ? "astrology" : c.system === "eastern_astrology" ? "chinese" : c.system === "human_design_inspired" ? "human_design" : c.system))
    .filter((s) => s === "astrology" || s === "numerology" || s === "chinese" || s === "bazi" || s === "human_design" || s === "tarot");
  return [...new Set([...fromCards, ...extractSystemsReferenced(text)])];
}

function extractSystemsReferenced(text: string): string[] {
  const refs: string[] = [];
  const patterns: Array<{ regex: RegExp; system: string }> = [
    { regex: /\b(Sun|Moon|Rising|Mars|Venus|Mercury|Jupiter|Saturn|Uranus|Neptune|Pluto|Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/gi, system: "astrology" },
    { regex: /\b(Life Path|Expression|Soul Urge|Personal (Year|Month|Day)|Number \d+)\b/gi, system: "numerology" },
    { regex: /\b(Generator|Manifestor|Projector|Reflector|Authority|Profile|Center|Gate)\b/gi, system: "human_design" },
    { regex: /\b(Rat|Ox|Tiger|Rabbit|Dragon|Snake|Horse|Goat|Monkey|Rooster|Dog|Pig|Wood|Fire|Earth|Metal|Water|Yin|Yang)\b/gi, system: "chinese" },
    { regex: /\b(BaZi|Four Pillars|Day Master|Ten Gods|Luck Pillars)\b/gi, system: "bazi" },
  ];
  for (const p of patterns) {
    if (p.regex.test(text) && !refs.includes(p.system)) {
      refs.push(p.system);
    }
  }
  return refs;
}
