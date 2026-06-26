/**
 * Prompt construction: the selected knowledge reaches the prompt, safety
 * directives are marked internal, and relationship guidance stays
 * non-fatalistic / repair-oriented.
 */

import { assert } from "../test_util.ts";
import { selectKnowledge } from "../knowledge/selectKnowledge.ts";
import { formatKnowledgeForPrompt } from "../knowledge/formatKnowledgeForPrompt.ts";
import { scanForBannedLanguage } from "../knowledge/tone-safety-rules.ts";

Deno.test("prompt includes selected knowledge cards", () => {
  const sel = selectKnowledge({ numerology: { lifePath: 7, personalDay: 7 }, chinese: { animal: "Rabbit" } });
  const { knowledgeBlock } = formatKnowledgeForPrompt(sel);
  assert(knowledgeBlock.includes("SELECTED KNOWLEDGE"));
  assert(/Life Path 7|Personal Day 7|Rabbit/i.test(knowledgeBlock));
  assert(knowledgeBlock.includes("CONFIDENCE:"));
});

Deno.test("the response guide forbids commands and fixed fate", () => {
  const { responseGuide } = formatKnowledgeForPrompt(selectKnowledge({ numerology: { lifePath: 1 } }));
  assert(/never say 'you must'/i.test(responseGuide));
  assert(/reflection prompt/i.test(responseGuide));
});

Deno.test("safety directive is marked internal (not user-facing)", () => {
  const sel = selectKnowledge({ userMessage: "I want to die" });
  const { safetyDirective } = formatKnowledgeForPrompt(sel);
  assert(safetyDirective.includes("INTERNAL SAFETY DIRECTIVE"));
  assert(/do not reveal/i.test(safetyDirective));
});

Deno.test("relationship focus yields repair-oriented, non-fatalistic guidance", () => {
  const sel = selectKnowledge({
    numerology: { lifePath: 2 },
    focus: { category: "relationship", problemText: "We keep arguing and I want to fix things." },
    connection: { involved: true, lens: "romance" },
  });
  // No banned/fatalistic language in any selected card's guidance fields.
  const blob = sel.selectedKnowledgeCards.map((c) => `${c.plainMeaning} ${c.growthEdges.join(" ")}`).join(" ");
  assert(scanForBannedLanguage(blob).length === 0);
  // A repair or boundary action should be on the table for relationship work.
  assert(
    sel.suggestedActionTypes.includes("relationship_repair") ||
    sel.suggestedActionTypes.includes("boundary_script") ||
    sel.suggestedActionTypes.includes("journal_prompt"),
  );
});
