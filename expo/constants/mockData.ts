import { Platform } from "react-native";

// ─── Font families ───────────────────────────────────────────────
export const Fonts = {
  heading: Platform.OS === "ios" ? "Georgia" : "serif",
  body: Platform.OS === "ios" ? "System" : "sans-serif",
  mono: Platform.OS === "ios" ? "Menlo" : "monospace",
} as const;

// ─── Zodiac signs ────────────────────────────────────────────────
export const ZODIAC = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;
export type ZodiacSign = (typeof ZODIAC)[number];

export const ZODIAC_SYMBOLS: Record<ZodiacSign, string> = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

export const ZODIAC_DATES: Record<ZodiacSign, string> = {
  Aries: "Mar 21 – Apr 19",
  Taurus: "Apr 20 – May 20",
  Gemini: "May 21 – Jun 20",
  Cancer: "Jun 21 – Jul 22",
  Leo: "Jul 23 – Aug 22",
  Virgo: "Aug 23 – Sep 22",
  Libra: "Sep 23 – Oct 22",
  Scorpio: "Oct 23 – Nov 21",
  Sagittarius: "Nov 22 – Dec 21",
  Capricorn: "Dec 22 – Jan 19",
  Aquarius: "Jan 20 – Feb 18",
  Pisces: "Feb 19 – Mar 20",
};

// ─── Planets ─────────────────────────────────────────────────────
export const PLANETS = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
] as const;
export type Planet = (typeof PLANETS)[number];

export const PLANET_SYMBOLS: Record<Planet, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
};

// ─── Houses ──────────────────────────────────────────────────────
export const HOUSE_NAMES: Record<number, string> = {
  1: "House of Self",
  2: "House of Values",
  3: "House of Communication",
  4: "House of Home & Family",
  5: "House of Creativity",
  6: "House of Health & Service",
  7: "House of Relationships",
  8: "House of Transformation",
  9: "House of Exploration",
  10: "House of Career & Legacy",
  11: "House of Community",
  12: "House of the Unconscious",
};

// ─── Mock User Chart ──────────────────────────────────────────────
export interface Placement {
  planet: Planet;
  sign: ZodiacSign;
  house: number;
  degree: number;
}

export interface ChartData {
  sun: Placement;
  moon: Placement;
  rising: ZodiacSign;
  placements: Placement[];
}

export const MOCK_CHART: ChartData = {
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
};

// ─── Mock User ────────────────────────────────────────────────────
export interface UserData {
  name: string;
  birthDate: string; // ISO
  birthTime: string; // HH:MM
  birthTimeKnown: boolean;
  birthPlace: string;
  chart: ChartData;
}

export const MOCK_USER: UserData = {
  name: "Maya",
  birthDate: "1995-06-22",
  birthTime: "14:35",
  birthTimeKnown: true,
  birthPlace: "Portland, Oregon, USA",
  chart: MOCK_CHART,
};

// ─── Daily Readings ───────────────────────────────────────────────
export interface DailyReading {
  date: string;
  reading: string;
  moonPhase: string;
  moonPhaseEmoji: string;
  moonSign: ZodiacSign;
  transit1: { planet: Planet; sign: ZodiacSign; blurb: string };
  transit2: { planet: Planet; sign: ZodiacSign; blurb: string };
  energyLevel: number; // 1-5
  energyCaption: string;
  affirmation: string;
  do: string;
  embrace: string;
  easeUp: string;
}

