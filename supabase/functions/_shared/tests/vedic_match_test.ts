/**
 * Vedic Match (Guna Milan) — prove the FreeAstroAPI response maps into a score +
 * koota breakdown, that our interpretation is a warm reflective lens (never a
 * marriage verdict), and that a scoreless response degrades (throws → caller
 * shows nothing, never fabricated). Pure functions, runs offline.
 */

import { assert, assertEquals, assertThrows } from "../test_util.ts";
import { normalizeVedicMatch, matchBandNote, matchReady } from "../engines/vedic-match.ts";

const MATCH_SAMPLE = {
  guna_milan: {
    total_points: 28,
    maximum_points: 36,
    kootas: [
      { name: "Varna", got: 1, max: 1 },
      { name: "Vashya", obtained: 2, maximum: 2 },
      { name: "Nadi", points: 0, max: 8 },
    ],
  },
};

Deno.test("normalizeVedicMatch: maps total, max, and koota breakdown (alt key names)", () => {
  const out = normalizeVedicMatch(MATCH_SAMPLE, {});
  assertEquals(out.source, "provider");
  assertEquals(out.score, 28);
  assertEquals(out.maxScore, 36);
  assertEquals(out.kootas.length, 3);
  assertEquals(out.kootas[0].name, "Varna");
  assertEquals(out.kootas[1].got, 2); // parsed from `obtained`
  assertEquals(out.kootas[2].got, 0); // parsed from `points`
  assert(out.note.length > 0);
});

Deno.test("normalizeVedicMatch: flat shape (no wrapper) + default max 36", () => {
  const out = normalizeVedicMatch({ total: 18 }, {});
  assertEquals(out.score, 18);
  assertEquals(out.maxScore, 36);
  assertEquals(out.kootas.length, 0);
});

Deno.test("normalizeVedicMatch: no score → throws (caller degrades, never fabricates)", () => {
  assertThrows(() => normalizeVedicMatch({}, {}));
  assertThrows(() => normalizeVedicMatch({ guna_milan: { kootas: [] } }, {}));
});

Deno.test("matchBandNote: reflective bands, never a verdict", () => {
  const high = matchBandNote(30, 36);
  const mid = matchBandNote(20, 36);
  const low = matchBandNote(10, 36);
  for (const n of [high, mid, low]) {
    assert(n.includes("36"), "mentions the max");
    assert(n.toLowerCase().includes("never a verdict"), "explicitly not a verdict");
    // Never marriage-verdict / pass-fail language.
    assert(!/incompatible|do not marry|should not|shouldn't marry|fail/i.test(n), "no verdict language");
  }
  assert(high.toLowerCase().includes("harmonious"));
  assert(low.toLowerCase().includes("contrast"));
});

Deno.test("matchReady: needs birth time + real coordinates on BOTH", () => {
  const full = { year: 1990, month: 3, day: 15, hour: 8, minute: 30, city: "NYC", timezone: "America/New_York", lat: 40.7, lng: -74, timeKnown: true };
  assertEquals(matchReady(full), true);
  assertEquals(matchReady({ ...full, timeKnown: false }), false);
  assertEquals(matchReady({ ...full, lat: null }), false);
  assertEquals(matchReady(null), false);
});
