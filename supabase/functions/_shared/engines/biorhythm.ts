// BiorhythmEngine — pure sine cycles from birth date.
// Physical 23d, Emotional 28d, Intellectual 33d. Values in [-1, 1].
import type { BiorhythmReading } from "./types.ts";

const PHYSICAL = 23;
const EMOTIONAL = 28;
const INTELLECTUAL = 33;
const DAY_MS = 86_400_000;

function daysBetween(birthDate: string, forDate: string): number {
  const birth = Date.parse(`${birthDate}T00:00:00Z`);
  const target = Date.parse(`${forDate}T00:00:00Z`);
  return Math.round((target - birth) / DAY_MS);
}

function cycle(dayIndex: number, period: number): number {
  return Math.sin((2 * Math.PI * dayIndex) / period);
}

export function computeBiorhythm(birthDate: string, forDate: string): BiorhythmReading {
  const dayIndex = daysBetween(birthDate, forDate);
  return {
    physical: round(cycle(dayIndex, PHYSICAL)),
    emotional: round(cycle(dayIndex, EMOTIONAL)),
    intellectual: round(cycle(dayIndex, INTELLECTUAL)),
    dayIndex,
  };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
