import { assert, assertEquals } from "../../test_util.ts";
import { compatibilityScore, generateBondReading, generateCompatibility, shareFacets } from "../synthesis.ts";
import type { ChineseAnimal, ZodiacSign } from "../../engines/types.ts";

const summary = {
  sunSign: "Cancer",
  moonSign: "Pisces",
  lifePath: 7,
  element: "Wood",
  animal: "Pig",
  hdType: "Generator",
};

Deno.test("shareFacets respects share prefs (privacy)", () => {
  const full = shareFacets("Maya", summary, {});
  assertEquals(full.sun, "Cancer");
  assertEquals(full.moon, "Pisces");
  assertEquals(full.lifePath, 7);
  assertEquals(full.chinese, "Wood Pig");
  assertEquals(full.hdType, "Generator");

  const hidden = shareFacets("Maya", summary, { shareMoon: false, shareNumbers: false });
  assertEquals(hidden.moon, undefined);
  assertEquals(hidden.lifePath, undefined);
  assertEquals(hidden.sun, "Cancer"); // not hidden
});

Deno.test("compatibilityScore is deterministic + symmetric", () => {
  const a = { sunSign: "Cancer" as ZodiacSign, lifePath: 7, animal: "Pig" as ChineseAnimal };
  const b = { sunSign: "Taurus" as ZodiacSign, lifePath: 3, animal: "Goat" as ChineseAnimal };
  const s1 = compatibilityScore(a, b);
  const s2 = compatibilityScore(b, a);
  assertEquals(s1.overall, s2.overall);
  assert(s1.overall >= 0 && s1.overall <= 100);
});

Deno.test("compatibility output is structured (arrays + evidence + confidence)", async () => {
  const { body } = await generateCompatibility(
    { name: "Maya", sunSign: "Cancer", lifePath: 7, animal: "Pig" },
    { name: "Sam", sunSign: "Scorpio", lifePath: 3, animal: "Horse" },
    "romance",
  );
  assert(Array.isArray(body.whereYouFlow) && body.whereYouFlow.length > 0);
  assert(Array.isArray(body.whereYouGrow) && body.whereYouGrow.length > 0);
  assert(Array.isArray(body.howToSupport) && body.howToSupport.length > 0);
  assertEquals(body.evidenceBySystem.length, 3);
  for (const e of body.evidenceBySystem) {
    assert(["astrology", "numerology", "chinese"].includes(e.system));
    assert(typeof e.score === "number" && !!e.signal);
  }
  assert(body.confidence > 0 && body.confidence <= 1);
  assertEquals(body.score, body.overall);
});

Deno.test("bond reading fallback is complete (offline)", async () => {
  const a = shareFacets("Maya", summary, {});
  const b = shareFacets("Sam", { ...summary, sunSign: "Scorpio", animal: "Horse" }, {});
  const { reading } = await generateBondReading(a, b, "romance", {
    moonPhase: "Full Moon",
    moonSign: "Leo",
  });
  assert(reading.togetherText.length > 20);
  assert(reading.flowGrow.flow.length > 0 && reading.flowGrow.grow.length > 0);
  assert(reading.sharedWeather.includes("Leo"));
});
