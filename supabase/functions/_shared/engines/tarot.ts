// TarotEngine — cryptographically seeded draws over the full 78-card deck.
// Card of the Day is deterministic per user/day; spreads can be deterministic
// (seeded by question) or freshly randomized per draw.

import { FULL_DECK } from "./tarot-deck.ts";
import type { TarotCard, TarotDraw } from "./types.ts";

export const SPREADS: Record<string, { name: string; positions: string[] }> = {
  daily: { name: "Card of the Day", positions: ["Today"] },
  "three-card": {
    name: "Past · Present · Future",
    positions: ["Past influence", "Present situation", "Future potential"],
  },
  "celtic-cross": {
    name: "Celtic Cross",
    positions: [
      "Present", "Challenge", "Past", "Future", "Above", "Below",
      "Advice", "External influences", "Hopes & fears", "Outcome",
    ],
  },
};

/** SHA-256 of a string -> uint32 seed (crypto-seeded, deterministic per input). */
async function seedFrom(str: string): Promise<number> {
  const data = new TextEncoder().encode(str);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  return ((hash[0] << 24) | (hash[1] << 16) | (hash[2] << 8) | hash[3]) >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(deck: TarotCard[], rng: () => number): TarotCard[] {
  const arr = deck.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function cardOfDay(userId: string, date: string): Promise<TarotCard> {
  const seed = await seedFrom(`cotd:${userId}:${date}`);
  return shuffle(FULL_DECK, mulberry32(seed))[0];
}

export interface DrawOptions {
  userId?: string;
  question?: string;
  /** When true, the same (spread, userId, question) always yields the same cards. */
  deterministic?: boolean;
}

export async function drawSpread(spread: string, opts: DrawOptions = {}): Promise<TarotDraw> {
  const def = SPREADS[spread];
  if (!def) throw new Error(`Unknown spread: ${spread}`);
  const nonce = opts.deterministic ? "" : crypto.randomUUID();
  const seed = await seedFrom(`${spread}:${opts.userId ?? ""}:${opts.question ?? ""}:${nonce}`);
  const shuffled = shuffle(FULL_DECK, mulberry32(seed));
  const cards = shuffled.slice(0, def.positions.length).map((c, i) => ({
    ...c,
    positionMeaning: def.positions[i],
  }));
  return { spread, cards };
}

export function deckSize(): number {
  return FULL_DECK.length;
}
