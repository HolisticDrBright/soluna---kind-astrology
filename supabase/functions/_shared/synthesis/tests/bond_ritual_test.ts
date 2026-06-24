// Bond ritual: complete, constructive daily relationship guidance — never
// fatalistic — even offline (deterministic fallback).

import { assert } from "../../test_util.ts";
import { generateBondRitual } from "../synthesis.ts";

Deno.test("bond ritual is complete and constructive (offline fallback)", async () => {
  const a = { name: "Maya", sun: "Cancer", lifePath: 7, chinese: "Wood Pig", hdType: "Generator" };
  const b = { name: "Sam", sun: "Scorpio", lifePath: 3, chinese: "Fire Horse", hdType: "Projector" };
  const { ritual } = await generateBondRitual(a, b, "romance", {
    moonPhase: "Full Moon",
    moonSign: "Capricorn",
  });

  assert(ritual.supportEachOtherToday.length > 0);
  assert(ritual.bestDayForDeepConversation.length > 0);
  assert(ritual.possibleMisread.length > 0);
  assert(ritual.sharedJournalPrompt.length > 0);

  // Never fatalistic about the relationship.
  const all = Object.values(ritual).join(" ").toLowerCase();
  for (const bad of ["breakup", "break up", "doomed", "never work", "leave you", "end the relationship"]) {
    assert(!all.includes(bad), `ritual should not contain "${bad}"`);
  }
});

Deno.test("bond ritual references both names", async () => {
  const a = { name: "Ada", lifePath: 4 };
  const b = { name: "Lin", lifePath: 9 };
  const { ritual } = await generateBondRitual(a, b, "friendship", {
    moonPhase: "New Moon",
    moonSign: "Aries",
  });
  const all = Object.values(ritual).join(" ");
  assert(all.includes("Ada") && all.includes("Lin"));
});
