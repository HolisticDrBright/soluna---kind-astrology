// End-to-end pipeline test (engines -> context -> agreement -> reading) without
// HTTP/DB. Exercises the full "blueprint -> today" path deterministically; the
// reading uses the safe fallback when no LLM key is set, so this runs offline.
// (The full HTTP+DB e2e is documented in README-backend.md for a running stack.)
import { assert, assertEquals } from "../test_util.ts";
import { computeBlueprint } from "../engines/blueprint.ts";
import { buildContext } from "../synthesis/context.ts";
import { detectAgreement } from "../synthesis/agreement.ts";
import { generateDailyReading } from "../synthesis/synthesis.ts";

Deno.test("blueprint -> today pipeline produces a complete reading", async () => {
  const { blueprint, placements } = await computeBlueprint({
    date: "1995-06-22",
    time: "14:35",
    lat: 45.5152,
    lng: -122.6784,
    fullName: "Maya Elizabeth Chen",
  });

  // Blueprint summary is populated across all systems.
  assertEquals(blueprint.summary.sunSign, "Cancer");
  assert(blueprint.summary.lifePath > 0);
  assertEquals(blueprint.summary.element, "Wood");
  assertEquals(blueprint.summary.animal, "Pig");
  assert(blueprint.summary.hdType !== null); // time known
  assert(placements.length > 10);

  // Context for a date.
  const ctx = await buildContext("mock-user", "2026-06-24", blueprint, "Maya");
  assertEquals(ctx.personalDay > 0, true);
  assert(ctx.tarot.name.length > 0);
  assert(ctx.transits.moon.phase.length > 0);

  // Agreement is deterministic and non-empty.
  const agreement = detectAgreement(ctx);
  assert(agreement.topTheme.score >= 1);
  assert(agreement.themes.length >= 1);

  // Reading (fallback path offline) is schema-shaped + complete.
  const { reading } = await generateDailyReading(ctx, agreement);
  assert(reading.heroText.length > 20);
  assert(reading.affirmation.length > 0);
  assert(reading.doEmbraceEase.do.length > 0);
  assert(reading.agreement.perSystem.length >= 1);
});

Deno.test("unknown birth time degrades honestly across the pipeline", async () => {
  const { blueprint } = await computeBlueprint({
    date: "1995-06-22",
    time: null,
    lat: 45.5,
    lng: -122.7,
    fullName: "Maya Elizabeth Chen",
  });
  assertEquals(blueprint.summary.rising, null); // no Rising without time
  assertEquals(blueprint.summary.hdType, null); // HD needs time
  assert("needsBirthTime" in blueprint.humanDesign);
  // Sun sign + numerology + Chinese remain correct.
  assertEquals(blueprint.summary.sunSign, "Cancer");
  assertEquals(blueprint.summary.animal, "Pig");
});
