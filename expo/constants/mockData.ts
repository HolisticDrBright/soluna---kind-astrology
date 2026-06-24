import { Platform } from "react-native";

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
  sun: Placement; moon: Placement; rising: ZodiacSign; placements: Placement[];
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
  bazi: BaZiPillar[];
}

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
  chart: ChartData;
  numerology: NumerologyData;
  chinese: ChineseAstrologyData;
  humanDesign: HumanDesignData;
}

export const MOCK_NUMEROLOGY: NumerologyData = {
  lifePath: 3,
  lifePathMeaning: "The Creative Communicator — you're here to express, uplift, and bring joy through your words and art. Your life path is about learning to share your authentic voice with the world, without self-censorship.",
  expression: 7,
  expressionMeaning: "Your Expression number 7 reflects a deeply analytical and spiritual nature. You process the world through a lens of curiosity and depth, and you communicate with insight that surprises people.",
  soulUrge: 9,
  soulUrgeMeaning: "At your core, your Soul Urge is 9 — the humanitarian. What truly fulfills you is contributing to something bigger than yourself. You feel most alive when you're helping, healing, or lifting others up.",
  personalYear: 7,
  personalYearMeaning: "This is your 7 Personal Year — a year of inner reflection, spiritual growth, and deep learning. It's not a year for big external moves, but for understanding yourself more profoundly. Trust the quieter rhythm.",
  personalMonth: 3,
  personalMonthMeaning: "Your 3 Personal Month brings a burst of creative, social energy. This is a wonderful time to share your ideas, connect with people who inspire you, and let your natural warmth shine.",
  personalDay: 7,
  personalDayMeaning: "Today is a Personal Day 7 — a day for reflection, for trust in the unseen, for honoring the mystery within you. Perfect for journaling, meditation, or one deep, meaningful conversation.",
};

export const MOCK_CHINESE: ChineseAstrologyData = {
  animal: "Pig",
  element: "Wood",
  elementAnimalLabel: "Wood Pig",
  description: "The Wood Pig is one of the most generous, warm-hearted combinations in the Chinese zodiac. You're naturally optimistic, deeply loyal, and have a quiet strength that doesn't need to announce itself. People trust you instinctively because you're genuine — what they see is really what you are. You bring comfort and stability to any group you're part of, and your optimism is quietly contagious.",
  strengths: [
    "Generous, warm, and genuinely kind-hearted",
    "Quiet strength — you don't need to prove anything",
    "Natural optimism that lifts others",
    "Deep loyalty to the people you love",
  ],
  growthEdge: "Your trusting nature can sometimes leave you vulnerable to people who don't have your best interests at heart. Learning to discern who deserves your generosity — and who doesn't — is a gentle but important lesson.",
  todayAnimal: "Snake",
  todayElement: "Fire",
  todayNote: "Today's Snake energy brings a contemplative, intuitive quality to your day. It's a good moment to trust your gut, especially in conversations where something feels unsaid. The Fire element adds a spark of passion — lean into what excites you.",
  bazi: [
    { heavenlyStem: "Yi", earthlyBranch: "Pig", element: "Wood", meaning: "Day Master — your core self, gentle and adaptable like a blade of grass that bends but doesn't break." },
    { heavenlyStem: "Ding", earthlyBranch: "Rabbit", element: "Fire", meaning: "Output star — your creative and expressive fire that warms others and lights up rooms." },
    { heavenlyStem: "Xin", earthlyBranch: "Ox", element: "Metal", meaning: "Wealth star — your capacity for building security and material comfort through steady effort." },
    { heavenlyStem: "Gui", earthlyBranch: "Rat", element: "Water", meaning: "Resource star — your depth of wisdom, intuition, and the support that flows toward you." },
  ],
};

export const MOCK_HUMAN_DESIGN: HumanDesignData = {
  type: "Generator",
  typeDescription: "As a Generator, you're the life force of the world — literally. Generators have a defined Sacral center, which means you have a powerful, consistent source of creative energy. When you're doing work you love, you can sustain it beautifully. Your gift isn't speed — it's sustainable momentum. The key is learning to only say yes to what lights you up.",
  strategy: "To Respond",
  strategyDescription: "Your strategy is 'To Respond' — rather than initiating from the mind, you thrive when you wait for life to come to you and then respond with your gut. This isn't passivity — it's alignment. When something is right, your Sacral will give you a clear yes (a feeling of expansion, energy, excitement). When it's wrong, you'll feel contraction, resistance, or just... flatness. Trust those signals.",
  authority: "Emotional",
  authorityDescription: "Your inner authority is Emotional — meaning clarity comes through the wave of your feelings over time. You're not designed to make decisions in the moment. Wait. Sleep on it. Let the emotional wave rise and fall before committing. What feels true right now might feel different tomorrow, and that's not flakiness — it's your process.",
  profile: "6/2 – Role Model / Hermit",
  profileDescription: "Your profile is 6/2 — the Role Model Hermit. The 6th line means your life unfolds in three phases: exploration (youth), observation (mid-life), and embodiment (wisdom years). You're here to become a living example, not by preaching but by simply being who you are. The 2nd line gives you a natural talent that others see more clearly than you do — and a genuine need for alone time to recharge.",
  incarnationCross: "Right Angle Cross of Explanation",
  signature: "Satisfaction",
  notSelf: "Frustration",
  centers: [
    { name: "Head", defined: false, gates: [] },
    { name: "Ajna", defined: false, gates: [] },
    { name: "Throat", defined: true, gates: [35, 12] },
    { name: "G Center", defined: true, gates: [15, 10] },
    { name: "Heart/Ego", defined: false, gates: [] },
    { name: "Sacral", defined: true, gates: [5, 14, 29] },
    { name: "Solar Plexus", defined: true, gates: [36, 37] },
    { name: "Spleen", defined: false, gates: [] },
    { name: "Root", defined: true, gates: [38, 54] },
  ],
  strengths: [
    "Sustainable, powerful creative energy when aligned with what you love",
    "Deep gut knowing that guides you toward the right people and opportunities",
    "Natural warmth that makes others feel safe and seen",
    "A life path that unfolds beautifully when you trust your timing",
  ],
  growthEdge: "Your design can lead to frustration when you try to force things or initiate from the mind. When you feel stuck or drained, it's often a sign that you're pushing rather than responding. Pause, and let life come to you.",
};