export const DAILY_READINGS: DailyReading[] = [
  {
    date: "2026-06-24",
    reading:
      "Today's moon in Cancer invites you to slow down and listen to what you actually need. You don't have to push so hard — rest is productive too. A quiet conversation could bring unexpected warmth this evening.",
    moonPhase: "Waxing Gibbous",
    moonPhaseEmoji: "🌔",
    moonSign: "Cancer",
    transit1: {
      planet: "Venus",
      sign: "Gemini",
      blurb: "Venus in Gemini brings playful, curious energy to your conversations — say the thing you've been holding back, gently.",
    },
    transit2: {
      planet: "Mars",
      sign: "Virgo",
      blurb: "Mars in Virgo sharpens your focus. Perfect for tackling that one small task that's been lingering.",
    },
    energyLevel: 3,
    energyCaption: "Steady and reflective — a good day for quiet wins.",
    affirmation: "I trust the rhythm of my own life. I don't need to rush what's meant to unfold.",
    do: "Light a candle and journal for ten minutes",
    embrace: "A slower pace — productivity isn't everything",
    easeUp: "Overthinking a text you sent this morning",
  },
  {
    date: "2026-06-25",
    reading:
      "With the Sun shining through your 12th house, your intuition is especially sharp today. Pay attention to the little nudges and gut feelings — they're trying to tell you something kind. A creative spark in the afternoon could lead somewhere lovely.",
    moonPhase: "Waxing Gibbous",
    moonPhaseEmoji: "🌔",
    moonSign: "Leo",
    transit1: {
      planet: "Sun",
      sign: "Cancer",
      blurb: "The Sun in Cancer wraps you in a warm, nurturing blanket — let yourself be taken care of today.",
    },
    transit2: {
      planet: "Mercury",
      sign: "Leo",
      blurb: "Mercury in Leo gives your words a little extra sparkle. Great day for sharing ideas.",
    },
    energyLevel: 4,
    energyCaption: "Creative and intuitive — follow the inspiration.",
    affirmation: "My inner voice is wise and kind. I can trust what it whispers.",
    do: "Write down three things that feel right today, even if you can't explain why",
    embrace: "A creative detour — it might be the path",
    easeUp: "Needing to have everything figured out by dinner",
  },
  {
    date: "2026-06-26",
    reading:
      "Your ruling planet, the Moon, is dancing through dramatic Leo today. You might feel a gentle pull to be seen — to share something you've been quietly working on. The right person will receive it with warmth, so don't be shy.",
    moonPhase: "Full Moon",
    moonPhaseEmoji: "🌕",
    moonSign: "Leo",
    transit1: {
      planet: "Jupiter",
      sign: "Taurus",
      blurb: "Jupiter in Taurus expands your sense of abundance — notice the small riches around you.",
    },
    transit2: {
      planet: "Saturn",
      sign: "Capricorn",
      blurb: "Saturn in Capricorn offers a gentle nudge to set one healthy boundary. You'll feel lighter for it.",
    },
    energyLevel: 5,
    energyCaption: "Radiant and bold — share your light today.",
    affirmation: "I am allowed to take up space. My voice matters and my presence is a gift.",
    do: "Share one thing you're proud of with someone you trust",
    embrace: "The spotlight — even if just for a moment",
    easeUp: "Downplaying your wins to make others comfortable",
  },
  {
    date: "2026-06-27",
    reading:
      "The Full Moon illuminates your 8th house of transformation — emotions may feel closer to the surface, and that's okay. Let yourself feel what comes up without judgment. A late-night insight could shift how you see a relationship.",
    moonPhase: "Full Moon",
    moonPhaseEmoji: "🌕",
    moonSign: "Virgo",
    transit1: {
      planet: "Moon",
      sign: "Virgo",
      blurb: "The Moon in Virgo asks: what's one small thing you can tidy up — in your space or your mind?",
    },
    transit2: {
      planet: "Neptune",
      sign: "Pisces",
      blurb: "Neptune in Pisces blurs the edges of reality. Let yourself dream a little — it's not a waste of time.",
    },
    energyLevel: 3,
    energyCaption: "Emotionally rich — gentle self-care goes a long way.",
    affirmation: "Feeling deeply is not a weakness. It's how I know I'm alive and growing.",
    do: "Have an honest, tender conversation with yourself — out loud or on paper",
    embrace: "The full spectrum of your emotions",
    easeUp: "Trying to 'fix' every feeling before bed",
  },
  {
    date: "2026-06-28",
    reading:
      "As the Moon wanes into Virgo, a sense of gentle order returns. You might find satisfaction in small rituals — making your space feel good, finishing a book, sending that kind note you've been meaning to write. The ordinary is sacred today.",
    moonPhase: "Waning Gibbous",
    moonPhaseEmoji: "🌖",
    moonSign: "Virgo",
    transit1: {
      planet: "Mercury",
      sign: "Leo",
      blurb: "Mercury in Leo keeps your conversations warm and generous — you'll say the right thing at the right time.",
    },
    transit2: {
      planet: "Uranus",
      sign: "Aquarius",
      blurb: "Uranus in Aquarius sprinkles in a dash of surprise. Stay open to an unexpected invitation.",
    },
    energyLevel: 4,
    energyCaption: "Grounded and graceful — a beautiful day for small wins.",
    affirmation: "I find meaning in the small moments. My daily life is full of quiet magic.",
    do: "Rearrange one corner of your home to feel fresh and yours",
    embrace: "Routine — it's not boring, it's grounding",
    easeUp: "Comparing your Sunday to anyone else's highlight reel",
  },
  {
    date: "2026-06-29",
    reading:
      "With Venus sliding through your 10th house of career, your natural warmth is especially magnetic at work or in public spaces. People are drawn to your kindness today — let them be. A compliment you receive is genuinely earned; take it in.",
    moonPhase: "Waning Gibbous",
    moonPhaseEmoji: "🌖",
    moonSign: "Libra",
    transit1: {
      planet: "Venus",
      sign: "Gemini",
      blurb: "Venus in Gemini makes your charm effortless. Social connections flow beautifully today.",
    },
    transit2: {
      planet: "Mars",
      sign: "Virgo",
      blurb: "Mars in Virgo gives you the precision to finish something important with grace.",
    },
    energyLevel: 4,
    energyCaption: "Magnetic and capable — you're in a lovely flow.",
    affirmation: "I receive kindness as easily as I give it. I am worthy of the good that comes my way.",
    do: "Accept one compliment without deflecting — just say thank you",
    embrace: "Your natural charm — it's not showing off",
    easeUp: "Imposter feelings at work or in social settings",
  },
  {
    date: "2026-06-30",
    reading:
      "The month closes with the Moon in Scorpio, deepening your emotional waters. This is a beautiful day for intimate one-on-one time — with a partner, a close friend, or just yourself. Depth over breadth. The quietest conversations often say the most.",
    moonPhase: "Waning Crescent",
    moonPhaseEmoji: "🌘",
    moonSign: "Scorpio",
    transit1: {
      planet: "Pluto",
      sign: "Sagittarius",
      blurb: "Pluto in Sagittarius encourages a philosophical lens — what belief is ready to be gently released?",
    },
    transit2: {
      planet: "Jupiter",
      sign: "Taurus",
      blurb: "Jupiter in Taurus reminds you that real abundance often looks like enough — and you are.",
    },
    energyLevel: 2,
    energyCaption: "Quietly deep — honor your need for closeness.",
    affirmation: "I am enough, exactly as I am. My presence is the gift I bring to the people I love.",
    do: "Plan a low-key evening with someone who makes you feel safe",
    embrace: "Depth over breadth — one real connection is plenty",
    easeUp: "Feeling like you need to be 'on' socially",
  },
];

