/**
 * Validates the whole knowledge deck against the shared schema, and checks
 * coverage invariants (every system present, tarot complete, ids unique).
 * Run: deno test --allow-env --allow-read supabase/functions/_shared/tests
 */

import { assert, assertEquals } from "../test_util.ts";
import { ALL_CARDS, CARDS_BY_SYSTEM } from "../knowledge/index.ts";
import { validateDeck } from "../knowledge/types.ts";

Deno.test("every knowledge card satisfies the schema", () => {
  const errors = validateDeck(ALL_CARDS);
  assertEquals(errors, []);
});

Deno.test("card ids are globally unique", () => {
  const ids = ALL_CARDS.map((c) => c.id);
  assertEquals(ids.length, new Set(ids).size);
});

Deno.test("every system has cards", () => {
  for (const [system, cards] of Object.entries(CARDS_BY_SYSTEM)) {
    assert(cards.length > 0, `system ${system} has no cards`);
    for (const c of cards) assertEquals(c.system, system);
  }
});

Deno.test("the full 78-card tarot deck is present (22 major + 56 minor)", () => {
  const keys = new Set(CARDS_BY_SYSTEM.tarot.map((c) => c.key));
  assertEquals(CARDS_BY_SYSTEM.tarot.length, 78);
  // 56 Minor Arcana: 4 suits × 14 ranks, keyed "<rank>_of_<suit>".
  const ranks = ["ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "page", "knight", "queen", "king"];
  const suits = ["wands", "cups", "swords", "pentacles"];
  for (const s of suits) for (const r of ranks) assert(keys.has(`${r}_of_${s}`), `missing tarot ${r}_of_${s}`);
});

Deno.test("western astrology has planet-in-sign, houses, and aspect cards", () => {
  const keys = new Set(CARDS_BY_SYSTEM.western_astrology.map((c) => c.key));
  const signs = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
  // 5 personal/social planets × 12 signs = 60 planet-in-sign cards.
  for (const p of ["mercury", "venus", "mars", "jupiter", "saturn"]) {
    for (const s of signs) assert(keys.has(`${p}_${s}`), `missing ${p}_${s}`);
  }
  // 12 houses.
  for (let h = 1; h <= 12; h++) assert(keys.has(`house_${h}`), `missing house_${h}`);
  // 5 core aspects.
  for (const a of ["conjunction", "sextile", "square", "trine", "opposition"]) {
    assert(keys.has(`aspect_${a}`), `missing aspect_${a}`);
  }
});

Deno.test("life path 1-9 plus master numbers exist", () => {
  const keys = new Set(CARDS_BY_SYSTEM.numerology.map((c) => c.key));
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) {
    assert(keys.has(`life_path_${n}`), `missing life_path_${n}`);
  }
});

Deno.test("cards stay prompt-sized (plainMeaning <= 400 chars)", () => {
  for (const c of ALL_CARDS) assert(c.plainMeaning.length <= 400, `${c.id} plainMeaning too long`);
});
