import { assert, assertEquals } from "../../test_util.ts";
import { computeAstrology, computeTransits } from "../astrology.ts";
import type { NeedsBirthTime } from "../types.ts";

function isNeedsTime(x: unknown): x is NeedsBirthTime {
  return !!x && typeof x === "object" && "needsBirthTime" in x;
}

Deno.test("natal chart with time: Big Three computed", async () => {
  const r = await computeAstrology({
    date: "1995-06-22",
    time: "14:35",
    lat: 45.5152,
    lng: -122.6784,
    houseSystem: "placidus",
  });
  assertEquals(r.timeKnown, true);
  assertEquals(r.source, "fallback");
  assertEquals(r.planets.length, 10);
  const sun = r.planets.find((p) => p.planet === "Sun")!;
  assertEquals(sun.sign, "Cancer"); // Sun ~91° -> Cancer
  assert(!isNeedsTime(r.ascendant));
  if (!isNeedsTime(r.ascendant)) assertEquals(r.ascendant.sign, "Libra");
  assert(typeof sun.house === "number");
});

Deno.test("unknown time: planets present, houses/asc flagged", async () => {
  const r = await computeAstrology({ date: "1995-06-22", time: null, lat: 45.5, lng: -122.7 });
  assertEquals(r.timeKnown, false);
  assertEquals(r.planets.length, 10);
  assert(isNeedsTime(r.ascendant));
  assert(isNeedsTime(r.houses));
  // Sun sign is time-independent and still correct.
  assertEquals(r.planets.find((p) => p.planet === "Sun")!.sign, "Cancer");
  // Houses are null (not guessed).
  assertEquals(r.planets.find((p) => p.planet === "Sun")!.house, null);
});

Deno.test("transits produce a moon phase + 10 planets", () => {
  const t = computeTransits("2026-06-24");
  assertEquals(t.planets.length, 10);
  assert(t.moon.illumination >= 0 && t.moon.illumination <= 1);
  assert(t.moon.phase.length > 0);
});