export const MOCK_USER: UserData = {
  fullName: "Maya Elizabeth Chen",
  preferredName: "Maya",
  birthDate: "1995-06-22",
  birthTime: "14:35",
  birthTimeKnown: true,
  birthPlace: "Portland, Oregon, USA",
  chart: {
    sun: { planet: "Sun", sign: "Cancer", house: 12, degree: 15 },
    moon: { planet: "Moon", sign: "Pisces", house: 8, degree: 22 },
    rising: "Libra",
    placements: [
      { planet: "Sun", sign: "Cancer", house: 12, degree: 15 },
      { planet: "Moon", sign: "Pisces", house: 8, degree: 22 },
      { planet: "Mercury", sign: "Leo", house: 11, degree: 7 },
      { planet: "Venus", sign: "Gemini", house: 10, degree: 18 },
      { planet: "Mars", sign: "Virgo", house: 3, degree: 4 },
      { planet: "Jupiter", sign: "Taurus", house: 9, degree: 29 },
      { planet: "Saturn", sign: "Capricorn", house: 6, degree: 11 },
      { planet: "Uranus", sign: "Aquarius", house: 5, degree: 25 },
      { planet: "Neptune", sign: "Pisces", house: 7, degree: 14 },
      { planet: "Pluto", sign: "Sagittarius", house: 4, degree: 8 },
    ],
  },
  numerology: MOCK_NUMEROLOGY,
  chinese: MOCK_CHINESE,
  humanDesign: MOCK_HUMAN_DESIGN,
};

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

