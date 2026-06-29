/**
 * Resonance personalization: payload validation, deterministic profile-update
 * rules, the "no chart facts ever change" invariant, prompt-block gating, and
 * the safety guardrails baked into the memory block.
 */

import { assert, assertEquals } from "../test_util.ts";
import { validateResonanceFeedback } from "../schemas.ts";
import {
  recomputePersonalization,
  personalizationMemoryBlock,
  systemFitRanking,
  type DerivedProfile,
  type PersonalizationProfile,
  type Resonance,
  type ResonanceRow,
} from "../personalization.ts";

function mk(resonance: Resonance, opts: Partial<ResonanceRow> = {}): ResonanceRow {
  return {
    resonance,
    reason_tags: opts.reason_tags ?? [],
    reframe_requested: opts.reframe_requested ?? null,
    systems_referenced: opts.systems_referenced ?? [],
    free_text: opts.free_text ?? null,
  };
}

function profile(d: DerivedProfile): PersonalizationProfile {
  return { user_id: "u1", updated_at: "2026-06-28T00:00:00Z", ...d };
}

Deno.test("systemFitRanking ranks lenses by resonance rate, best-fit first", () => {
  const rows: ResonanceRow[] = [
    mk("yes", { systems_referenced: ["astrology"] }),
    mk("yes", { systems_referenced: ["astrology"] }),
    mk("yes", { systems_referenced: ["astrology"] }),
    mk("no", { systems_referenced: ["numerology"] }),
    mk("partly", { systems_referenced: ["numerology"] }),
    mk("yes", { systems_referenced: ["bazi"] }),
  ];
  const fit = systemFitRanking(rows);
  // Only systems with feedback appear.
  assertEquals(fit.map((f) => f.system), ["astrology", "bazi", "numerology"]);
  // astrology: 3/3 = 1.0, enough signal (>=3); numerology: 0/2 = 0.0.
  assertEquals(fit[0].system, "astrology");
  assertEquals(fit[0].score, 1);
  assertEquals(fit[0].enoughSignal, true);
  const numerology = fit.find((f) => f.system === "numerology")!;
  assertEquals(numerology.score, 0);
  assertEquals(numerology.enoughSignal, false); // only 2 appearances
  // Unknown systems are ignored entirely.
  assertEquals(systemFitRanking([mk("yes", { systems_referenced: ["tea_leaves"] })]).length, 0);
});

// ─── Validation ──────────────────────────────────────────────────────────────

Deno.test("valid resonance payload passes validation", () => {
  const r = validateResonanceFeedback({
    sourceType: "today",
    sourceId: "2026-06-28",
    resonance: "partly",
    reasonTags: ["too_vague", "not_practical_enough"],
    freeText: "  more concrete steps please  ",
    reframeRequested: "make_it_more_practical",
    systemsReferenced: ["astrology", "numerology"],
  });
  assert(r.success);
  assertEquals(r.data!.resonance, "partly");
  assertEquals(r.data!.reasonTags, ["too_vague", "not_practical_enough"]);
  assertEquals(r.data!.freeText, "more concrete steps please"); // trimmed
  assertEquals(r.data!.reframeRequested, "make_it_more_practical");
});

Deno.test("invalid source_type and resonance are rejected", () => {
  assert(!validateResonanceFeedback({ sourceType: "horoscope", resonance: "yes" }).success);
  assert(!validateResonanceFeedback({ sourceType: "today", resonance: "maybe" }).success);
  assert(!validateResonanceFeedback({ resonance: "yes" }).success); // missing source
  assert(!validateResonanceFeedback(null).success);
});

Deno.test("unknown reframe is rejected; unknown reason tags / systems are dropped", () => {
  assert(!validateResonanceFeedback({ sourceType: "ask", resonance: "no", reframeRequested: "make_it_weird" }).success);

  const r = validateResonanceFeedback({
    sourceType: "ask",
    resonance: "no",
    reasonTags: ["too_vague", "totally_made_up"],
    systemsReferenced: ["astrology", "tea_leaves"],
  });
  assert(r.success);
  assertEquals(r.data!.reasonTags, ["too_vague"]);
  assertEquals(r.data!.systemsReferenced, ["astrology"]);
});

// ─── Deterministic update rules ──────────────────────────────────────────────

Deno.test("repeated 'too_vague' raises detail level and adds avoid-vague pattern", () => {
  const p = recomputePersonalization([
    mk("no", { reason_tags: ["too_vague"] }),
    mk("partly", { reason_tags: ["too_vague"] }),
    mk("no", { reason_tags: ["too_vague"] }),
  ]);
  assertEquals(p.detail_level, "deep");
  assert(p.avoid_patterns.some((x) => x.includes("vague")));
});

Deno.test("repeated 'too_mystical' lowers spirituality toward grounded", () => {
  const p = recomputePersonalization([
    mk("no", { reason_tags: ["too_mystical"] }),
    mk("no", { reason_tags: ["too_mystical"] }),
    mk("partly", { reason_tags: ["too_mystical"] }),
  ]);
  assertEquals(p.spirituality_level, "grounded");
  assert(p.avoid_patterns.some((x) => x.includes("mystical")));
});

Deno.test("repeated 'wanted_more_depth' increases detail level", () => {
  const p = recomputePersonalization([
    mk("partly", { reason_tags: ["wanted_more_depth"] }),
    mk("partly", { reason_tags: ["wanted_more_depth"] }),
    mk("no", { reason_tags: ["wanted_more_depth"] }),
  ]);
  assertEquals(p.detail_level, "deep");
});

