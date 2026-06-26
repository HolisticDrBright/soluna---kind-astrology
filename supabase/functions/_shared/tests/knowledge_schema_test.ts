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

Deno.test("all 22 Major Arcana are present", () => {
  assertEquals(CARDS_BY_SYSTEM.tarot.length, 22);
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
