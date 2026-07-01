/**
 * Solar Return — prove the "which return year is active" math, that the FreeAstroAPI
 * chart maps into a year-ahead summary (ascendant / sun house / moon sign), and
 * that a chart with no ascendant degrades (throws → caller shows "unavailable",
 * never fabricated). Pure functions, runs offline.
 */

import { assertEquals, assertThrows } from "../test_util.ts";
import { currentSolarYear, normalizeSolarReturn } from "../engines/solar-return.ts";

// ── currentSolarYear ──────────────────────────────────────────────
Deno.test("currentSolarYear: after this year's birthday → this year", () => {
  // birthday March 15; today July 1, 2026 → 2026
  assertEquals(currentSolarYear(3, 15, "2026-07-01"), 2026);
});
Deno.test("currentSolarYear: before this year's birthday → last year", () => {
  // birthday March 15; today Feb 1, 2026 → 2025
  assertEquals(currentSolarYear(3, 15, "2026-02-01"), 2025);
});
Deno.test("currentSolarYear: on the birthday itself → this year", () => {
  assertEquals(currentSolarYear(3, 15, "2026-03-15"), 2026);
});

// ── normalizeSolarReturn ──────────────────────────────────────────
const SR_SAMPLE = {
  return_date: "2026-03-15T04:22:00Z",
  ascendant: { sign: "Leo", absolute_degree: 128.4 },
  planets: [
    { name: "Sun", sign: "Pisces", house: 8 },
    { name: "Moon", sign: "Taurus", house: 10 },
    { name: "Venus", sign: "Aquarius", house: 7 },
  ],
};

Deno.test("normalizeSolarReturn: maps ascendant, sun house, moon sign, return date", () => {
  const out = normalizeSolarReturn(SR_SAMPLE, { hash: "h", returnYear: 2026, missingInputs: [] });
  assertEquals(out.source, "provider");
  assertEquals(out.year, 2026);
  assertEquals(out.ascendantSign, "Leo");
  assertEquals(out.sunHouse, 8);
  assertEquals(out.moonSign, "Taurus");
  assertEquals(out.returnDate, "2026-03-15T04:22:00Z");
});

Deno.test("normalizeSolarReturn: planets-as-map shape + string ascendant", () => {
  const out = normalizeSolarReturn(
    { ascendant: "Scorpio", planets: { Sun: { house: 3 }, Moon: { sign: "Cancer" } } },
    { hash: "h", returnYear: 2027, missingInputs: [] },
  );
  assertEquals(out.ascendantSign, "Scorpio");
  assertEquals(out.sunHouse, 3);
  assertEquals(out.moonSign, "Cancer");
});

Deno.test("normalizeSolarReturn: out-of-range sun house is dropped (null, not invented)", () => {
  const out = normalizeSolarReturn(
    { ascendant: { sign: "Aries" }, planets: [{ name: "Sun", house: 99 }] },
    { hash: "h", returnYear: 2026, missingInputs: [] },
  );
  assertEquals(out.ascendantSign, "Aries");
  assertEquals(out.sunHouse, null);
});

Deno.test("normalizeSolarReturn: no ascendant → throws (caller degrades, never fabricates)", () => {
  assertThrows(() => normalizeSolarReturn({}, { hash: "h", returnYear: 2026, missingInputs: [] }));
  assertThrows(() => normalizeSolarReturn({ planets: [{ name: "Sun", house: 5 }] }, { hash: "h", returnYear: 2026, missingInputs: [] }));
});