Deno.test("repeated 'tone_didnt_fit' flags tone for adjustment", () => {
  const p = recomputePersonalization([
    mk("no", { reason_tags: ["tone_didnt_fit"] }),
    mk("partly", { reason_tags: ["tone_didnt_fit"] }),
    mk("no", { reason_tags: ["tone_didnt_fit"] }),
  ]);
  assertEquals(p.preferred_tone, "warm");
  assert(p.avoid_patterns.some((x) => x.includes("tone")));
});

Deno.test("repeatedly high resonance for a system marks it resonant; low marks it less-resonant", () => {
  const high = recomputePersonalization([
    mk("yes", { systems_referenced: ["numerology"] }),
    mk("yes", { systems_referenced: ["numerology"] }),
    mk("yes", { systems_referenced: ["numerology"] }),
  ]);
  assert(high.resonant_systems.includes("numerology"));
  assert(!high.less_resonant_systems.includes("numerology"));

  const low = recomputePersonalization([
    mk("no", { systems_referenced: ["human_design"] }),
    mk("partly", { systems_referenced: ["human_design"] }),
    mk("no", { systems_referenced: ["human_design"] }),
  ]);
  assert(low.less_resonant_systems.includes("human_design"));
  assert(!low.resonant_systems.includes("human_design"));
});

Deno.test("reframe requests steer focus, action style, and grounding", () => {
  const work = recomputePersonalization([
    mk("partly", { reframe_requested: "focus_on_work" }),
    mk("partly", { reframe_requested: "focus_on_work" }),
  ]);
  assert(work.preferred_focus_areas.includes("work"));

  const oneStep = recomputePersonalization([
    mk("no", { reframe_requested: "give_me_one_next_step" }),
    mk("no", { reframe_requested: "give_me_one_next_step" }),
    mk("partly", { reframe_requested: "give_me_one_next_step" }),
  ]);
  assertEquals(oneStep.action_style, "one_step");

  const grounded = recomputePersonalization([
    mk("no", { reframe_requested: "make_it_less_mystical" }),
    mk("no", { reframe_requested: "make_it_less_mystical" }),
    mk("no", { reframe_requested: "make_it_less_mystical" }),
  ]);
  assertEquals(grounded.spirituality_level, "grounded");
});

Deno.test("changes are gradual — a single tap never flips a standing preference", () => {
  const p = recomputePersonalization([mk("no", { reason_tags: ["too_vague", "too_mystical"] })]);
  assertEquals(p.detail_level, null);
  assertEquals(p.spirituality_level, null);
  assertEquals(p.avoid_patterns, []);
  assertEquals(p.feedback_count, 1);
});

// ─── No chart facts ever change ──────────────────────────────────────────────

Deno.test("derived profile only ever contains delivery preferences (never chart facts)", () => {
  const p = recomputePersonalization([
    mk("no", { reason_tags: ["too_vague"], systems_referenced: ["astrology"] }),
    mk("no", { reason_tags: ["too_vague"], systems_referenced: ["astrology"] }),
    mk("no", { reason_tags: ["too_vague"], systems_referenced: ["astrology"] }),
  ]);
  const allowed = new Set([
    "preferred_tone", "detail_level", "spirituality_level", "action_style",
    "preferred_focus_areas", "resonant_systems", "less_resonant_systems",
    "avoid_patterns", "helpful_patterns", "summary", "feedback_count",
  ]);
  for (const key of Object.keys(p)) assert(allowed.has(key), `unexpected field "${key}" in derived profile`);
  // Nothing that looks like a placement / number / pillar / transit ever appears.
  const blob = JSON.stringify(p).toLowerCase();
  for (const banned of ["sun", "moon", "rising", "lifepath", "life_path", "pillar", "transit", "placement", "house"]) {
    assert(!blob.includes(banned), `derived profile must not reference chart data ("${banned}")`);
  }
});

// ─── Prompt-block gating + safety ────────────────────────────────────────────

Deno.test("personalization block is included ONLY when a profile with feedback exists", () => {
  assertEquals(personalizationMemoryBlock(null), "");
  const empty = recomputePersonalization([]);
  assertEquals(empty.feedback_count, 0);
  assertEquals(personalizationMemoryBlock(profile(empty)), ""); // no feedback → no block

  const real = recomputePersonalization([
    mk("no", { reason_tags: ["too_vague"] }),
    mk("no", { reason_tags: ["too_vague"] }),
    mk("no", { reason_tags: ["too_vague"] }),
  ]);
  const block = personalizationMemoryBlock(profile(real));
  assert(block.length > 0);
  assert(block.toLowerCase().includes("personalization memory"));
});

Deno.test("memory block preserves safety guardrails and only tunes delivery", () => {
  const real = recomputePersonalization([
    mk("no", { reason_tags: ["too_mystical", "not_practical_enough"] }),
    mk("no", { reason_tags: ["too_mystical", "not_practical_enough"] }),
    mk("no", { reason_tags: ["too_mystical", "not_practical_enough"] }),
  ]);
  const block = personalizationMemoryBlock(profile(real)).toLowerCase();
  // Reflective-lens + never-fabricate language is always present.
  assert(block.includes("reflective lenses"));
  assert(block.includes("never change") || block.includes("do not invent certainty"));
  // Fate is always NEGATED ("not fixed fate"), never asserted as a directive.
  assert(block.includes("not fixed fate"));
  // It must never turn feedback into medical/legal/financial/certainty directives.
  for (const banned of ["medical", "diagnos", "legal", "financial", "guarantee", "will definitely"]) {
    assert(!block.includes(banned), `memory block must not contain "${banned}"`);
  }
});
