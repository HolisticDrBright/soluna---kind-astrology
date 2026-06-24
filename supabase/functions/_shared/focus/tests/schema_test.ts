// Focus input validation + the privacy-first allowed-context default.

import { assert, assertEquals } from "../../test_util.ts";
import { focusCheckinInput, focusCreateInput } from "../../schemas.ts";
import { resolveAllowedContext } from "../types.ts";

Deno.test("focusCreateInput requires problem text", () => {
  assert(!focusCreateInput.safeParse({ category: "work", problemText: "" }).success);
  assert(!focusCreateInput.safeParse({ category: "work" }).success);
});

Deno.test("focusCreateInput caps problem text near 3000 chars", () => {
  assert(focusCreateInput.safeParse({ category: "work", problemText: "x".repeat(3000) }).success);
  assert(!focusCreateInput.safeParse({ category: "work", problemText: "x".repeat(3001) }).success);
});

Deno.test("focusCreateInput enforces category + supportMode enums", () => {
  assert(!focusCreateInput.safeParse({ category: "vibes", problemText: "hi" }).success);
  assert(!focusCreateInput.safeParse({ category: "work", problemText: "hi", supportMode: "hype" }).success);
  const ok = focusCreateInput.safeParse({ category: "big_decision", problemText: "Should I move?" });
  assert(ok.success);
  if (ok.success) {
    assertEquals(ok.data.supportMode, "gentle"); // default
    assertEquals(ok.data.allowedContext, {}); // default empty (opt-in)
  }
});

Deno.test("selected ids must be uuids when provided", () => {
  assert(!focusCreateInput.safeParse({ category: "work", problemText: "hi", selectedBondId: "nope" }).success);
});

Deno.test("checkin status is enum-validated", () => {
  assert(focusCheckinInput.safeParse({ checkinStatus: "better" }).success);
  assert(!focusCheckinInput.safeParse({ checkinStatus: "meh" }).success);
});

Deno.test("allowed context defaults every source to FALSE (privacy-first)", () => {
  const none = resolveAllowedContext({});
  assertEquals(none, {
    recentJournalThemes: false, savedReadings: false, currentMood: false,
    memoryThemes: false, recentAskHistory: false, selectedBondDynamics: false,
  });
  const some = resolveAllowedContext({ memoryThemes: true, currentMood: true });
  assertEquals(some.memoryThemes, true);
  assertEquals(some.currentMood, true);
  assertEquals(some.recentAskHistory, false);
});
