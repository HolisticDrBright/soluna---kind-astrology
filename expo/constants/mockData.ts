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
  planet: Planet; sign: ZodiacSign; house: number; degree: number;
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

export const HD_INTERPRETATIONS: Record<string, { description: string; strengths: string[]; growthEdge: string }> = {
  "Generator": {
    description: "As a Generator, you are quite literally the life force of humanity. About 37% of people share your type, and together, Generators and Manifesting Generators make up about 70% of the population. You have a defined Sacral center — a powerful, consistent source of creative, life-giving energy. When you're doing work you love, you can sustain it almost endlessly. Your gift isn't speed or initiation — it's sustainable momentum and the deep satisfaction that comes from being fully engaged in what matters to you. The world literally runs on Generator energy — your joy is not frivolous, it's fuel.",
    strengths: ["Sustainable, powerful creative energy when aligned", "Deep gut wisdom that guides you toward the right people and opportunities", "Natural warmth and presence that energizes others", "Capacity for deep satisfaction in work and life"],
    growthEdge: "Frustration is your signal that you're out of alignment — pushing, initiating from the mind, or saying yes when your gut says no. When you feel stuck, pause and ask: 'Am I responding to life, or forcing it?'",
  },
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
}

// ══════════════════════════════════════════════════════════════════
// TAROT DATA
// ══════════════════════════════════════════════════════════════════

export const TAROT_SPREADS: TarotSpread[] = [
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

export function getPlacementInterpretation(planet: Planet, sign: ZodiacSign, house: number): PlacementInterpretation | null {
  const key = `${planet}-${sign}-${house}`;
  if (PLACEMENT_INTERPRETATIONS[key]) return PLACEMENT_INTERPRETATIONS[key];
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
