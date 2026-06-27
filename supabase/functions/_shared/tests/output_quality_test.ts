/**
 * Output QA — deterministic. Runs every scenario in fixtures/output-qa-scenarios
 * through the SELECTION + PROMPT layer and asserts the quality bar Soluna promises,
 * WITHOUT needing live LLM calls (those are covered by scripts/run-output-qa.ts):
 *   - no banned/fatalistic language in any selected card's user-facing fields
 *   - no fabricated placements when a chart is unavailable
 *   - safety-adjacent input routes to a safety directive (and crisis → grounding)
 *   - confidence matches the evidence
 *   - a practical next-step seed and a reflection prompt are always available
 *   - output is not repetitive across scenarios
 * Run: deno test --allow-env --allow-read supabase/functions/_shared/tests
 */

import { assert, assertEquals } from "../test_util.ts";
import { selectKnowledge } from "../knowledge/selectKnowledge.ts";
import { formatKnowledgeForPrompt } from "../knowledge/formatKnowledgeForPrompt.ts";
import { scanForBannedLanguage } from "../knowledge/tone-safety-rules.ts";
import { QA_SCENARIOS } from "./fixtures/output-qa-scenarios.ts";

Deno.test("QA fixture set covers 50+ scenarios across every required category", () => {
  assert(QA_SCENARIOS.length >= 50, `only ${QA_SCENARIOS.length} scenarios`);
  const kinds = new Set(QA_SCENARIOS.map((s) => s.kind));
  for (const required of [
    "daily", "ask_relationship", "ask_work", "ask_school", "ask_decision",
    "ask_self_worth", "ask_grief", "ask_stress", "compatibility", "tarot",
    "crisis", "missing_time", "provider_failure", "partial_data", "out_of_scope",
    "bazi", "bazi_compatibility",
  ]) {
    assert(kinds.has(required as typeof QA_SCENARIOS[number]["kind"]), `missing category ${required}`);
  }
});

Deno.test("every scenario meets its quality expectations", () => {
  const failures: string[] = [];

  for (const s of QA_SCENARIOS) {
    const sel = selectKnowledge(s.context);
    const blocks = formatKnowledgeForPrompt(sel);
    const e = s.expect;

    const fail = (msg: string) => failures.push(`${s.id}: ${msg}`);

    // 1. No banned language in selected cards' user-facing fields (tone cards
    //    intentionally quote anti-patterns, and avoidSaying is excluded).
    for (const c of sel.selectedKnowledgeCards) {
      if (c.system === "tone") continue;
      const text = [c.plainMeaning, ...c.strengths, ...c.growthEdges, ...c.confidenceNotes].join(" ");
      const hits = scanForBannedLanguage(text);
      if (hits.length) fail(`banned language in ${c.id}: ${hits.map((h) => h.match).join(", ")}`);
    }

    // 2. No fabricated placements when a chart is unavailable.
    if (e.noWesternCards && sel.selectedKnowledgeCards.some((c) => c.system === "western_astrology")) {
      fail("fabricated western cards with no chart");
    }

    // 3. Safety routing.
    if (e.requiresSafety && !sel.safetyWarnings.some((w) => w.category === e.requiresSafety)) {
      fail(`missing safety flag ${e.requiresSafety}`);
    }
    if (e.crisisGroundingOnly) {
      assertOrPush(sel.suggestedActionTypes.length === 1 && sel.suggestedActionTypes[0] === "nervous_system_reset", fail, "crisis did not route to grounding only");
      if (sel.safetyWarnings.length) {
        assertOrPush(blocks.safetyDirective.includes("INTERNAL SAFETY DIRECTIVE"), fail, "safety directive not marked internal");
      }
    }

    // 4. Confidence matches evidence.
    if (e.confidenceIn && !e.confidenceIn.includes(sel.confidenceLabel)) {
      fail(`confidence ${sel.confidenceLabel} not in [${e.confidenceIn.join(", ")}]`);
    }

    // 5. A practical next-step seed is available.
    if (e.expectsAction && sel.suggestedActionTypes.length < 1) fail("no suggested action");

    // 6. Minimum resolved cards.
    if (e.minCards && sel.selectedKnowledgeCards.length < e.minCards) {
      fail(`only ${sel.selectedKnowledgeCards.length} cards, expected >= ${e.minCards}`);
    }

    // 7. Every non-crisis scenario gets a response guide with a reflection prompt
    //    and the no-commands rule (the "reflection + practical step" shape).
    assertOrPush(/reflection prompt/i.test(blocks.responseGuide), fail, "response guide missing reflection prompt");
    assertOrPush(/never say 'you must'/i.test(blocks.responseGuide), fail, "response guide missing no-commands rule");
  }

  assertEquals(failures, []);
});

Deno.test("BaZi cards appear if and only if a real provider chart is present", () => {
  const offenders: string[] = [];
  for (const s of QA_SCENARIOS) {
    const sel = selectKnowledge(s.context);
    const hasBaziCards = sel.selectedKnowledgeCards.some((c) => c.system === "bazi");
    const realBazi = s.context.bazi?.present === true;
    if (hasBaziCards && !realBazi) offenders.push(`${s.id}: BaZi cards without a real chart (fabrication)`);
    if (realBazi && !hasBaziCards) offenders.push(`${s.id}: real BaZi chart but no BaZi cards selected`);
  }
  assertEquals(offenders, []);
});

Deno.test("selection is not repetitive across scenarios", () => {
  const confidences = new Set<string>();
  const actionSets = new Set<string>();
  const firstCards = new Set<string>();
  for (const s of QA_SCENARIOS) {
    const sel = selectKnowledge(s.context);
    confidences.add(sel.confidenceLabel);
    actionSets.add([...sel.suggestedActionTypes].sort().join(","));
    if (sel.selectedKnowledgeCards[0]) firstCards.add(sel.selectedKnowledgeCards[0].id);
  }
  assert(confidences.size >= 3, `only ${confidences.size} distinct confidence labels`);
  assert(actionSets.size >= 8, `only ${actionSets.size} distinct action sets — too repetitive`);
  assert(firstCards.size >= 15, `only ${firstCards.size} distinct lead cards — too repetitive`);
});

function assertOrPush(cond: boolean, fail: (m: string) => void, msg: string) {
  if (!cond) fail(msg);
}