// ─── Placement Interpretations ────────────────────────────────────
export interface PlacementInterpretation {
  strengths: string[];
  growthEdge: string;
  description: string;
}

export const PLACEMENT_INTERPRETATIONS: Record<string, PlacementInterpretation> = {
  "Sun-Cancer-12": {
    description:
      "Your Sun in Cancer lives in the quiet, luminous space of the 12th house — the house of dreams, intuition, and the deep inner world. This is a profoundly tender placement: you feel everything, and you feel it deeply. You experience life not just through events, but through the emotional currents beneath them. Your strength comes from your ability to sit with feelings — your own and others' — without needing to fix or rush through them.\n\nPeople with this placement often have a rich inner life. You might be drawn to creative expression, spirituality, or simply the art of understanding what makes people tick. Your sensitivity is not a burden — it's a finely tuned instrument. When you trust it, you can read a room, a person, or a moment with uncommon depth. The world needs more people who move through it with this kind of emotional intelligence.",
    strengths: [
      "Extraordinary emotional intuition — you often know what others need before they do",
      "A natural capacity for deep, meaningful one-on-one connection",
      "Creative imagination that thrives in solitude and quiet",
      "The ability to hold space for others without judgment",
    ],
    growthEdge:
      "Your empathic nature can sometimes blur the line between your feelings and other people's. Learning to ask 'is this mine?' is a gentle but essential practice. Protecting your energy isn't selfish — it's how you sustain your gift.",
  },
  "Moon-Pisces-8": {
    description:
      "Your Moon in Pisces in the 8th house gives you an emotional landscape that is vast, mystical, and deeply compassionate. You don't just understand other people's pain — you feel it with them, which makes you an extraordinary friend, partner, and confidant. Your emotional intuition borders on psychic; you pick up on unspoken currents that others miss entirely.\n\nThis placement suggests someone who finds comfort in depth. Surface-level interactions may drain you while deep, soulful conversations restore you. You're drawn to what's beneath — in relationships, in art, in yourself. Creativity is likely a lifeline for you: music, writing, visual art, or simply a rich fantasy life that keeps your spirit nourished.\n\nThe 8th house also connects to transformation. Throughout your life, you'll experience emotional rebirths — moments where you release an old version of yourself and emerge softer, wiser, and more fully you.",
    strengths: [
      "Boundless compassion — you genuinely care, and people feel it",
      "Powerful creative and imaginative gifts",
      "A natural healer: your presence alone can be calming to others",
      "Emotional resilience born from deep feeling — you know how to weather storms",
    ],
    growthEdge:
      "Because you absorb so much from others, it's essential to have practices that help you release what isn't yours — whether that's journaling, time in nature, or simply being alone with your own thoughts. Boundaries are a form of self-love for you.",
  },
  "Mercury-Leo-11": {
    description:
      "With Mercury in Leo in the 11th house, your voice carries warmth, generosity, and a natural sparkle. You communicate with heart, and people remember how you made them feel in conversation. In group settings, you have a gift for bringing people together — your ideas light up the room, not because they're loud, but because they're genuinely inspiring.\n\nThe 11th house connects to community and friendship. You're the friend who sends the thoughtful message, who remembers the small details, who makes people feel seen. Your mind naturally gravitates toward big-picture thinking about how to make the world — or at least your corner of it — a little warmer, a little more connected.",
    strengths: [
      "Warm, magnetic communication style that draws people in",
      "A natural leader in group settings — people want to hear what you think",
      "Creative, big-picture thinking about community and connection",
      "Loyal and generous in friendships — you show up",
    ],
    growthEdge:
      "Your desire to be encouraging can sometimes lead you to hold back honest feelings to keep the peace. Remember that truth spoken with kindness is not unkind — it's actually one of the most loving things you can offer.",
  },
  "Venus-Gemini-10": {
    description:
      "Venus in Gemini in your 10th house of career gives you an effortlessly charming public presence. People are drawn to your warmth, wit, and the way you make complex ideas feel accessible and human. You thrive in roles that let you communicate, connect, and bring a little lightness to serious spaces.\n\nThis placement suggests someone whose career or public identity is intertwined with relationship-building. You might be the person at work who bridges gaps between teams, who makes presentations feel like conversations, who brings warmth to professional settings without losing credibility. Your charm is not superficial — it's a genuine reflection of your interest in people.",
    strengths: [
      "Effortless charm and warmth in professional settings",
      "A gift for making complex ideas feel simple and human",
      "Natural networking ability — you build real connections, not just contacts",
      "Versatile and adaptable in your career path",
    ],
    growthEdge:
      "With Gemini's duality, you may sometimes spread yourself across too many interests at once. Giving yourself permission to focus deeply on one thing at a time can actually feel liberating, not limiting.",
  },
  "Mars-Virgo-3": {
    description:
      "Mars in Virgo in the 3rd house gives you a sharp, precise mind and the quiet determination to get things right. You're not the loudest person in the room, but you're often the most effective. Your drive shows up in the details — the thoughtful edit, the well-timed question, the small improvement that changes everything.\n\nThe 3rd house connects to communication and daily rhythms. You express your energy through words, ideas, and the gentle art of making things better than you found them. When something matters to you, your focus is extraordinary — you notice what others overlook.",
    strengths: [
      "Remarkable attention to detail and follow-through",
      "A clear, precise communicator — you say what you mean",
      "Quiet determination that gets things done without fanfare",
      "A gift for improving systems, processes, and ideas",
    ],
    growthEdge:
      "Your high standards are a strength, but they can also turn inward as self-criticism. Remember that 'good enough' is often genuinely enough — and that your worth is not measured by your productivity.",
  },
  "Jupiter-Taurus-9": {
    description:
      "Jupiter in Taurus in the 9th house gives you an expansive, grounded wisdom. You don't just collect knowledge — you embody it. You learn through experience, through your senses, through the slow, rich process of living. Travel, philosophy, and big ideas appeal to you, but you approach them with earthy practicality.\n\nThis placement suggests that your growth comes through steadiness, not speed. You expand your world not by chasing every new thing, but by going deep into what matters. Your wisdom feels approachable and real because it's lived, not just studied.",
    strengths: [
      "Grounded, practical wisdom that others naturally trust",
      "A love of learning through real experience, not just theory",
      "Patient, steady approach to personal growth",
      "An appreciation for beauty, comfort, and the sensory richness of life",
    ],
    growthEdge:
      "Your love of comfort and stability can sometimes make change feel harder than it needs to. Trust that your roots are deep enough to weather new terrain — growth often happens just outside the comfort zone.",
  },
  "Saturn-Capricorn-6": {
    description:
      "Saturn in Capricorn in the 6th house gives you a deeply responsible relationship with work, health, and daily discipline. You take your commitments seriously, and people count on you because you follow through. Structure isn't a cage for you — it's a foundation that lets you build something meaningful.\n\nThe 6th house connects to service and daily practice. You find genuine satisfaction in being helpful, in doing things well, in creating order from chaos. This placement often indicates someone who grows into real mastery over time — not through flashes of brilliance, but through consistent, dedicated effort.",
    strengths: [
      "Exceptional reliability — when you say you'll do something, it gets done",
      "A natural gift for creating sustainable routines and systems",
      "Quiet mastery that deepens over years of dedicated practice",
      "A deep sense of satisfaction from meaningful work and service",
    ],
    growthEdge:
      "Your sense of responsibility can sometimes tip into overwork or guilt about rest. Remember that rest is not the absence of productivity — it's an essential part of it. You are allowed to pause.",
  },
};

