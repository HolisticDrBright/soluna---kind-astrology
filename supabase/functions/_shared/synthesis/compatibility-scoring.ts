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

// ─── BaZi compatibility (deterministic; uses the real Five-Element cycles) ──────
//
// The generating (生) and controlling (克) cycles are fixed facts of BaZi, not
// invented. We turn two real Day Master elements + element balances into gentle,
// non-fatalistic reflection notes. Used ONLY when both sides have a real chart.

export interface BaziCompatInput {
  dayMasterElement?: string;            // wood/fire/earth/metal/water
  favorableElements?: string[];
  balance?: Record<string, number>;
}
export interface BaziCompatResult {
  relation: "kindred" | "nourishing" | "dynamic" | "independent" | "unknown";
  notes: string[];
}

const GENERATES: Record<string, string> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CONTROLS: Record<string, string> = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };

function topElement(balance?: Record<string, number>): string | undefined {
  if (!balance) return undefined;
  let best: string | undefined;
  let max = -Infinity;
  for (const [k, v] of Object.entries(balance)) if (v > max) { max = v; best = k; }
  return max > 0 ? best : undefined;
}

export function baziCompatibility(a: BaziCompatInput, b: BaziCompatInput): BaziCompatResult {
  const ae = (a.dayMasterElement ?? "").toLowerCase();
  const be = (b.dayMasterElement ?? "").toLowerCase();
  const notes: string[] = [];
  let relation: BaziCompatResult["relation"] = "unknown";

  if (ae && be) {
    if (ae === be) {
      relation = "kindred";
      notes.push("Your Day Masters share the same element — an easy, peer-like understanding, with a gentle invitation to invite in some variety.");
    } else if (GENERATES[ae] === be || GENERATES[be] === ae) {
      relation = "nourishing";
      notes.push("Your Day Master elements sit in a nourishing flow — one tends to feed and encourage the other's energy.");
    } else if (CONTROLS[ae] === be || CONTROLS[be] === ae) {
      relation = "dynamic";
      notes.push("Your Day Master elements are in a more dynamic relationship — it can sharpen you both when met with patience and respect, rather than as a clash.");
    } else {
      relation = "independent";
      notes.push("Your Day Master elements are fairly independent — different rhythms that leave room to learn from each other.");
    }
  }

  // Complementarity: does one person's strongest element supply what the other
  // could use (its favorable element)?
  const aTop = topElement(a.balance);
  const bTop = topElement(b.balance);
  const aFav = (a.favorableElements ?? []).map((e) => e.toLowerCase());
  const bFav = (b.favorableElements ?? []).map((e) => e.toLowerCase());
  if ((bTop && aFav.includes(bTop)) || (aTop && bFav.includes(aTop))) {
    notes.push("There's a complementary balance here — each of you tends to carry an element the other finds steadying.");
  }

  return { relation, notes };
}
