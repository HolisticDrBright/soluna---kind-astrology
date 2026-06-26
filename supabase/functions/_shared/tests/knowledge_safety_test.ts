/**
 * Safety + tone guardrails: banned-language linter, user-input safety routing,
 * and the rule that relationship advice cannot be fatalistic/manipulative.
 */

import { assert, assertEquals } from "../test_util.ts";
import { scanForBannedLanguage } from "../knowledge/tone-safety-rules.ts";
import { scanUserInputSafety } from "../knowledge/synthesis-rules.ts";
import { selectKnowledge } from "../knowledge/selectKnowledge.ts";

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
