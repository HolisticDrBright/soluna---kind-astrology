/**
 * Moon phase is deterministic real astronomy derived from the date alone.
 * Anchors the new/full points, the waxing/waning buckets, ranges, determinism.
 * Run: deno test --allow-env --allow-read supabase/functions/_shared/tests
 */

import { assert, assertEquals } from "../test_util.ts";
import { computeMoonPhase } from "../engines/moon-phase.ts";

const REF = Date.UTC(2000, 0, 6, 18, 14, 0); // a known new moon
const DAY = 86_400_000;

Deno.test("the reference instant reads as a New Moon", () => {
  const out = computeMoonPhase(new Date(REF));
  assertEquals(out.phase, "New Moon");
  assertEquals(out.bucket, "new");
  assert(out.illumination <= 0.02, `illumination ${out.illumination} should be ~0`);
});

Deno.test("about half a cycle later reads as a Full Moon", () => {
  const out = computeMoonPhase(new Date(REF + 14.765 * DAY));
  assertEquals(out.phase, "Full Moon");
  assertEquals(out.bucket, "full");
  assert(out.illumination >= 0.98, `illumination ${out.illumination} should be ~1`);
});

Deno.test("early cycle is waxing, late cycle is waning", () => {
  assertEquals(computeMoonPhase(new Date(REF + 5 * DAY)).bucket, "waxing");
  assertEquals(computeMoonPhase(new Date(REF + 22 * DAY)).bucket, "waning");
});

Deno.test("age and illumination stay in range for a full year of dates", () => {
  for (let d = 0; d < 365; d++) {
    const out = computeMoonPhase(new Date(REF + d * DAY));
    assert(out.ageDays >= 0 && out.ageDays < 29.54, `ageDays ${out.ageDays} out of range`);
    assert(out.illumination >= 0 && out.illumination <= 1, `illumination ${out.illumination} out of range`);
  }
});

Deno.test("moon phase is deterministic (same date -> same phase)", () => {
  const a = computeMoonPhase(new Date(REF + 100 * DAY));
  const b = computeMoonPhase(new Date(REF + 100 * DAY));
  assertEquals(JSON.stringify(a), JSON.stringify(b));
});
