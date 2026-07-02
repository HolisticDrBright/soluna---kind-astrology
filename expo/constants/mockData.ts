import { Platform } from "react-native";

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCTION-SAFE shared constants, types, and reference interpretation labels.
//
// Everything here is generic and NON-user-specific (zodiac symbols, planet
// glyphs, number meanings, static option vocabularies, type definitions). It is
// safe to import in live/production mode.
//
// FAKE, user-specific sample data (MOCK_USER, demo connections, sample journal
// entries, etc.) lives in ./demoData.ts and must only be used behind an
// isDemoMode guard (see lib/runtimeMode.ts). Do NOT add fake per-user data here.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Font families ───────────────────────────────────────────────
export const Fonts = {
  heading: Platform.OS === "ios" ? "Georgia" : "serif",
  body: Platform.OS === "ios" ? "System" : "sans-serif",
  mono: Platform.OS === "ios" ? "Menlo" : "monospace",
} as const;

// ══════════════════════════════════════════════════════════════════
// ASTROLOGY
// ══════════════════════════════════════════════════════════════════

export const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;
export type ZodiacSign = (typeof ZODIAC)[number];

export const ZODIAC_SYMBOLS: Record<ZodiacSign, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

export const ZODIAC_DATES: Record<ZodiacSign, string> = {
  Aries: "Mar 21 – Apr 19", Taurus: "Apr 20 – May 20", Gemini: "May 21 – Jun 20",
  Cancer: "Jun 21 – Jul 22", Leo: "Jul 23 – Aug 22", Virgo: "Aug 23 – Sep 22",
  Libra: "Sep 23 – Oct 22", Scorpio: "Oct 23 – Nov 21", Sagittarius: "Nov 22 – Dec 21",
  Capricorn: "Dec 22 – Jan 19", Aquarius: "Jan 20 – Feb 18", Pisces: "Feb 19 – Mar 20",
};

export const PLANETS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
] as const;
export type Planet = (typeof PLANETS)[number];

export const PLANET_SYMBOLS: Record<Planet, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
};

export const HOUSE_NAMES: Record<number, string> = {
  1: "House of Self", 2: "House of Values", 3: "House of Communication",
  4: "House of Home & Family", 5: "House of Creativity", 6: "House of Health & Service",
  7: "House of Relationships", 8: "House of Transformation", 9: "House of Exploration",
  10: "House of Career & Legacy", 11: "House of Community", 12: "House of the Unconscious",
};

export interface Placement {
  planet: Planet; sign: ZodiacSign;
  /** Null when birth time is unknown — houses need an exact time (never guessed). */
  house: number | null;
  degree: number;
}
export interface ChartData {
  sun: Placement;
  moon: Placement;
  /** Null when birth time is unknown — the Rising sign can't be computed. */
  rising: ZodiacSign | null;
  placements: Placement[];
}

// ══════════════════════════════════════════════════════════════════
// NUMEROLOGY
// ══════════════════════════════════════════════════════════════════

export interface NumerologyData {
  lifePath: number;
  lifePathMeaning: string;
  expression: number;
  expressionMeaning: string;
  soulUrge: number;
  soulUrgeMeaning: string;
  personalYear: number;
  personalYearMeaning: string;
  personalMonth: number;
  personalMonthMeaning: string;
  personalDay: number;
  personalDayMeaning: string;
}

export const NUMBER_MEANINGS: Record<number, { title: string; description: string; strengths: string[]; growthEdge: string }> = {
  1: {
    title: "The Leader",
    description: "You're here to pioneer, to initiate, to be fiercely yourself. The energy of 1 is independent, courageous, and original. You're not meant to follow — your path involves learning to trust your own instincts and act on them, even when others don't understand yet.",
    strengths: ["Independent thinking", "Natural leadership", "Courage to start new things", "Original creative vision"],
    growthEdge: "Your independence can sometimes tip into isolation. Remember that asking for help isn't weakness — it's wisdom. The strongest leaders know when to lean on others.",
  },
  2: {
    title: "The Harmonizer",
    description: "You're here to bring people together. The energy of 2 is diplomatic, sensitive, and deeply attuned to relationships. You have a gift for seeing both sides of any situation and finding the middle ground. Your intuition is unusually sharp — trust it.",
    strengths: ["Deep empathy and emotional intelligence", "Natural diplomacy", "Patient, careful decision-making", "Gift for partnership and collaboration"],
    growthEdge: "Your desire for harmony can sometimes lead you to suppress your own needs. Your voice matters just as much as everyone else's — don't be afraid to use it.",
  },
  3: {
    title: "The Creative Communicator",
    description: "You're here to express, to create, to bring joy into the world through your words and your art. The energy of 3 is playful, optimistic, and magnetic. People are drawn to your warmth and wit — you make life feel lighter just by being in it.",
    strengths: ["Expressive communication", "Creative self-expression", "Natural optimism and joy", "Social warmth and charm"],
    growthEdge: "Your enthusiasm can sometimes scatter your energy across too many projects. Focus is a form of self-love — give yourself permission to go deep on one thing.",
  },
  4: {
    title: "The Builder",
    description: "You're here to create structure, stability, and something that lasts. The energy of 4 is practical, reliable, and deeply committed. You build things — relationships, careers, homes — that can weather any storm. Your steadiness is a gift to everyone who depends on you.",
    strengths: ["Reliability and follow-through", "Practical problem-solving", "Strong work ethic", "Ability to create lasting structures"],
    growthEdge: "Your love of stability can sometimes make change feel threatening. Not all change is chaos — some of it is growth knocking, and you're sturdy enough to answer.",
  },
  5: {
    title: "The Explorer",
    description: "You're here to experience life fully — through travel, adventure, and constant growth. The energy of 5 is freedom-loving, adaptable, and endlessly curious. Routine can feel like a cage to you — your soul needs variety and new horizons to feel alive.",
    strengths: ["Adaptability and resilience", "Love of adventure and new experiences", "Natural charisma", "Quick thinking in any situation"],
    growthEdge: "Your love of freedom can sometimes make commitment feel scary. True freedom isn't the absence of roots — it's choosing where to plant them.",
  },
  6: {
    title: "The Nurturer",
    description: "You're here to care for others — deeply, genuinely, and without condition. The energy of 6 is loving, responsible, and protective. You're the person people come to when they need to feel safe. Your heart is BIG, and that's one of the most beautiful things about you.",
    strengths: ["Deep capacity for love and care", "Natural sense of responsibility", "Aesthetic sensibility and love of beauty", "Gift for creating warm, safe spaces"],
    growthEdge: "Your instinct to care for others can sometimes mean you forget to care for yourself. You can't pour from an empty cup — your needs matter too.",
  },
  7: {
    title: "The Seeker",
    description: "You're here to understand — yourself, the universe, and the deep currents beneath the surface of life. The energy of 7 is analytical, spiritual, and profoundly intuitive. You need solitude to thrive, not because you don't love people, but because that's where your deepest insights live.",
    strengths: ["Deep analytical and intuitive abilities", "Spiritual and philosophical depth", "Natural research and investigation skills", "Quiet, profound wisdom"],
    growthEdge: "Your natural inclination toward solitude can sometimes become isolation. The world needs your insights — don't keep them all to yourself.",
  },
  8: {
    title: "The Powerhouse",
    description: "You're here to master the material world while staying connected to your soul. The energy of 8 is ambitious, authoritative, and deeply capable. You have an innate understanding of power — how to build it, how to use it wisely, and how to share it.",
    strengths: ["Natural leadership and authority", "Strong business and financial sense", "Ambition tempered with wisdom", "Ability to manifest goals into reality"],
    growthEdge: "Your drive for achievement can sometimes overshadow other parts of life. True success includes relationships, rest, and joy — not just accomplishments.",
  },
  9: {
    title: "The Humanitarian",
    description: "You're here to serve something bigger than yourself. The energy of 9 is compassionate, wise, and globally minded. You feel the suffering of the world deeply, and you're driven to help — not from ego, but from a genuine place of love and understanding.",
    strengths: ["Deep compassion and humanitarian spirit", "Wisdom beyond your years", "Creative and artistic talent", "Ability to see the big picture"],
    growthEdge: "Your sensitivity to the world's pain can be overwhelming. Remember that you don't have to fix everything — sometimes presence is enough.",
  },
  11: {
    title: "The Intuitive Visionary (Master Number)",
    description: "You carry the intensified energy of a Master Number 11 — deeply intuitive, spiritually awake, and here to illuminate. You may feel things before they happen, sense emotions that aren't yours, and see possibilities others miss entirely. This isn't 'weird' — it's your gift.",
    strengths: ["Extraordinary intuition", "Spiritual insight and inspiration", "Natural ability to uplift and inspire others", "Creative vision that transcends the ordinary"],
    growthEdge: "Your sensitivity can be overwhelming without proper grounding. Regular practices that anchor you — nature, movement, creative expression — aren't optional for you, they're essential.",
  },
  22: {
    title: "The Master Builder (Master Number)",
    description: "You carry the intensified energy of Master Number 22 — practical vision combined with spiritual wisdom. You're here to build something that changes the world, not through force but through inspired, grounded action. You dream big, but you also know how to make it real.",
    strengths: ["Ability to manifest large-scale visions", "Practical spirituality", "Natural leadership on a grand scale", "Gift for turning ideas into reality"],
    growthEdge: "The pressure you feel to achieve something significant is real but can be paralyzing. Start small — master builders lay one brick at a time, and each one matters.",
  },
  33: {
    title: "The Master Teacher (Master Number)",
    description: "You carry the rare, intensified energy of Master Number 33 — the heart of compassionate service. Built on the nurturing of 6 but amplified, you're here to uplift through love, teaching, and devotion to others' growth. People feel safer, seen, and more hopeful in your presence. This is the most emotionally demanding of the master numbers, and also one of the most healing.",
    strengths: ["Profound compassion and emotional generosity", "A natural gift for teaching, guiding, and healing", "Ability to hold space for others' pain without flinching", "Vision for collective wellbeing, not just your own"],
    growthEdge: "Your instinct to carry others can quietly drain you, and the call to 'serve' can tip into self-sacrifice. Your own wholeness isn't a distraction from your purpose — it's the source of it. Tend to yourself first, then give from the overflow.",
  },
};

// ══════════════════════════════════════════════════════════════════
// CHINESE ASTROLOGY
// ══════════════════════════════════════════════════════════════════

