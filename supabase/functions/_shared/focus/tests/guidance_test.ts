// Focus guidance: grounded evidence (only the systems actually included),
// crisis-safe escalation with no LLM, complete offline fallbacks, and a privacy
// check that the deterministic fallback never echoes the raw problem text.

import { assert, assertEquals } from "../../test_util.ts";
import { focusEvidence, generateFocusCheckinGuidance, generateFocusGuidance } from "../guidance.ts";
import type { FocusContext } from "../types.ts";

const SECRET = "SECRET_PROBLEM_TEXT_XYZ";

// deno-lint-ignore no-explicit-any
function mkCtx(over: any = {}): FocusContext {
  const base: FocusContext = {
    preferredName: "Maya",
    input: { category: "relationship", problemText: SECRET, supportMode: "gentle" },
    blueprint: {
      sunSign: "Cancer", moonSign: "Pisces", rising: "Libra", lifePath: 7,
      element: "Wood", animal: "Pig", hdType: "Generator", hdAuthority: "Sacral", timeKnown: true,
    },
    memoryThemes: [],
    journalThemes: [],
    savedReadings: [],
    askSnippets: [],
    priorCheckins: [],
    accuracy: { accuracyLevel: "exact", missingInputs: [], confidenceNotes: [] },
    included: {
      recentJournalThemes: false, savedReadings: false, currentMood: false,
      memoryThemes: false, recentAskHistory: false, selectedBondDynamics: false,
    },
    crisis: false,
  };
  return {
    ...base,
    ...over,
    blueprint: { ...base.blueprint, ...(over.blueprint ?? {}) },
    input: { ...base.input, ...(over.input ?? {}) },
  };
}

Deno.test("evidence reflects ONLY the included context (privacy filtering)", () => {
  const minimal = focusEvidence(mkCtx());
  const systems = new Set(minimal.map((e) => e.system));
  assert(systems.has("astrology") && systems.has("numerology") && systems.has("chinese"));
  // Nothing was included, so no soft sources appear.
  for (const s of ["journal", "memory", "saved_reading", "ask_history", "biorhythm", "tarot"]) {
    assert(!systems.has(s as never), `${s} must not appear when not included`);
  }

  const rich = focusEvidence(mkCtx({
    day: { personalDay: 7, moonSign: "Cancer", moonPhase: "Full Moon", chineseDaily: "Water Pig", tarot: "The Star", biorhythm: { physical: 0.2, emotional: 0.1, intellectual: 0 } },
    memoryThemes: [{ label: "rest", description: null }],
    journalThemes: ["boundaries", "rest"],
    savedReadings: ["A reading (reading)"],
    askSnippets: ["how do I set boundaries"],
  }));
  const richSystems = new Set(rich.map((e) => e.system));
  for (const s of ["journal", "memory", "saved_reading", "ask_history", "biorhythm", "tarot"]) {
    assert(richSystems.has(s as never), `${s} should appear when included`);
  }
});

Deno.test("Human Design evidence is gated on birth time", () => {
  const withTime = focusEvidence(mkCtx());
  assertEquals(withTime.find((e) => e.system === "human_design")?.confidence, "high");
  const noTime = focusEvidence(mkCtx({ blueprint: { timeKnown: false, hdType: null } }));
  assert(!noTime.some((e) => e.system === "human_design"), "no HD chip without a type");
  assertEquals(noTime.find((e) => e.system === "astrology")?.confidence, "medium");
});

Deno.test("relationship evidence is included when present", () => {
  const ev = focusEvidence(mkCtx({
    relationship: {
      kind: "bond", name: "Sam", lens: "romance",
      evidence: [{ system: "bond", signal: "Cancer × Scorpio suns", detail: "...", confidence: "high", source: "Both Suns." }],
      confidenceNotes: [],
    },
  }));
  assert(ev.some((e) => e.system === "bond"));
});

Deno.test("crisis content returns safe escalation with NO astrology prediction", async () => {
  const { guidance, usedFallback } = await generateFocusGuidance(mkCtx({
    crisis: true,
    input: { problemText: "i want to end my life" },
  }));
  assert(guidance.safetyNote && guidance.safetyNote.length > 0, "must include a safety note");
  assertEquals(guidance.evidence.length, 0); // no chart "evidence" for a crisis
  assertEquals(usedFallback, false); // deterministic safe path, not an LLM fallback
  // No fortune-telling claims (note: "set the stars aside" is fine — it's the
  // opposite of a prediction — so we match specific deterministic phrasings).
  const all = JSON.stringify(guidance).toLowerCase();
  for (const bad of ["your chart says", "destined to", "it is fated", "the universe wants"]) {
    assert(!all.includes(bad));
  }
});

Deno.test("non-crisis guidance is complete; fallback never leaks raw problem text", async () => {
  const { guidance, usedFallback } = await generateFocusGuidance(mkCtx());
  assert(guidance.whatSolunaNotices && guidance.deeperPattern && guidance.watchFor);
  assert(guidance.tryThisNext && guidance.reflectionPrompt && guidance.followUpQuestion);
  assert(guidance.evidence.length > 0);
  assert(!guidance.safetyNote);
  if (usedFallback) {
    // The deterministic fallback must not echo the user's raw words.
    assert(!JSON.stringify(guidance).includes(SECRET), "fallback leaked the raw problem text");
  }
});

Deno.test("check-in guidance is complete and never forces resolve", async () => {
  const { guidance } = await generateFocusCheckinGuidance(mkCtx(), "harder_than_expected", "still stuck");
  assert(guidance.whatShifted && guidance.nextStep && guidance.reflectionPrompt);
  assert(["keep", "pause", "resolve"].includes(guidance.keepPauseOrResolve));
  assert(guidance.evidence.length > 0);
});