// ─── Transits ──────────────────────────────────────────────────────
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
    id: "venus-gemini",
    planet: "Venus",
    sign: "Gemini",
    title: "Venus in Gemini",
    plainDescription:
      "Venus, the planet of love and connection, is currently moving through curious, communicative Gemini.",
    whatItMeans:
      "For you, Maya, this transit lights up your 10th house of career and public life. You might find that your natural warmth is especially appreciated at work or in group settings right now. Conversations flow with unusual ease, and people are drawn to your perspective. This is a lovely window for sharing ideas, collaborating, or simply letting your personality shine in professional spaces. If there's a conversation you've been gently avoiding, the energy right now supports approaching it with grace.",
    suggestion:
      "Reach out to someone you admire professionally — even just a kind message. The connection could open an unexpected door.",
    duration: "June 18 – July 12, 2026",
  },
  {
    id: "mars-virgo",
    planet: "Mars",
    sign: "Virgo",
    title: "Mars in Virgo",
    plainDescription:
      "Mars, the planet of action and drive, is moving through precise, detail-oriented Virgo.",
    whatItMeans:
      "For you, Maya, Mars is traveling through your 3rd house of communication and daily rhythms. This gives you a quiet but steady boost of focused energy — perfect for tackling projects that need attention to detail. You might find yourself unusually motivated to organize, plan, or finally cross off that lingering to-do. The key with Mars in Virgo is to channel the energy into one thing at a time; scattered effort will feel frustrating, but focused effort will feel deeply satisfying.",
    suggestion:
      "Pick one project that's been lingering and give it two hours of undistracted attention. The momentum will feel wonderful.",
    duration: "June 5 – July 28, 2026",
  },
  {
    id: "jupiter-taurus",
    planet: "Jupiter",
    sign: "Taurus",
    title: "Jupiter in Taurus",
    plainDescription:
      "Jupiter, the planet of expansion and abundance, is moving through steady, sensory Taurus.",
    whatItMeans:
      "For you, Maya, Jupiter is blessing your 9th house of exploration, learning, and big-picture thinking. This is a year-long transit that gently expands your horizons — through travel, study, or simply a shift in perspective that makes the world feel bigger and more possible. Taurus energy keeps this expansion grounded: this isn't about running away, but about enriching the life you already have. You might feel drawn to learn something new, plan a meaningful trip, or explore a philosophy that resonates with your soul.",
    suggestion:
      "Sign up for that class, buy that book, or plan that trip you've been quietly dreaming about. The universe is giving you a gentle green light.",
    duration: "May 2026 – June 2027",
  },
  {
    id: "saturn-capricorn",
    planet: "Saturn",
    sign: "Capricorn",
    title: "Saturn in Capricorn",
    plainDescription:
      "Saturn, the planet of structure and wisdom, is moving through its home sign of Capricorn.",
    whatItMeans:
      "For you, Maya, Saturn is working through your 6th house of daily routines, health, and service. This is a gentle but persistent invitation to build structures that actually support you — not rigid rules, but kind frameworks that make your life feel more spacious, not less. You might feel a pull to refine your daily habits, set healthier boundaries at work, or commit to a practice that nourishes you. Saturn's lessons are slow but deeply rewarding: the small, consistent choice adds up to something solid over time.",
    suggestion:
      "Choose one small, kind habit to anchor your days — a morning ritual, an evening wind-down, a weekly check-in with yourself.",
    duration: "January – November 2026",
  },
];