export type ChineseAnimal = "Rat" | "Ox" | "Tiger" | "Rabbit" | "Dragon" | "Snake" | "Horse" | "Goat" | "Monkey" | "Rooster" | "Dog" | "Pig";
export type ChineseElement = "Wood" | "Fire" | "Earth" | "Metal" | "Water";

export const CHINESE_ANIMAL_EMOJI: Record<ChineseAnimal, string> = {
  Rat: "🐀", Ox: "🐂", Tiger: "🐅", Rabbit: "🐇", Dragon: "🐉",
  Snake: "🐍", Horse: "🐎", Goat: "🐐", Monkey: "🐒", Rooster: "🐓", Dog: "🐕", Pig: "🐖",
};

export const CHINESE_ELEMENT_EMOJI: Record<ChineseElement, string> = {
  Wood: "🌳", Fire: "🔥", Earth: "🏔️", Metal: "⚙️", Water: "💧",
};

export interface BaZiPillar {
  heavenlyStem: string;
  earthlyBranch: ChineseAnimal;
  element: ChineseElement;
  meaning: string;
}

export interface ChineseAstrologyData {
  animal: ChineseAnimal;
  element: ChineseElement;
  elementAnimalLabel: string;
  description: string;
  strengths: string[];
  growthEdge: string;
  todayAnimal: ChineseAnimal;
  todayElement: ChineseElement;
  todayNote: string;
  /** Lightweight birth-year zodiac pillars — NOT a true BaZi chart. */
  bazi: BaZiPillar[];
}

// ── True, provider-backed BaZi / Four Pillars (distinct from the zodiac above) ──
export interface BaziViewPillar {
  label: "Year" | "Month" | "Day" | "Hour";
  stem: string;
  branch: string;
  element: string;
  animal?: string;
  /** Na Yin (sound element), e.g. "城头土". */
  nayin?: string;
  /** 12 Life Stage of the Day Master at this branch, e.g. "Peak". */
  lifeStage?: string;
}
export interface BaziViewStar {
  name: string;
  pillar?: string;
  description?: string;
}
export interface BaziView {
  /** A real provider chart with at least a Day Master. */
  available: boolean;
  /** Some inputs were missing (e.g. no birth time) — partial chart. */
  partial: boolean;
  missingInputs: string[];
  unavailableReason?: string;
  dayMaster: { stem: string; element: string; yinYang: string } | null;
  dayMasterStrength: string | null;
  pillars: BaziViewPillar[];
  elementBalance: { element: string; count: number }[];
  favorableElements: string[];
  luckPillars: { stem: string; branch: string; startAge: number | null }[];
  /** Chart structure / pattern, e.g. "Direct Resource Structure". */
  structure?: string | null;
  /** Symbolic stars (shen sha) across the chart. */
  stars?: BaziViewStar[];
  /** Void / empty branches (xun kong). */
  voidBranches?: string[];
  notes: string[];
}

/** Honest default: BaZi is unavailable until a provider chart exists. */
export const UNAVAILABLE_BAZI: BaziView = {
  available: false,
  partial: false,
  missingInputs: [],
  unavailableReason: "provider_not_configured",
  dayMaster: null,
  dayMasterStrength: null,
  pillars: [],
  elementBalance: [],
  favorableElements: [],
  luckPillars: [],
  notes: ["Full BaZi / Four Pillars unlocks when a BaZi provider is connected and your birth time and place are on file."],
};

// ── Vedic / sidereal (Jyotish) — a distinct lens from the Western chart above ──
export interface VedicViewPlanet {
  planet: string;
  sign: string;
  degree: number;
  house: number | null;
  retrograde: boolean;
  nakshatra?: string;
  nakshatraLord?: string;
}
export interface VedicView {
  available: boolean;
  partial: boolean;
  missingInputs: string[];
  unavailableReason?: string;
  ascendant: { sign: string; degree: number; nakshatra?: string } | null;
  planets: VedicViewPlanet[];
  /** The Moon's nakshatra — the heart of a Vedic reading. */
  moonNakshatra?: string;
  sadeSati?: { active: boolean; phase: string | null; note: string } | null;
  ayanamsha?: string;
  /** Vimshottari Dasha — the current planetary period + the Mahadasha timeline. */
  dasha?: VedicDashaView;
  /** Shadbala — planetary strengths (strongest / developing). */
  strength?: VedicStrengthView;
  notes: string[];
}

export interface VedicStrengthPlanetView {
  planet: string;
  score: number;
  rank: number;
  grade?: string;
}
export interface VedicStrengthView {
  planets: VedicStrengthPlanetView[];
  strongest: VedicStrengthPlanetView | null;
  weakest: VedicStrengthPlanetView | null;
}

export interface VedicDashaPeriodView {
  /** Ruling graha, e.g. "Venus". */
  planet: string;
  /** ISO date (YYYY-MM-DD). */
  start: string;
  /** ISO date (YYYY-MM-DD). */
  end: string;
}
export interface VedicDashaView {
  /** Dasha system, typically "Vimshottari". */
  system: string;
  /** The Mahadasha (major period) active today, recomputed from the timeline. */
  maha: VedicDashaPeriodView | null;
  /** The Antardasha (sub-period) active today, when the provider returns sub-periods. */
  antar: VedicDashaPeriodView | null;
  /** The Mahadasha timeline (major periods only) for context. */
  timeline: VedicDashaPeriodView[];
}

/** Honest default: Vedic is unavailable until a provider chart exists. */
export const UNAVAILABLE_VEDIC: VedicView = {
  available: false,
  partial: false,
  missingInputs: [],
  unavailableReason: "provider_not_configured",
  ascendant: null,
  planets: [],
  notes: ["Your Vedic / sidereal chart unlocks when a provider is connected and your birth time and place are on file. It's a separate tradition from your Western chart — its signs are intentionally different."],
};

// ══════════════════════════════════════════════════════════════════
// HUMAN DESIGN
// ══════════════════════════════════════════════════════════════════

export type HDType = "Generator" | "Manifesting Generator" | "Manifestor" | "Projector" | "Reflector";
export type HDAuthority = "Emotional" | "Sacral" | "Splenic" | "Ego" | "Self-Projected" | "Environmental" | "Lunar";
export type HDStrategy = "To Respond" | "To Wait to Respond" | "To Inform" | "To Wait for the Invitation" | "To Wait a Lunar Cycle";

export interface HDCenter {
  name: string;
  defined: boolean;
  gates: number[];
}

export interface HumanDesignData {
  type: HDType;
  typeDescription: string;
  strategy: HDStrategy;
  strategyDescription: string;
  authority: HDAuthority;
  authorityDescription: string;
  profile: string;
  profileDescription: string;
  incarnationCross: string;
  signature: string;
  notSelf: string;
  centers: HDCenter[];
  strengths: string[];
  growthEdge: string;
}

// ══════════════════════════════════════════════════════════════════
// TAROT
// ══════════════════════════════════════════════════════════════════

export interface TarotCard {
  name: string;
  arcana: "major" | "minor";
  suit?: string;
  imageEmoji: string;
  uprightMeaning: string;
  positionMeaning?: string;
}

export interface TarotSpread {
  id: string;
  name: string;
  positions: string[];
  description: string;
}

// ══════════════════════════════════════════════════════════════════
// RITUALS
// ══════════════════════════════════════════════════════════════════

export interface Ritual {
  id: string;
  title: string;
  moonPhase: string;
  description: string;
  steps: string[];
  intention: string;
}

// ══════════════════════════════════════════════════════════════════
// JOURNAL
// ══════════════════════════════════════════════════════════════════

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  transitContext: string;
}

// ══════════════════════════════════════════════════════════════════
// SOLUNA SHIFT
// ══════════════════════════════════════════════════════════════════

export interface SolunaShiftData {
  reframe: string;
  reset: string;
  braveTinyAction: string;
  journalPrompt: string;
}

// ══════════════════════════════════════════════════════════════════
// MOOD CHECK-IN
// ══════════════════════════════════════════════════════════════════

export type MoodSupport = "Gentle" | "Clear" | "Motivating" | "Reflective" | "Practical";

export interface MoodOption {
  id: MoodSupport;
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { id: "Gentle", label: "Gentle", emoji: "🌸", color: "#F2A88D", description: "Soft, reassuring, and kind — like a warm cup of tea for your soul." },
  { id: "Clear", label: "Clear", emoji: "🔮", color: "#B9A3E3", description: "Straightforward insights — let's cut through the fog together." },
  { id: "Motivating", label: "Motivating", emoji: "🔥", color: "#E8B86D", description: "Energizing and encouraging — a gentle push toward what's possible." },
  { id: "Reflective", label: "Reflective", emoji: "🌙", color: "#B9A3E3", description: "Deep and contemplative — let's sit with the questions that matter." },
  { id: "Practical", label: "Practical", emoji: "🌿", color: "#7BC89C", description: "Grounded and actionable — show me what I can actually do today." },
];

// ══════════════════════════════════════════════════════════════════
// PATTERN MEMORY
// ══════════════════════════════════════════════════════════════════

export interface PatternTheme {
  id: string;
  label: string;
  active: boolean;
  createdAt: string;
}

// ══════════════════════════════════════════════════════════════════
// WEEKLY INTEGRATION REPORT
// ══════════════════════════════════════════════════════════════════

export interface WeeklyReport {
  startDate: string;
  endDate: string;
  repeatingThemes: string[];
  systemsAgreedMost: string[];
  savedReadings: number;
  journalReflections: number;
  carryForward: string;
  moodPattern: string;
}

// ══════════════════════════════════════════════════════════════════
// BOND RITUAL DATA
// ══════════════════════════════════════════════════════════════════

export interface BondRitualData {
  howToSupportToday: string;
  bestDayForDeepConversation: string;
  whereYouMayBeMisreading: string;
  sharedJournalPrompt: string;
}

// ══════════════════════════════════════════════════════════════════
// WIDGET PREVIEWS
// ══════════════════════════════════════════════════════════════════

export interface WidgetPreview {
  id: string;
  title: string;
  description: string;
  notificationExample: string;
  emoji: string;
}

// ══════════════════════════════════════════════════════════════════
// SYNTHESIS
// ══════════════════════════════════════════════════════════════════

export interface SynthesisBlock {
  system: "astrology" | "numerology" | "chinese" | "humanDesign";
  label: string;
  signal: string;
}

