/**
 * Numerology is deterministic. Locks the documented fixture and confirms master
 * numbers (11/22/33) are preserved rather than reduced.
 * Run: `deno test --allow-env --allow-read supabase/functions/_shared/tests`.
 */

import { assertEquals } from "../test_util.ts";
import { computeNumerology } from "../engines/numerology.ts";

Deno.test("John Doe / 1990-01-15 matches the verified fixture", () => {
  const out = computeNumerology({
    fullBirthName: "John Doe",
    birthDate: new Date(1990, 0, 15),
    targetDate: new Date(2026, 5, 25),
  });
  assertEquals(out.lifePath, 8);
  assertEquals(out.expression, 8);
  assertEquals(out.soulUrge, 8);
  assertEquals(out.personality, 9);
  assertEquals(out.birthday, 6);
  // Personal cycles for the target date 2026-06-25.
  assertEquals(out.personalYear, 8);
  assertEquals(out.personalMonth, 5);
  assertEquals(out.personalDay, 3);
});

Deno.test("master numbers are preserved, not reduced", () => {
  // Born on the 29th → birthday 29 → 11 (a master number), kept as 11.
  const out = computeNumerology({
    fullBirthName: "Jane Smith",
    birthDate: new Date(1990, 0, 29),
    targetDate: new Date(2026, 5, 25),
  });
  assertEquals(out.birthday, 11);
});
