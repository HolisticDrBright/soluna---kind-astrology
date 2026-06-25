/**
 * TarotEngine — 78-card deck with warm meanings.
 * Cryptographically seeded draw. Card of the Day deterministic per user/day.
 */

export interface TarotCard {
  name: string;
  arcana: "major" | "minor";
  suit?: string;
  number?: number;
  meaning: string;
  reversed: boolean;
}

export interface TarotDraw {
  cards: TarotCard[];
  spread: "daily" | "three_card" | "celtic_cross";
  question?: string;
}

const MAJOR_ARCANA: Array<{ name: string; meaning: string }> = [
  { name: "The Fool", meaning: "A fresh start awaits. Trust the path ahead, even if you can't see where it leads. This is a moment of pure potential — embrace it with an open heart." },
  { name: "The Magician", meaning: "You have everything you need right now. Your will, focus, and creativity are aligned. Now is the time to act with intention." },
  { name: "The High Priestess", meaning: "Listen to your inner voice today. The answers you're looking for aren't outside — they're quietly waiting within you. Trust what you already know." },
  { name: "The Empress", meaning: "Nurture what's growing in your life. This is a fertile, abundant time. Create, rest, receive — you don't always have to push." },
  { name: "The Emperor", meaning: "Structure brings freedom. Build something solid today — a routine, a boundary, a plan. Your steadiness is a gift to yourself and others." },
  { name: "The Hierophant", meaning: "There's wisdom in tradition and in trusted guidance. Someone who's walked this path before you may have insight worth hearing. Stay open to learning." },
  { name: "The Lovers", meaning: "A meaningful choice is before you — one that asks you to be honest about what you truly value. Choose with your whole heart, not just your head." },
  { name: "The Chariot", meaning: "You're gaining momentum. Harness your determination but stay grounded — victory comes from steady focus, not reckless speed." },
  { name: "Strength", meaning: "Your gentleness is your power today. Patience, compassion, and quiet courage will carry you further than force ever could." },
  { name: "The Hermit", meaning: "Step back and turn inward. Solitude isn't loneliness — it's where clarity grows. A little quiet time today could answer a big question." },
  { name: "Wheel of Fortune", meaning: "The wheel is turning in your favor. Change is coming, and it's bringing something you couldn't have planned. Stay open to the unexpected." },
  { name: "Justice", meaning: "Truth and fairness are the themes today. Be honest with yourself about a situation. The right outcome will emerge from clarity, not calculation." },
  { name: "The Hanged Man", meaning: "Sometimes not moving forward IS moving forward. Surrender your need to control the outcome. A shift in perspective will show you what you've been missing." },
  { name: "Death", meaning: "Something is ending so something new can begin. Release what's no longer serving you — not with fear, but with gratitude for what it taught you." },
  { name: "Temperance", meaning: "Balance isn't about extremes — it's about blending. Find the middle ground today. Patience and moderation will restore your equilibrium." },
  { name: "The Devil", meaning: "Notice where you might be giving your power away. A habit, a fear, or a pattern — you have more choice than you think. Reclaim your freedom gently." },
  { name: "The Tower", meaning: "A sudden shift may shake things up. What crumbles wasn't built on solid ground anyway. You'll rebuild something truer — this is liberation in disguise." },
  { name: "The Star", meaning: "Hope is real. After everything, you're still here, still reaching. Trust in renewal — this is a moment of healing, inspiration, and gentle light." },
  { name: "The Moon", meaning: "Not everything needs to be clear right now. Intuition works best in the dark. Let things unfold without forcing clarity — your instincts are sharp." },
  { name: "The Sun", meaning: "Joy, vitality, and warmth are yours today. Let yourself be seen. Celebrate something small — happiness doesn't need to be earned." },
  { name: "Judgement", meaning: "You're being called to rise into a new version of yourself. Answer the call with courage. Release old guilt — you've grown more than you know." },
  { name: "The World", meaning: "A cycle is completing. Celebrate how far you've come. This is a moment of wholeness and accomplishment — you're ready for what's next." },
];

const MINOR_SUITS = ["Wands", "Cups", "Swords", "Pentacles"];
const MINOR_NAMES = [
  "Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Page", "Knight", "Queen", "King",
];

// Minor arcana meanings by suit and general theme
const SUIT_THEMES: Record<string, string> = {
  Wands: "fire, passion, creativity, action",
  Cups: "water, emotion, relationships, intuition",
  Swords: "air, intellect, decisions, clarity",
  Pentacles: "earth, abundance, work, grounding",
};

/**
 * Deterministic hash for card selection — seeded by user+date.
 */
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

/**
 * Draw cards deterministically from a crypto-seeded random.
 */
export function drawCards(
  seed: string,
  spread: "daily" | "three_card" | "celtic_cross",
): TarotCard[] {
  const rand = seededRandom(seed);
  const count = spread === "daily" ? 1 : spread === "three_card" ? 3 : 10;
  const drawn: TarotCard[] = [];
  const deck: Array<{ name: string; meaning: string; arcana: "major" | "minor"; suit?: string }> = [
    ...MAJOR_ARCANA.map((c) => ({ ...c, arcana: "major" as const })),
  ];

  // Add minor arcana
  for (const suit of MINOR_SUITS) {
    for (const name of MINOR_NAMES) {
      const cardName = `${name} of ${suit}`;
      const cardNumber = MINOR_NAMES.indexOf(name) + 1;
      deck.push({
        name: cardName,
        meaning: `The ${cardName} speaks to ${SUIT_THEMES[suit]}. Today, this energy invites you to notice where ${name.toLowerCase()} energy — ${cardNumber <= 10 ? "a moment of" : "an invitation to embody"} — shows up in your life.`,
        arcana: "minor",
        suit,
      });
    }
  }

  // Fisher-Yates shuffle with seeded random
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  for (let i = 0; i < count; i++) {
    const card = deck[i];
    const reversed = i > 0 && rand() > 0.7;
    drawn.push({
      name: card.name,
      arcana: card.arcana,
      suit: card.suit,
      meaning: card.meaning,
      reversed,
    });
  }

  return drawn;
}

/**
 * Generate the Card of the Day for a user — deterministic per user+date.
 */
export function cardOfTheDay(userId: string, dateStr: string): TarotCard {
  const seed = `${userId}:${dateStr}:cotd:v1`;
  const cards = drawCards(seed, "daily");
  return cards[0];
}