export interface SynthesisTheme {
  id: string;
  title: string;
  subtitle: string;
  systemsAgree: number;
  blocks: SynthesisBlock[];
  combinedTakeaway: string;
}

// ══════════════════════════════════════════════════════════════════
// MOCK USER DATA (multi-system)
// ══════════════════════════════════════════════════════════════════

export interface UserData {
  fullName: string;
  preferredName: string;
  birthDate: string;
  birthTime: string;
  birthTimeKnown: boolean;
  birthPlace: string;
  // Each system lens is NULL when the live backend hasn't produced real data for
  // it yet (e.g. birth place unresolved, blueprint still computing). Live mode
  // shows honest "not available yet" states for null lenses — never fake data.
  // In demo mode these are always populated (see demoData.ts MOCK_USER).
  chart: ChartData | null;
  numerology: NumerologyData | null;
  chinese: ChineseAstrologyData | null;
  /** True provider-backed BaZi / Four Pillars (distinct from `chinese`). Carries
   *  its own availability flag, so it is never null. */
  bazi: BaziView;
  vedic: VedicView;
  humanDesign: HumanDesignData | null;
}

// ══════════════════════════════════════════════════════════════════
// DAILY READINGS (blended, multi-system)
// ══════════════════════════════════════════════════════════════════

export interface DailyReading {
  date: string;
  reading: string;
  moonPhase: string;
  moonPhaseEmoji: string;
  moonSign: ZodiacSign;
  transit1: { planet: Planet; sign: ZodiacSign; blurb: string };
  transit2: { planet: Planet; sign: ZodiacSign; blurb: string };
  energyLevel: number;
  energyCaption: string;
  affirmation: string;
  do: string;
  embrace: string;
  easeUp: string;
  personalDay: number;
  personalDayMeaning: string;
  chineseNote: string;
  systemsAgree: { systems: string[]; summary: string; detail: string };
  cardOfTheDay: TarotCard;
}

// ══════════════════════════════════════════════════════════════════
// PLACEMENT INTERPRETATIONS
// ══════════════════════════════════════════════════════════════════

export interface PlacementInterpretation {
  strengths: string[];
  growthEdge: string;
  description: string;
}

export const PLACEMENT_INTERPRETATIONS: Record<string, PlacementInterpretation> = {
  "Sun-Cancer-12": {
    description: "Your Sun in Cancer lives in the quiet, luminous space of the 12th house — the house of dreams, intuition, and the deep inner world. This is a profoundly tender placement: you feel everything, and you feel it deeply. You experience life not just through events, but through the emotional currents beneath them. Your strength comes from your ability to sit with feelings — your own and others' — without needing to fix or rush through them.\n\nPeople with this placement often have a rich inner life. You might be drawn to creative expression, spirituality, or simply the art of understanding what makes people tick. Your sensitivity is not a burden — it's a finely tuned instrument. When you trust it, you can read a room, a person, or a moment with uncommon depth. The world needs more people who move through it with this kind of emotional intelligence.",
    strengths: [
      "Extraordinary emotional intuition — you often know what others need before they do",
      "A natural capacity for deep, meaningful one-on-one connection",
      "Creative imagination that thrives in solitude and quiet",
      "The ability to hold space for others without judgment",
    ],
    growthEdge: "Your empathic nature can sometimes blur the line between your feelings and other people's. Learning to ask 'is this mine?' is a gentle but essential practice. Protecting your energy isn't selfish — it's how you sustain your gift.",
  },
  "Moon-Pisces-8": {
    description: "Your Moon in Pisces in the 8th house gives you an emotional landscape that is vast, mystical, and deeply compassionate. You don't just understand other people's pain — you feel it with them, which makes you an extraordinary friend, partner, and confidant. Your emotional intuition borders on psychic; you pick up on unspoken currents that others miss entirely.\n\nThis placement suggests someone who finds comfort in depth. Surface-level interactions may drain you while deep, soulful conversations restore you. You're drawn to what's beneath — in relationships, in art, in yourself. Creativity is likely a lifeline for you: music, writing, visual art, or simply a rich fantasy life that keeps your spirit nourished.\n\nThe 8th house also connects to transformation. Throughout your life, you'll experience emotional rebirths — moments where you release an old version of yourself and emerge softer, wiser, and more fully you.",
    strengths: [
      "Boundless compassion — you genuinely care, and people feel it",
      "Powerful creative and imaginative gifts",
      "A natural healer: your presence alone can be calming to others",
      "Emotional resilience born from deep feeling — you know how to weather storms",
    ],
    growthEdge: "Because you absorb so much from others, it's essential to have practices that help you release what isn't yours — whether that's journaling, time in nature, or simply being alone with your own thoughts. Boundaries are a form of self-love for you.",
  },
};

export const NUMEROLOGY_INTERPRETATIONS: Record<number, { description: string; strengths: string[]; growthEdge: string }> = NUMBER_MEANINGS;

export const CHINESE_INTERPRETATIONS: Record<string, { description: string; strengths: string[]; growthEdge: string }> = {
  "Wood-Pig": {
    description: "The Wood Pig is a rare and beautiful combination — generous, optimistic, and quietly strong. In Chinese astrology, the Pig represents abundance, honesty, and a warm, trusting nature. The Wood element adds growth, flexibility, and a gentle but persistent forward movement. Together, you're someone who genuinely wants the best for everyone around you, and you're willing to put in the quiet work to make it happen.",
    strengths: ["Deep generosity that expects nothing in return", "Genuine optimism that lifts others naturally", "Quiet persistence — you keep going when others stop", "Honesty and trustworthiness that people instinctively feel"],
    growthEdge: "Your trusting nature is beautiful, but not everyone deserves full access to your heart. Discernment is a form of self-respect — you can be kind AND protective of your energy.",
  },
};

// Per-animal reference interpretations (all 12 signs). Keyed by the user's REAL
// computed zodiac animal — generic, value-accurate archetype text, never copied
// from a demo user. Used as the fallback when the richer element-animal table
// (CHINESE_INTERPRETATIONS) has no entry, so every blueprint shows real content.
export const CHINESE_ANIMAL_INTERPRETATIONS: Record<string, { description: string; strengths: string[]; growthEdge: string }> = {
  Rat: {
    description: "The Rat opens the zodiac cycle — resourceful, perceptive, and endlessly adaptable. You read a room in seconds and find the opening others miss. Behind your quick charm is a strategic mind that's usually a few steps ahead, and a loyalty to your inner circle that runs deeper than you let on.",
    strengths: ["Quick, resourceful thinking under pressure", "Sharp instinct for people and timing", "Adaptable — you thrive when plans change", "Quiet, fierce loyalty to those you love"],
    growthEdge: "Your mind moves fast, and sometimes it races ahead into worry or over-planning. You don't have to secure every outcome in advance — some doors only open once you're already walking. Stillness isn't falling behind; it's where your best ideas land.",
  },
  Ox: {
    description: "The Ox is steady, dependable, and quietly powerful. You build things that last — through patience, honest effort, and a backbone that doesn't bend to pressure. People lean on you because you show up, again and again, long after others have drifted.",
    strengths: ["Remarkable patience and follow-through", "Dependability others build their lives around", "Honest, grounded, hard to rattle", "Deep inner strength and resolve"],
    growthEdge: "Your steadiness is a gift, but you can hold so tightly to how things 'should' be done that you carry more than your share. Flexibility isn't weakness, and rest isn't laziness — letting others help you is its own kind of strength.",
  },
  Tiger: {
    description: "The Tiger is bold, magnetic, and courageous — a natural leader who moves on instinct and heart. You feel things intensely and aren't afraid to act on them, drawing people in with your warmth and daring. When you believe in something, your conviction is contagious.",
    strengths: ["Natural courage and bold initiative", "Magnetic, inspiring presence", "Passionate, wholehearted commitment", "Protective of those who can't protect themselves"],
    growthEdge: "Your fire is beautiful, but it can flare faster than you can think it through. A breath between feeling and action lets your courage land where it's truly needed, instead of burning where it isn't.",
  },
  Rabbit: {
    description: "The Rabbit is gentle, intuitive, and quietly elegant. You move through life with grace and a deep sensitivity to beauty, harmony, and the feelings of others. Your kindness is real, and so is your perceptiveness — you notice the small things that make people feel safe and seen.",
    strengths: ["Deep empathy and emotional attunement", "Natural diplomacy and gentleness", "An eye for beauty and harmony", "A calming presence that puts others at ease"],
    growthEdge: "You feel others so deeply that you sometimes abandon yourself to keep the peace. Your needs matter just as much as everyone else's — naming what you want isn't selfish, it's honest. Gentle people are allowed to take up space, too.",
  },
  Dragon: {
    description: "The Dragon is visionary, charismatic, and full of natural force. You think big, dream bigger, and carry a confidence that lifts everyone around you. People are drawn to your energy and your sense that anything is possible — because when you commit, it often is.",
    strengths: ["Visionary thinking and big ambition", "Natural charisma and confidence", "Generous, energizing leadership", "Resilience that bounces back from setbacks"],
    growthEdge: "Your standards are sky-high — for the world and for yourself. You are already enough, even on the days you don't soar. Letting people see your softer, uncertain side won't diminish your magic; it makes it real.",
  },
  Snake: {
    description: "The Snake is wise, intuitive, and deeply perceptive. You think before you speak and see beneath the surface of things, drawn to depth, mystery, and meaning. There's a quiet magnetism to you — a calm that comes from trusting your own inner knowing.",
    strengths: ["Profound intuition and insight", "Calm, considered wisdom", "Natural elegance and self-possession", "The ability to see what others miss"],
    growthEdge: "Your inner world is rich, but holding everything so close can leave you alone with it. Letting trusted people in isn't a loss of power — vulnerability shared with the right person deepens connection rather than risking it.",
  },
  Horse: {
    description: "The Horse is free-spirited, energetic, and warm. You love movement, adventure, and the open road of possibility — and your enthusiasm is genuinely contagious. Independent and honest, you bring lightness wherever you go and inspire others to chase their own freedom.",
    strengths: ["Boundless energy and enthusiasm", "Honesty and a free, open spirit", "Adventurousness — you're willing to leap", "Warmth that lifts everyone's mood"],
    growthEdge: "You love freedom so much that staying can feel like being trapped. But not every commitment is a cage — some are the roots that let you grow taller. Slowing down long enough to finish what you start is its own adventure.",
  },
  Goat: {
    description: "The Goat is gentle, creative, and compassionate. You have a tender heart and an artist's sensitivity, finding beauty and meaning where others rush past. Your kindness runs deep, and you give generously to the people and causes you care about.",
    strengths: ["Rich creativity and imagination", "Deep compassion and tenderness", "Sensitivity to beauty and feeling", "A quiet generosity of spirit"],
    growthEdge: "Your tender heart feels everything, and criticism can land harder on you than others realize. Your worth was never up for a vote — soothing yourself from the inside means the world's opinions stop deciding how you feel.",
  },
  Monkey: {
    description: "The Monkey is clever, playful, and endlessly inventive. Your mind is quick and curious, always finding a new angle, a clever solution, or a reason to laugh. You bring intelligence and joy in equal measure, and you're rarely stumped for long.",
    strengths: ["Sharp, inventive problem-solving", "Playfulness that lightens any room", "Curiosity and fast learning", "Charm and natural social ease"],
    growthEdge: "Your cleverness can become a way to stay one step removed — solving or joking instead of simply feeling. The people who love you want the real you, not just the entertaining one. It's safe to be sincere.",
  },
  Rooster: {
    description: "The Rooster is confident, observant, and refreshingly honest. You notice details others overlook and aren't afraid to say what's true. Hardworking and proud in the best sense, you take real care in what you do and hold yourself to a high standard.",
    strengths: ["A keen eye for detail and quality", "Honesty and the courage to speak up", "A strong work ethic and reliability", "Confidence that steadies a group"],
    growthEdge: "Your high standards push you toward excellence, but turned inward they can become harsh self-judgment. Try meeting your own mistakes the way you'd meet a friend's — with patience. You don't have to be flawless to be worthy of pride.",
  },
  Dog: {
    description: "The Dog is loyal, honest, and deeply principled. You have a strong sense of justice and an instinct to protect the people you love. Trustworthy to the core, you'd rather be honest than easy, and the people in your life know they can count on you completely.",
    strengths: ["Unwavering loyalty and integrity", "A strong, fair sense of justice", "Protectiveness toward loved ones", "Honesty you can build real trust on"],
    growthEdge: "You carry the world's fairness on your shoulders, and worry can keep you on guard even when you're safe. Not every threat needs your vigilance — letting yourself rest, trusting some things will be okay without you holding them, is a gift you've earned.",
  },
  Pig: {
    description: "The Pig is generous, sincere, and warmhearted. You meet life with honesty and an open, trusting nature, and you find real joy in comfort, connection, and caring for others. Your kindness is unforced — it's simply who you are.",
    strengths: ["Genuine generosity and warmth", "Sincerity and an open heart", "The ability to enjoy and savor life", "A steady, forgiving nature"],
    growthEdge: "Your trusting nature is beautiful, but not everyone deserves full access to your heart. Discernment is a form of self-respect — you can be kind AND protective of your energy.",
  },
};

