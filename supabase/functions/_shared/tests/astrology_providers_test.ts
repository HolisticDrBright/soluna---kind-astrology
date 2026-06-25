/**
 * Astrology provider normalization + selection. Pure, no network.
 * Run: `deno test supabase/functions/_shared/tests`.
 */

import { assert, assertEquals, assertThrows } from "../test_util.ts";
import {
  coerceSign,
  getConfiguredProvider,
  normalizeCustom,
  normalizeProkerala,
} from "../engines/astrology-providers.ts";

Deno.test("coerceSign accepts valid signs, derives from degree, else empty", () => {
  assertEquals(coerceSign("scorpio"), "Scorpio");
  assertEquals(coerceSign("GARBAGE", 125), "Leo"); // 120..150
  assertEquals(coerceSign(undefined), "");
});

Deno.test("normalizeCustom maps planets/houses/aspects + tags source", () => {
  const out = normalizeCustom({
    planets: [
      { name: "Sun", sign: "Cancer", degree: 5.4, house: 10, retrograde: false },
      { name: "Moon", sign: "Scorpio", degree: 12.0, house: 2 },
    ],
    ascendant: { sign: "Libra", degree: 2.5 },
    mc: { sign: "Cancer", degree: 10 },
    houses: Array.from({ length: 12 }, (_, i) => ({ sign: "Aries", degree: i })),
    aspects: [{ planetA: "Sun", planetB: "Moon", type: "square", orb: 3.2 }],
  }, false);
  assertEquals(out.source, "provider");
  assertEquals(out.provider, "custom");
  assertEquals(out.planets.length, 2);
  assertEquals(out.planets[0].planet, "Sun");
  assertEquals(out.ascendant?.sign, "Libra");
  assertEquals(out.houses.length, 12);
  assertEquals(out.aspects[0].type, "square");
});

Deno.test("normalizeCustom hides angles/houses when birth time is missing", () => {
  const out = normalizeCustom({
    planets: [{ name: "Sun", sign: "Cancer", degree: 5 }],
    ascendant: { sign: "Libra", degree: 2 },
    houses: [{ sign: "Aries", degree: 0 }],
  }, true);
  assertEquals(out.ascendant, null);
  assertEquals(out.houses.length, 0);
  assertEquals(out.planets[0].house, null);
  assertEquals(out.timeRequired, true);
  assert(out.timeMissingNote && out.timeMissingNote.length > 0);
});

Deno.test("normalizeCustom throws when no planets (engine degrades honestly)", () => {
  assertThrows(() => normalizeCustom({ planets: [] }, false));
});

Deno.test("normalizeProkerala maps western chart + tags source", () => {
  const out = normalizeProkerala({
    data: {
      planet_positions: [
        { name: "Sun", sign: "Cancer", degree: 95.4, house: 10, is_retrograde: false },
        { name: "Moon", sign: "Scorpio", degree: 215.0, house: 2 },
      ],
      ascendant: { sign: "Libra", degree: 2.5 },
      aspects: [{ aspecting_planet: "Sun", aspected_planet: "Moon", aspect: "Trine", orb: 1.1 }],
    },
  }, false);
  assertEquals(out.source, "provider");
  assertEquals(out.provider, "prokerala");
  assertEquals(out.planets[0].planet, "Sun");
  // 95.4 longitude -> 5.4 within sign
  assertEquals(out.planets[0].degree, 5.4);
  assertEquals(out.ascendant?.sign, "Libra");
  assertEquals(out.aspects[0].type, "trine");
});

Deno.test("getConfiguredProvider honors env + auto-detects by creds", () => {
  const keys = ["ASTROLOGY_PROVIDER", "PROKERALA_CLIENT_ID", "PROKERALA_CLIENT_SECRET", "ASTROLOGY_API_BASE_URL"];
  const clear = () => keys.forEach((k) => Deno.env.delete(k));

  clear();
  assertEquals(getConfiguredProvider(), null);

  Deno.env.set("ASTROLOGY_PROVIDER", "prokerala"); // explicit but no creds
  assertEquals(getConfiguredProvider(), null);
  Deno.env.set("PROKERALA_CLIENT_ID", "id");
  Deno.env.set("PROKERALA_CLIENT_SECRET", "secret");
  assertEquals(getConfiguredProvider(), "prokerala");

  clear();
  Deno.env.set("ASTROLOGY_API_BASE_URL", "https://example.invalid"); // auto-detect custom
  assertEquals(getConfiguredProvider(), "custom");
  clear();
});
