/**
 * Pure, deterministic compatibility scoring — NO external/network imports so it
 * can be fully type-checked and unit-tested offline.
 *
 * Everything here is computed from REAL values (Sun sign by calendar date,
 * Chinese zodiac animal, Life Path number). Nothing is fabricated: a Sun sign is
 * fully determined by the birth date, and the harmony rules are original
 * interpretations of well-known traditions (elemental affinity, Chinese trines,
 * numerology resonance). The LLM never produces the number — this does.
 */

export type Element = "fire" | "earth" | "air" | "water";

const SUN_ELEMENT: Record<string, Element> = {
  Aries: "fire", Leo: "fire", Sagittarius: "fire",
  Taurus: "earth", Virgo: "earth", Capricorn: "earth",
  Gemini: "air", Libra: "air", Aquarius: "air",
  Cancer: "water", Scorpio: "water", Pisces: "water",
};

/**
 * Tropical Sun sign from a calendar date. A date alone fully determines this —
 * no birth time or place required — so it is a genuine value, not an estimate.
 */
export function sunSignFromDate(d: Date): string {
  const m = d.getUTCMonth() + 1; // 1-12
  const day = d.getUTCDate();
  // For each month: [first day of the sign that BEGINS that month, that sign].
  const ranges: Array<[number, string]> = [
    [20, "Aquarius"], [19, "Pisces"], [21, "Aries"], [20, "Taurus"],
    [21, "Gemini"], [21, "Cancer"], [23, "Leo"], [23, "Virgo"],
    [23, "Libra"], [23, "Scorpio"], [22, "Sagittarius"], [22, "Capricorn"],
  ];
  const [startDay, sign] = ranges[m - 1];
  if (day >= startDay) return sign;
  return ranges[(m - 2 + 12) % 12][1]; // before the cutoff → previous month's sign
}

export function sunElement(sign?: string): Element | undefined {
  return sign ? SUN_ELEMENT[sign] : undefined;
}

export function elementHarmony(a?: string, b?: string): number {
  if (!a || !b) return 0.6;
  if (a === b) return 1;
  const flows = (x: string, y: string) =>
    (x === "fire" && y === "air") || (x === "earth" && y === "water");
  if (flows(a, b) || flows(b, a)) return 0.9;
  return 0.55; // different elements: more stretch, still workable
}

// Traditional Chinese zodiac trines (natural allies).
const TRINES = [
  ["Rat", "Dragon", "Monkey"],
  ["Ox", "Snake", "Rooster"],
  ["Tiger", "Horse", "Dog"],
  ["Rabbit", "Goat", "Pig"],
];
// Opposite-branch pairs (6 apart) — the classic "stretch" pairings.
const CLASHES: Record<string, string> = {
  Rat: "Horse", Horse: "Rat", Ox: "Goat", Goat: "Ox",
  Tiger: "Monkey", Monkey: "Tiger", Rabbit: "Rooster", Rooster: "Rabbit",
  Dragon: "Dog", Dog: "Dragon", Snake: "Pig", Pig: "Snake",
};

export function animalHarmony(a?: string, b?: string): number {
  if (!a || !b) return 0.6;
  if (a === b) return 0.8;
  if (TRINES.some((t) => t.includes(a) && t.includes(b))) return 1;
  if (CLASHES[a] === b) return 0.45;
  return 0.6;
}

export function lifePathHarmony(a?: number, b?: number): number {
  if (!a || !b) return 0.6;
  if (a === b) return 0.9;
  return Math.abs(a - b) <= 2 ? 0.78 : 0.62;
}

export interface ScoreSignals {
  youSun?: string;
  themSun?: string;
  youAnimal?: string;
  themAnimal?: string;
  youLifePath?: number;
  themLifePath?: number;
}

/**
 * Weighted blend of the three real signals, mapped into a warm 55-95 band.
 * Deterministic: identical inputs always yield the identical score.
 */
export function compatibilityScore(s: ScoreSignals): number {
  const harmony =
    elementHarmony(sunElement(s.youSun), sunElement(s.themSun)) * 0.4 +
    animalHarmony(s.youAnimal, s.themAnimal) * 0.3 +
    lifePathHarmony(s.youLifePath, s.themLifePath) * 0.3;
  return Math.max(55, Math.min(95, Math.round(55 + harmony * 40)));
}

export function bandLabel(score: number): string {
  if (score >= 85) return "Natural harmony";
  if (score >= 72) return "Warm & complementary";
  if (score >= 62) return "Growth pairing";
  return "Stretch & learn";
}
