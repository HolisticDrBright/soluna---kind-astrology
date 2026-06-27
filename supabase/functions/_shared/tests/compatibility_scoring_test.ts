/**
 * Compatibility scoring is pure + deterministic. Locks the Sun-sign cusps (a date
 * alone determines the Sun sign — no fabrication), the warm 55-95 band, harmony
 * ordering, and determinism. No network imports, so it type-checks + runs offline.
 * Run: `deno test --allow-env --allow-read supabase/functions/_shared/tests`.
 */

import { assert, assertEquals } from "../test_util.ts";
import {
  bandLabel,
  baziCompatibility,
  compatibilityScore,
  sunSignFromDate,
} from "../synthesis/compatibility-scoring.ts";

function d(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

Deno.test("sunSignFromDate resolves the standard cusps correctly", () => {
  assertEquals(sunSignFromDate(d("1990-01-15")), "Capricorn"); // before Jan 20
  assertEquals(sunSignFromDate(d("1990-01-25")), "Aquarius"); // on/after Jan 20
  assertEquals(sunSignFromDate(d("1990-03-20")), "Pisces"); // before Mar 21
  assertEquals(sunSignFromDate(d("1990-03-21")), "Aries"); // on the cusp
  assertEquals(sunSignFromDate(d("1990-07-22")), "Cancer"); // before Jul 23
  assertEquals(sunSignFromDate(d("1990-07-23")), "Leo");
  assertEquals(sunSignFromDate(d("1990-12-21")), "Sagittarius"); // before Dec 22
  assertEquals(sunSignFromDate(d("1990-12-22")), "Capricorn"); // wraps to year start
});

Deno.test("every day of the year maps to exactly one of the 12 signs", () => {
  const signs = new Set<string>();
  for (let m = 0; m < 12; m++) {
    for (let day = 1; day <= 28; day++) {
      const dt = new Date(Date.UTC(2001, m, day, 12));
      signs.add(sunSignFromDate(dt));
    }
  }
  assertEquals(signs.size, 12);
});

Deno.test("score stays inside the warm 55-95 band for any inputs", () => {
  const cases = [
    {},
    { youSun: "Aries", themSun: "Leo", youAnimal: "Rat", themAnimal: "Dragon", youLifePath: 1, themLifePath: 1 },
    { youSun: "Taurus", themSun: "Gemini", youAnimal: "Rat", themAnimal: "Horse", youLifePath: 1, themLifePath: 9 },
    { youSun: "Cancer", themSun: "Scorpio", youAnimal: "Tiger", themAnimal: "Tiger", youLifePath: 7, themLifePath: 7 },
  ];
  for (const c of cases) {
    const s = compatibilityScore(c);
    assert(s >= 55 && s <= 95, `score ${s} out of band for ${JSON.stringify(c)}`);
    assert(Number.isInteger(s), `score ${s} should be an integer`);
  }
});

Deno.test("strong alignment scores higher than a stretch pairing", () => {
  const strong = compatibilityScore({
    youSun: "Aries", themSun: "Leo", // both fire
    youAnimal: "Rat", themAnimal: "Dragon", // same trine
    youLifePath: 5, themLifePath: 5, // identical
  });
  const stretch = compatibilityScore({
    youSun: "Aries", themSun: "Cancer", // fire vs water
    youAnimal: "Rat", themAnimal: "Horse", // clash
    youLifePath: 1, themLifePath: 9, // far apart
  });
  assert(strong > stretch, `expected strong(${strong}) > stretch(${stretch})`);
});

Deno.test("scoring is deterministic (same input -> same output)", () => {
  const input = { youSun: "Virgo", themSun: "Capricorn", youAnimal: "Ox", themAnimal: "Snake", youLifePath: 4, themLifePath: 8 };
  assertEquals(compatibilityScore(input), compatibilityScore(input));
});

Deno.test("baziCompatibility reads the real Five-Element cycles, kindly", () => {
  // Same element → kindred.
  assertEquals(baziCompatibility({ dayMasterElement: "wood" }, { dayMasterElement: "wood" }).relation, "kindred");
  // Generating cycle (water → wood, wood → fire) → nourishing.
  assertEquals(baziCompatibility({ dayMasterElement: "wood" }, { dayMasterElement: "fire" }).relation, "nourishing");
  assertEquals(baziCompatibility({ dayMasterElement: "wood" }, { dayMasterElement: "water" }).relation, "nourishing");
  // Controlling cycle (wood → earth, metal → wood) → dynamic.
  assertEquals(baziCompatibility({ dayMasterElement: "wood" }, { dayMasterElement: "earth" }).relation, "dynamic");
  assertEquals(baziCompatibility({ dayMasterElement: "wood" }, { dayMasterElement: "metal" }).relation, "dynamic");
  // Unknown when an element is missing; notes never empty for a known relation.
  assertEquals(baziCompatibility({}, {}).relation, "unknown");
  assert(baziCompatibility({ dayMasterElement: "fire" }, { dayMasterElement: "earth" }).notes.length > 0);
  // Complementarity: one's abundant element is the other's favorable.
  const comp = baziCompatibility(
    { dayMasterElement: "fire", balance: { wood: 4, fire: 1, earth: 0, metal: 0, water: 0 } },
    { dayMasterElement: "earth", favorableElements: ["wood"] },
  );
  assert(comp.notes.some((n) => /complementary/i.test(n)));
});

Deno.test("bandLabel matches its thresholds", () => {
  assertEquals(bandLabel(90), "Natural harmony");
  assertEquals(bandLabel(85), "Natural harmony");
  assertEquals(bandLabel(72), "Warm & complementary");
  assertEquals(bandLabel(62), "Growth pairing");
  assertEquals(bandLabel(55), "Stretch & learn");
});
