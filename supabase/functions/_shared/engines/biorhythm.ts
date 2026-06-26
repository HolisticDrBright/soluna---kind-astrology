/**
 * BiorhythmEngine — Pure math sine cycles from birth date.
 * Physical (23-day), Emotional (28-day), Intellectual (33-day).
 */

export interface BiorhythmInput {
  birthDate: Date;
  targetDate?: Date;
}

export interface BiorhythmOutput {
  physical: number;   // -100 to 100
  emotional: number;  // -100 to 100
  intellectual: number; // -100 to 100
  average: number;    // -100 to 100
}

const PHYSICAL_CYCLE = 23;
const EMOTIONAL_CYCLE = 28;
const INTELLECTUAL_CYCLE = 33;

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function biorhythmValue(days: number, cycle: number): number {
  return Math.round(Math.sin((2 * Math.PI * days) / cycle) * 100);
}

export function computeBiorhythm(input: BiorhythmInput): BiorhythmOutput {
  const target = input.targetDate ?? new Date();
  const days = daysBetween(input.birthDate, target);
  const physical = biorhythmValue(days, PHYSICAL_CYCLE);
  const emotional = biorhythmValue(days, EMOTIONAL_CYCLE);
  const intellectual = biorhythmValue(days, INTELLECTUAL_CYCLE);
  const average = Math.round((physical + emotional + intellectual) / 3);

  return { physical, emotional, intellectual, average };
}
