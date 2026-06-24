// Explainable evidence chips: coarse confidence labels, daily chips (incl tarot),
// blueprint-grounded Ask chips that gate on birth time, and privacy-respecting
// bond chips + honest confidence notes.

import { assert, assertEquals } from "../../test_util.ts";
import {
  askEvidence,
  bondConfidenceNotes,
  bondEvidence,
  confidenceLabel,
  dailyEvidence,
} from "../evidence.ts";
import { detectAgreement } from "../agreement.ts";
import { mkDayContext, mkSummary } from "./fixtures.ts";

Deno.test("confidenceLabel maps numbers to coarse labels", () => {
  assertEquals(confidenceLabel(0.95), "high");
  assertEquals(confidenceLabel(0.8), "high");
  assertEquals(confidenceLabel(0.7), "medium");
  assertEquals(confidenceLabel(0.6), "medium");
  assertEquals(confidenceLabel(0.4), "low");
});

Deno.test("dailyEvidence yields enum-confidence chips, including tarot", () => {
  const ctx = mkDayContext();
  const ev = dailyEvidence(ctx, detectAgreement(ctx));
  assert(ev.length > 0);
  assert(ev.some((e) => e.system === "tarot"), "should include the card of the day");
  for (const e of ev) {
    assert(["high", "medium", "low"].includes(e.confidence));
    assert(!!e.signal && !!e.detail && !!e.source);
  }
  // Sorted highest-confidence first.
  const rank = { high: 0, medium: 1, low: 2 } as const;
  for (let i = 1; i < ev.length; i++) {
    assert(rank[ev[i - 1].confidence] <= rank[ev[i].confidence]);
  }
});

Deno.test("askEvidence gates Human Design + Rising on birth time", () => {
  const withTime = askEvidence(mkSummary(), ["astrology", "human_design"]);
  assertEquals(withTime.find((e) => e.system === "astrology")!.confidence, "high");
  assertEquals(withTime.find((e) => e.system === "human_design")!.confidence, "high");

  const noTime = askEvidence(
    mkSummary({ timeKnown: false, rising: null, hdType: null }),
    ["astrology", "human_design"],
  );
  assertEquals(noTime.find((e) => e.system === "astrology")!.confidence, "medium");
  assertEquals(noTime.find((e) => e.system === "human_design")!.confidence, "low");
});

Deno.test("bondEvidence only includes facets BOTH partners shared", () => {
  const a = { name: "A", sun: "Cancer", lifePath: 7, chinese: "Wood Pig" };
  const b = { name: "B", sun: "Scorpio", lifePath: 3 }; // no chinese shared
  const ev = bondEvidence(a, b);
  assert(ev.some((e) => e.system === "astrology")); // both shared sun
  assert(ev.some((e) => e.system === "numerology")); // both shared life path
  assert(!ev.some((e) => e.system === "chinese"), "chinese only one-sided -> omitted");
});

Deno.test("bondConfidenceNotes flags missing birth time honestly", () => {
  const exact = bondConfidenceNotes(mkSummary(), mkSummary());
  assert(exact.every((n) => !n.toLowerCase().includes("approximate")));

  const missing = bondConfidenceNotes(mkSummary(), mkSummary({ timeKnown: false }));
  assert(missing.some((n) => n.toLowerCase().includes("approximate")));
});
