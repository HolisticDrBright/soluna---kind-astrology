/**
 * Reading accuracy is honest: an approximation is never labeled "exact".
 * Run: `deno test supabase/functions/_shared/tests`.
 */

import { assert, assertEquals } from "../test_util.ts";
import { deriveReadingAccuracy } from "../accuracy.ts";
import type { AstrologyOutput } from "../engines/astrology.ts";

function chart(over: Partial<AstrologyOutput>): AstrologyOutput {
  return {
    planets: [],
    ascendant: null,
    mc: null,
    houses: [],
    aspects: [],
    timeRequired: false,
    source: "provider",
    ...over,
  };
}

Deno.test("no chart => blocked", () => {
  const a = deriveReadingAccuracy(null);
  assertEquals(a.accuracy_level, "blocked");
  assert(a.missing_inputs.includes("birth_profile"));
});

Deno.test("approximation => approximate, never exact", () => {
  const a = deriveReadingAccuracy(chart({ source: "approximation", timeRequired: false }));
  assertEquals(a.accuracy_level, "approximate");
  assert(a.missing_inputs.includes("verified_ephemeris"));
  assert(a.confidence_notes.some((n) => n.toLowerCase().includes("estimate")));
});

Deno.test("real provider + time known => exact", () => {
  const a = deriveReadingAccuracy(chart({ source: "provider", timeRequired: false }));
  assertEquals(a.accuracy_level, "exact");
  assertEquals(a.missing_inputs.length, 0);
});

Deno.test("real provider + time unknown => partial + birth_time note", () => {
  const a = deriveReadingAccuracy(chart({ source: "provider", timeRequired: true }));
  assertEquals(a.accuracy_level, "partial");
  assert(a.missing_inputs.includes("birth_time"));
});
