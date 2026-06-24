import { assert, assertEquals } from "../../test_util.ts";
import { cardOfDay, deckSize, drawSpread, SPREADS } from "../tarot.ts";
import { FULL_DECK } from "../tarot-deck.ts";

Deno.test("deck has exactly 78 unique cards", () => {
  assertEquals(deckSize(), 78);
  const names = new Set(FULL_DECK.map((c) => c.name));
  assertEquals(names.size, 78);
  assertEquals(FULL_DECK.filter((c) => c.arcana === "major").length, 22);
  assertEquals(FULL_DECK.filter((c) => c.arcana === "minor").length, 56);
});

Deno.test("card of the day is deterministic per user+date", async () => {
  const a = await cardOfDay("user-1", "2026-06-24");
  const b = await cardOfDay("user-1", "2026-06-24");
  assertEquals(a.name, b.name);
  // Different day usually differs (not guaranteed, but check it varies across a week).
  const week = new Set<string>();
  for (const d of ["24", "25", "26", "27", "28", "29", "30"]) {
    week.add((await cardOfDay("user-1", `2026-06-${d}`)).name);
  }
  assert(week.size > 1, "card of day should vary across days");
});

Deno.test("three-card spread returns 3 distinct positioned cards", async () => {
  const draw = await drawSpread("three-card", { userId: "u", question: "career?", deterministic: true });
  assertEquals(draw.cards.length, 3);
  assertEquals(draw.cards.map((c) => c.positionMeaning), SPREADS["three-card"].positions);
  const names = new Set(draw.cards.map((c) => c.name));
  assertEquals(names.size, 3);
});

Deno.test("deterministic spread repeats; random spread varies", async () => {
  const d1 = await drawSpread("three-card", { userId: "u", question: "x", deterministic: true });
  const d2 = await drawSpread("three-card", { userId: "u", question: "x", deterministic: true });
  assertEquals(d1.cards.map((c) => c.name), d2.cards.map((c) => c.name));

  const r1 = await drawSpread("three-card", { userId: "u" });
  const r2 = await drawSpread("three-card", { userId: "u" });
  // Extremely unlikely to be identical across all three.
  assert(JSON.stringify(r1.cards.map((c) => c.name)) !== JSON.stringify(r2.cards.map((c) => c.name)));
});

Deno.test("celtic cross returns 10 cards", async () => {
  const draw = await drawSpread("celtic-cross", { userId: "u" });
  assertEquals(draw.cards.length, 10);
});