// ─── Connections ──────────────────────────────────────────────────
export interface ConnectionPerson {
  id: string;
  name: string;
  avatarInitial: string;
  sunSign: ZodiacSign;
  relationship: string;
  compatibilityScore: number; // 0-100
  compatibilityLabel: string;
  whereYouFlow: string;
  whereYouGrow: string;
  howToLove: string[];
  romanceTip: string;
  friendshipTip: string;
  workTip: string;
}

export const CONNECTIONS: ConnectionPerson[] = [
  {
    id: "1",
    name: "Leo",
    avatarInitial: "L",
    sunSign: "Leo",
    relationship: "Friend",
    compatibilityScore: 82,
    compatibilityLabel: "Naturally easy",
    whereYouFlow:
      "Your Cancer Sun and Leo's warm heart create a safe, affectionate space where both of you feel seen. Leo brings out your playful side, and you offer Leo the emotional depth they secretly crave. Together, you balance warmth and depth beautifully — like a cozy fire and a good conversation.",
    whereYouGrow:
      "Leo's need for recognition can sometimes feel overwhelming to your more private nature. And Leo might wish you'd step into the spotlight a little more. These differences aren't problems — they're invitations to stretch gently toward each other.",
    howToLove: [
      "Celebrate Leo's wins openly — your genuine pride in them means the world",
      "Let Leo draw you out when you're retreating — they do it with love",
      "Share your feelings directly; Leo thrives on emotional honesty",
    ],
    romanceTip:
      "Not a romantic match, but Leo's warmth and your depth could absolutely spark something tender if the timing is right. The foundation of friendship makes it even sweeter.",
    friendshipTip:
      "Your friendship works because you admire each other's differences rather than trying to change them. Leo brings sunshine; you bring soul. Protect that balance.",
    workTip:
      "Leo's bold ideas and your intuitive read on people make you a quietly powerful team. Let Leo pitch while you read the room — you'll complement each other perfectly.",
  },
  {
    id: "2",
    name: "Sam",
    avatarInitial: "S",
    sunSign: "Scorpio",
    relationship: "Partner",
    compatibilityScore: 68,
    compatibilityLabel: "Growth pairing",
    whereYouFlow:
      "Your water signs — Cancer and Scorpio — create a deep emotional resonance that few other pairings can match. You understand each other without words, and there's a profound sense of safety in that. When you're together, you both feel truly known. This is soul-level stuff.",
    whereYouGrow:
      "Scorpio's intensity can sometimes feel heavy to your Cancer heart, which needs lightness and nurturing. And Scorpio might occasionally wish you'd dive even deeper into the emotional waters they call home. These moments of friction aren't signs of incompatibility — they're chances to understand each other more fully.",
    howToLove: [
      "Give Scorpio reassurance that your occasional need for lightness isn't withdrawal — it's self-care",
      "Let Scorpio see your shadows without fear — they'll hold them with surprising tenderness",
      "Create rituals together that honor both depth (Scorpio) and coziness (you)",
    ],
    romanceTip:
      "Your emotional connection is the engine of this relationship. When it feels intense, remember: Scorpio isn't testing you, they're inviting you closer. And your Cancer gentleness is exactly what softens Scorpio's edges.",
    friendshipTip:
      "Even as friends, you'd be the pair who can sit in comfortable silence and then share something real. You make each other feel safe enough to be vulnerable.",
    workTip:
      "Scorpio's strategic mind and your emotional intelligence make you formidable collaborators. Scorpio sees the chess moves; you see the people. Together, you don't miss much.",
  },
  {
    id: "3",
    name: "Priya",
    avatarInitial: "P",
    sunSign: "Taurus",
    relationship: "Friend",
    compatibilityScore: 91,
    compatibilityLabel: "Magnetic",
    whereYouFlow:
      "Cancer and Taurus are a classic, beautiful match — you both crave security, comfort, and genuine connection. With Priya, you don't have to explain why you'd rather stay in with candles and good food than go to a loud party. She just gets it. Your time together feels like a deep exhale. There's an ease here that's rare and precious.",
    whereYouGrow:
      "Taurus can be wonderfully steady, but also stubborn. And your Cancer moods might sometimes puzzle Priya's more pragmatic mind. The growth here is gentle: you teach her that feelings have their own logic, and she teaches you that some things are simpler than they feel.",
    howToLove: [
      "Honor your shared love of comfort — make your hangouts a ritual, not an afterthought",
      "When Priya seems stubborn, try asking what she's protecting — it's usually something tender",
      "Let her ground you when your emotions are swirling; that steadiness is a gift",
    ],
    romanceTip:
      "This is a friendship with the soul of something deeper. If romantic feelings ever surfaced, they'd have a strong foundation to grow on — mutual respect, genuine care, and that effortless comfort.",
    friendshipTip:
      "This is the friend who'll bring you soup when you're sad, not because you asked, but because she sensed it. Don't take this kind of connection for granted — nurture it.",
    workTip:
      "Taurus's persistence paired with your intuition is quietly unstoppable. She'll keep the project on track; you'll keep the team feeling human. A dream collaboration.",
  },
  {
    id: "4",
    name: "Jordan",
    avatarInitial: "J",
    sunSign: "Aquarius",
    relationship: "Colleague",
    compatibilityScore: 74,
    compatibilityLabel: "Naturally easy",
    whereYouFlow:
      "Your Cancer warmth and Jordan's Aquarius vision make for a surprisingly complementary dynamic. You humanize their big ideas, and they help you see beyond your immediate emotional landscape. Together, you cover both heart and mind — a rare and valuable combination.",
    whereYouGrow:
      "Aquarius can sometimes feel emotionally distant to your Cancer heart, while you might seem too subjective to their logical mind. These are not walls — they're windows into different ways of experiencing the world. Learning to appreciate rather than bridge this gap is the work.",
    howToLove: [
      "Don't take Aquarius's detachment personally — they express care through ideas, not emotions",
      "Share your feelings clearly and without apology; Jordan actually values the honesty",
      "Find projects where your emotional intelligence and their vision can both shine",
    ],
    romanceTip:
      "Romantically, this is a classic opposites-attract scenario. It could work beautifully if both of you commit to curiosity about each other's inner worlds rather than trying to make them match.",
    friendshipTip:
      "A friendship built on mutual respect for your differences. Jordan expands your mind; you warm their heart. That's a balanced, beautiful thing.",
    workTip:
      "This is where you truly shine together. Jordan brings the bold strategy; you bring the human touch that makes it land. Trust each other's strengths — they're perfectly complementary.",
  },
  {
    id: "5",
    name: "Alex",
    avatarInitial: "A",
    sunSign: "Aries",
    relationship: "Sibling",
    compatibilityScore: 55,
    compatibilityLabel: "Growth pairing",
    whereYouFlow:
      "Aries and Cancer are a classic square — it's a dynamic, sometimes challenging aspect, but it's also one that can generate enormous growth. Alex's boldness can pull you out of your shell in the best way, and your gentleness can show Alex that slowing down isn't weakness.",
    whereYouGrow:
      "Aries's directness can sometimes land harshly on your sensitive heart. And your emotional approach to conflict might frustrate Alex's preference for quick, clean resolutions. These moments ask both of you to stretch — you toward directness, Alex toward tenderness. That's real growth.",
    howToLove: [
      "Tell Alex clearly when something hurt — they genuinely may not know, and they'll appreciate the directness",
      "Let Alex's boldness inspire you to take a risk now and then — they'll be your biggest cheerleader",
      "Remember that Aries's impatience is rarely personal — it's just their tempo",
    ],
    romanceTip:
      "This isn't a romantic connection, but the Aries-Cancer square can produce a strangely magnetic tension. As siblings, it translates into a bond built on mutual growth rather than natural ease — and that's its own kind of beautiful.",
    friendshipTip:
      "Your differences can make you better versions of yourselves. Alex teaches you to speak up; you teach Alex to listen deeply. That's a friendship worth honoring, even when it's bumpy.",
    workTip:
      "Alex initiates; you nurture. In a work setting, you'd be an unexpectedly effective duo — if you can agree on the pace. Let Alex sprint while you handle the details they'll inevitably overlook.",
  },
];

