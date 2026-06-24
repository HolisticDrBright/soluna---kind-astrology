// buildContext — assemble a compact, structured snapshot of a user's day:
// blueprint summary + today's transits + Personal Day + Chinese daily energy +
// biorhythm + drawn tarot card. This is the input to detectAgreement and the LLM.

import type { Blueprint, BlueprintSummary } from "../engines/blueprint.ts";
import { computeTransits, type TransitSnapshot } from "../engines/astrology.ts";
import { personalDay, personalMonth, personalYear } from "../engines/numerology.ts";
import { chineseDaily } from "../engines/chinese.ts";
import { computeBiorhythm } from "../engines/biorhythm.ts";
import { cardOfDay } from "../engines/tarot.ts";
import type { BiorhythmReading, ChineseDaily, TarotCard } from "../engines/types.ts";

export interface DayContext {
  date: string;
  preferredName: string;
  summary: BlueprintSummary;
  transits: TransitSnapshot;
  personalDay: number;
  personalMonth: number;
  personalYear: number;
  chineseDaily: ChineseDaily;
  biorhythm: BiorhythmReading;
  tarot: TarotCard;
}

export async function buildContext(
  userId: string,
  date: string,
  blueprint: Blueprint,
  preferredName: string,
): Promise<DayContext> {
  const birthDate = blueprint.biorhythmSeed.birthDate;
  return {
    date,
    preferredName,
    summary: blueprint.summary,
    transits: computeTransits(date),
    personalDay: personalDay(birthDate, date),
    personalMonth: personalMonth(birthDate, date),
    personalYear: personalYear(birthDate, date),
    chineseDaily: chineseDaily(date),
    biorhythm: computeBiorhythm(birthDate, date),
    tarot: await cardOfDay(userId, date),
  };
}
