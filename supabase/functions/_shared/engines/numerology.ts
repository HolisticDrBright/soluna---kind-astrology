/**
 * NumerologyEngine — Pure TypeScript, deterministic Pythagorean numerology.
 * Input: { fullBirthName, birthDate }
 * Output: Life Path, Expression/Destiny, Soul Urge, Personality, Birthday numbers;
 *          Personal Year/Month/Day for any target date.
 */

export interface NumerologyInput {
  fullBirthName: string;
  birthDate: Date;
  targetDate?: Date;
}

export interface NumerologyOutput {
  lifePath: number;
  lifePathMaster: boolean;
  expression: number;
  expressionMaster: boolean;
  soulUrge: number;
  soulUrgeMaster: boolean;
  personality: number;
  personalityMaster: boolean;
  birthday: number;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
}

const MASTER_NUMBERS = new Set([11, 22, 33]);

function sumDigits(n: number): number {
  let sum = 0;
  while (n > 0) {
    sum += n % 10;
    n = Math.floor(n / 10);
  }
  return sum;
}

function reduceToSingleOrMaster(n: number): { value: number; isMaster: boolean } {
  if (MASTER_NUMBERS.has(n)) return { value: n, isMaster: true };
  while (n > 9 && !MASTER_NUMBERS.has(n)) {
    n = sumDigits(n);
  }
  return { value: n, isMaster: MASTER_NUMBERS.has(n) };
}

function letterToNumber(letter: string): number {
  const upper = letter.toUpperCase();
  const map: Record<string, number> = {
    A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8, I:9,
    J:1, K:2, L:3, M:4, N:5, O:6, P:7, Q:8, R:9,
    S:1, T:2, U:3, V:4, W:5, X:6, Y:7, Z:8,
  };
  return map[upper] ?? 0;
}

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

function nameToNumbers(name: string): { all: number; vowels: number; consonants: number } {
  let all = 0;
  let vowels = 0;
  let consonants = 0;

  for (const ch of name) {
    const n = letterToNumber(ch);
    if (n === 0) continue;
    all += n;
    if (VOWELS.has(ch.toUpperCase())) {
      vowels += n;
    } else {
      consonants += n;
    }
  }
  return { all, vowels, consonants };
}

/**
 * Personal Year / Month / Day for a target date — the parts of numerology that
 * CHANGE every day. Exported separately so daily surfaces (buildContext, cron)
 * can recompute the live cycle instead of reusing the values frozen into the
 * blueprint at onboarding time. Pure; needs only the birth date.
 */
export function personalCycles(
  birthDate: Date,
  targetDate: Date,
): { personalYear: number; personalMonth: number; personalDay: number } {
  const universalYear = reduceToSingleOrMaster(targetDate.getFullYear()).value;
  const personalYear = reduceToSingleOrMaster(
    birthDate.getDate() + (birthDate.getMonth() + 1) + universalYear,
  ).value;
  const personalMonth = reduceToSingleOrMaster(
    personalYear + (targetDate.getMonth() + 1),
  ).value;
  const personalDay = reduceToSingleOrMaster(
    personalMonth + targetDate.getDate(),
  ).value;
  return { personalYear, personalMonth, personalDay };
}

/**
 * Compute full numerology profile for a person.
 * Verified against known fixtures (see _shared/tests/numerology_test.ts):
 * - "John Doe" / 1990-01-15 → Life Path 8, Expression 8, Soul Urge 8, Personality 9, Birthday 6
 */
export function computeNumerology(input: NumerologyInput): NumerologyOutput {
  const { fullBirthName, birthDate, targetDate } = input;

  // Life Path from birth date
  const dateStr = `${birthDate.getFullYear()}${String(birthDate.getMonth() + 1).padStart(2, "0")}${String(birthDate.getDate()).padStart(2, "0")}`;
  const dateSum = dateStr.split("").reduce((s, d) => s + parseInt(d), 0);
  const lp = reduceToSingleOrMaster(dateSum);

  // Name numbers
  const { all, vowels, consonants } = nameToNumbers(fullBirthName.replace(/\s+/g, ""));
  const expr = reduceToSingleOrMaster(all);
  const soul = reduceToSingleOrMaster(vowels);
  const pers = reduceToSingleOrMaster(consonants);

  // Birthday number
  const bday = reduceToSingleOrMaster(birthDate.getDate());

  // Personal Year / Month / Day
  const { personalYear, personalMonth, personalDay } = personalCycles(
    birthDate,
    targetDate ?? new Date(),
  );

  return {
    lifePath: lp.value,
    lifePathMaster: lp.isMaster,
    expression: expr.value,
    expressionMaster: expr.isMaster,
    soulUrge: soul.value,
    soulUrgeMaster: soul.isMaster,
    personality: pers.value,
    personalityMaster: pers.isMaster,
    birthday: bday.value,
    personalYear,
    personalMonth,
    personalDay,
  };
}