// ─── Chat Messages (Ask Soluna) ───────────────────────────────────
export interface ChatMessage {
  id: string;
  sender: "user" | "soluna";
  text: string;
  timestamp: string;
}

export const MOCK_CHAT_HISTORY: ChatMessage[] = [
  {
    id: "c1",
    sender: "soluna",
    text: "Hi Maya — welcome. I've been looking at your chart, and I have to say: your Cancer Sun in the 12th house, paired with your Pisces Moon, gives you one of the most deeply feeling hearts I've seen. And with Libra rising, you move through the world with a quiet grace that people are drawn to, even if you don't always notice it.\n\nI'm here whenever you want to talk — about your chart, your day, your relationships, or anything that's on your mind. What feels most alive for you right now?",
    timestamp: "10:30 AM",
  },
  {
    id: "c2",
    sender: "user",
    text: "That's really sweet, thank you. I've been feeling kind of restless this week and I'm not sure why. Can you help me understand what might be going on?",
    timestamp: "10:32 AM",
  },
  {
    id: "c3",
    sender: "soluna",
    text: "I hear you — that restless feeling can be unsettling, especially when you can't quite name its source. Let me look at what's happening in your chart right now.\n\nA couple of things stand out. First, Mars is currently moving through Virgo, which activates your 3rd house of communication and daily rhythms. Mars wants to move, to act, to do — and when it's in precise Virgo, that energy can feel like a hum of 'something needs to change' without being clear about what.\n\nSecond, your Moon in Pisces in the 8th house means you're naturally attuned to emotional undercurrents that others might miss. Sometimes restlessness isn't about what's wrong — it's your intuition sensing that something is shifting, even if it hasn't surfaced yet.\n\nCan I ask — has there been anything lately, even something small, that's felt like it's nudging you toward a change?",
    timestamp: "10:33 AM",
  },
  {
    id: "c4",
    sender: "user",
    text: "Actually yes. I've been thinking about making a career change but I keep second-guessing myself. It feels scary to leave something stable.",
    timestamp: "10:35 AM",
  },
  {
    id: "c5",
    sender: "soluna",
    text: "That takes real courage to admit — thank you for sharing it with me. And it makes so much sense astrologically.\n\nRight now, Jupiter — the planet of expansion and new horizons — is moving through Taurus in your 9th house. The 9th house is all about broadening your world: through learning, travel, or taking a leap toward something that feels more aligned with who you're becoming. Jupiter in steady Taurus says: you don't have to rush, but you do get to dream bigger.\n\nMeanwhile, Venus in Gemini is lighting up your 10th house of career, making this an unusually fertile time for exploring new professional paths. People are receptive to you right now — your warmth, your ideas, your perspective.\n\nHere's what I'd gently suggest: you don't need to quit your job tomorrow. But what if you gave yourself permission to explore — just explore — one alternative path this week? A conversation, a bit of research, a small step that honors the restlessness instead of fighting it. Your Cancer Sun values security deeply, and that's not a weakness. But security and growth can coexist. You don't have to choose one forever.",
    timestamp: "10:36 AM",
  },
];

