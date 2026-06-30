/**
 * Deterministic selection + synthesis: agreement -> strong, tension -> mixed,
 * tarot draw resolves, and provider failure never fabricates placements.
 */

import { assert, assertEquals } from "../test_util.ts";
import { selectKnowledge } from "../knowledge/selectKnowledge.ts";

Deno.test("multi-system action alignment yields a strong/supportive pattern", () => {
  const sel = selectKnowledge({
    astrology: { planets: [{ planet: "Sun", sign: "Aries" }], ascendant: null },
    numerology: { lifePath: 1, personalDay: 1 },
    chinese: { animal: "Dragon", element: "Fire", yinYang: "Yang" },
    humanDesign: { type: "Manifestor" },
  });
  assert(["strong", "supportive"].includes(sel.confidenceLabel), `got ${sel.confidenceLabel}`);
  assert(sel.agreementSignals.some((a) => a.tag === "action_initiative"));
  assert(sel.synthesisTags.includes("action_initiative"));
});

Deno.test("action signals + burnout journal hint produces a mixed/held pattern", () => {
  const sel = selectKnowledge({
    astrology: { planets: [{ planet: "Sun", sign: "Aries" }], ascendant: null },
    numerology: { personalDay: 1 },
    chinese: { animal: "Tiger" },
    journalThemeTags: ["rest_recovery"],
  });
  assert(sel.tensionSignals.some((t) =>
    (t.a === "action_initiative" && t.b === "rest_recovery") ||
    (t.a === "rest_recovery" && t.b === "action_initiative")
  ));
  assertEquals(sel.confidenceLabel, "mixed");
});

Deno.test("tarot draw resolves to the matching archetype card", () => {
  const sel = selectKnowledge({ tarot: { name: "The Star" } });
  assert(sel.selectedKnowledgeCards.some((c) => c.system === "tarot" && c.key === "the_star"));
});

Deno.test("BaZi cards are selected ONLY from real provider-backed BaZi data", () => {
  // Real chart present → BaZi cards appear (day master + favorable + pillar etc.).
  const withBazi = selectKnowledge({
    chinese: { animal: "Rat", element: "Wood", yinYang: "Yang" },
    bazi: {
      present: true,
      dayMaster: { element: "wood", yinYang: "yang" },
      dayMasterStrength: "strong",
      favorableElements: ["water"],
      fiveElementBalance: { wood: 4, fire: 1, earth: 1, metal: 1, water: 0 },
      tenGods: ["Direct Wealth"],
      pillars: { year: true, month: true, day: true, hour: true },
      hasLuckPillars: true,
    },
  });
  assert(withBazi.selectedKnowledgeCards.some((c) => c.system === "bazi" && c.key === "day_master_yang_wood"));
  assert(withBazi.selectedKnowledgeCards.some((c) => c.system === "bazi" && c.key === "favorable_water"));
  // The lightweight Chinese-zodiac cards still coexist.
  assert(withBazi.selectedKnowledgeCards.some((c) => c.system === "eastern_astrology"));

  // No bazi (or present:false) → NO bazi cards, ever.
  const noBazi = selectKnowledge({ chinese: { animal: "Rat", element: "Wood", yinYang: "Yang" } });
  assert(!noBazi.selectedKnowledgeCards.some((c) => c.system === "bazi"));
  const blockedBazi = selectKnowledge({ bazi: { present: false } });
  assert(!blockedBazi.selectedKnowledgeCards.some((c) => c.system === "bazi"));
});

Deno.test("Vedic cards are selected ONLY from a real provider-backed Vedic chart", () => {
  // Real chart → vedic_core + the Moon's nakshatra card (normalized key) + Sade Sati.
  const withVedic = selectKnowledge({
    vedic: { present: true, moonNakshatra: "Purva Bhadrapada", ascendantNakshatra: "Ardra", sadeSatiActive: true },
  });
  const vedic = withVedic.selectedKnowledgeCards.filter((c) => c.system === "vedic");
  assert(vedic.some((c) => c.key === "vedic_core"), "expected vedic_core");
  assert(vedic.some((c) => c.key === "nak_purva_bhadrapada"), "expected the Moon's nakshatra card");
  assert(vedic.some((c) => c.key === "nak_ardra"), "expected the Ascendant's nakshatra card");
  assert(vedic.some((c) => c.key === "sade_sati_active"), "expected the Sade Sati card");

  // No vedic (or present:false) → NO vedic cards, ever.
  assert(!selectKnowledge({}).selectedKnowledgeCards.some((c) => c.system === "vedic"));
  assert(!selectKnowledge({ vedic: { present: false } }).selectedKnowledgeCards.some((c) => c.system === "vedic"));
});

Deno.test("provider failure (null astrology) fabricates no placements", () => {
  const sel = selectKnowledge({ astrology: null, numerology: { lifePath: 7 } });
  assert(!sel.selectedKnowledgeCards.some((c) => c.system === "western_astrology"));
  assert(sel.selectedKnowledgeCards.some((c) => c.system === "numerology"));
});

Deno.test("empty context stays reflective with a safe default action", () => {
  const sel = selectKnowledge({});
  assertEquals(sel.confidenceLabel, "reflective");
  assert(sel.suggestedActionTypes.length >= 1);
});

Deno.test("focus category biases suggested actions and tags", () => {
  const sel = selectKnowledge({
    numerology: { lifePath: 2 },
    focus: { category: "relationship", problemText: "We keep having the same argument and I shut down." },
  });
  assert(sel.synthesisTags.includes("connection_love") || sel.synthesisTags.includes("communication"));
});

Deno.test("selection is deterministic (same input -> same output)", () => {
  const ctx = { numerology: { lifePath: 5, personalDay: 5 }, chinese: { animal: "Monkey" } };
  assertEquals(JSON.stringify(selectKnowledge(ctx)), JSON.stringify(selectKnowledge(ctx)));
});
