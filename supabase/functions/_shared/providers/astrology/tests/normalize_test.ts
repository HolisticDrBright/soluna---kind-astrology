// Provider normalization: representative payloads from each provider map to the
// same normalized shape (planets/angles/houses/aspects), with degrees recomputed
// and planet/sign names canonicalized. No network — pure parsers only.

import { assert, assertEquals } from "../../../test_util.ts";
import {
  canonicalPlanet,
  coerceSign,
  degreeInSign,
  normalizeAspect,
  signFromLongitude,
} from "../normalize.ts";
import { normalizeProkerala } from "../prokerala.ts";
import { normalizeAstrologyApi } from "../astrologyapi.ts";
import { normalizeCustom } from "../custom.ts";

Deno.test("longitude → sign + degree-in-sign", () => {
  assertEquals(signFromLongitude(0), "Aries");
  assertEquals(signFromLongitude(125), "Leo"); // 120..150
  assertEquals(degreeInSign(125), 5);
  assertEquals(signFromLongitude(-1), "Pisces"); // wraps
});

Deno.test("planet + sign coercion is forgiving", () => {
  assertEquals(canonicalPlanet("RAHU"), "NorthNode");
  assertEquals(canonicalPlanet("sun"), "Sun");
  assertEquals(coerceSign("scorpio", 0), "Scorpio");
  assertEquals(coerceSign("garbage", 125), "Leo"); // falls back to longitude
});

Deno.test("aspect normalization rejects unknown aspects", () => {
  assert(normalizeAspect({ aspecting_planet: "Sun", aspected_planet: "Moon", type: "trine", orb: 2.1 }));
  assertEquals(normalizeAspect({ a: "Sun", b: "Moon", aspect: "quintile", orb: 1 }), null);
});

Deno.test("Prokerala western chart normalizes", () => {
  const json = {
    data: {
      planet_positions: [
        { name: "Sun", longitude: 95.4, sign: "Cancer", house: 10, is_retrograde: false },
        { name: "Moon", longitude: 215.0, sign: "Scorpio", house: 2 },
      ],
      ascendant: { sign: "Libra", longitude: 182.5 },
      midheaven: { sign: "Cancer", longitude: 100.0 },
      aspects: [{ aspecting_planet: "Sun", aspected_planet: "Moon", type: "square", orb: 3.2 }],
    },
  };
  const n = normalizeProkerala(json);
  assertEquals(n.provider, "prokerala");
  assertEquals(n.planets.length, 2);
  const sun = n.planets[0];
  assertEquals(sun.planet, "Sun");
  assertEquals(sun.sign, "Cancer");
  assertEquals(sun.degree, degreeInSign(95.4));
  assertEquals(n.ascendant?.sign, "Libra");
  assertEquals(n.aspects?.[0].aspect, "square");
  assertEquals(n.moon?.sign, "Scorpio");
});

Deno.test("AstrologyAPI planets + horoscope normalize", () => {
  const planetsJson = [
    { name: "Sun", full_degree: 95.4, sign: "Cancer", house: 10 },
    { name: "Moon", full_degree: 215.0, sign: "Scorpio", house: 2 },
  ];
  const horoscopeJson = {
    houses: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, degree: i * 30 })),
    ascendant: 182.5,
    aspects: [{ aspecting_planet: "Sun", aspected_planet: "Moon", type: "trine", orb: 1.5 }],
  };
  const n = normalizeAstrologyApi(planetsJson, horoscopeJson);
  assertEquals(n.provider, "astrologyapi");
  assertEquals(n.planets.length, 2);
  assertEquals(n.houses?.length, 12);
  assertEquals(n.ascendant?.sign, "Libra"); // 182.5 -> Libra
  assertEquals(n.aspects?.[0].aspect, "trine");
});

Deno.test("custom endpoint normalizes; throws when empty", () => {
  const n = normalizeCustom({
    planets: [{ planet: "Sun", longitude: 10, sign: "Aries" }],
    houses: Array.from({ length: 12 }, (_, i) => i * 30),
    ascendant: { sign: "Leo", degree: 5 },
  });
  assertEquals(n.planets[0].planet, "Sun");
  assertEquals(n.houses?.length, 12);
  let threw = false;
  try {
    normalizeCustom({ planets: [] });
  } catch {
    threw = true;
  }
  assert(threw, "empty planets must throw so the engine degrades honestly");
});