export const DAILY_READINGS: DailyReading[] = [
  {
    date: "2026-06-24",
    reading: "Today's Cancer moon, your Personal Day 7, and your Generator design all point to the same quiet invitation: slow down and feel what's really here. You don't have to push so hard — rest is productive too. A quiet conversation this evening could bring unexpected warmth, especially with someone who doesn't need you to perform.",
    moonPhase: "Waxing Gibbous",
    moonPhaseEmoji: "🌔",
    moonSign: "Cancer",
    transit1: { planet: "Venus", sign: "Gemini", blurb: "Venus in Gemini brings playful, curious energy to your conversations — say the thing you've been holding back, gently." },
    transit2: { planet: "Mars", sign: "Virgo", blurb: "Mars in Virgo sharpens your focus. Perfect for tackling that one small task that's been lingering." },
    energyLevel: 3,
    energyCaption: "Steady and reflective — a good day for quiet wins.",
    affirmation: "I trust the rhythm of my own life. I don't need to rush what's meant to unfold.",
    do: "Light a candle and journal for ten minutes",
    embrace: "A slower pace — productivity isn't everything",
    easeUp: "Overthinking a text you sent this morning",
    personalDay: 7,
    personalDayMeaning: "A Personal Day 7 is about inner listening. Your intuition is louder than usual — pay attention.",
    chineseNote: "Today's Snake energy brings quiet wisdom. Trust your instincts in conversations — you're reading between the lines beautifully.",
    systemsAgree: {
      systems: ["Moon in Cancer", "Personal Day 7", "Generator Sacral"],
      summary: "3 systems point to rest, reflection, and trusting your gut today.",
      detail: "Your Moon in Cancer (astrology) activates your emotional depth and need for safety. Your Personal Day 7 (numerology) says this is a day for inner listening, not outer pushing. Your Generator design (Human Design) asks you to wait and respond rather than initiate. Together, they're all saying the same thing: pause. Let life come to you today.",
    },
    cardOfTheDay: {
      name: "The High Priestess",
      arcana: "major",
      imageEmoji: "🌙",
      uprightMeaning: "Today, The High Priestess invites you to trust what you know without knowing how you know it. Your intuition is especially sharp right now — pay attention to dreams, gut feelings, and the quiet voice inside. There's wisdom in silence today.",
    },
  },
  {
    date: "2026-06-25",
    reading: "With the Sun lighting up your 12th house and your Life Path 3 energy humming, today is rich with creative possibility. Your intuition is sharper than usual, and a spark of inspiration in the afternoon could lead somewhere lovely. Your Generator sacral will give you a clear yes or no — trust the buzz.",
    moonPhase: "Waxing Gibbous",
    moonPhaseEmoji: "🌔",
    moonSign: "Leo",
    transit1: { planet: "Sun", sign: "Cancer", blurb: "The Sun in Cancer wraps you in a warm, nurturing blanket — let yourself be taken care of today." },
    transit2: { planet: "Mercury", sign: "Leo", blurb: "Mercury in Leo gives your words a little extra sparkle. Great day for sharing ideas." },
    energyLevel: 4,
    energyCaption: "Creative and intuitive — follow the inspiration.",
    affirmation: "My inner voice is wise and kind. I can trust what it whispers.",
    do: "Write down three things that feel right today, even if you can't explain why",
    embrace: "A creative detour — it might be the path",
    easeUp: "Needing to have everything figured out by dinner",
    personalDay: 8,
    personalDayMeaning: "A Personal Day 8 brings an empowered, capable energy. You can get things done today — channel it into one meaningful task.",
    chineseNote: "Horse energy today brings a spirited, free quality to your day. Follow your curiosity — it knows where it's going.",
    systemsAgree: {
      systems: ["Sun in 12th House", "Life Path 3", "Wood Pig"],
      summary: "All 3 point to creative expression and trusting your unique perspective.",
      detail: "Your Sun in the 12th house (astrology) opens a channel to your subconscious creative source. Your Life Path 3 (numerology) is the path of the Creative Communicator — expressing yourself is literally your purpose. Your Wood Pig (Chinese) brings generous, warm-hearted optimism to whatever you create. Together: your creativity isn't a hobby, it's a compass.",
    },
    cardOfTheDay: {
      name: "Ace of Cups",
      arcana: "minor",
      suit: "Cups",
      imageEmoji: "🏆",
      uprightMeaning: "The Ace of Cups signals an opening of the heart. New emotional beginnings are possible today — in a relationship, a creative project, or your relationship with yourself. Let the feelings flow. This is a beautiful card for starting something you love.",
    },
  },
  {
    date: "2026-06-26",
    reading: "Your ruling Moon dances through bold Leo today, lighting up your Generator fire and calling your expressive Life Path 3 to the stage. You might feel a gentle pull to be seen — to share something you've been quietly working on. The right person will receive it with warmth. Your Wood Pig generosity makes your sharing feel like a gift rather than a pitch.",
    moonPhase: "Full Moon",
    moonPhaseEmoji: "🌕",
    moonSign: "Leo",
    transit1: { planet: "Jupiter", sign: "Taurus", blurb: "Jupiter in Taurus expands your sense of abundance — notice the small riches around you." },
    transit2: { planet: "Saturn", sign: "Capricorn", blurb: "Saturn in Capricorn offers a gentle nudge to set one healthy boundary. You'll feel lighter for it." },
    energyLevel: 5,
    energyCaption: "Radiant and bold — share your light today.",
    affirmation: "I am allowed to take up space. My voice matters and my presence is a gift.",
    do: "Share one thing you're proud of with someone you trust",
    embrace: "The spotlight — even if just for a moment",
    easeUp: "Downplaying your wins to make others comfortable",
    personalDay: 9,
    personalDayMeaning: "A Personal Day 9 brings completion energy. Something is ready to be released or celebrated — honor the cycle.",
    chineseNote: "The Goat's gentle creativity mingles with Fire today. Creative projects benefit from both patience and passion.",
    systemsAgree: {
      systems: ["Moon in Leo", "Personal Day 9", "Generator Signature"],
      summary: "3 systems agree: today is for completion, celebration, and being seen.",
      detail: "The Full Moon in Leo (astrology) illuminates what's ready to shine. Personal Day 9 (numerology) marks the end of a cycle — time to honor what's been completed. Your Generator signature of 'Satisfaction' (Human Design) tells you: if it feels energizing, it's right. Celebration isn't vanity — it's alignment.",
    },
    cardOfTheDay: {
      name: "The Sun",
      arcana: "major",
      imageEmoji: "☀️",
      uprightMeaning: "The Sun is one of the most joyful cards in the deck — it signals clarity, vitality, and success. Today, let yourself feel good about what you've accomplished. This isn't arrogance — it's healthy pride. Share your warmth generously.",
    },
  },
  {
    date: "2026-06-27",
    reading: "The Full Moon illuminates your 8th house of transformation, and your Soul Urge 9 is feeling it deeply. Emotions may feel closer to the surface, and your Emotional Authority says: wait before deciding. Let the wave rise and fall. Your Wood Pig heart knows that depth isn't dangerous — it's where the real stuff lives.",
    moonPhase: "Full Moon",
    moonPhaseEmoji: "🌕",
    moonSign: "Virgo",
    transit1: { planet: "Moon", sign: "Virgo", blurb: "The Moon in Virgo asks: what's one small thing you can tidy up — in your space or your mind?" },
    transit2: { planet: "Neptune", sign: "Pisces", blurb: "Neptune in Pisces blurs the edges of reality. Let yourself dream a little — it's not a waste of time." },
    energyLevel: 3,
    energyCaption: "Emotionally rich — gentle self-care goes a long way.",
    affirmation: "Feeling deeply is not a weakness. It's how I know I'm alive and growing.",
    do: "Have an honest, tender conversation with yourself — out loud or on paper",
    embrace: "The full spectrum of your emotions",
    easeUp: "Trying to 'fix' every feeling before bed",
    personalDay: 1,
    personalDayMeaning: "A Personal Day 1 brings fresh-start energy. Even in the midst of big feelings, a new seed is being planted.",
    chineseNote: "The Monkey's clever, playful energy lightens heavy emotions today. Find one thing that makes you laugh.",
    systemsAgree: {
      systems: ["Full Moon 8H", "Soul Urge 9", "Emotional Authority"],
      summary: "All 3 confirm: feeling deeply is your pathway, not your problem.",
      detail: "The Full Moon in your 8th house (astrology) brings transformation through emotional release. Your Soul Urge 9 (numerology) is the humanitarian — you feel the world's emotions as your own. Your Emotional Authority (Human Design) means clarity comes through feeling, not bypassing it. The message is unanimous: let yourself feel. That's where your wisdom lives.",
    },
    cardOfTheDay: {
      name: "The Moon",
      arcana: "major",
      imageEmoji: "🌑",
      uprightMeaning: "The Moon card invites you into the mystery. Things may feel unclear or emotionally charged, and that's okay — you don't need perfect clarity today. Trust the process. What feels confusing now will make sense in hindsight.",
    },
  },
  {
    date: "2026-06-28",
    reading: "As the Moon wanes into Virgo, your Expression number 7 and your defined Root center find a beautiful shared rhythm. A sense of gentle order returns — you might find satisfaction in small rituals: making your space feel good, finishing a book, sending that kind note. The ordinary is sacred today, and your 6/2 profile's hermit side would love some quiet.",
    moonPhase: "Waning Gibbous",
    moonPhaseEmoji: "🌖",
    moonSign: "Virgo",
    transit1: { planet: "Mercury", sign: "Leo", blurb: "Mercury in Leo keeps your conversations warm and generous — you'll say the right thing at the right time." },
    transit2: { planet: "Uranus", sign: "Aquarius", blurb: "Uranus in Aquarius sprinkles in a dash of surprise. Stay open to an unexpected invitation." },
    energyLevel: 4,
    energyCaption: "Grounded and graceful — a beautiful day for small wins.",
    affirmation: "I find meaning in the small moments. My daily life is full of quiet magic.",
    do: "Rearrange one corner of your home to feel fresh and yours",
    embrace: "Routine — it's not boring, it's grounding",
    easeUp: "Comparing your Sunday to anyone else's highlight reel",
    personalDay: 2,
    personalDayMeaning: "A Personal Day 2 brings harmonious, partnership-focused energy. Reach out to someone you care about.",
    chineseNote: "The Rooster's precise energy supports organization and detail work today. Small wins add up beautifully.",
    systemsAgree: {
      systems: ["Moon Waning Virgo", "Expression 7", "6/2 Hermit"],
      summary: "All roads point inward — this is a day for quiet depth, not social performance.",
      detail: "The waning Moon in Virgo (astrology) supports reflection and gentle order. Your Expression number 7 (numerology) thrives in solitude and analysis. Your 6/2 Hermit profile (Human Design) literally needs alone time to function well. Take the hint! Solitude isn't antisocial — it's how your design works best.",
    },
    cardOfTheDay: {
      name: "The Hermit",
      arcana: "major",
      imageEmoji: "🏮",
      uprightMeaning: "The Hermit appears when stillness is the answer. Today is for turning inward — for reflection, for silence, for the kind of wisdom that only comes when you step back from the noise. A quiet insight is waiting for you.",
    },
  },
  {
    date: "2026-06-29",
    reading: "Venus moving through your 10th house activates your Life Path 3 magnetism — your warmth is especially radiant at work or in public spaces. Your Generator energy responds beautifully to genuine appreciation: let yourself receive the compliment you've earned. Your Wood Pig generosity makes you a natural connector today.",
    moonPhase: "Waning Gibbous",
    moonPhaseEmoji: "🌖",
    moonSign: "Libra",
    transit1: { planet: "Venus", sign: "Gemini", blurb: "Venus in Gemini makes your charm effortless. Social connections flow beautifully today." },
    transit2: { planet: "Mars", sign: "Virgo", blurb: "Mars in Virgo gives you the precision to finish something important with grace." },
    energyLevel: 4,
    energyCaption: "Magnetic and capable — you're in a lovely flow.",
    affirmation: "I receive kindness as easily as I give it. I am worthy of the good that comes my way.",
    do: "Accept one compliment without deflecting — just say thank you",
    embrace: "Your natural charm — it's not showing off",
    easeUp: "Imposter feelings at work or in social settings",
    personalDay: 3,
    personalDayMeaning: "A Personal Day 3 is your sweet spot — creative, expressive, and socially magnetic. Share your ideas freely.",
    chineseNote: "Dog energy brings loyalty and warmth to your connections today. Someone appreciates you more than you know.",
    systemsAgree: {
      systems: ["Venus 10H", "Life Path 3", "Generator"],
      summary: "Your magnetism, creativity, and warmth are all firing together today — use it.",
      detail: "Venus in your 10th house (astrology) makes you magnetically warm in public and professional spaces. Your Life Path 3 (numerology) is the Creative Communicator — your voice and presence are your gifts. Your Generator design (Human Design) literally energizes others when you're doing what lights you up. When you shine, you give others permission to shine too.",
    },
    cardOfTheDay: {
      name: "Queen of Wands",
      arcana: "minor",
      suit: "Wands",
      imageEmoji: "👑",
      uprightMeaning: "The Queen of Wands embodies warmth, confidence, and magnetic presence. Today, you're her. Step into your power with kindness — lead with heart, and people will naturally follow. Your enthusiasm is contagious in the best way.",
    },
  },
  {
    date: "2026-06-30",
    reading: "The month closes with the Moon in Scorpio deepening your emotional waters. This is a beautiful day for intimate one-on-one time — your Personal Day 4 energy wants closeness, not crowds, and your Emotional Authority says: there's no rush. Your Wood Pig loyalty makes you the person others feel safest with. Depth over breadth.",
    moonPhase: "Waning Crescent",
    moonPhaseEmoji: "🌘",
    moonSign: "Scorpio",
    transit1: { planet: "Pluto", sign: "Sagittarius", blurb: "Pluto in Sagittarius encourages a philosophical lens — what belief is ready to be gently released?" },
    transit2: { planet: "Jupiter", sign: "Taurus", blurb: "Jupiter in Taurus reminds you that real abundance often looks like enough — and you are." },
    energyLevel: 2,
    energyCaption: "Quietly deep — honor your need for closeness.",
    affirmation: "I am enough, exactly as I am. My presence is the gift I bring to the people I love.",
    do: "Plan a low-key evening with someone who makes you feel safe",
    embrace: "Depth over breadth — one real connection is plenty",
    easeUp: "Feeling like you need to be 'on' socially",
    personalDay: 4,
    personalDayMeaning: "A Personal Day 4 is about foundations, home, and what's real. Ground yourself in what truly matters.",
    chineseNote: "Rat energy today favors strategy and quiet planning. A good day for thinking ahead rather than acting.",
    systemsAgree: {
      systems: ["Moon in Scorpio", "Personal Day 4", "Emotional Authority"],
      summary: "Depth, safety, and emotional honesty are your north stars today.",
      detail: "The Moon in Scorpio (astrology) calls you into emotional depth and truth. Personal Day 4 (numerology) centers on home, foundations, and what's real. Your Emotional Authority (Human Design) says: don't decide until you've felt it all the way through. Together, these three create a powerful invitation to go deep with someone you trust — or with yourself.",
    },
    cardOfTheDay: {
      name: "Six of Cups",
      arcana: "minor",
      suit: "Cups",
      imageEmoji: "🎁",
      uprightMeaning: "The Six of Cups brings nostalgia, sweetness, and emotional connection. Today, reach out to someone who's known you for a long time. A shared memory could warm you both. There's healing in remembering where you've been together.",
    },
  },
];

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