export const HD_INTERPRETATIONS: Record<string, { description: string; strengths: string[]; growthEdge: string }> = {
  "Generator": {
    description: "As a Generator, you are quite literally the life force of humanity. About 37% of people share your type, and together, Generators and Manifesting Generators make up about 70% of the population. You have a defined Sacral center — a powerful, consistent source of creative, life-giving energy. When you're doing work you love, you can sustain it almost endlessly. Your gift isn't speed or initiation — it's sustainable momentum and the deep satisfaction that comes from being fully engaged in what matters to you. The world literally runs on Generator energy — your joy is not frivolous, it's fuel.",
    strengths: ["Sustainable, powerful creative energy when aligned", "Deep gut wisdom that guides you toward the right people and opportunities", "Natural warmth and presence that energizes others", "Capacity for deep satisfaction in work and life"],
    growthEdge: "Frustration is your signal that you're out of alignment — pushing, initiating from the mind, or saying yes when your gut says no. When you feel stuck, pause and ask: 'Am I responding to life, or forcing it?'",
  },
  "Manifesting Generator": {
    description: "As a Manifesting Generator, you carry the powerful, sustainable energy of a Generator with an extra spark of speed and initiation. You're multi-passionate by design — you can hold several interests at once and move through them faster than almost anyone, often finding shortcuts others miss. Roughly a third of people share your type. Your gift is responding to what lights you up and then moving quickly and efficiently toward it, sometimes skipping steps that don't serve you.",
    strengths: ["Fast, multi-passionate energy that thrives on variety", "A gift for finding shortcuts and doing things efficiently", "Sustainable drive when you're engaged with what you love", "The ability to start AND finish when your gut is a yes"],
    growthEdge: "Your two signals are frustration and a flash of impatience — both say you've forced something or skipped the step of checking your gut. Two things steady you: letting yourself respond before you leap, and informing the people around you before you charge ahead, so they move with you instead of against you. You're allowed to drop what no longer lights you up — that's not quitting, it's correction.",
  },
  "Projector": {
    description: "As a Projector, you're here to guide, not to grind. About 20% of people share your type, and unlike Generators you don't have a consistent inner motor — instead you have a gift for seeing people and systems deeply and knowing how energy could be used more wisely. When you're recognized and invited into the right rooms, your insight is extraordinary. You're designed to manage, direct, and guide — to see the whole board.",
    strengths: ["Deep insight into people, systems, and what makes them work", "Natural wisdom and the ability to guide others well", "Seeing efficiencies and possibilities others miss", "Doing more with less when your energy is honored"],
    growthEdge: "Bitterness is your signal — it usually means you've been over-giving, unrecognized, or pushing your way in instead of waiting to be invited. Rest is not laziness for you; it's maintenance. Wait for genuine recognition and invitation for the big things, and trust that your worth was never measured in how much you produce.",
  },
  "Manifestor": {
    description: "As a Manifestor, you're an initiator — here to start things, spark change, and make an impact. About 9% of people share your type. You carry an independent, catalytic energy: when an idea moves through you, you can act on it without waiting for anyone's go-ahead. You're not designed for steady, sustained output like a Generator — you work in bursts of initiation, then rest. You're here to get things moving that others will carry forward.",
    strengths: ["The power to initiate and make things happen", "Genuine independence and self-direction", "A catalyzing presence that sparks change", "Vision and the courage to act on it"],
    growthEdge: "Anger is your signal — it often flares when you feel controlled or when others resist you. The thing that smooths your path is informing the people who'll be affected before you act: you don't need permission, but a heads-up turns resistance into support. Honor your rhythm of bursts and rest — you're not meant to run nonstop.",
  },
  "Reflector": {
    description: "As a Reflector, you're the rarest type — only about 1% of people. With all of your energy centers open, you're a mirror: you sample and reflect the health and energy of the people and places around you. This makes you wise, perceptive, and surprisingly resilient, but also deeply affected by your environment. Who you spend time with and where you are matter more for you than for anyone else. At your best, you reflect a community back to itself with remarkable clarity.",
    strengths: ["Profound openness and a mirror-like wisdom", "Sensitivity to the health of people and environments", "The ability to sample and understand many kinds of energy", "Surprising depth, fairness, and perspective"],
    growthEdge: "Disappointment is your signal — often a sign your environment or company isn't right for you. Two things protect you: choosing your people and places with great care, and giving yourself a full lunar cycle (about a month) before big decisions instead of being rushed. You're not inconsistent or indecisive — you're a mirror, and mirrors need the right things to reflect.",
  },
};

/**
 * Strategy, Signature (the feeling of being on-track), and Not-Self theme (the
 * feeling that signals you've drifted) all follow from Type, so they're keyed by
 * the engine's Type. These fill the Strategy / Signature / Not-Self cards that
 * were previously blank. Reflective, never deterministic.
 */
export const HD_TYPE_GUIDANCE: Record<string, { strategyDescription: string; signature: string; notSelf: string }> = {
  "Generator": {
    strategyDescription: "Your strategy is to RESPOND. Instead of initiating from the mind, let life come to you and notice what your gut lights up for — a true yes feels like an opening, a no like a quiet closing. Responding keeps your energy sustainable and your commitments genuine.",
    signature: "Satisfaction",
    notSelf: "Frustration",
  },
  "Manifesting Generator": {
    strategyDescription: "Your strategy is to RESPOND, then INFORM. Wait for your gut to light up, then let the people around you know before you move — because you move fast, a quick heads-up turns resistance into momentum. Skipping steps is fine when your gut is leading.",
    signature: "Satisfaction & Peace",
    notSelf: "Frustration & Anger",
  },
  "Projector": {
    strategyDescription: "Your strategy is to WAIT FOR THE INVITATION for the big things — work, love, where you pour your energy. Recognition is the sign a space is truly ready for your gift. You're not waiting passively; you're staying available until the right invitation lets your guidance land.",
    signature: "Success",
    notSelf: "Bitterness",
  },
  "Manifestor": {
    strategyDescription: "Your strategy is to INFORM before you act. You don't need anyone's permission — but telling the people who'll be affected, before you move, dissolves the resistance that otherwise meets your initiating energy. Inform, then act freely.",
    signature: "Peace",
    notSelf: "Anger",
  },
  "Reflector": {
    strategyDescription: "Your strategy is to WAIT A FULL LUNAR CYCLE (about a month) before major decisions. As an all-open mirror you need time to feel a choice from many angles and environments before it's truly yours. Sleep on it — many times — and talk it through with people you trust.",
    signature: "Surprise & Delight",
    notSelf: "Disappointment",
  },
};

/**
 * Inner Authority — HOW you're designed to reach trustworthy decisions. Keyed by
 * the leading label of the engine's authority string (the part before the dash).
 */
export const HD_AUTHORITY_MEANINGS: Record<string, string> = {
  "Emotional Authority": "You ride an emotional wave, so clarity comes over TIME, not in the heat of the moment — there's no truth in the now for you. Sleep on important decisions and notice how you feel across a few days. When the emotional charge settles, your real answer is waiting underneath.",
  "Sacral Authority": "Your truth lives in the gut, in the moment — a spontaneous 'uh-huh' (yes) or 'unh-uh' (no) that rises before the mind explains itself. Ask yourself yes/no questions and trust the immediate energy of the response over the story your head builds afterward.",
  "Splenic Authority": "Your authority is the spleen: a quiet, in-the-moment instinct for safety and wellbeing that speaks ONCE, softly, and rarely repeats. It's the subtle 'not this' or 'yes, now.' Learning to honor that first faint signal — instead of overriding it — is your work.",
  "Self-Projected Authority": "You hear your truth when you TALK it out — not to gather advice, but to listen to your own voice. Speak a decision aloud to someone you trust and notice which way your words and tone naturally lean. Your knowing reveals itself through your own expression.",
  "Lunar Authority": "As a Reflector, your authority is lunar: give big decisions a full ~28-day cycle. Talk it through with trusted people over that time and watch how the choice feels as the moon moves. Your clarity comes from patience and perspective, never from pressure.",
};

