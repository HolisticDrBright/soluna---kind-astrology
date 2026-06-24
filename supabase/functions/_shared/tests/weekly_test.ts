// Weekly integration report aggregation: repeating themes, distinct-per-day
// system counts, journal highlights, empty state, and an offline narrative.

import { assert, assertEquals } from "../test_util.ts";
import {
  emptyWeeklyBody,
  generateWeeklyNarrative,
  summarizeWeek,
  weekEndFor,
} from "../weekly.ts";

Deno.test("weekEndFor adds 6 days (inclusive week)", () => {
  assertEquals(weekEndFor("2026-06-22"), "2026-06-28");
  assertEquals(weekEndFor("2026-12-29"), "2027-01-04"); // year rollover
});

Deno.test("summarizeWeek finds repeating themes + counts systems once per day", () => {
  const readings = [
    { reading_date: "2026-06-22", agreement: { title: "Rest & Reflection", systems: [{ system: "astrology" }, { system: "numerology" }] } },
    // astrology appears twice the same day -> must count as ONE for that day.
    { reading_date: "2026-06-23", agreement: { title: "Rest & Reflection", systems: [{ system: "astrology" }, { system: "astrology" }] } },
    { reading_date: "2026-06-24", agreement: { title: "Focus & Work", systems: [{ system: "humanDesign" }] } },
  ];
  const journal = [{ entry_date: "2026-06-22", title: "A quiet, good day", body: "" }];
  const sum = summarizeWeek(readings, [], journal);

  assert(sum.repeatingThemes.includes("Rest & Reflection")); // 2 days
  assertEquals(sum.daysWithReadings, 3);

  const astro = sum.systemsThatAgreed.find((s) => s.system === "astrology")!;
  assertEquals(astro.count, 2); // two days, distinct per day
  // camelCase agreement system normalizes to the product vocabulary.
  assert(sum.systemsThatAgreed.some((s) => s.system === "human_design"));
  assert(sum.journalHighlights.includes("A quiet, good day"));
});

Deno.test("empty weekly body is warm and honestly not-enough-data", () => {
  const b = emptyWeeklyBody("2026-06-22", "2026-06-28", 0);
  assertEquals(b.enoughData, false);
  assertEquals(b.accuracyLevel, "approximate");
  assert(b.carryForward.length > 0);
  assert(b.confidenceNotes.length > 0);
  assertEquals(b.repeatingThemes.length, 0);
});

Deno.test("weekly narrative falls back cleanly offline", async () => {
  const r = await generateWeeklyNarrative("Maya", ["Rest & Reflection"], [{ system: "astrology", count: 2 }], 3);
  assert(r.carryForward.length > 0);
  assert(r.shiftForNextWeek.length > 0);
});

Deno.test("zero-day weeks get a fallback narrative without calling the model", async () => {
  const r = await generateWeeklyNarrative("Maya", [], [], 0);
  assert(r.usedFallback);
  assert(r.carryForward.length > 0);
});