export const CURRENT_TRANSITS: Transit[] = [
  {
    id: "venus-gemini", planet: "Venus", sign: "Gemini",
    title: "Venus in Gemini",
    plainDescription: "Venus, the planet of love and connection, is currently moving through curious, communicative Gemini.",
    whatItMeans: "For you, Maya, this transit lights up your 10th house of career and public life. You might find that your natural warmth is especially appreciated at work or in group settings right now. Conversations flow with unusual ease, and people are drawn to your perspective. This is a lovely window for sharing ideas, collaborating, or simply letting your personality shine in professional spaces.",
    suggestion: "Reach out to someone you admire professionally — even just a kind message. The connection could open an unexpected door.",
    duration: "June 18 – July 12, 2026",
  },
  {
    id: "mars-virgo", planet: "Mars", sign: "Virgo",
    title: "Mars in Virgo",
    plainDescription: "Mars, the planet of action and drive, is moving through precise, detail-oriented Virgo.",
    whatItMeans: "For you, Maya, Mars is traveling through your 3rd house of communication and daily rhythms. This gives you a quiet but steady boost of focused energy — perfect for tackling projects that need attention to detail. Channel the energy into one thing at a time; scattered effort will feel frustrating, but focused effort will feel deeply satisfying.",
    suggestion: "Pick one project that's been lingering and give it two hours of undistracted attention. The momentum will feel wonderful.",
    duration: "June 5 – July 28, 2026",
  },
  {
    id: "jupiter-taurus", planet: "Jupiter", sign: "Taurus",
    title: "Jupiter in Taurus",
    plainDescription: "Jupiter, the planet of expansion and abundance, is moving through steady, sensory Taurus.",
    whatItMeans: "For you, Maya, Jupiter is blessing your 9th house of exploration, learning, and big-picture thinking. This is a year-long transit that gently expands your horizons — through travel, study, or simply a shift in perspective that makes the world feel bigger and more possible. Taurus energy keeps this expansion grounded: this isn't about running away, but about enriching the life you already have.",
    suggestion: "Sign up for that class, buy that book, or plan that trip you've been quietly dreaming about. The universe is giving you a gentle green light.",
    duration: "May 2026 – June 2027",
  },
  {
    id: "saturn-capricorn", planet: "Saturn", sign: "Capricorn",
    title: "Saturn in Capricorn",
    plainDescription: "Saturn, the planet of structure and wisdom, is moving through its home sign of Capricorn.",
    whatItMeans: "For you, Maya, Saturn is working through your 6th house of daily routines, health, and service. This is a gentle but persistent invitation to build structures that actually support you — not rigid rules, but kind frameworks that make your life feel more spacious, not less. You might feel a pull to refine your daily habits, set healthier boundaries at work, or commit to a practice that nourishes you.",
    suggestion: "Choose one small, kind habit to anchor your days — a morning ritual, an evening wind-down, a weekly check-in with yourself.",
    duration: "January – November 2026",
  },
];

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