// ─── Cities for Autocomplete ──────────────────────────────────────
export const CITIES = [
  "New York, New York, USA",
  "Los Angeles, California, USA",
  "Chicago, Illinois, USA",
  "Houston, Texas, USA",
  "Phoenix, Arizona, USA",
  "Philadelphia, Pennsylvania, USA",
  "San Francisco, California, USA",
  "Seattle, Washington, USA",
  "Denver, Colorado, USA",
  "Portland, Oregon, USA",
  "Austin, Texas, USA",
  "Miami, Florida, USA",
  "Atlanta, Georgia, USA",
  "Boston, Massachusetts, USA",
  "Nashville, Tennessee, USA",
  "London, England, UK",
  "Paris, France",
  "Berlin, Germany",
  "Tokyo, Japan",
  "Sydney, Australia",
  "Toronto, Ontario, Canada",
  "Vancouver, British Columbia, Canada",
  "Mexico City, Mexico",
  "São Paulo, Brazil",
  "Buenos Aires, Argentina",
  "Mumbai, India",
  "Delhi, India",
  "Cairo, Egypt",
  "Lagos, Nigeria",
  "Nairobi, Kenya",
];

// ─── Onboarding Steps ─────────────────────────────────────────────
export type OnboardingStep =
  | "welcome"
  | "name"
  | "birthdate"
  | "birthtime"
  | "birthplace"
  | "calculating"
  | "reveal";

