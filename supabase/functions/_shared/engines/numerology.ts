// NumerologyEngine — pure, deterministic, Pythagorean.
//
// Rules (documented for testability):
//  - Pythagorean letter values 1..9 (A=1..I=9, J=1..R=9, S=1..Z=8).
//  - Master numbers 11/22/33 are PRESERVED in core numbers (Life Path,
//    Expression, Soul Urge, Personality, Birthday).
//  - Personal Year/Month/Day cycle 1..9 (reduced fully; no masters), matching
//    the conventional cyclical interpretation.
//  - Y is treated as a VOWEL when it is not adjacent to another vowel in its
//    word, otherwise a consonant (the standard "vowel sound" rule).

import type { NumerologyResult } from "./types.ts";

const VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};
const VOWELS = new Set(["A", "E", "I", "O", "U"]);

function sumDigits(n: number): number {
  return String(n).split("").reduce((s, d) => s + Number(d), 0);
}

/** Reduce to a single digit, keeping master numbers 11/22/33. */
export function reduceKeepMaster(n: number): number {
  let x = Math.abs(n);
  while (x > 9 && x !== 11 && x !== 22 && x !== 33) x = sumDigits(x);
  return x;
}

/** Reduce fully to 1..9 (0 stays 0). */
export function reduceToDigit(n: number): number {
  let x = Math.abs(n);
  while (x > 9) x = sumDigits(x);
  return x;
}

/** Normalize a name to uppercase A–Z (strip accents, spaces, punctuation per word). */
function toWords(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter(Boolean);
}

/** Y is a vowel when neither neighbor (within the word) is a vowel. */
function isVowelAt(word: string, i: number): boolean {
  const ch = word[i];
  if (VOWELS.has(ch)) return true;
  if (ch !== "Y") return false;
  const prev = word[i - 1];
  const next = word[i + 1];
  const prevVowel = prev ? VOWELS.has(prev) : false;
  const nextVowel = next ? VOWELS.has(next) : false;
  return !prevVowel && !nextVowel;
}

type LetterFilter = "all" | "vowels" | "consonants";

function nameNumber(name: string, filter: LetterFilter): number {
  let total = 0;
  for (const word of toWords(name)) {
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      const v = VALUES[ch];
      if (v === undefined) continue;
      const vowel = isVowelAt(word, i);
      if (filter === "vowels" && !vowel) continue;
      if (filter === "consonants" && vowel) continue;
      total += v;
    }
  }
  return reduceKeepMaster(total);
}

/** Life Path: reduce(month) + reduce(day) + reduce(year), then reduce — masters kept. */
export function lifePath(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const parts = reduceKeepMaster(m) + reduceKeepMaster(d) + reduceKeepMaster(y);
  return reduceKeepMaster(parts);
}

export interface NumerologyOptions {
  /** Target date for personal year/month/day (defaults to birth date). */
  forDate?: string;
}

export function computeNumerology(
  fullName: string,
  birthDate: string,
  opts: NumerologyOptions = {},
): NumerologyResult {
  const [, , bDay] = birthDate.split("-").map(Number);
  const target = opts.forDate ?? birthDate;
  const [ty, tm, td] = target.split("-").map(Number);
  const [, bMonth] = birthDate.split("-").map(Number);

  const py = reduceToDigit(reduceToDigit(bMonth) + reduceToDigit(bDay) + reduceToDigit(ty));
  const pm = reduceToDigit(py + reduceToDigit(tm));
  const pd = reduceToDigit(pm + reduceToDigit(td));

  return {
    lifePath: lifePath(birthDate),
    expression: nameNumber(fullName, "all"),
    soulUrge: nameNumber(fullName, "vowels"),
    personality: nameNumber(fullName, "consonants"),
    birthday: reduceKeepMaster(bDay),
    personalYear: py,
    personalMonth: pm,
    personalDay: pd,
  };
}

/** Personal Day for an arbitrary date (used by the daily reading). */
export function personalDay(birthDate: string, forDate: string): number {
  return computeNumerology("", birthDate, { forDate }).personalDay;
}