/**
 * The six Profile lines. A Profile (e.g. "1/3") blends a conscious line with an
 * unconscious one; the display composes a description from both lines.
 */
export const HD_PROFILE_LINES: Record<number, { name: string; theme: string }> = {
  1: { name: "Investigator", theme: "needing a solid foundation of understanding before you feel secure" },
  2: { name: "Hermit", theme: "natural talents that ripen in alone time and get called out by others" },
  3: { name: "Martyr", theme: "learning through trial, error, and lived experiment — nothing wasted" },
  4: { name: "Opportunist", theme: "growth that travels through your network of trusted relationships" },
  5: { name: "Heretic", theme: "a projection field where others look to you for practical solutions" },
  6: { name: "Role Model", theme: "a three-phase life that matures into embodied wisdom and example" },
};

// ══════════════════════════════════════════════════════════════════
// BAZI — Four Pillars + Day Master (tap-to-detail reference content)
// Mirrors the backend knowledge voice; reflective lens, never fixed fate.
// ══════════════════════════════════════════════════════════════════

/** What each of the Four Pillars represents (Year / Month / Day / Hour). */
export const BAZI_PILLAR_MEANINGS: Record<string, { represents: string; description: string }> = {
  Year: {
    represents: "Roots, ancestry & your early years",
    description:
      "The Year Pillar speaks to your origins — family, ancestry, and the social 'face' you grew up inside. It colours your early years (roughly 0–16) and the larger environment you move through. Think of it as the soil your story is planted in.",
  },
  Month: {
    represents: "Parents, growth & your work in the world",
    description:
      "The Month Pillar is the engine of your chart — your upbringing, your drive, and how you grow and work in the world (roughly 17–32). Often called the pillar of career and ambition, it shows how you meet the outer world and build a life.",
  },
  Day: {
    represents: "Your core self & closest bonds",
    description:
      "The Day Pillar is the heart of the chart. Its heavenly stem is your Day Master — the 'you' everything else relates to — and the pillar also speaks to your closest relationships and inner partner. This is where you live.",
  },
  Hour: {
    represents: "Your inner world, later life & legacy",
    description:
      "The Hour Pillar is the most private — your inner world, your children and creations, later life (roughly 49+), and what you're quietly becoming. It needs an accurate birth time, so it's the first to go missing without one.",
  },
};

/** Day Master temperament by element (the 'you' of the BaZi chart). */
export const BAZI_ELEMENT_MEANINGS: Record<string, { description: string; strengths: string[]; growthEdge: string }> = {
  Wood: {
    description:
      "A Wood Day Master is like a tree or a sprouting plant — growth-seeking, principled, and quietly determined. You reach upward, value progress and fairness, and grow steadily toward the light. Wood bends in storms but keeps climbing.",
    strengths: ["Growth-oriented and resilient", "Principled and fair-minded", "Quietly determined", "A natural sense of direction and purpose"],
    growthEdge: "Learning to bend with the wind rather than only standing firm, and letting yourself rest between growth spurts instead of always pushing upward.",
  },
  Fire: {
    description:
      "A Fire Day Master is like flame and sunlight — warm, expressive, and naturally illuminating. You bring energy, passion, and visibility, lighting up the people and projects around you. At your best you warm a whole room.",
    strengths: ["Warmth and charisma", "Passion and visibility", "A natural ability to inspire", "Quick, bright, generous spirit"],
    growthEdge: "Tending your fuel so you don't burn out, and letting your warmth be steady and sustained, not only bright and fast.",
  },
  Earth: {
    description:
      "An Earth Day Master is like soil and mountain — steady, nurturing, and dependable. You hold things together, offer grounding to others, and value trust, stability, and care. People feel safe around you.",
    strengths: ["Reliability and steadiness", "A nurturing, grounding presence", "Practical, trustworthy nature", "Patience and loyalty"],
    growthEdge: "Letting yourself receive support too, and allowing change to move through the steadiness rather than resisting every shift.",
  },
  Metal: {
    description:
      "A Metal Day Master is like refined metal and the blade — clear, principled, and precise. You value integrity, structure, and quality, and you can cut through to what matters with honesty and resolve.",
    strengths: ["Integrity and precision", "Clear standards and discernment", "Resilience and resolve", "A gift for refining and improving"],
    growthEdge: "Softening sharp edges with warmth, and letting 'good' be enough when 'perfect' isn't needed.",
  },
  Water: {
    description:
      "A Water Day Master is like river and ocean — adaptable, wise, and deep. You flow around obstacles, sense undercurrents others miss, and carry quiet intelligence and emotional depth. Water finds a way.",
    strengths: ["Adaptability and flow", "Wisdom and perception", "Emotional depth", "Resourcefulness and intuition"],
    growthEdge: "Choosing a clear direction rather than flowing everywhere at once, and letting trusted people see your depths.",
  },
};

// ══════════════════════════════════════════════════════════════════
// HUMAN DESIGN — the nine energy centers (defined vs open)
// Keyed by the engine's HD_CENTER_NAMES. Reflective, never deterministic.
// ══════════════════════════════════════════════════════════════════

export const HD_CENTER_MEANINGS: Record<string, { theme: string; defined: string; open: string }> = {
  "Head": {
    theme: "Inspiration & mental pressure",
    defined: "A consistent source of mental inspiration and questions — you generate your own ideas and the pressure to think. You don't have to chase or answer every question that arrives.",
    open: "You take in and amplify the mental pressure and questions around you. Not every question is yours to solve — let some simply pass through.",
  },
  "Ajna": {
    theme: "How you process & hold certainty",
    defined: "A fixed way of processing — you think in reliable patterns and can hold firm views. Your gift is consistency; stay willing to revisit a certainty now and then.",
    open: "A flexible, open mind that samples many ways of thinking. You don't need fixed answers to be wise — seeing from many angles is the gift.",
  },
  "Throat": {
    theme: "Expression & manifestation",
    defined: "Consistent self-expression and a steady voice — you can speak and act reliably. Let your voice follow your true authority, not the pressure to fill silence.",
    open: "Your expression varies with who you're with. Speaking when you're genuinely invited or moved lands far better than forcing it.",
  },
  "G Center": {
    theme: "Identity, direction & love",
    defined: "A consistent sense of self, direction, and love — you tend to know who you are and where you're going, even when life shifts around you.",
    open: "Identity and direction shift with your environment, which makes you adaptable. The right places and people help you feel most like yourself — choose them with care.",
  },
  "Heart/Ego": {
    theme: "Willpower & self-worth",
    defined: "Consistent willpower and a healthy relationship to promises — you can commit and follow through. Make pledges to yourself you actually want to keep.",
    open: "Willpower comes and goes; you're not built for constant proving. Your worth isn't conditional on performance — you don't have to earn it.",
  },
  "Sacral": {
    theme: "Life-force, work & creativity",
    defined: "A powerful, renewable engine for work and creativity — when you're engaged with what you love, your energy sustains. Honour your gut yes and no.",
    open: "You don't carry consistent life-force energy, so you're not made to keep going endlessly. Rest before exhaustion, and know when enough is enough.",
  },
  "Solar Plexus": {
    theme: "Emotions & clarity over time",
    defined: "An emotional wave moves through you — your clarity comes over time, not in the heat of the moment. Sleep on big decisions and let the wave settle first.",
    open: "You feel and amplify the emotions in the room. Much of what you feel isn't yours — give it space to pass before you act on it.",
  },
  "Spleen": {
    theme: "Instinct, intuition & wellbeing",
    defined: "A consistent, in-the-moment instinct for safety and wellbeing — a quiet knowing you can trust. It speaks softly, usually once.",
    open: "You amplify the fears and instincts around you. Notice which alarms are truly yours, and don't let borrowed fear run the show.",
  },
  "Root": {
    theme: "Pressure, drive & stress",
    defined: "A consistent way of handling pressure — you can pace yourself and use stress as fuel without it running you.",
    open: "You amplify the pressure to be done and the stress around you. Most of that urgency isn't actually yours — you're allowed to slow down.",
  },
};

// ══════════════════════════════════════════════════════════════════
// VEDIC — the 27 Nakshatras (lunar mansions)
// Mirrors the backend knowledge (supabase/.../knowledge/vedic.ts) so the
// tap-to-detail screen has rich, on-voice content offline. The Moon's
// nakshatra is the heart of a Vedic reading — a reflective lens, not fate.
// ══════════════════════════════════════════════════════════════════

