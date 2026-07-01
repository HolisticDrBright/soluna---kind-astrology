/**
 * Vimshottari Dasha — prove the FreeAstroAPI dasha response maps into a stable
 * timeline, that "which period is active" is correct pure date math, and that
 * empty/garbage input degrades (throws → caller shows "unavailable", never
 * fabricated). Pure functions, so this runs offline. Fixtures are shaped from a
 * typical Vimshottari-dasha response; the normalizer is deliberately tolerant of
 * alternate field names (start/start_date, antardashas/bhuktis, …).
 */

import { assert, assertEquals, assertThrows } from "../test_util.ts";
import { normalizeDasha, selectCurrentDasha, toISODate, type DashaPeriod } from "../engines/vedic-dasha.ts";

// ── toISODate ─────────────────────────────────────────────────────
Deno.test("toISODate: accepts ISO date, ISO datetime, and empty", () => {
  assertEquals(toISODate("2031-06-14"), "2031-06-14");
  assertEquals(toISODate("2031-06-14T00:00:00Z"), "2031-06-14");
  assertEquals(toISODate("2031-06-14 12:30:00"), "2031-06-14");
  assertEquals(toISODate(""), "");
  assertEquals(toISODate(null), "");
  assertEquals(toISODate("not a date"), "");
});

// ── normalizeDasha ────────────────────────────────────────────────
const DASHA_SAMPLE = {
  dasha_system: "Vimshottari",
  dashas: [
    {
      planet: "venus", start_date: "2005-06-12", end_date: "2025-06-12",
      antardashas: [
        { lord: "Venus", start: "2005-06-12", end: "2008-10-12" },
        { lord: "Sun", start: "2008-10-12", end: "2009-10-12" },
        { lord: "Moon", start: "2009-10-12", end: "2011-06-12" },
      ],
    },
    {
      planet: "SUN", start_date: "2025-06-12", end_date: "2031-06-12",
      // alternate sub-period key + datetime strings
      bhuktis: [
        { name: "Sun", start_date: "2025-06-12T00:00:00Z", end_date: "2025-09-30T00:00:00Z" },
        { name: "Moon", start_date: "2025-09-30", end_date: "2026-03-31" },
      ],
    },
    { planet: "Moon", start_date: "2031-06-12", end_date: "2041-06-12" },
  ],
};

Deno.test("normalizeDasha: maps timeline, planets title-cased, nested sub-periods", () => {
  const out = normalizeDasha(DASHA_SAMPLE, { hash: "h1", missingInputs: [], asOfISO: "2025-08-01" });
  assertEquals(out.source, "provider");
  assertEquals(out.system, "Vimshottari");
  assertEquals(out.timeline.length, 3);
  assertEquals(out.timeline[0].planet, "Venus");
  assertEquals(out.timeline[1].planet, "Sun");
  // sub-periods parsed under both `antardashas` and `bhuktis`
  assertEquals(out.timeline[0].subPeriods?.length, 3);
  assertEquals(out.timeline[1].subPeriods?.length, 2);
  // datetime strings on sub-periods normalized to plain dates
  assertEquals(out.timeline[1].subPeriods?.[0].start, "2025-06-12");
});

Deno.test("normalizeDasha: computes the current maha + antar as of a date", () => {
  const out = normalizeDasha(DASHA_SAMPLE, { hash: "h1", missingInputs: [], asOfISO: "2025-08-01" });
  assertEquals(out.current?.maha?.planet, "Sun");
  assertEquals(out.current?.antar?.planet, "Sun"); // 2025-06-12 .. 2025-09-30
});

Deno.test("normalizeDasha: alternate top-level key (dasha_periods) still parses", () => {
  const out = normalizeDasha(
    { dasha_periods: [{ lord: "Rahu", from: "2000-01-01", to: "2018-01-01" }] },
    { hash: "h", missingInputs: [], asOfISO: "2010-01-01" },
  );
  assertEquals(out.timeline.length, 1);
  assertEquals(out.timeline[0].planet, "Rahu");
  assertEquals(out.current?.maha?.planet, "Rahu");
});

Deno.test("normalizeDasha: no usable periods → throws (caller degrades, never fabricates)", () => {
  assertThrows(() => normalizeDasha({}, { hash: "h", missingInputs: [], asOfISO: "2025-01-01" }));
  assertThrows(() => normalizeDasha({ dashas: [] }, { hash: "h", missingInputs: [], asOfISO: "2025-01-01" }));
  // periods missing required fields are dropped → empty → throws
  assertThrows(() => normalizeDasha({ dashas: [{ planet: "Venus" }] }, { hash: "h", missingInputs: [], asOfISO: "2025-01-01" }));
});

// ── selectCurrentDasha ────────────────────────────────────────────
const TL: DashaPeriod[] = [
  { planet: "Venus", start: "2005-06-12", end: "2025-06-12", subPeriods: [
    { planet: "Venus", start: "2005-06-12", end: "2008-10-12" },
    { planet: "Rahu", start: "2008-10-12", end: "2011-10-12" },
  ] },
  { planet: "Sun", start: "2025-06-12", end: "2031-06-12" },
];

Deno.test("selectCurrentDasha: picks the maha and antar containing the day", () => {
  const c = selectCurrentDasha(TL, "2009-01-01");
  assertEquals(c.maha?.planet, "Venus");
  assertEquals(c.antar?.planet, "Rahu");
});

Deno.test("selectCurrentDasha: maha with no sub-periods yields null antar", () => {
  const c = selectCurrentDasha(TL, "2026-01-01");
  assertEquals(c.maha?.planet, "Sun");
  assertEquals(c.antar, null);
});

Deno.test("selectCurrentDasha: a day outside the timeline yields nulls (no fabrication)", () => {
  const before = selectCurrentDasha(TL, "1990-01-01");
  assertEquals(before.maha, null);
  assertEquals(before.antar, null);
  const after = selectCurrentDasha(TL, "2099-01-01");
  assertEquals(after.maha, null);
});

Deno.test("selectCurrentDasha: period is half-open [start, end) at the boundary", () => {
  // On the exact end date of Venus / start of Sun, Sun is active.
  const c = selectCurrentDasha(TL, "2025-06-12");
  assertEquals(c.maha?.planet, "Sun");
  assert(c.maha!.start <= "2025-06-12");
});
