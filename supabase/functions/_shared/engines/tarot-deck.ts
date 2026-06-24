// Full 78-card tarot deck with warm, growth-oriented upright meanings.
// Verdicts are intentionally gentle — final interpretation is phrased by the
// SynthesisEngine in Soluna's voice, never doom.

import type { TarotCard } from "./types.ts";

const MAJOR: Array<[string, string, string]> = [
  ["The Fool", "🃏", "A fresh beginning and a leap of faith. Trust the journey, even before you can see the whole path."],
  ["The Magician", "🪄", "You already have every tool you need. This is a moment to focus your will and make something real."],
  ["The High Priestess", "🌙", "Your intuition is especially clear right now. Trust what you know without knowing how you know it."],
  ["The Empress", "🌷", "Abundance, nurturing, and creativity are flowing. Let yourself receive and create with ease."],
  ["The Emperor", "🏛️", "Structure and steady leadership serve you now. A little healthy order makes everything feel more spacious."],
  ["The Hierophant", "📜", "A season of learning and guidance. Tradition or a wise teacher has something to offer you."],
  ["The Lovers", "💞", "A heartfelt connection or a values-based choice. Lead with what genuinely matters to you."],
  ["The Chariot", "🛡️", "Focused determination carries you forward. You can hold two reins and still move as one."],
  ["Strength", "🦁", "Gentle courage. Your power lies in patience and compassion, not force."],
  ["The Hermit", "🏮", "Turn inward. A quiet insight is waiting in the stillness you give yourself."],
  ["Wheel of Fortune", "🎡", "The cycle is turning in your favor. Stay open — change is bringing something good."],
  ["Justice", "⚖️", "Truth, fairness, and balance. An honest choice now sets things right."],
  ["The Hanged Man", "🙃", "A pause that reveals a new perspective. Surrendering the timeline is its own kind of progress."],
  ["Death", "🦋", "A meaningful ending makes room for what's next. This is transformation, not loss."],
  ["Temperance", "🍵", "Balance and patience. Blend the parts of your life gently and they'll settle into harmony."],
  ["The Devil", "⛓️", "A loving look at what you feel bound to. Naming the attachment is the first step to freedom."],
  ["The Tower", "⚡", "A sudden shift clears away what wasn't serving you. What remains is sturdier and truer."],
  ["The Star", "⭐", "Hope and renewal. After uncertainty, you're seeing your way forward with fresh inspiration."],
  ["The Moon", "🌑", "Dreams and intuition speak loudly. You don't need perfect clarity today — trust the process."],
  ["The Sun", "☀️", "Joy, vitality, and warmth. Let yourself feel genuinely good about where you are."],
  ["Judgement", "📯", "An awakening or a fresh chapter calling. Reflect kindly on how far you've come, then rise."],
  ["The World", "🌍", "Completion and wholeness. A cycle is fulfilled — savor it before the next begins."],
];

interface SuitDef {
  suit: string;
  emoji: string;
  theme: string;
  ranks: string[]; // 14 meanings: Ace..Ten, Page, Knight, Queen, King
}

const RANK_NAMES = [
  "Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Page", "Knight", "Queen", "King",
];