export const NAKSHATRA_MEANINGS: Record<string, { description: string; strengths: string[]; growthEdge: string }> = {
  "Ashwini": { description: "A fresh-start, fast-moving temperament — pioneering, quick to act, and drawn to healing or helping. You tend to begin things others hesitate over, with youthful, hopeful energy.", strengths: ["Initiative and speed", "A healing, helpful instinct", "Fresh, hopeful outlook"], growthEdge: "Finishing what you start before chasing the next spark, and pausing long enough to aim." },
  "Bharani": { description: "An intense, holding temperament — capable of carrying, transforming, and seeing things through difficult passages. You tend to feel deeply and bear what others can't, with quiet strength.", strengths: ["Endurance through intensity", "Creative, transformative energy", "Loyalty and depth"], growthEdge: "Setting limits before you're overloaded, and releasing what no longer needs carrying." },
  "Krittika": { description: "A sharp, purifying temperament — honest, focused, and able to cut through to what's true. You tend to see clearly and say it plainly, with a determined, refining edge.", strengths: ["Clarity and honesty", "Focused determination", "A refining, improving instinct"], growthEdge: "Softening sharpness into warmth when it lands hard, and letting 'good enough' be enough sometimes." },
  "Rohini": { description: "A magnetic, growth-loving temperament — sensual, creative, and drawn to beauty and comfort. You tend to make things (and people) flourish, with natural charm and steadiness.", strengths: ["Warm magnetism", "Creative, nurturing growth", "An eye for beauty and comfort"], growthEdge: "Loosening attachment to comfort or appearances, and sharing the spotlight you naturally attract." },
  "Mrigashira": { description: "A seeking, curious temperament — gentle, restless, and always searching for something more. You tend to explore, question, and follow your curiosity wherever it leads.", strengths: ["Curiosity and openness", "Gentle, approachable nature", "A searcher's adaptability"], growthEdge: "Settling into what you find rather than always seeking, and trusting that you have enough." },
  "Ardra": { description: "A storm-and-renewal temperament — sharp-minded, emotionally deep, and able to grow through upheaval. You tend to feel things intensely and come out clearer on the other side.", strengths: ["Penetrating intelligence", "Resilience through hard change", "Emotional depth and honesty"], growthEdge: "Tending your nervous system through storms, and letting calm feel safe, not boring." },
  "Punarvasu": { description: "A renewing, hopeful temperament — resilient, generous, and able to begin again after setbacks. You tend to find your way home, restore what's frayed, and keep faith.", strengths: ["Resilience and renewal", "Optimism and generosity", "A grounding sense of home"], growthEdge: "Letting yourself fully arrive instead of restarting, and receiving care, not only giving it." },
  "Pushya": { description: "A nourishing, devoted temperament — caring, dependable, and steadying for others. You tend to feed, support, and protect the people and causes you love.", strengths: ["Deep care and devotion", "Dependability and steadiness", "A nourishing presence"], growthEdge: "Letting yourself be cared for too, and not over-giving to earn belonging." },
  "Ashlesha": { description: "A penetrating, perceptive temperament — intuitive, persuasive, and able to read what's beneath the surface. You tend to sense hidden currents others miss.", strengths: ["Sharp perception and insight", "Persuasive, magnetic presence", "Deep intuition"], growthEdge: "Directing your intensity toward what heals, and trusting openness as much as strategy." },
  "Magha": { description: "A dignified, ancestral temperament — proud in the best sense, drawn to honor your roots and lead with grace. You tend to carry a sense of legacy and quiet authority.", strengths: ["Natural dignity and leadership", "Respect for roots and tradition", "Generosity from a full seat"], growthEdge: "Leading without needing to be above, and honoring lineage while writing your own line." },
  "Purva Phalguni": { description: "A warm, pleasure-loving temperament — creative, generous, and drawn to enjoyment, rest, and connection. You tend to bring ease and delight wherever you go.", strengths: ["Warmth and generosity", "Creative, playful spirit", "A gift for rest and enjoyment"], growthEdge: "Balancing pleasure with follow-through, and letting depth join the lightness." },
  "Uttara Phalguni": { description: "A reliable, friendship-minded temperament — generous, helpful, and steady in partnership. You tend to show love through loyalty and dependable support.", strengths: ["Loyalty and dependability", "Generosity and helpfulness", "Steady partnership"], growthEdge: "Receiving help, not only offering it, and choosing where your generosity goes." },
  "Hasta": { description: "A skillful, clever temperament — handy, witty, and able to turn ideas into real things. You tend to make, fix, and craft, with a light touch and quick mind.", strengths: ["Skill and craftsmanship", "Cleverness and wit", "A gift for making things real"], growthEdge: "Trusting your work without over-perfecting, and letting your hands rest, too." },
  "Chitra": { description: "A brilliant, design-minded temperament — charismatic, artistic, and drawn to create beauty and order. You tend to shine and to make things shine around you.", strengths: ["Charisma and artistry", "An eye for design and form", "Bold self-expression"], growthEdge: "Building substance beneath the shine, and letting yourself be seen plainly, too." },
  "Swati": { description: "An independent, adaptable temperament — self-reliant, balanced, and like the wind, hard to pin down. You tend to value freedom and find your own way.", strengths: ["Independence and self-reliance", "Adaptability and balance", "Diplomatic flexibility"], growthEdge: "Letting people close without losing your freedom, and committing when it matters." },
  "Vishakha": { description: "A goal-driven, determined temperament — focused, ambitious, and willing to work hard for what you want. You tend to lock onto a target and pursue it with patience and fire.", strengths: ["Determination and ambition", "Focused, goal-directed energy", "Patience for the long game"], growthEdge: "Enjoying the journey, not only the goal, and letting rest be part of the plan." },
  "Anuradha": { description: "A devoted, cooperative temperament — loyal, friendly, and able to thrive through relationship. You tend to succeed by building bonds and working with others.", strengths: ["Loyalty and devotion", "A gift for cooperation", "Success through connection"], growthEdge: "Honoring your own needs within bonds, and leading as well as supporting." },
  "Jyeshtha": { description: "A capable, responsible temperament — the elder energy, protective and able to carry weight. You tend to take charge and look after others, even when it costs you.", strengths: ["Capability and responsibility", "Protective leadership", "Resilience under pressure"], growthEdge: "Asking for help before you're depleted, and letting others be capable, too." },
  "Mula": { description: "A root-seeking, investigative temperament — drawn to get to the bottom of things, even if it means dismantling them first. You tend to question deeply and rebuild from truth.", strengths: ["Depth and investigative drive", "Courage to face hard truths", "Philosophical insight"], growthEdge: "Rebuilding gently after you've uprooted, and letting some things stay whole." },
  "Purva Ashadha": { description: "A confident, persuasive temperament — optimistic, undefeated, and able to lift others with your conviction. You tend to believe in possibility and carry people with you.", strengths: ["Conviction and optimism", "Persuasive, uplifting energy", "Refreshing resilience"], growthEdge: "Staying open to other views, and letting confidence include a little uncertainty." },
  "Uttara Ashadha": { description: "An enduring, principled temperament — drawn to lasting achievement built on integrity. You tend to win slowly and for keeps, by doing things the right way.", strengths: ["Integrity and patience", "Lasting, well-built success", "Steady leadership"], growthEdge: "Letting good-enough wins count, and finding flexibility within your principles." },
  "Shravana": { description: "A listening, learning temperament — attentive, wise, and able to gather understanding through deep attention. You tend to learn by truly hearing others.", strengths: ["Deep listening and attention", "Wisdom through learning", "A connecting, trusted presence"], growthEdge: "Voicing your own knowing, too, and filtering whose words you take in." },
  "Dhanishta": { description: "A rhythmic, abundant temperament — musical, adaptable, and able to bring people into harmony. You tend to keep the beat and create prosperity around you.", strengths: ["Rhythm and timing", "Adaptable, prosperous energy", "A gift for group harmony"], growthEdge: "Pausing the drumbeat to rest, and letting feeling join the performance." },
  "Shatabhisha": { description: "A healing, independent temperament — private, inventive, and drawn to mystery and mending. You tend to go your own way and quietly help others heal.", strengths: ["Healing and inventiveness", "Independence and privacy", "Comfort with mystery"], growthEdge: "Letting trusted people in, and healing yourself, not only others." },
  "Purva Bhadrapada": { description: "An intense, idealistic temperament — passionate, visionary, and able to transform through deep conviction. You tend to feel strongly and reach for something higher.", strengths: ["Visionary intensity", "Idealism and conviction", "Transformative depth"], growthEdge: "Grounding big ideals in small steps, and tending your nervous system through intensity." },
  "Uttara Bhadrapada": { description: "A deep, calm temperament — wise, compassionate, and steady like still water. You tend to hold depth without drama, offering quiet, grounding wisdom.", strengths: ["Calm depth and wisdom", "Compassion and patience", "A steadying presence"], growthEdge: "Letting your depth be seen and known, and acting on insight, not only holding it." },
  "Revati": { description: "A gentle, nourishing temperament — kind, imaginative, and a safe harbor for others. You tend to care for the vulnerable and help people reach the end of the road safely.", strengths: ["Kindness and compassion", "Imagination and gentleness", "A protective, guiding warmth"], growthEdge: "Keeping some care for yourself, and setting limits without guilt." },
};

// Vimshottari Dasha lords — the nine grahas, each colouring the chapter it rules.
// A reflective lens for the theme and timing of a life season, never fixed fate.
export const DASHA_PLANET_MEANINGS: Record<string, { theme: string; description: string; strengths: string[]; growthEdge: string }> = {
  "Ketu": { theme: "Release & inner focus", description: "A Ketu period turns the volume down on the outer world and up on the inner one. It's a chapter of letting go, simplifying, and returning to something you already know deep down — often quieter and more spiritual than the years around it.", strengths: ["Spiritual depth and detachment", "Cutting away what no longer fits", "Intuition and inner knowing"], growthEdge: "Staying gently connected to people and plans while you turn inward — solitude that nourishes, not isolates." },
  "Venus": { theme: "Love, beauty & harmony", description: "A Venus period warms the chapter toward relationship, beauty, pleasure, and creativity. Connection and comfort come more easily, and it's a natural season for art, partnership, and enjoying the good things you've built.", strengths: ["Warmth in relationships", "Creative and aesthetic gifts", "A capacity for pleasure and ease"], growthEdge: "Balancing indulgence with intention — letting comfort restore you without dulling your edge." },
  "Sun": { theme: "Identity & purpose", description: "A Sun period brings identity, purpose, and visibility to the foreground. It's a chapter to step into leadership, clarify who you are, and let your genuine self be seen — recognition often follows sincerity.", strengths: ["Clarity of purpose", "Natural leadership and confidence", "Vitality and self-expression"], growthEdge: "Leading from warmth rather than ego — letting others shine alongside you." },
  "Moon": { theme: "Emotional depth & care", description: "A Moon period softens the chapter toward feeling, home, and belonging. Emotional life, nurturing, and intuition take centre stage, and caring for and being cared by others becomes a throughline.", strengths: ["Emotional intelligence and empathy", "A nurturing, connecting presence", "Strong intuition"], growthEdge: "Riding emotional tides without being swept away — steady self-care through the ebbs and flows." },
  "Mars": { theme: "Drive & courage", description: "A Mars period raises the energy, drive, and appetite for action. It's a chapter for courage, initiative, and pushing projects forward — momentum is available when you channel it with aim.", strengths: ["Courage and initiative", "Energy to start and finish", "Healthy assertiveness"], growthEdge: "Directing the heat with patience — choosing your battles rather than forcing every door." },
  "Rahu": { theme: "Ambition & the new", description: "A Rahu period amplifies worldly hunger, ambition, and fascination with the unfamiliar. It's a chapter of big reaches, unconventional paths, and rapid change — often unexpected and expansive, asking you to grow into something new.", strengths: ["Ambition and boldness", "Innovation and originality", "Appetite for new experience"], growthEdge: "Staying grounded amid the pull for more — checking that the hunger serves your real values." },
  "Jupiter": { theme: "Wisdom & expansion", description: "A Jupiter period opens the chapter toward growth, learning, faith, and abundance. Opportunities to teach, study, travel, and expand tend to arrive, and generosity — given and received — is a theme.", strengths: ["Wisdom and perspective", "Optimism and generosity", "A season for growth and meaning"], growthEdge: "Turning expansion into depth — following through on what you begin rather than over-reaching." },
  "Saturn": { theme: "Discipline & maturation", description: "A Saturn period is the long, steady chapter of responsibility, structure, and earned maturity. It can feel demanding, but it builds something real — patience and consistent effort are rewarded over time.", strengths: ["Discipline and endurance", "Responsibility and integrity", "The capacity to build lasting things"], growthEdge: "Being kind to yourself under the weight — trusting slow, honest progress over pressure." },
  "Mercury": { theme: "Mind & communication", description: "A Mercury period sharpens the mind, communication, and curiosity. It's a chapter for learning, writing, teaching, commerce, and connection — ideas move quickly and adaptability serves you well.", strengths: ["Sharp thinking and learning", "Skillful communication", "Adaptability and wit"], growthEdge: "Grounding the busy mind — choosing depth over scatter, and rest over constant input." },
};

