/**
 * Safety + tone guardrails: banned-language linter, user-input safety routing,
 * and the rule that relationship advice cannot be fatalistic/manipulative.
 */

import { assert, assertEquals } from "../test_util.ts";
import { scanForBannedLanguage } from "../knowledge/tone-safety-rules.ts";
import { scanUserInputSafety } from "../knowledge/synthesis-rules.ts";
import { selectKnowledge } from "../knowledge/selectKnowledge.ts";
import { ALL_CARDS } from "../knowledge/index.ts";

Deno.test("no card's user-facing guidance contains banned language", () => {
  // Scan the POSITIVE fields the model paraphrases. `avoidSaying` and
  // `safetyNotes` intentionally quote anti-patterns, so they are excluded.
  const offenders: string[] = [];
  for (const c of ALL_CARDS) {
    // "tone" cards intentionally quote banned phrases to teach the model what to
    // avoid; they are meta-instructions, not paraphrased user-facing content.
    if (c.system === "tone") continue;
    const text = [c.plainMeaning, ...c.strengths, ...c.growthEdges, ...c.confidenceNotes].join(" ");
    const hits = scanForBannedLanguage(text);
    if (hits.length) offenders.push(`${c.id}: ${hits.map((h) => h.match).join(", ")}`);
  }
  assertEquals(offenders, []);
});

Deno.test("Human Design-inspired cards stay non-proprietary and non-deterministic", () => {
  const hd = ALL_CARDS.filter((c) => c.system === "human_design_inspired");
  assert(hd.length > 0);
  // Proprietary HD specifics must not appear in ANY field (gates, channels,
  // incarnation cross). Profile notation like "1/3" is fine and not matched here.
  const proprietary = [/incarnation cross/i, /\bgate\s+\d+/i, /\bchannel\s+\d+\s*[-–]\s*\d+/i];
  // Deterministic identity claims must not appear in user-facing fields; cards
  // use "Generator-style energy", never "you are a Generator".
  const deterministic = /\byou are an? (generator|manifestor|projector|reflector|manifesting generator)\b/i;

  const offenders: string[] = [];
  for (const c of hd) {
    const allText = [c.title, c.plainMeaning, ...c.strengths, ...c.growthEdges, ...c.avoidSaying, ...c.confidenceNotes, ...c.safetyNotes].join(" ");
    if (proprietary.some((re) => re.test(allText))) offenders.push(`${c.id}: proprietary HD term`);
    const positive = [c.plainMeaning, ...c.strengths, ...c.growthEdges, ...c.confidenceNotes].join(" ");
    if (deterministic.test(positive)) offenders.push(`${c.id}: deterministic type claim`);
    // Every HD card must carry the reflective-lens caveat.
    if (!c.confidenceNotes.some((n) => /inspired|lens|not a (rule|verdict|diagnosis|fixed)/i.test(n))) {
      offenders.push(`${c.id}: missing reflective-lens caveat`);
    }
  }
  assertEquals(offenders, []);
});

Deno.test("banned linter catches commands and certainty", () => {
  assert(scanForBannedLanguage("You must leave today.").length > 0);
  assert(scanForBannedLanguage("This will definitely happen to you.").length > 0);
  assert(scanForBannedLanguage("Today is a gentle day to reflect.").length === 0);
});

Deno.test("banned linter catches fatalistic relationship language", () => {
  assert(scanForBannedLanguage("They're toxic, leave them immediately.").length > 0);
  assert(scanForBannedLanguage("Your relationship is doomed.").length > 0);
});

Deno.test("banned linter blocks medical/legal/financial directives", () => {
  assert(scanForBannedLanguage("You have depression.").length > 0);
  assert(scanForBannedLanguage("You should sell your stocks.").length > 0);
  assert(scanForBannedLanguage("You should sue them.").length > 0);
});

Deno.test("user-input safety detects self-harm crisis", () => {
  const cats = scanUserInputSafety("I don't want to be alive anymore");
  assert(cats.includes("self_harm_crisis"));
});

Deno.test("crisis input suppresses directive actions and routes to grounding", () => {
  const sel = selectKnowledge({ userMessage: "I want to die", numerology: { lifePath: 1 } });
  assertEquals(sel.suggestedActionTypes, ["nervous_system_reset"]);
  assert(sel.safetyWarnings.some((w) => w.category === "self_harm_crisis"));
});

Deno.test("medical/financial/third-party questions raise warnings", () => {
  assert(selectKnowledge({ userMessage: "Should I stop my medication?" }).safetyWarnings.some((w) => w.category === "medical"));
  assert(selectKnowledge({ userMessage: "Should I invest my savings?" }).safetyWarnings.some((w) => w.category === "financial"));
  assert(selectKnowledge({ userMessage: "Does he secretly love me?" }).safetyWarnings.some((w) => w.category === "third_party_speculation"));
});
