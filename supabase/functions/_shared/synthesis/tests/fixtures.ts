// Shared test fixtures (NOT a *_test.ts file, so the runner won't execute it).
import type { BlueprintSummary } from "../../engines/blueprint.ts";
import type { DayContext } from "../context.ts";

export function mkSummary(over: Partial<BlueprintSummary> = {}): BlueprintSummary {
  return {
    sunSign: "Cancer",
    moonSign: "Pisces",
    rising: "Libra",
    lifePath: 7,
    expression: 5,
    animal: "Pig",
    element: "Wood",
    hdType: "Generator",
    hdAuthority: "Sacral",
    hdProfile: "6/2",
    timeKnown: true,
    ...over,
  };
}

type DayContextOverrides =
  & Partial<Omit<DayContext, "summary">>
  & { summary?: Partial<BlueprintSummary> };

export function mkDayContext(over: DayContextOverrides = {}): DayContext {
  const { summary, ...rest } = over;
  return {
    date: "2026-06-24",
    preferredName: "Maya",
    transits: {
      date: "2026-06-24",
      planets: [],
      moon: { phase: "Waning Gibbous", emoji: "🌖", sign: "Cancer", illumination: 0.6 },
    },
    personalDay: 7,
    personalMonth: 5,
    personalYear: 2,
    chineseDaily: { animal: "Snake", element: "Water" },
    biorhythm: { physical: -0.5, emotional: -0.6, intellectual: -0.4, dayIndex: 100 },
    tarot: { name: "The Star", arcana: "major", imageEmoji: "⭐", uprightMeaning: "Hope and renewal." },
    ...rest,
    summary: mkSummary(summary),
  };
}