// Shadbala — how each planet reads when it's your strongest vs. your developing
// one. A reflective lens on where expression comes easily and where it's a
// conscious practice. Never a verdict on worth, and pointedly not about health.
export const PLANET_STRENGTH_MEANINGS: Record<string, { domain: string; strong: string; developing: string }> = {
  "Sun": { domain: "identity, confidence & purpose", strong: "Your sense of self and purpose expresses clearly and with natural warmth — you can lead and be seen without forcing it.", developing: "A clear, confident sense of self is something you get to build deliberately — your authority grows as you claim it." },
  "Moon": { domain: "emotions, care & belonging", strong: "Your emotional world and instinct to nurture flow naturally — you attune to feeling with ease.", developing: "Emotional steadiness and self-nurture are a conscious practice for you — tending your inner weather pays off." },
  "Mars": { domain: "drive, courage & action", strong: "Initiative and the courage to act come readily — you can start things and stand your ground.", developing: "Asserting yourself and beginning things may take deliberate effort — your strength grows each time you use it." },
  "Mercury": { domain: "mind, communication & learning", strong: "Thinking, learning, and communicating come fluidly — you connect ideas and people with ease.", developing: "Clear focus and communication are skills you cultivate — structure and practice sharpen them over time." },
  "Jupiter": { domain: "wisdom, growth & faith", strong: "Optimism, meaning, and a sense of growth come naturally — you tend to see the bigger picture.", developing: "Perspective and faith are something you build intentionally — seeking wisdom and mentors nourishes it." },
  "Venus": { domain: "love, beauty & harmony", strong: "Connection, pleasure, and an eye for beauty come easily — relating and receiving feel natural.", developing: "Ease in relating and letting yourself receive is a growing edge — you learn to soften and enjoy." },
  "Saturn": { domain: "discipline, structure & endurance", strong: "Discipline and the ability to build lasting things come naturally — you can hold a long, steady line.", developing: "Structure and patience are qualities you consciously develop — small consistent steps build the muscle." },
};

// Solar Return — the "rising sign of your year" (the return Ascendant sets the
// year's overall flavour) and the life area the return Sun spotlights (its house).
// Reflective themes for the year ahead, never fixed predictions.
export const SOLAR_RETURN_ASC_THEMES: Record<string, string> = {
  "Aries": "a year of bold beginnings and initiative — a fresh, self-directed chapter where courage opens doors.",
  "Taurus": "a year of steadiness and building — slowing down to create something solid and savour what's real.",
  "Gemini": "a year of curiosity and connection — learning, conversation, and following what fascinates you.",
  "Cancer": "a year of nurture and belonging — tending home, family, and your emotional foundations.",
  "Leo": "a year of self-expression and visibility — stepping into your warmth and being seen.",
  "Virgo": "a year of refinement and care — improving your craft, routines, and how you serve.",
  "Libra": "a year of relationship and balance — partnership, harmony, and meeting others halfway.",
  "Scorpio": "a year of depth and transformation — honest change, intimacy, and releasing what's finished.",
  "Sagittarius": "a year of expansion and adventure — travel, study, and reaching for more meaning.",
  "Capricorn": "a year of ambition and structure — building toward a real goal with patience and mastery.",
  "Aquarius": "a year of innovation and community — freedom, fresh ideas, and finding your people.",
  "Pisces": "a year of intuition and compassion — softening, creativity, and tending your inner life.",
};
export const SOLAR_RETURN_SUN_HOUSE: Record<number, { area: string; theme: string }> = {
  1: { area: "self & fresh starts", theme: "This year puts you at the centre — identity, vitality, and how you show up. A season for new beginnings that are genuinely yours." },
  2: { area: "resources & self-worth", theme: "This year highlights money, values, and what you build on — a chance to steady your foundations and know your own worth." },
  3: { area: "communication & learning", theme: "This year emphasizes ideas, conversation, and learning — writing, connecting locally, and following your curiosity." },
  4: { area: "home & roots", theme: "This year centres home, family, and inner foundations — tending where you come from and where you feel safe." },
  5: { area: "creativity & joy", theme: "This year spotlights creativity, romance, and play — self-expression and doing what lights you up." },
  6: { area: "work & wellbeing", theme: "This year focuses on daily work, routines, and self-care — refining how you spend your days and tend yourself." },
  7: { area: "partnership", theme: "This year emphasizes one-to-one relationships — partnership, collaboration, and learning through others." },
  8: { area: "depth & transformation", theme: "This year invites depth — intimacy, shared resources, and honest transformation. A season for letting go and renewing." },
  9: { area: "growth & horizons", theme: "This year expands your horizons — travel, study, and beliefs. A season to grow beyond the familiar." },
  10: { area: "career & direction", theme: "This year foregrounds career and public life — ambition, reputation, and the direction you're headed." },
  11: { area: "community & hopes", theme: "This year highlights friendships, community, and long-range hopes — your place in the bigger picture." },
  12: { area: "rest & reflection", theme: "This year turns inward — rest, reflection, and spiritual life. A quieter season for release and renewal before a new cycle." },
};

// ══════════════════════════════════════════════════════════════════
// TRANSITS
// ══════════════════════════════════════════════════════════════════

export interface Transit {
  id: string;
  planet: Planet;
  sign: ZodiacSign;
  title: string;
  plainDescription: string;
  whatItMeans: string;
  suggestion: string;
  duration: string;
}

// ══════════════════════════════════════════════════════════════════
// CONNECTIONS (blended compatibility)
// ══════════════════════════════════════════════════════════════════

export type RelationshipLens = "Romance" | "Friendship" | "Work" | "Family";

export interface ConnectionPerson {
  id: string; name: string; avatarInitial: string;
  sunSign: ZodiacSign; relationship: string;
  compatibilityScore: number; compatibilityLabel: string;
  whereYouFlow: string; whereYouGrow: string;
  howToLove: string[];
  romanceTip: string; friendshipTip: string; workTip: string; familyTip: string;
  numerologyScore: number; chineseScore: number;
  blendedSummary: string;
}

// ══════════════════════════════════════════════════════════════════
// CHAT (cross-system Ask Soluna)
// ══════════════════════════════════════════════════════════════════

export interface ChatMessage {
  id: string; sender: "user" | "soluna"; text: string; timestamp: string;
  isError?: boolean;
  /** Systems the answer actually drew on (from the API). */
  systems?: string[];
}

// ══════════════════════════════════════════════════════════════════
// TAROT DATA
// ══════════════════════════════════════════════════════════════════

export const TAROT_SPREADS: TarotSpread[] = [
  { id: "daily-reset", name: "Daily Reset (free)", positions: ["One card for today"], description: "A single card drawn for this moment — a gentle check-in, free for everyone." },
  { id: "three-card", name: "Past · Present · Future", positions: ["Past influence", "Present situation", "Future potential"], description: "A simple, elegant spread that illuminates the arc of a situation — where it came from, where it is now, and where it's heading." },
  { id: "celtic-cross", name: "Celtic Cross", positions: ["Present", "Challenge", "Past", "Future", "Above", "Below", "Advice", "External", "Hopes", "Outcome"], description: "The classic 10-card spread for a deep, nuanced reading on any life question. Best for when you want the full picture." },
];

// ══════════════════════════════════════════════════════════════════
// SOLUNA FOCUS
// ══════════════════════════════════════════════════════════════════

export type FocusCategory =
  | "Relationship"
  | "Work"
  | "School"
  | "Big Decision"
  | "Family"
  | "Friendship"
  | "Money"
  | "Self-Worth"
  | "Creativity"
  | "Spiritual Growth"
  | "Something Personal";

export type FocusSupport = "Gentle" | "Clear" | "Motivating" | "Practical" | "Reflective";

export type FocusContext =
  | "journal"
  | "savedReadings"
  | "mood"
  | "memoryThemes"
  | "recentAsk"
  | "bondDynamics";

export type FocusStatus = "active" | "paused" | "resolved";

export type CheckInResult =
  | "Better"
  | "Still unclear"
  | "Harder than expected"
  | "I took the step"
  | "I didn't take the step yet";

export interface FocusData {
  id: string;
  title: string;
  category: FocusCategory;
  supportMode: FocusSupport;
  connectedPersonId?: string;
  connectedPersonName?: string;
  contextUsed: FocusContext[];
  freeText: string;
  status: FocusStatus;
  createdAt: string;
  lastUpdated: string;
  nextCheckIn?: string;
}

export interface FocusResult {
  whatSolunaNotices: string;
  deeperPattern: string;
  watchFor: string;
  tryThisNext: string;
  ifInvolvesOther?: string;
  reflectionPrompt: string;
  systemsReferenced: string[];
}

export interface FocusCheckIn {
  result: CheckInResult;
  whatChanged: string;
  updatedGuidance: {
    whatShifted: string;
    recommendedNext: string;
    suggestion: "keep" | "pause" | "resolve";
  };
}

