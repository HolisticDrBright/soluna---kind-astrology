import { assertAlmostEquals, assertEquals } from "../../test_util.ts";
import { computeBiorhythm } from "../biorhythm.ts";

Deno.test("birth day => all cycles at zero", () => {
  const r = computeBiorhythm("1990-01-01", "1990-01-01");
  assertEquals(r.dayIndex, 0);
  assertAlmostEquals(r.physical, 0, 1e-6);
  assertAlmostEquals(r.emotional, 0, 1e-6);
  assertAlmostEquals(r.intellectual, 0, 1e-6);
});

Deno.test("full period returns ~zero crossing", () => {
  const r = computeBiorhythm("1990-01-01", "1990-01-24"); // 23 days later
  assertEquals(r.dayIndex, 23);
  assertAlmostEquals(r.physical, 0, 1e-6); // physical cycle = 23d
});

Deno.test("quarter physical period ~ peak", () => {
  // ~5.75 days => not integer; use day 6 close to peak
  const r = computeBiorhythm("1990-01-01", "1990-01-07"); // 6 days
  assertEquals(r.dayIndex, 6);
  // sin(2*pi*6/23) ~ sin(1.638) ~ 0.998
  assertAlmostEquals(r.physical, Math.sin((2 * Math.PI * 6) / 23), 1e-3);
});
