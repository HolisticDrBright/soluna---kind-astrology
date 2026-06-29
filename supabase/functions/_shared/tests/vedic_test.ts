/**
 * Vedic (sidereal) normalization — proves the adapter maps FreeAstroAPI's real
 * sidereal response (numeric sign_id, degree_in_sign/absolute_degree, nakshatras,
 * Rahu/Ketu, sade_sati) into the stable VedicOutput, and never fabricates the
 * Ascendant/houses when birth time is missing.
 */

import { assert, assertEquals } from "../test_util.ts";
import { normalizeVedic, type VedicFetchCtx } from "../engines/vedic.ts";

// A representative slice of a real FreeAstroAPI sidereal chart (Einstein).
const SAMPLE = {
  ascendant: { degree: 79.4698, sign: "Gemini", sign_id: 3, nakshatra: { id: 6, name: "Ardra", pada: 4, lord: "Rahu" } },
  planets: [
    { name: "Sun", absolute_degree: 331.3393, sign: "Pisces", sign_id: 12, degree_in_sign: 1.3393, house: 10, is_retrograde: false, nakshatra: "Purva Bhadrapada", nakshatra_lord: "Jupiter", pada: 4 },
    { name: "Moon", absolute_degree: 232.3522, sign: "Scorpio", sign_id: 8, degree_in_sign: 22.3522, house: 6, is_retrograde: false, nakshatra: "Jyeshtha", nakshatra_lord: "Mercury", pada: 2 },
    { name: "Rahu", absolute_degree: 279.3061, sign: "Capricorn", sign_id: 10, degree_in_sign: 9.3061, house: 8, is_retrograde: true, nakshatra: "Uttara Ashadha", nakshatra_lord: "Sun", pada: 4 },
  ],
  houses: [
    { house: 1, sign: "Gemini", sign_id: 3, degree_cusp: 0 },
    { house: 10, sign: "Pisces", sign_id: 12, degree_cusp: 0 },
  ],
  sade_sati: { active: false, phase: null, description: "Sade Sati not active", moon_sign: "Scorpio" },
  metadata: { ayanamsha: "lahiri", house_system: "whole_sign", node_type: "mean" },
};

const FULL_CTX: VedicFetchCtx = { hash: "h1", missingInputs: [], hasTime: true, provider: "freeastroapi" };

Deno.test("Vedic: planets, ascendant, nakshatras, sade sati map correctly", () => {
  const v = normalizeVedic(SAMPLE, FULL_CTX);
  assertEquals(v.source, "provider");

  assertEquals(v.planets[0].planet, "Sun");
  assertEquals(v.planets[0].sign, "Pisces");
  assertEquals(v.planets[0].degree, 1.3);            // degree_in_sign
  assertEquals(v.planets[0].house, 10);
  assertEquals(v.planets[0].nakshatra, "Purva Bhadrapada");
  assertEquals(v.planets[0].nakshatraLord, "Jupiter");
  assertEquals(v.planets[2].retrograde, true);       // Rahu, is_retrograde

  assertEquals(v.ascendant?.sign, "Gemini");
  assertEquals(v.ascendant?.degree, 19.5);            // 79.4698 % 30
  assertEquals(v.ascendant?.nakshatra, "Ardra");

  assertEquals(v.moonNakshatra, "Jyeshtha");          // from the Moon planet
  assertEquals(v.sadeSati?.active, false);
  assert((v.sadeSati?.note ?? "").includes("not active"));
  assertEquals(v.ayanamsha, "lahiri");

  assertEquals(v.houses.length, 2);
  assertEquals(v.houses[1].sign, "Pisces");
});

Deno.test("Vedic: no birth time → Ascendant + houses are never fabricated", () => {
  const v = normalizeVedic(SAMPLE, { hash: "h2", missingInputs: ["birth_time"], hasTime: false });
  assertEquals(v.ascendant, null);
  assertEquals(v.houses.length, 0);
  assertEquals(v.planets[0].house, null);
  assert(v.partial);
  assert(v.planets.length > 0); // planet signs still resolve
});

Deno.test("Vedic: an empty/unrecognized response throws (caller degrades to 'unavailable')", () => {
  let threw = false;
  try {
    normalizeVedic({ foo: "bar" }, FULL_CTX);
  } catch {
    threw = true;
  }
  assert(threw, "expected normalizeVedic to throw when no planets are present");
});
