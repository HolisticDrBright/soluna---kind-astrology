/**
 * Shadbala — prove the FreeAstroAPI strength response maps into a ranked list
 * (strongest → weakest), that both array and object-map shapes parse, and that
 * empty/garbage input degrades (throws → caller shows "unavailable", never
 * fabricated). Pure functions, runs offline.
 */

import { assertEquals, assertThrows } from "../test_util.ts";
import { normalizeStrength } from "../engines/vedic-strength.ts";

// Array shape with total_rupas.
const ARRAY_SAMPLE = {
  shadbala: [
    { planet: "sun", total_rupas: 6.2 },
    { planet: "moon", total_rupas: 8.1, grade: "strong" },
    { planet: "JUPITER", total_rupas: 9.4 },
    { planet: "saturn", total_rupas: 4.3 },
  ],
};

Deno.test("normalizeStrength: array shape ranks strongest→weakest, title-cases", () => {
  const out = normalizeStrength(ARRAY_SAMPLE, { hash: "h", missingInputs: [] });
  assertEquals(out.source, "provider");
  assertEquals(out.planets.length, 4);
  assertEquals(out.planets[0].planet, "Jupiter");
  assertEquals(out.planets[0].rank, 1);
  assertEquals(out.strongest?.planet, "Jupiter");
  assertEquals(out.weakest?.planet, "Saturn");
  assertEquals(out.planets[1].planet, "Moon");
  assertEquals(out.planets[1].grade, "strong");
});

// Object-map shape keyed by planet, nested total.
const MAP_SAMPLE = {
  strengths: {
    Mars: { total: { rupas: 7.0 } },
    Venus: { total: 5.5 },
    Mercury: 6.6,
  },
};

Deno.test("normalizeStrength: object-map shape with nested + scalar totals", () => {
  const out = normalizeStrength(MAP_SAMPLE, { hash: "h", missingInputs: [] });
  assertEquals(out.planets.length, 3);
  assertEquals(out.strongest?.planet, "Mars");
  assertEquals(out.weakest?.planet, "Venus");
});

Deno.test("normalizeStrength: birth-time note added when missing", () => {
  const out = normalizeStrength(ARRAY_SAMPLE, { hash: "h", missingInputs: ["birth_time"] });
  assertEquals(out.missingInputs.includes("birth_time"), true);
  assertEquals(out.confidenceNotes.some((n) => n.toLowerCase().includes("approximate")), true);
});

Deno.test("normalizeStrength: no usable scores → throws (caller degrades, never fabricates)", () => {
  assertThrows(() => normalizeStrength({}, { hash: "h", missingInputs: [] }));
  assertThrows(() => normalizeStrength({ shadbala: [] }, { hash: "h", missingInputs: [] }));
  assertThrows(() => normalizeStrength({ shadbala: [{ planet: "Sun" }] }, { hash: "h", missingInputs: [] }));
});
