import { assert, assertEquals } from "../../test_util.ts";
import { chineseDaily, computeChinese } from "../chinese.ts";

Deno.test("1995-06-22 is a Wood Pig with full BaZi when time known", () => {
  const r = computeChinese("1995-06-22", "14:35");
  assertEquals(r.animal, "Pig");
  assertEquals(r.element, "Wood");
  assertEquals(r.yinYang, "Yin");
  assertEquals(r.elementAnimalLabel, "Wood Pig");
  assertEquals(r.hourPillarKnown, true);
  assertEquals(r.bazi.length, 4); // year, month, day, hour
  // Day master (day stem) for this date is 甲 (Jia) = Wood.
  const day = r.bazi.find((p) => p.pillar === "day")!;
  assertEquals(day.heavenlyStem, "甲");
  assertEquals(day.element, "Wood");
});

Deno.test("unknown birth time omits the hour pillar", () => {
  const r = computeChinese("1995-06-22", null);
  assertEquals(r.hourPillarKnown, false);
  assertEquals(r.bazi.length, 3);
  assert(!r.bazi.some((p) => p.pillar === "hour"));
  // Year animal/element are time-independent and remain correct.
  assertEquals(r.elementAnimalLabel, "Wood Pig");
});

Deno.test("chineseDaily returns animal + element for a date", () => {
  const d = chineseDaily("2026-06-24"); // day GanZhi 己巳 -> Earth Snake
  assertEquals(d.animal, "Snake");
  assertEquals(d.element, "Earth");
});
