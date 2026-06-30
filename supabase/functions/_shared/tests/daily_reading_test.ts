/**
 * Daily reading freshness — proves the affirmation and "gentle nudges"
 * (do / embrace / ease up) ROTATE by date instead of freezing on a single line.
 *
 * This is the exact symptom users hit when the LLM key/model is misconfigured:
 * generateDailyReading falls back, and previously the fallback was one static
 * affirmation + one static nudge set every single day. The fallback is now
 * date-seeded (stable within a calendar day, advances daily) supportive GENERIC
 * language — never fabricated chart data.
 *
 * Tests the pure ./daily-fallback.ts module directly so it runs offline (the
 * synthesis module pulls in the network-only Supabase client).
 */

import { assert, assertEquals } from "../test_util.ts";
import {
  buildDailyFallbackParts,
  dayIndexFromISODate,
  formatDateLabel,
} from "../synthesis/daily-fallback.ts";

Deno.test("daily fallback: affirmation + gentle nudges rotate across consecutive days", () => {
  const a = buildDailyFallbackParts("2026-06-30");
  const b = buildDailyFallbackParts("2026-07-01");

  assert(a.affirmation !== b.affirmation, "affirmation should change day to day");
  assert(a.concreteNudge !== b.concreteNudge, "concrete nudge should change day to day");
  assert(
    JSON.stringify(a.doEmbraceEase) !== JSON.stringify(b.doEmbraceEase),
    "gentle nudges (do/embrace/ease) should change day to day",
  );
});

Deno.test("daily fallback: stable within the same calendar day (deterministic, not random)", () => {
  const a = buildDailyFallbackParts("2026-06-30");
  const b = buildDailyFallbackParts("2026-06-30");
  assertEquals(a.affirmation, b.affirmation);
  assertEquals(a.concreteNudge, b.concreteNudge);
  assertEquals(JSON.stringify(a.doEmbraceEase), JSON.stringify(b.doEmbraceEase));
});

Deno.test("daily fallback: every reading is complete (never blank fields)", () => {
  // Sweep a month: each day yields a non-empty affirmation, nudge, and a full
  // 3/3/3 do-embrace-ease set.
  for (let d = 1; d <= 31; d++) {
    const iso = `2026-07-${String(d).padStart(2, "0")}`;
    const parts = buildDailyFallbackParts(iso);
    assert(parts.affirmation.length > 0, `affirmation non-empty for ${iso}`);
    assert(parts.concreteNudge.length > 0, `nudge non-empty for ${iso}`);
    assertEquals(parts.doEmbraceEase.do.length, 3);
    assertEquals(parts.doEmbraceEase.embrace.length, 3);
    assertEquals(parts.doEmbraceEase.easeUpOn.length, 3);
  }
});

Deno.test("dayIndexFromISODate: advances by exactly 1 per day, stable per day, safe on junk", () => {
  assertEquals(dayIndexFromISODate("2026-07-01") - dayIndexFromISODate("2026-06-30"), 1);
  assertEquals(dayIndexFromISODate("2026-06-30"), dayIndexFromISODate("2026-06-30"));
  assertEquals(dayIndexFromISODate("not-a-date"), 0);
});

Deno.test("formatDateLabel: renders the literal calendar date (no timezone shift)", () => {
  assertEquals(formatDateLabel("2026-06-30"), "Tuesday, June 30, 2026");
  // Unparseable input is returned as-is rather than throwing.
  assertEquals(formatDateLabel("garbage"), "garbage");
});
