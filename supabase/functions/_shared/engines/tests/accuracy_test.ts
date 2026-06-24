// Proves the core honesty guarantee: a user can NEVER receive a fake-precise
// chart from missing place/time. Angles + houses are withheld (not guessed at
// 0,0/UTC), planets keep null houses, and the blueprint accuracy report labels
// exactly what is exact vs estimated.

import { assert, assertEquals } from "../../test_util.ts";
import { computeAstrology } from "../astrology.ts";
import { computeBlueprint } from "../blueprint.ts";
import type { BirthInput } from "../types.ts";

const BASE: BirthInput = {
  date: "1995-06-22",
  time: "14:30",
  lat: 34.05,
  lng: -118.24,
  timezone: "America/Los_Angeles",
  fullName: "Test Person",
};

function isUnavailable(x: unknown): x is { needsBirthTime: true; note: string } {
  return !!x && typeof x === "object" && "needsBirthTime" in (x as Record<string, unknown>);
}

Deno.test("time known but NO location: Rising/MC/houses withheld, not faked", async () => {
  const r = await computeAstrology({ ...BASE, lat: undefined, lng: undefined });
  assert(isUnavailable(r.ascendant), "ascendant must be unavailable without location");
  assert(isUnavailable(r.midheaven), "midheaven must be unavailable without location");
  assert(isUnavailable(r.houses), "houses must be unavailable without location");
  // The honest note must point at the missing PLACE, not pretend it's computed.
  if (isUnavailable(r.ascendant)) assert(r.ascendant.note.toLowerCase().includes("place"));
  // Planets still resolve to signs, but with NO house (no fake 0,0 house).
  for (const p of r.planets) assertEquals(p.house, null);
  assertEquals(r.locationKnown, false);
  assertEquals(r.timeKnown, true);
  assertEquals(r.meta.precision, "low");
});

Deno.test("no time AND no location: still no fake angles, low precision", async () => {
  const r = await computeAstrology({ ...BASE, time: null, lat: undefined, lng: undefined });
  assert(isUnavailable(r.ascendant));
  assert(isUnavailable(r.houses));
  assertEquals(r.locationKnown, false);
  assertEquals(r.timeKnown, false);
  if (isUnavailable(r.ascendant)) {
    assert(r.ascendant.note.toLowerCase().includes("time"));
  }
});

Deno.test("full data: angles + houses ARE computed, medium/high precision", async () => {
  const r = await computeAstrology(BASE);
  assert(!isUnavailable(r.ascendant), "ascendant should compute with time + place");
  assert(!isUnavailable(r.houses), "houses should compute with time + place");
  assertEquals(r.locationKnown, true);
  assert(r.meta.precision === "medium" || r.meta.precision === "high");
  // At least some planets get a real house number now.
  assert(r.planets.some((p) => typeof p.house === "number"));
});

Deno.test("blueprint accuracy: exact / partial / approximate are labeled honestly", async () => {
  const exact = await computeBlueprint(BASE);
  assertEquals(exact.blueprint.accuracy.accuracyLevel, "exact");
  // "exact" means we have time + place + timezone; a verified hosted ephemeris
  // is a further refinement, so it may still be listed — but never the core inputs.
  assert(!exact.blueprint.accuracy.missingInputs.includes("birth_time"));
  assert(!exact.blueprint.accuracy.missingInputs.includes("birth_place"));
  assert(!exact.blueprint.accuracy.missingInputs.includes("timezone"));

  const partial = await computeBlueprint({ ...BASE, lat: undefined, lng: undefined });
  assertEquals(partial.blueprint.accuracy.accuracyLevel, "partial");
  assert(partial.blueprint.accuracy.missingInputs.includes("birth_place"));
  // Reassures about what IS exact, and names the moon estimate honestly only
  // when time is missing — here time is known, so it asks for place.
  assert(partial.blueprint.accuracy.confidenceNotes.some((n) => n.toLowerCase().includes("place")));

  const approx = await computeBlueprint({ ...BASE, time: null, lat: undefined, lng: undefined });
  assertEquals(approx.blueprint.accuracy.accuracyLevel, "approximate");
  assert(approx.blueprint.accuracy.missingInputs.includes("birth_time"));
  assert(approx.blueprint.accuracy.missingInputs.includes("birth_place"));
  // Moon must be flagged as an estimate when there's no birth time.
  assert(approx.blueprint.accuracy.confidenceNotes.some((n) => n.toLowerCase().includes("moon")));
});

Deno.test("blueprint summary never invents a Rising sign without data", async () => {
  const partial = await computeBlueprint({ ...BASE, lat: undefined, lng: undefined });
  assertEquals(partial.blueprint.summary.rising, null);
});

Deno.test("chinese engine: 3 pillars exact without time, hour pillar flagged", () => {
  // (Indirect via blueprint to exercise the wiring.)
  return computeBlueprint({ ...BASE, time: null, lat: undefined, lng: undefined }).then((bp) => {
    assertEquals(bp.blueprint.chinese.hourPillarKnown, false);
    assertEquals(bp.blueprint.chinese.meta.precision, "medium");
    // Animal + element are still resolved (exact from the date).
    assert(!!bp.blueprint.chinese.animal && !!bp.blueprint.chinese.element);
  });
});
