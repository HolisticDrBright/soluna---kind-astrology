/**
 * personalCycles — Personal Year/Month/Day must CHANGE with the target date.
 * The blueprint froze them at onboarding (so "Personal Day 7" showed forever);
 * buildContext now overlays these live values per reading date.
 */

import { assert, assertEquals } from "../test_util.ts";
import { computeNumerology, personalCycles } from "../engines/numerology.ts";

const birth = new Date("1990-03-15T12:00:00Z");

Deno.test("personalCycles: matches computeNumerology for the same target date", () => {
  const target = new Date("2026-07-02T12:00:00Z");
  const full = computeNumerology({ fullBirthName: "John Doe", birthDate: birth, targetDate: target });
  const cycles = personalCycles(birth, target);
  assertEquals(cycles.personalYear, full.personalYear);
  assertEquals(cycles.personalMonth, full.personalMonth);
  assertEquals(cycles.personalDay, full.personalDay);
});

Deno.test("personalCycles: the Personal Day actually cycles day to day", () => {
  const days = ["2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-05"]
    .map((d) => personalCycles(birth, new Date(`${d}T12:00:00Z`)).personalDay);
  // Consecutive days step the reduced sum — at least two distinct values in any
  // 5-day window (a frozen value would collapse to one).
  assert(new Set(days).size >= 2, `expected varying personal days, got ${days.join(",")}`);
  for (const d of days) assert(d >= 1 && d <= 33);
});

Deno.test("personalCycles: month boundary shifts the Personal Month", () => {
  const june = personalCycles(birth, new Date("2026-06-15T12:00:00Z"));
  const july = personalCycles(birth, new Date("2026-07-15T12:00:00Z"));
  assert(june.personalMonth !== july.personalMonth || june.personalDay !== july.personalDay);
});
