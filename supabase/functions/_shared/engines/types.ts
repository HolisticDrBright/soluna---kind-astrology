// Shared engine I/O types. Each engine is an isolated, unit-tested module that
// takes normalized birth input and returns a normalized result. The
// BlueprintService composes them.

export type HouseSystem = "placidus" | "whole-sign" | "porphyry";

export interface BirthInput {
  /** YYYY-MM-DD (civil date at birth place). */
  date: string;
  /** HH:MM (24h) at birth place, or null if unknown. */
  time: string | null;
  lat?: number;
  lng?: number;
  /** IANA timezone, e.g. "America/Los_Angeles". */
  timezone?: string;
  /** Full birth name (numerology only). */
  fullName?: string;
  houseSystem?: HouseSystem;
}

/** Marks an output that could not be computed because birth time is unknown. */
export interface NeedsBirthTime {
  needsBirthTime: true;
  note: string;
}

export function needsBirthTime(what: string): NeedsBirthTime {
  return {
    needsBirthTime: true,
    note: `${what} needs your birth time to be accurate. Add it in your profile any time.`,
  };
}

/** Marks an output unavailable for a specific honest reason (time and/or place). */
export function unavailable(what: string, reason: string): NeedsBirthTime {
  return { needsBirthTime: true, note: `${what} ${reason}` };
}

// ─── engine provenance + accuracy ──────────────────────────────────
export interface EngineMeta {
  /** Where the data came from. */
  source: "hosted_api" | "verified_library" | "prototype_fallback";
  /** How precise the output is. */
  precision: "high" | "medium" | "low";
  /** Short, warm, honest note for the UI (e.g. "approximate without birth time"). */
  userFacingNote?: string;
}

export type AccuracyLevel = "exact" | "partial" | "approximate" | "blocked";

export interface AccuracyReport {
  accuracyLevel: AccuracyLevel;
  /** Inputs that, if added, would improve accuracy (e.g. "birthTime", "birthPlace"). */
  missingInputs: string[];
  /** Warm, specific notes the frontend can show verbatim. */
  confidenceNotes: string[];
}

// ─── numerology ────────────────────────────────────────────────────
export interface NumerologyResult {
  lifePath: number;
  expression: number;
  soulUrge: number;
  personality: number;
  birthday: number;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
}

// ─── biorhythm ─────────────────────────────────────────────────────
export interface BiorhythmSeed {
  birthDate: string;
}
export interface BiorhythmReading {
  physical: number; // -1..1
  emotional: number;
  intellectual: number;
  /** day index since birth (informational) */
  dayIndex: number;
}

// ─── chinese ───────────────────────────────────────────────────────
export type ChineseAnimal =
  | "Rat" | "Ox" | "Tiger" | "Rabbit" | "Dragon" | "Snake"
  | "Horse" | "Goat" | "Monkey" | "Rooster" | "Dog" | "Pig";
export type ChineseElement = "Wood" | "Fire" | "Earth" | "Metal" | "Water";

export interface BaZiPillar {
  pillar: "year" | "month" | "day" | "hour";
  heavenlyStem: string;
  earthlyBranch: ChineseAnimal;
  element: ChineseElement;
}
export interface ChineseResult {
  animal: ChineseAnimal;
  element: ChineseElement;
  yinYang: "Yin" | "Yang";
  elementAnimalLabel: string;
  bazi: BaZiPillar[];
  hourPillarKnown: boolean;
  meta: EngineMeta;
}
export interface ChineseDaily {
  animal: ChineseAnimal;
  element: ChineseElement;
}

// ─── tarot ─────────────────────────────────────────────────────────
export interface TarotCard {
  name: string;
  arcana: "major" | "minor";
  suit?: string;
  imageEmoji: string;
  uprightMeaning: string;
  reversed?: boolean;
  positionMeaning?: string;
}
export interface TarotDraw {
  spread: string;
  cards: TarotCard[];
}

// ─── astrology ─────────────────────────────────────────────────────
export type ZodiacSign =
  | "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo"
  | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

export interface PlanetPosition {
  planet: string;
  sign: ZodiacSign;
  /** ecliptic longitude 0..360 */
  longitude: number;
  /** degree within sign 0..30 */
  degree: number;
  house: number | null; // null when houses unavailable
  retrograde?: boolean;
}
export interface AspectHit {
  a: string;
  b: string;
  aspect: "conjunction" | "sextile" | "square" | "trine" | "opposition";
  orb: number;
}
export interface AstrologyResult {
  planets: PlanetPosition[];
  ascendant: { sign: ZodiacSign; degree: number } | NeedsBirthTime;
  midheaven: { sign: ZodiacSign; degree: number } | NeedsBirthTime;
  houses: number[] | NeedsBirthTime; // 12 cusp longitudes
  aspects: AspectHit[];
  houseSystem: HouseSystem;
  timeKnown: boolean;
  /** True only when both birth time AND location were supplied. */
  locationKnown: boolean;
  source: "api" | "fallback";
  meta: EngineMeta;
}

// ─── human design ──────────────────────────────────────────────────
export type HDType =
  | "Generator" | "Manifesting Generator" | "Manifestor" | "Projector" | "Reflector";
export type HDAuthority =
  | "Emotional" | "Sacral" | "Splenic" | "Ego" | "Self-Projected" | "Mental" | "Lunar";

export interface HDActivation {
  planet: string;
  gate: number;
  line: number;
  side: "personality" | "design";
}
export interface HDCenter {
  name: string;
  defined: boolean;
  gates: number[];
}
export interface HumanDesignResult {
  type: HDType;
  strategy: string;
  authority: HDAuthority;
  profile: string;
  definition: string;
  centers: HDCenter[];
  definedChannels: string[];
  activations: HDActivation[];
  signature: string;
  notSelf: string;
  incarnationCross: string;
  timeKnown: boolean;
  meta: EngineMeta;
}