export const CONNECTIONS: ConnectionPerson[] = [
  {
    id: "1", name: "Leo", avatarInitial: "L", sunSign: "Leo", relationship: "Friend",
    compatibilityScore: 82, compatibilityLabel: "Naturally easy",
    numerologyScore: 78, chineseScore: 85,
    blendedSummary: "Across astrology, numerology, and Chinese astrology, your connection with Leo shows strong harmony — particularly in how you nurture each other and bring out each other's warmth. Your astrology is especially aligned, your numbers complement well, and your Chinese signs are naturally friendly.",
    whereYouFlow: "Your Cancer Sun and Leo's warm heart create a safe, affectionate space where both of you feel seen. Leo brings out your playful side, and you offer Leo the emotional depth they secretly crave. Together, you balance warmth and depth beautifully — like a cozy fire and a good conversation.",
    whereYouGrow: "Leo's need for recognition can sometimes feel overwhelming to your more private nature. And Leo might wish you'd step into the spotlight a little more. These differences aren't problems — they're invitations to stretch gently toward each other.",
    howToLove: ["Celebrate Leo's wins openly — your genuine pride in them means the world", "Let Leo draw you out when you're retreating — they do it with love", "Share your feelings directly; Leo thrives on emotional honesty"],
    romanceTip: "Not a romantic match, but Leo's warmth and your depth could absolutely spark something tender if the timing is right. The foundation of friendship makes it even sweeter.",
    friendshipTip: "Your friendship works because you admire each other's differences rather than trying to change them. Leo brings sunshine; you bring soul. Protect that balance.",
    workTip: "Leo's bold ideas and your intuitive read on people make you a quietly powerful team. Let Leo pitch while you read the room.",
    familyTip: "As family, you'd be the warm, nurturing anchor and Leo would be the one who brings energy and celebration. Together you create a home that feels both safe and alive.",
  },
  {
    id: "2", name: "Sam", avatarInitial: "S", sunSign: "Scorpio", relationship: "Partner",
    compatibilityScore: 68, compatibilityLabel: "Growth pairing",
    numerologyScore: 72, chineseScore: 55,
    blendedSummary: "Your connection with Sam shows deep emotional resonance through astrology, with some beautiful tension through your Chinese signs that creates growth. Your numerology indicates complementary life paths — you challenge each other in ways that genuinely help you grow.",
    whereYouFlow: "Your water signs — Cancer and Scorpio — create a deep emotional resonance that few other pairings can match. You understand each other without words, and there's a profound sense of safety in that. When you're together, you both feel truly known.",
    whereYouGrow: "Scorpio's intensity can sometimes feel heavy to your Cancer heart, which needs lightness and nurturing. And Scorpio might occasionally wish you'd dive even deeper into the emotional waters they call home. These moments of friction aren't signs of incompatibility — they're chances to understand each other more fully.",
    howToLove: ["Give Scorpio reassurance that your occasional need for lightness isn't withdrawal — it's self-care", "Let Scorpio see your shadows without fear — they'll hold them with surprising tenderness", "Create rituals together that honor both depth (Scorpio) and coziness (you)"],
    romanceTip: "Your emotional connection is the engine of this relationship. When it feels intense, remember: Scorpio isn't testing you, they're inviting you closer. And your Cancer gentleness is exactly what softens Scorpio's edges.",
    friendshipTip: "Even as friends, you'd be the pair who can sit in comfortable silence and then share something real. You make each other feel safe enough to be vulnerable.",
    workTip: "Scorpio's strategic mind and your emotional intelligence make you formidable collaborators. Scorpio sees the chess moves; you see the people.",
    familyTip: "As family, the depth of your bond could be both a shelter and a storm. Your shared emotional language means you understand each other in ways others never will. Protect that — it's rare.",
  },
  {
    id: "3", name: "Priya", avatarInitial: "P", sunSign: "Taurus", relationship: "Friend",
    compatibilityScore: 91, compatibilityLabel: "Magnetic",
    numerologyScore: 88, chineseScore: 92,
    blendedSummary: "This is one of your strongest connections across all three systems. Your Cancer-Taurus astrology is a classic harmonious match, your numerology shows life paths that complement perfectly, and your Chinese signs are naturally friendly. This is the kind of connection that feels like coming home.",
    whereYouFlow: "Cancer and Taurus are a classic, beautiful match — you both crave security, comfort, and genuine connection. With Priya, you don't have to explain why you'd rather stay in with candles and good food than go to a loud party. She just gets it. Your time together feels like a deep exhale.",
    whereYouGrow: "Taurus can be wonderfully steady, but also stubborn. And your Cancer moods might sometimes puzzle Priya's more pragmatic mind. The growth here is gentle: you teach her that feelings have their own logic, and she teaches you that some things are simpler than they feel.",
    howToLove: ["Honor your shared love of comfort — make your hangouts a ritual, not an afterthought", "When Priya seems stubborn, try asking what she's protecting — it's usually something tender", "Let her ground you when your emotions are swirling; that steadiness is a gift"],
    romanceTip: "This is a friendship with the soul of something deeper. If romantic feelings ever surfaced, they'd have a strong foundation to grow on — mutual respect, genuine care, and that effortless comfort.",
    friendshipTip: "This is the friend who'll bring you soup when you're sad, not because you asked, but because she sensed it. Don't take this kind of connection for granted — nurture it.",
    workTip: "Taurus's persistence paired with your intuition is quietly unstoppable. She'll keep the project on track; you'll keep the team feeling human. A dream collaboration.",
    familyTip: "As chosen family, Priya would be your anchor through any storm — steady, unwavering, and there before you even ask. The kind of bond that makes life feel manageable.",
  },
  {
    id: "4", name: "Jordan", avatarInitial: "J", sunSign: "Aquarius", relationship: "Colleague",
    compatibilityScore: 74, compatibilityLabel: "Naturally easy",
    numerologyScore: 66, chineseScore: 80,
    blendedSummary: "Your connection with Jordan shows strong complementarity across systems — you cover each other's blind spots beautifully. Your astrology creates an opposites-attract dynamic that's productive, your Chinese signs are compatible, and your numerology suggests you'll learn a lot from each other.",
    whereYouFlow: "Your Cancer warmth and Jordan's Aquarius vision make for a surprisingly complementary dynamic. You humanize their big ideas, and they help you see beyond your immediate emotional landscape. Together, you cover both heart and mind — a rare and valuable combination.",
    whereYouGrow: "Aquarius can sometimes feel emotionally distant to your Cancer heart, while you might seem too subjective to their logical mind. These are not walls — they're windows into different ways of experiencing the world.",
    howToLove: ["Don't take Aquarius's detachment personally — they express care through ideas, not emotions", "Share your feelings clearly and without apology; Jordan actually values the honesty", "Find projects where your emotional intelligence and their vision can both shine"],
    romanceTip: "Romantically, this is a classic opposites-attract scenario. It could work beautifully if both of you commit to curiosity about each other's inner worlds rather than trying to make them match.",
    friendshipTip: "A friendship built on mutual respect for your differences. Jordan expands your mind; you warm their heart. That's a balanced, beautiful thing.",
    workTip: "This is where you truly shine together. Jordan brings the bold strategy; you bring the human touch that makes it land. Trust each other's strengths.",
    familyTip: "As family, your dynamic would be one of deep mutual respect — you'd teach each other different ways of being in the world, and both would be better for it.",
  },
  {
    id: "5", name: "Alex", avatarInitial: "A", sunSign: "Aries", relationship: "Sibling",
    compatibilityScore: 55, compatibilityLabel: "Growth pairing",
    numerologyScore: 58, chineseScore: 62,
    blendedSummary: "Your connection with Alex shows moderate alignment across all systems — enough harmony to build on, enough friction to grow through. This is a classic 'iron sharpens iron' dynamic where your differences genuinely make you both stronger when approached with mutual respect.",
    whereYouFlow: "Aries and Cancer are a classic square — it's a dynamic, sometimes challenging aspect, but it's also one that can generate enormous growth. Alex's boldness can pull you out of your shell in the best way, and your gentleness can show Alex that slowing down isn't weakness.",
    whereYouGrow: "Aries's directness can sometimes land harshly on your sensitive heart. And your emotional approach to conflict might frustrate Alex's preference for quick, clean resolutions. These moments ask both of you to stretch — you toward directness, Alex toward tenderness.",
    howToLove: ["Tell Alex clearly when something hurt — they genuinely may not know, and they'll appreciate the directness", "Let Alex's boldness inspire you to take a risk now and then — they'll be your biggest cheerleader", "Remember that Aries's impatience is rarely personal — it's just their tempo"],
    romanceTip: "This isn't a romantic connection, but the Aries-Cancer square can produce a strangely magnetic tension. As siblings, it translates into a bond built on mutual growth rather than natural ease — and that's its own kind of beautiful.",
    friendshipTip: "Your differences can make you better versions of yourselves. Alex teaches you to speak up; you teach Alex to listen deeply. That's a friendship worth honoring, even when it's bumpy.",
    workTip: "Alex initiates; you nurture. In a work setting, you'd be an unexpectedly effective duo — if you can agree on the pace. Let Alex sprint while you handle the details they'll inevitably overlook.",
    familyTip: "The Aries-Cancer sibling dynamic is one of the most growth-oriented in the zodiac. You challenge each other in ways that, with love, become your greatest teachers. You'll understand each other better with age.",
  },
];