export interface FocusCategoryConfig {
  id: FocusCategory;
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export const FOCUS_CATEGORIES: FocusCategoryConfig[] = [
  { id: "Relationship", label: "Relationship", emoji: "💞", color: "#F2A88D", description: "Navigating a romantic partnership or dating life." },
  { id: "Work", label: "Work", emoji: "💼", color: "#B9A3E3", description: "Career direction, a job decision, or workplace dynamics." },
  { id: "School", label: "School", emoji: "📚", color: "#7BC89C", description: "Studies, academic pressure, or choosing a path." },
  { id: "Big Decision", label: "Big Decision", emoji: "⚖️", color: "#E8B86D", description: "A choice that feels weighty and you want clarity." },
  { id: "Family", label: "Family", emoji: "🏡", color: "#7BC89C", description: "Family dynamics, a conversation, or home life." },
  { id: "Friendship", label: "Friendship", emoji: "🌟", color: "#E8B86D", description: "A friendship that's shifting, growing, or needing attention." },
  { id: "Money", label: "Money", emoji: "💰", color: "#7BC89C", description: "Financial decisions, security, or scarcity feelings." },
  { id: "Self-Worth", label: "Self-Worth", emoji: "🪞", color: "#F2A88D", description: "How you see yourself, your value, your enoughness." },
  { id: "Creativity", label: "Creativity", emoji: "🎨", color: "#B9A3E3", description: "A creative block, a project, or trusting your ideas." },
  { id: "Spiritual Growth", label: "Spiritual Growth", emoji: "🌱", color: "#B9A3E3", description: "Deepening your inner life, practice, or belief." },
  { id: "Something Personal", label: "Something Personal", emoji: "💭", color: "#E8B86D", description: "Something tender you want to explore privately." },
];

export const FOCUS_SUPPORT_OPTIONS: { id: FocusSupport; label: string; emoji: string; color: string; description: string }[] = [
  { id: "Gentle", label: "Gentle", emoji: "🌸", color: "#F2A88D", description: "Soft, reassuring guidance — like a warm hand on your shoulder." },
  { id: "Clear", label: "Clear", emoji: "🔮", color: "#B9A3E3", description: "Direct, honest insight — let's cut through the fog together." },
  { id: "Motivating", label: "Motivating", emoji: "🔥", color: "#E8B86D", description: "Energizing encouragement — a gentle push toward what's possible." },
  { id: "Practical", label: "Practical", emoji: "🌿", color: "#7BC89C", description: "Grounded, actionable steps — show me what I can actually do." },
  { id: "Reflective", label: "Reflective", emoji: "🌙", color: "#B9A3E3", description: "Deep, contemplative — let's sit with the questions that matter." },
];

export const FOCUS_CONTEXT_OPTIONS: { id: FocusContext; label: string; emoji: string; description: string }[] = [
  { id: "journal", label: "Recent journal themes", emoji: "📖", description: "Patterns and feelings you've written about recently." },
  { id: "savedReadings", label: "Saved readings", emoji: "💾", description: "Insights you've bookmarked and wanted to return to." },
  { id: "mood", label: "Current mood", emoji: "💫", description: "The support mode and emotional tone you're carrying today." },
  { id: "memoryThemes", label: "Memory themes I approved", emoji: "🧠", description: "Themes you've told Soluna it's okay to remember." },
  { id: "recentAsk", label: "Recent Ask conversations", emoji: "💬", description: "What you've been exploring with Soluna lately." },
  { id: "bondDynamics", label: "Selected Bond dynamics", emoji: "💞", description: "The relationship patterns Soluna has noticed in your Bond." },
];

// ══════════════════════════════════════════════════════════════════
// CITIES
// ══════════════════════════════════════════════════════════════════

export const CITIES = [
  "New York, New York, USA", "Los Angeles, California, USA", "Chicago, Illinois, USA",
  "Houston, Texas, USA", "Phoenix, Arizona, USA", "Philadelphia, Pennsylvania, USA",
  "San Francisco, California, USA", "Seattle, Washington, USA", "Denver, Colorado, USA",
  "Portland, Oregon, USA", "Austin, Texas, USA", "Miami, Florida, USA",
  "Atlanta, Georgia, USA", "Boston, Massachusetts, USA", "Nashville, Tennessee, USA",
  "London, England, UK", "Paris, France", "Berlin, Germany", "Tokyo, Japan",
  "Sydney, Australia", "Toronto, Ontario, Canada", "Vancouver, British Columbia, Canada",
  "Mexico City, Mexico", "São Paulo, Brazil", "Buenos Aires, Argentina",
  "Mumbai, India", "Delhi, India", "Cairo, Egypt", "Lagos, Nigeria", "Nairobi, Kenya",
];

export const CITY_COORDS: Record<string, { lat: number; lng: number; timezone: string }> = {
  "New York, New York, USA": { lat: 40.7128, lng: -74.006, timezone: "America/New_York" },
  "Los Angeles, California, USA": { lat: 34.0522, lng: -118.2437, timezone: "America/Los_Angeles" },
  "Chicago, Illinois, USA": { lat: 41.8781, lng: -87.6298, timezone: "America/Chicago" },
  "Houston, Texas, USA": { lat: 29.7604, lng: -95.3698, timezone: "America/Chicago" },
  "Phoenix, Arizona, USA": { lat: 33.4484, lng: -112.074, timezone: "America/Phoenix" },
  "Philadelphia, Pennsylvania, USA": { lat: 39.9526, lng: -75.1652, timezone: "America/New_York" },
  "San Francisco, California, USA": { lat: 37.7749, lng: -122.4194, timezone: "America/Los_Angeles" },
  "Seattle, Washington, USA": { lat: 47.6062, lng: -122.3321, timezone: "America/Los_Angeles" },
  "Denver, Colorado, USA": { lat: 39.7392, lng: -104.9903, timezone: "America/Denver" },
  "Portland, Oregon, USA": { lat: 45.5152, lng: -122.6784, timezone: "America/Los_Angeles" },
  "Austin, Texas, USA": { lat: 30.2672, lng: -97.7431, timezone: "America/Chicago" },
  "Miami, Florida, USA": { lat: 25.7617, lng: -80.1918, timezone: "America/New_York" },
  "Atlanta, Georgia, USA": { lat: 33.749, lng: -84.388, timezone: "America/New_York" },
  "Boston, Massachusetts, USA": { lat: 42.3601, lng: -71.0589, timezone: "America/New_York" },
  "Nashville, Tennessee, USA": { lat: 36.1627, lng: -86.7816, timezone: "America/Chicago" },
  "London, England, UK": { lat: 51.5072, lng: -0.1276, timezone: "Europe/London" },
  "Paris, France": { lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris" },
  "Berlin, Germany": { lat: 52.52, lng: 13.405, timezone: "Europe/Berlin" },
  "Tokyo, Japan": { lat: 35.6762, lng: 139.6503, timezone: "Asia/Tokyo" },
  "Sydney, Australia": { lat: -33.8688, lng: 151.2093, timezone: "Australia/Sydney" },
  "Toronto, Ontario, Canada": { lat: 43.6532, lng: -79.3832, timezone: "America/Toronto" },
  "Vancouver, British Columbia, Canada": { lat: 49.2827, lng: -123.1207, timezone: "America/Vancouver" },
  "Mexico City, Mexico": { lat: 19.4326, lng: -99.1332, timezone: "America/Mexico_City" },
  "São Paulo, Brazil": { lat: -23.5558, lng: -46.6396, timezone: "America/Sao_Paulo" },
  "Buenos Aires, Argentina": { lat: -34.6037, lng: -58.3816, timezone: "America/Argentina/Buenos_Aires" },
  "Mumbai, India": { lat: 19.076, lng: 72.8777, timezone: "Asia/Kolkata" },
  "Delhi, India": { lat: 28.6139, lng: 77.209, timezone: "Asia/Kolkata" },
  "Cairo, Egypt": { lat: 30.0444, lng: 31.2357, timezone: "Africa/Cairo" },
  "Lagos, Nigeria": { lat: 6.5244, lng: 3.3792, timezone: "Africa/Lagos" },
  "Nairobi, Kenya": { lat: -1.2921, lng: 36.8219, timezone: "Africa/Nairobi" },
};

// ══════════════════════════════════════════════════════════════════
// ONBOARDING
// ══════════════════════════════════════════════════════════════════

export type OnboardingStep =
  | "welcome" | "fullName" | "preferredName" | "birthdate" | "birthtime" | "birthplace" | "calculating" | "reveal";

export function getPlacementInterpretation(planet: Planet, sign: ZodiacSign, house: number | null): PlacementInterpretation | null {
  const key = house != null ? `${planet}-${sign}-${house}` : "";
  if (key && PLACEMENT_INTERPRETATIONS[key]) return PLACEMENT_INTERPRETATIONS[key];
  const partialKey = `${planet}-${sign}`;
  const partial = Object.entries(PLACEMENT_INTERPRETATIONS).find(([k]) => k.startsWith(partialKey));
  return partial ? partial[1] : null;
}

export const BIG_THREE_DESCRIPTIONS: Record<string, string> = {
  "Sun-Cancer": "Your Sun in Cancer means you lead with heart. You nurture, protect, and feel deeply — it's your superpower, not your soft spot.",
  "Moon-Pisces": "Your Moon in Pisces gives you a soul that's part poet, part mystic. You understand things without needing them explained, and your compassion is boundless.",
  "Rising-Libra": "With Libra rising, you greet the world with warmth and grace. People feel at ease around you — your presence is a gift you might not even realize you're giving.",
};

// ─── Blueprint Summary (for Profile / quick display) ─────────────
export interface BlueprintSummary {
  // Each field is null when that lens isn't available yet (honest, never faked).
  sunSign: ZodiacSign | null;
  moonSign: ZodiacSign | null;
  rising: ZodiacSign | null;
  lifePath: number | null;
  animal: ChineseAnimal | null;
  element: ChineseElement | null;
  hdType: HDType | null;
}

export function getBlueprintSummary(user: UserData): BlueprintSummary {
  return {
    sunSign: user.chart?.sun.sign ?? null,
    moonSign: user.chart?.moon.sign ?? null,
    rising: user.chart?.rising ?? null,
    lifePath: user.numerology?.lifePath ?? null,
    animal: user.chinese?.animal ?? null,
    element: user.chinese?.element ?? null,
    hdType: user.humanDesign?.type ?? null,
  };
}
