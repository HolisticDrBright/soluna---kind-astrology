// The Soluna Shift always returns complete, on-voice, non-fear guidance — even
// offline (LLM unavailable) it falls back deterministically by theme and echoes
// the chosen support mode.

import { assert, assertEquals } from "../../test_util.ts";
import { generateSolunaShift } from "../synthesis.ts";
import { detectAgreement } from "../agreement.ts";
import { mkDayContext } from "./fixtures.ts";

Deno.test("Shift is complete and echoes the support mode", async () => {
  const ctx = mkDayContext();
  const agreement = detectAgreement(ctx);
  const { shift } = await generateSolunaShift(ctx, agreement, "gentle");
  assert(shift.reframe.length > 0);
  assert(shift.reset.length > 0);
  assert(shift.braveTinyAction.length > 0);
  assert(shift.journalPrompt.length > 0);
  assertEquals(shift.supportMode, "gentle");
});

Deno.test("Shift is non-fear and doesn't ape a public figure", async () => {
  const ctx = mkDayContext();
  const agreement = detectAgreement(ctx);
  const { shift } = await generateSolunaShift(ctx, agreement);
  const all = [shift.reframe, shift.reset, shift.braveTinyAction, shift.journalPrompt]
    .join(" ").toLowerCase();
  for (const bad of ["doom", "disaster", "death", "warning", "beware", "tony robbins", "unleash"]) {
    assert(!all.includes(bad), `Shift should not contain "${bad}"`);
  }
});

Deno.test("Shift fallback differs by theme", async () => {
  // A clearly rest-leaning day vs. a clearly action-leaning day.
  const restCtx = mkDayContext({
    transits: { date: "2026-06-24", planets: [], moon: { phase: "Waning Crescent", emoji: "🌘", sign: "Pisces", illumination: 0.1 } },
    chineseDaily: { animal: "Pig", element: "Water" },
    personalDay: 7,
    biorhythm: { physical: -0.6, emotional: -0.7, intellectual: -0.5, dayIndex: 100 },
  });
  const actionCtx = mkDayContext({
    summary: { hdAuthority: "Sacral" },
    transits: { date: "2026-06-24", planets: [], moon: { phase: "New Moon", emoji: "🌑", sign: "Aries", illumination: 0 } },
    chineseDaily: { animal: "Horse", element: "Fire" },
    personalDay: 1,
    biorhythm: { physical: 0.8, emotional: 0.1, intellectual: 0.0, dayIndex: 100 },
  });
  const rest = await generateSolunaShift(restCtx, detectAgreement(restCtx));
  const action = await generateSolunaShift(actionCtx, detectAgreement(actionCtx));
  // Different dominant themes should produce different reframes offline.
  assert(rest.shift.reframe !== action.shift.reframe);
});