// ══════════════════════════════════════════════════════════════════
// CHAT (cross-system Ask Soluna)
// ══════════════════════════════════════════════════════════════════

export interface ChatMessage {
  id: string; sender: "user" | "soluna"; text: string; timestamp: string;
  isError?: boolean;
}

export const MOCK_CHAT_HISTORY: ChatMessage[] = [
  {
    id: "c1", sender: "soluna",
    text: "Hi Maya — welcome. I've been looking at your full Blueprint, and there's so much beauty here. Your Cancer Sun in the 12th house gives you one of the most deeply feeling hearts I've seen. Your Life Path 3 means you're here to create and communicate — your voice literally matters. As a Wood Pig, you bring generosity and warmth wherever you go. And as a Generator, you have this incredible, sustainable energy when you're doing what you love.\n\nWhat's interesting is how these systems converge: your astrology, numerology, and Human Design all point to someone who thrives through expression, connection, and trusting their gut. When you follow what feels genuinely right — not what you think you 'should' do — you're unstoppable.\n\nI'm here whenever you want to talk. What feels most alive for you right now?",
    timestamp: "10:30 AM",
  },
  {
    id: "c2", sender: "user",
    text: "That's really sweet, thank you. I've been feeling kind of restless this week and I'm not sure why. Can you help me understand what might be going on?",
    timestamp: "10:32 AM",
  },
  {
    id: "c3", sender: "soluna",
    text: "I hear you — and I can see why across your systems. Let me walk you through what's happening.\n\nAstrologically: Mars is moving through Virgo in your 3rd house of daily rhythms. Mars wants action, movement, change — and in precise Virgo, it can feel like an itch you can't quite scratch. Your Pisces Moon is also picking up on emotional undercurrents that haven't surfaced yet.\n\nNumerologically: You're in a Personal Year 7 — a year of inner reflection and spiritual growth. This isn't a year for big external moves, but for understanding yourself more deeply. Restlessness during a 7 year often means something inside you IS shifting — it just hasn't named itself yet.\n\nIn Human Design: As a Generator with Emotional Authority, restlessness is often your inner authority speaking. Your Solar Plexus is processing something, and the feeling of 'I need to DO something' is the mind trying to shortcut the emotional wave. Your design says: wait. Let the wave rise and fall before acting.\n\nThese three systems agree: something is genuinely shifting, but clarity comes through patience, not force. Can I ask — has there been anything, even small, that's felt like a nudge toward change?",
    timestamp: "10:33 AM",
  },
  {
    id: "c4", sender: "user",
    text: "Actually yes. I've been thinking about making a career change but I keep second-guessing myself. It feels scary to leave something stable.",
    timestamp: "10:35 AM",
  },
  {
    id: "c5", sender: "soluna",
    text: "That takes real courage to admit — thank you for sharing it. And your systems are all lighting up around this question. Let me show you what I mean.\n\nYour astrology: Venus is currently in Gemini in your 10th house of career — this is one of the most supportive transits for exploring professional change. Venus makes you magnetic, Gemini makes you adaptable, and the 10th house is literally about your life's work. This window won't last forever, but while it's here, you have an unusual amount of support for exploring new paths.\n\nYour numerology: Your Expression number 7 suggests that your ideal work involves depth, analysis, and understanding — not surface-level productivity. If your current role isn't letting you go deep, that restlessness is your Soul Urge 9 (the humanitarian) asking for more meaning, not just more money.\n\nYour Human Design: As a Generator, your ONLY job is to respond to what lights you up. Not what's practical, not what's safe, not what others expect — what genuinely energizes you. When you feel flat or frustrated, your Sacral is saying no. When you feel a buzz of energy, it's saying yes. The career question isn't 'is this scary?' — it's 'does this energize me?'\n\nAll four of your systems are pointing the same way: exploration is safe. You don't need to quit tomorrow. But what if you gave yourself permission to take ONE small step toward what lights you up this week? Just explore. You're not leaving security — you're gathering information about what's next. Your Cancer Sun values stability, and that's not a weakness. But stability and growth can absolutely coexist.",
    timestamp: "10:36 AM",
  },
];

