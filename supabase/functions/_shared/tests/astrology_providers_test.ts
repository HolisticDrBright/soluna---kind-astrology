/**
 * Astrology provider normalization + selection. Pure, no network.
 * Run: `deno test supabase/functions/_shared/tests`.
 */

import { assert, assertEquals, assertThrows } from "../test_util.ts";
import {
  coerceSign,
  getConfiguredProvider,
  normalizeAstrologyApi,
  normalizeCustom,
  normalizeFreeAstroNatal,
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
  const keys = ["ASTROLOGY_PROVIDER", "PROKERALA_CLIENT_ID", "PROKERALA_CLIENT_SECRET", "ASTROLOGY_API_BASE_URL", "ASTROLOGY_API_KEY", "ASTROLOGY_API_USER_ID", "FREEASTRO_API", "FREEASTRO_API_KEY", "BAZI_API_KEY"];
  const clear = () => keys.forEach((k) => Deno.env.delete(k));

  clear();
  assertEquals(getConfiguredProvider(), null);

  // AstrologyAPI: explicit needs a key; also auto-detected by key (when no FreeAstro key).
  Deno.env.set("ASTROLOGY_PROVIDER", "astrologyapi"); // explicit but no key
  assertEquals(getConfiguredProvider(), null);
  Deno.env.set("ASTROLOGY_API_KEY", "secret-token");
  assertEquals(getConfiguredProvider(), "astrologyapi");
  clear();
  Deno.env.set("ASTROLOGY_API_KEY", "secret-token"); // no explicit → auto-detect astrologyapi
  assertEquals(getConfiguredProvider(), "astrologyapi");
  clear();

  // FreeAstroAPI: explicit needs its (BaZi) key; auto-detect PREFERS it when present.
  Deno.env.set("ASTROLOGY_PROVIDER", "freeastroapi"); // explicit but no key
  assertEquals(getConfiguredProvider(), null);
  Deno.env.set("FREEASTRO_API", "fa-key");
  assertEquals(getConfiguredProvider(), "freeastroapi");
  clear();
  Deno.env.set("FREEASTRO_API", "fa-key"); // no explicit → auto-detect freeastroapi
  assertEquals(getConfiguredProvider(), "freeastroapi");
  // Preferred over astrologyapi when both keys exist (one working key for both systems).
  Deno.env.set("ASTROLOGY_API_KEY", "secret-token");
  assertEquals(getConfiguredProvider(), "freeastroapi");
  clear();

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

Deno.test("normalizeAstrologyApi maps western_horoscope + tags source", () => {
  const out = normalizeAstrologyApi({
    planets: [
      { name: "Sun", full_degree: 351.6, norm_degree: 21.6, is_retro: "false", sign: "Pisces", house: 10 },
      { name: "Moon", full_degree: 215.0, norm_degree: 5.0, is_retro: "true", sign: "Scorpio", house: 2 },
    ],
    houses: [{ house_id: 1, sign: "Gemini", degree: 80.5 }],
    ascendant: 80.5,
    midheaven: 350.2,
    aspects: [{ aspecting_planet: "Sun", aspected_planet: "Moon", type: "Square", orb: 2.1 }],
  }, false);
  assertEquals(out.source, "provider");
  assertEquals(out.provider, "astrologyapi");
  assertEquals(out.planets[0].planet, "Sun");
  assertEquals(out.planets[0].sign, "Pisces");
  assertEquals(out.planets[0].degree, 21.6);
  assertEquals(out.planets[1].retrograde, true);
  // ascendant 80.5 -> Gemini (60..90), 20.5 within sign
  assertEquals(out.ascendant?.sign, "Gemini");
  assertEquals(out.ascendant?.degree, 20.5);
  assertEquals(out.aspects[0].type, "square");
});

Deno.test("normalizeAstrologyApi hides angles/houses when birth time missing; throws on no planets", () => {
  const out = normalizeAstrologyApi({
    planets: [{ name: "Sun", full_degree: 351.6, norm_degree: 21.6, sign: "Pisces", house: 10 }],
    ascendant: 80.5,
    houses: [{ house_id: 1, sign: "Gemini", degree: 80.5 }],
  }, true);
  assertEquals(out.ascendant, null);
  assertEquals(out.houses.length, 0);
  assertEquals(out.planets[0].house, null);
  assertEquals(out.timeRequired, true);
  assertThrows(() => normalizeAstrologyApi({ planets: [] }, false));
});

// A representative slice of a real FreeAstroAPI /natal/chart response (Einstein).
Deno.test("normalizeFreeAstroNatal maps planets/houses/angles/aspects + tags source", () => {
  const out = normalizeFreeAstroNatal({
    planets: [
      { id: "sun", name: "Sun", sign: "Pis", sign_id: "pisces", pos: 23.535, abs_pos: 353.535, retrograde: false, house: 9 },
      { id: "uranus", name: "Uranus", sign: "Vir", sign_id: "virgo", pos: 1.287, abs_pos: 151.287, retrograde: true, house: 3 },
      { id: "north_node", name: "North Node", sign: "Aqu", sign_id: "aquarius", pos: 1.479, abs_pos: 301.479, retrograde: true, house: 7 },
    ],
    houses: [
      { house: 1, sign: "Can", sign_id: "cancer", pos: 19.67, abs_pos: 109.67 },
      { house: 10, sign: "Pis", sign_id: "pisces", pos: 23.681, abs_pos: 353.681 },
    ],
    angles_details: {
      asc: { sign: "Can", sign_id: "cancer", pos: 19.67, abs_pos: 109.67, house: 1 },
      mc: { sign: "Pis", sign_id: "pisces", pos: 23.681, abs_pos: 353.681, house: 10 },
    },
    aspects: [
      { p1: "mars", p2: "sun", type: "sextile", orb: 3.4 },
      { p1: "chiron", p2: "north_node", type: "square", orb: 4.07 },
    ],
  }, false);
  assertEquals(out.source, "provider");
  assertEquals(out.provider, "freeastroapi");
  assertEquals(out.planets[0].planet, "Sun");
  assertEquals(out.planets[0].sign, "Pisces"); // sign_id "pisces" → "Pisces"
  assertEquals(out.planets[0].degree, 23.5);
  assertEquals(out.planets[0].house, 9);
  assertEquals(out.planets[1].retrograde, true);
  assertEquals(out.ascendant?.sign, "Cancer");
  assertEquals(out.ascendant?.degree, 19.7);
  assertEquals(out.mc?.sign, "Pisces");
  assertEquals(out.houses.length, 2);
  assertEquals(out.houses[0].sign, "Cancer");
  // aspects reference lowercase ids → resolved to display names
  assertEquals(out.aspects[0].planetA, "Mars");
  assertEquals(out.aspects[0].planetB, "Sun");
  assertEquals(out.aspects[0].type, "sextile");
  assertEquals(out.aspects[1].planetA, "Chiron");     // not in planets list → prettyId
  assertEquals(out.aspects[1].planetB, "North Node"); // in planets list → name
});

// FreeAstroAPI also serves a Vedic/sidereal natal shape (different field names,
// numeric sign_id, top-level ascendant, no aspects) — accept it too.
Deno.test("normalizeFreeAstroNatal accepts the Vedic/sidereal field names", () => {
  const out = normalizeFreeAstroNatal({
    ascendant: { degree: 79.4698, sign: "Gemini", sign_id: 3 },
    planets: [
      { name: "Sun", absolute_degree: 331.3393, sign: "Pisces", sign_id: 12, degree_in_sign: 1.3393, house: 10, is_retrograde: false },
      { name: "Rahu", absolute_degree: 279.3061, sign: "Capricorn", sign_id: 10, degree_in_sign: 9.3061, house: 8, is_retrograde: true },
    ],
    houses: [
      { house: 1, sign: "Gemini", sign_id: 3, degree_cusp: 0 },
      { house: 10, sign: "Pisces", sign_id: 12, degree_cusp: 0 },
    ],
  }, false);
  assertEquals(out.source, "provider");
  assertEquals(out.planets[0].planet, "Sun");
  assertEquals(out.planets[0].sign, "Pisces");   // from the full "sign" string
  assertEquals(out.planets[0].degree, 1.3);       // degree_in_sign
  assertEquals(out.planets[0].house, 10);
  assertEquals(out.planets[1].retrograde, true);  // is_retrograde
  assertEquals(out.ascendant?.sign, "Gemini");    // top-level ascendant
  assertEquals(out.ascendant?.degree, 19.5);      // 79.4698 % 30
  assertEquals(out.mc, null);                      // whole-sign Vedic omits MC
  assertEquals(out.houses.length, 2);
  assertEquals(out.houses[1].sign, "Pisces");
  assertEquals(out.aspects.length, 0);            // no aspects in the Vedic payload
});

Deno.test("normalizeFreeAstroNatal hides angles/houses when birth time missing; throws on no planets", () => {
  const out = normalizeFreeAstroNatal({
    planets: [{ id: "sun", name: "Sun", sign_id: "pisces", pos: 23.5, abs_pos: 353.5, house: 9 }],
    houses: [{ house: 1, sign_id: "cancer", pos: 19.67, abs_pos: 109.67 }],
    angles_details: { asc: { sign_id: "cancer", pos: 19.67, abs_pos: 109.67 } },
  }, true);
  assertEquals(out.ascendant, null);
  assertEquals(out.houses.length, 0);
  assertEquals(out.planets[0].house, null);
  assertEquals(out.timeRequired, true);
  assertThrows(() => normalizeFreeAstroNatal({ planets: [] }, false));
});