// ─── Helper: get today's reading ──────────────────────────────────
export function getReadingForDate(dateStr: string): DailyReading {
  const found = DAILY_READINGS.find((r) => r.date === dateStr);
  return found ?? DAILY_READINGS[0];
}

// ─── Helper: get placement interpretation ─────────────────────────
export function getPlacementInterpretation(
  planet: Planet,
  sign: ZodiacSign,
  house: number,
): PlacementInterpretation | null {
  const key = `${planet}-${sign}-${house}`;
  if (PLACEMENT_INTERPRETATIONS[key]) return PLACEMENT_INTERPRETATIONS[key];

  // Try without house
  const partialKey = `${planet}-${sign}`;
  const partial = Object.entries(PLACEMENT_INTERPRETATIONS).find(([k]) =>
    k.startsWith(partialKey),
  );
  return partial ? partial[1] : null;
}

// ─── Big Three descriptions ───────────────────────────────────────
export const BIG_THREE_DESCRIPTIONS: Record<string, string> = {
  "Sun-Cancer":
    "Your Sun in Cancer means you lead with heart. You nurture, protect, and feel deeply — it's your superpower, not your soft spot.",
  "Moon-Pisces":
    "Your Moon in Pisces gives you a soul that's part poet, part mystic. You understand things without needing them explained, and your compassion is boundless.",
  "Rising-Libra":
    "With Libra rising, you greet the world with warmth and grace. People feel at ease around you — your presence is a gift you might not even realize you're giving.",
};