const SUITS: SuitDef[] = [
  {
    suit: "Wands", emoji: "🔥", theme: "creativity & passion",
    ranks: [
      "A spark of inspiration. A new creative impulse wants to be followed.",
      "Planning your next adventure. You're standing at the edge of possibility.",
      "Your efforts are beginning to bloom. Keep your vision wide.",
      "A joyful milestone — celebrate the stable ground you've built.",
      "Lively friction that sharpens you. Healthy competition, not conflict.",
      "Recognition and a well-earned win. Let yourself enjoy the applause.",
      "Standing your ground with courage. Your conviction is worth defending.",
      "Momentum and swift movement. Things are speeding up in a good way.",
      "Resilience. You've got more strength left than you think.",
      "A heavy load lightens when you ask for help or set something down.",
      "Curious, eager energy. A message or idea is ready to be explored.",
      "Bold, adventurous action. Follow the excitement.",
      "Warm, magnetic confidence. Lead with heart and others will follow.",
      "Visionary leadership. You can hold a big dream and inspire others into it.",
    ],
  },
  {
    suit: "Cups", emoji: "🏆", theme: "emotion & love",
    ranks: [
      "An opening of the heart. New feelings or a creative beginning are possible.",
      "A beautiful mutual connection. Partnership built on genuine care.",
      "Friendship and celebration. Lean into your community.",
      "A moment to notice the good already in front of you.",
      "Tender feelings need acknowledging — and there's still much to be grateful for.",
      "Sweetness and nostalgia. A kind memory or gentle reunion warms you.",
      "So many options. Dream freely, then choose what's truly nourishing.",
      "Walking toward something deeper. It's okay to outgrow what no longer fits.",
      "Contentment and emotional fulfillment — your wish, quietly granted.",
      "Harmony and belonging. The love around you is real and lasting.",
      "A gentle, intuitive message. Stay open to tender news.",
      "Following your heart with romance and grace. Idealism in the best sense.",
      "Compassionate emotional wisdom. You hold space for others beautifully.",
      "Mastery of feeling. Calm, caring, and emotionally generous."
    ],
  },
  {
    suit: "Swords", emoji: "⚔️", theme: "mind & truth",
    ranks: [
      "A breakthrough in clarity. A clear thought cuts through the fog.",
      "A pause before a choice. Give yourself room to feel before deciding.",
      "A tender heart healing. Honoring the hurt is how it mends.",
      "Rest and recovery. Quiet your mind — you've earned the stillness.",
      "Choosing your battles. Some wins aren't worth the cost; peace is allowed.",
      "Moving toward calmer waters. The hardest part is behind you.",
      "A clever, strategic approach. Think it through and act with care.",
      "A feeling of being stuck that loosens the moment you shift perspective.",
      "Worries that feel bigger at night than in daylight. Be gentle with your mind.",
      "An ending that finally lets a new, lighter day begin.",
      "Curious, sharp thinking. Ask the honest question.",
      "Direct, decisive action. Speak your truth clearly.",
      "Clear-eyed honesty with compassion. You see things as they are.",
      "Wise, fair authority. Lead with truth and a steady mind."
    ],
  },
  {
    suit: "Pentacles", emoji: "🪙", theme: "body, work & resources",
    ranks: [
      "A tangible new opportunity — a seed worth planting with patience.",
      "Balancing it all with a little grace. Adjust, don't overload.",
      "Collaboration and craft. Your skill is being recognized.",
      "Holding what matters while keeping an open hand. Security, gently.",
      "A lean moment that passes — and reminds you who's truly in your corner.",
      "Generosity flowing both ways. Give and receive with ease.",
      "Patient investment. Your steady effort is quietly compounding.",
      "Dedication and craftsmanship. The slow, satisfying work of getting good.",
      "Self-sufficiency and earned comfort. Enjoy the fruits of your effort.",
      "Lasting stability and legacy. The foundation you built holds.",
      "An eager learner. A practical new venture or skill is calling.",
      "Reliable, methodical progress. Steady steps get you there.",
      "Grounded nurturing. You create warmth, beauty, and security around you.",
      "Abundant mastery. Generous, capable, and at home in the material world."
    ],
  },
];

function buildDeck(): TarotCard[] {
  const cards: TarotCard[] = MAJOR.map(([name, emoji, meaning]) => ({
    name,
    arcana: "major" as const,
    imageEmoji: emoji,
    uprightMeaning: meaning,
  }));
  for (const s of SUITS) {
    s.ranks.forEach((meaning, i) => {
      const rank = RANK_NAMES[i];
      const isCourt = i >= 10;
      cards.push({
        name: `${rank} of ${s.suit}`,
        arcana: "minor",
        suit: s.suit,
        imageEmoji: isCourt ? "👑" : s.emoji,
        uprightMeaning: meaning,
      });
    });
  }
  return cards;
}

export const FULL_DECK: TarotCard[] = buildDeck();