// ══════════════════════════════════════════════════════════════════
// SYNTHESIS THEMES
// ══════════════════════════════════════════════════════════════════

export const SYNTHESIS_THEMES: SynthesisTheme[] = [
  {
    id: "today",
    title: "Today: Rest & Reflection",
    subtitle: "Where your systems agree about today's energy",
    systemsAgree: 3,
    blocks: [
      { system: "astrology", label: "Moon in Cancer, 12H Sun", signal: "Your chart points to emotional depth and a need for quiet today. The Moon in Cancer activates your nurturing instincts — toward yourself and others." },
      { system: "numerology", label: "Personal Day 7", signal: "Your Personal Day 7 is a day for inner listening, reflection, and trust in the unseen. Not a day for big decisions, but for gathering insight." },
      { system: "humanDesign", label: "Generator Strategy", signal: "Your design says: wait to respond. Let life come to you today rather than chasing it. Your Sacral will tell you what's worth your energy." },
    ],
    combinedTakeaway: "Three independent systems all point to the same invitation today: pause, reflect, and trust your inner timing. You don't need to push — the right things will find you when you're still enough to notice them. Rest is productive. Listening is action. Your gut knows what your mind is still figuring out.",
  },
  {
    id: "career",
    title: "Your Career Path",
    subtitle: "What your systems say about your work and purpose",
    systemsAgree: 4,
    blocks: [
      { system: "astrology", label: "Venus in 10H, Mercury in Leo 11H", signal: "Your chart shows a career path rooted in communication, warmth, and bringing people together. You're designed to be a voice that others trust and a presence that makes work feel human." },
      { system: "numerology", label: "Life Path 3, Expression 7", signal: "Your Life Path 3 says you're here to create and communicate. Your Expression 7 adds depth — you're not just a talker, you're a thinker who expresses insights with heart." },
      { system: "chinese", label: "Wood Pig", signal: "The Wood Pig's generosity and quiet strength suggest fulfillment in roles where you can genuinely help others grow. Leadership through service, not dominance." },
      { system: "humanDesign", label: "Generator with Defined Throat", signal: "Your defined Throat center means your voice is powerful when you speak from alignment. As a Generator, energy flows when you're doing work you love — not when you're forcing it." },
    ],
    combinedTakeaway: "All four systems converge on the same truth: your work needs to involve creative expression, genuine human connection, and the feeling that you're contributing something meaningful. You're not designed for a purely transactional career — you need heart in your work. When you're communicating, connecting, and creating from a place of authenticity, you're not just 'good at your job' — you're living your design.",
  },
  {
    id: "love",
    title: "Love & Relationships",
    subtitle: "How your systems describe your relationship blueprint",
    systemsAgree: 4,
    blocks: [
      { system: "astrology", label: "Moon in Pisces 8H, Libra Rising", signal: "You love deeply and completely — surface connections don't satisfy you. Your Libra rising draws people in with warmth and grace, while your Pisces Moon creates emotional bonds that feel almost spiritual." },
      { system: "numerology", label: "Soul Urge 9", signal: "At your core, you're driven by a desire to connect, heal, and contribute. In relationships, this means you give generously — sometimes too generously. Your lesson is to receive as openly as you give." },
      { system: "chinese", label: "Wood Pig", signal: "The Pig in Chinese astrology is one of the most loving and loyal signs. You're in relationships for the long haul. Trust is everything to you, and once earned, your devotion runs deep." },
      { system: "humanDesign", label: "Emotional Authority, Defined Solar Plexus", signal: "You feel relationships through an emotional wave — highs and lows are natural and don't mean something is wrong. Clarity comes over time, not in the moment. Your design needs partners who can ride the wave with you." },
    ],
    combinedTakeaway: "You're built for deep, meaningful connection — not casual, surface-level relating. Your systems all point to someone who loves with their whole heart and needs a partner who can meet that depth without being overwhelmed by it. The key insight across all four: your emotional process needs TIME. Don't let anyone rush you into clarity. Your feelings are not unstable — they're thorough. The right person will understand that your emotional depth is the gift, not the challenge.",
  },
];

// ══════════════════════════════════════════════════════════════════
// TAROT DATA
// ══════════════════════════════════════════════════════════════════

export const TAROT_SPREADS: TarotSpread[] = [
  { id: "three-card", name: "Past · Present · Future", positions: ["Past influence", "Present situation", "Future potential"], description: "A simple, elegant spread that illuminates the arc of a situation — where it came from, where it is now, and where it's heading." },
  { id: "celtic-cross", name: "Celtic Cross", positions: ["Present", "Challenge", "Past", "Future", "Above", "Below", "Advice", "External", "Hopes", "Outcome"], description: "The classic 10-card spread for a deep, nuanced reading on any life question. Best for when you want the full picture." },
];

