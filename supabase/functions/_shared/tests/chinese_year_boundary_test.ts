/**
 * Chinese year boundary — the zodiac year turns at Li Chun (~Feb 4), not Jan 1.
 * Anyone born in January belongs to the PREVIOUS cycle year; the old code gave
 * them the next year's animal, which fed the blueprint, compatibility scoring,
 * and agreement signals.
 */

import { assertEquals } from "../test_util.ts";
import { computeChinese } from "../engines/chinese.ts";

// 1990 is the Horse year (from Feb 4, 1990); before that it's still the 1989 Snake.
Deno.test("chinese year: January birthday belongs to the previous cycle year", () => {
  const jan = computeChinese({ birthDate: new Date("1990-01-15T12:00:00Z"), birthTime: null });
  assertEquals(jan.animal, "Snake");
});

Deno.test("chinese year: Feb 3 is still the old year, Feb 4 starts the new one", () => {
  const feb3 = computeChinese({ birthDate: new Date("1990-02-03T12:00:00Z"), birthTime: null });
  const feb4 = computeChinese({ birthDate: new Date("1990-02-04T12:00:00Z"), birthTime: null });
  assertEquals(feb3.animal, "Snake");
  assertEquals(feb4.animal, "Horse");
});

Deno.test("chinese year: mid-year birthdays unchanged", () => {
  const jul = computeChinese({ birthDate: new Date("1990-07-20T12:00:00Z"), birthTime: null });
  assertEquals(jul.animal, "Horse");
});