export const MOCK_THREE_CARD_READING = {
  question: "What do I need to know about my career direction right now?",
  cards: [
    { name: "The Star", arcana: "major" as const, imageEmoji: "⭐", uprightMeaning: "Hope, inspiration, and renewed purpose. You're emerging from a period of uncertainty with a clearer sense of what you truly want.", positionMeaning: "Past: You've been through a time of questioning, but it wasn't wasted — it was clarifying." },
    { name: "Eight of Pentacles", arcana: "minor" as const, suit: "Pentacles", imageEmoji: "🪙", uprightMeaning: "Dedication, craftsmanship, and skill-building. This is a card of focused work and the quiet satisfaction of getting good at something.", positionMeaning: "Present: You're in a phase of building skills and refining your craft. This isn't glamorous, but it's deeply valuable." },
    { name: "Queen of Wands", arcana: "minor" as const, suit: "Wands", imageEmoji: "👑", uprightMeaning: "Warmth, confidence, and magnetic leadership. The Queen of Wands steps into her power with kindness and inspires others naturally.", positionMeaning: "Future: Your path forward involves owning your warmth and creativity as leadership qualities, not soft skills." },
  ],
  overallReading: "Your reading tells a beautiful story: you've moved through uncertainty (The Star) into a period of genuine skill-building (Eight of Pentacles), and you're heading toward a future where your warmth and creativity become your professional superpowers (Queen of Wands). The through-line is authenticity — the more you trust your natural gifts, the more the path reveals itself. Your career isn't something you need to force — it's something you're becoming.",
};

// ══════════════════════════════════════════════════════════════════
// RITUALS
// ══════════════════════════════════════════════════════════════════

export const RITUALS: Ritual[] = [
  {
    id: "full-moon-leo",
    title: "Full Moon in Leo: Shine Your Light",
    moonPhase: "Full Moon 🌕",
    description: "This Full Moon in bold, radiant Leo is an invitation to celebrate what makes you uniquely you. Full Moons are times of culmination and release — what are you ready to let go of so you can shine more brightly? Leo energy asks: where are you dimming your light to make others comfortable? This ritual is about honoring your own brilliance — not with arrogance, but with genuine, warm self-appreciation.",
    steps: [
      "Light a gold or yellow candle — or just a warm light in your space.",
      "Write down three things you're genuinely proud of from the past six months. Big or small — no filtering.",
      "Read them aloud to yourself. Let the words land. You did those things.",
      "Write down one way you've been holding yourself back to keep others comfortable. Be honest.",
      "Burn or tear up that second piece of paper — a symbolic release of self-diminishment.",
      "Close with your hands on your heart. Say: 'My light is not too much. My presence is a gift.'",
    ],
    intention: "I release the habit of shrinking. I honor my light and let it shine warmly, freely, and generously.",
  },
  {
    id: "new-moon-cancer",
    title: "New Moon in Cancer: Nurture Your Inner Home",
    moonPhase: "New Moon 🌑",
    description: "This tender New Moon in Cancer invites you to plant seeds of emotional safety and self-nurturing. Cancer rules home, family, and the inner world. What does your soul need to feel truly at home within yourself? This is a quiet, intimate ritual for setting intentions around emotional well-being, boundaries, and the gentle art of taking care of you.",
    steps: [
      "Create a cozy corner — blankets, tea, whatever makes you feel held.",
      "Close your eyes and place one hand on your belly, one on your heart. Breathe slowly for two minutes.",
      "Ask yourself: 'What would make me feel more at home in my own life?' Write down whatever comes.",
      "Choose one intention from what you wrote. Make it small, doable, kind.",
      "Write it on a small piece of paper and place it somewhere you'll see daily — a mirror, a journal, your nightstand.",
      "Whisper to yourself: 'I am building a home within myself, one kind choice at a time.'",
    ],
    intention: "I am creating safety within myself. My inner home is a place of warmth, rest, and gentle belonging.",
  },
];

// ══════════════════════════════════════════════════════════════════
// JOURNAL
// ══════════════════════════════════════════════════════════════════

export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: "j1", date: "2026-06-22",
    title: "Birthday reflections",
    mood: "Grateful, thoughtful",
    transitContext: "Sun entering Cancer, Jupiter in Taurus 9H",
    content: "Another year around the sun. I'm noticing how different this birthday feels from five years ago — less about achievement, more about alignment. The Soluna reading this morning mentioned my 12th house Sun and how it's okay to live life at a deeper, quieter frequency. That landed. I don't need to be the loudest person in the room to be fully myself. Today I'm grateful for the people who get that about me without explanation.",
  },
  {
    id: "j2", date: "2026-06-25",
    title: "A creative spark",
    mood: "Inspired, curious",
    transitContext: "Mercury in Leo, Venus in Gemini 10H",
    content: "Had an idea during lunch that I can't stop thinking about — a potential side project that combines writing and community in a way that feels genuinely exciting. I almost dismissed it as impractical, but then remembered: my Life Path 3 is literally about creative expression. And my Generator design says if it gives me energy, it's worth exploring. I'm not going to overthink it. I'm just going to write down the idea and see where it goes. That feels like enough for today.",
  },
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

// ══════════════════════════════════════════════════════════════════
// ONBOARDING
// ══════════════════════════════════════════════════════════════════

export type OnboardingStep =
  | "welcome" | "fullName" | "preferredName" | "birthdate" | "birthtime" | "birthplace" | "calculating" | "reveal";

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

export function getReadingForDate(dateStr: string): DailyReading {
  return DAILY_READINGS.find((r) => r.date === dateStr) ?? DAILY_READINGS[0];
}

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
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  rising: ZodiacSign;
  lifePath: number;
  animal: ChineseAnimal;
  element: ChineseElement;
  hdType: HDType;
}

export function getBlueprintSummary(user: UserData): BlueprintSummary {
  return {
    sunSign: user.chart.sun.sign,
    moonSign: user.chart.moon.sign,
    rising: user.chart.rising,
    lifePath: user.numerology.lifePath,
    animal: user.chinese.animal,
    element: user.chinese.element,
    hdType: user.humanDesign.type,
  };
}
