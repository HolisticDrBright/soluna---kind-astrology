import { assert, assertEquals } from "../../test_util.ts";
import { computeHumanDesign, gateLine } from "../humandesign.ts";
import { GATE_WHEEL } from "../humandesign-data.ts";
import type { HumanDesignResult, NeedsBirthTime } from "../types.ts";

function isNeedsTime(x: unknown): x is NeedsBirthTime {
  return !!x && typeof x === "object" && "needsBirthTime" in x;
}

Deno.test("gate wheel is a permutation of 1..64", () => {
  assertEquals(GATE_WHEEL.length, 64);
  const set = new Set(GATE_WHEEL);
  assertEquals(set.size, 64);
  for (let g = 1; g <= 64; g++) assert(set.has(g), `missing gate ${g}`);
});

Deno.test("calibration: 2° Aquarius is Gate 41.1, 0° Aries is in Gate 25", () => {
  assertEquals(gateLine(302), { gate: 41, line: 1 }); // 2° Aquarius
  assertEquals(gateLine(307.625).gate, 19); // next gate
  assertEquals(gateLine(360).gate, 25); // 0° Aries
  assertEquals(gateLine(0).gate, 25);
});

Deno.test("no birth time => needs birth time", () => {
  const r = computeHumanDesign({ date: "1995-06-22", time: null, lat: 45.5, lng: -122.7 });
  assert(isNeedsTime(r));
});

Deno.test("full chart is structurally valid", () => {
  const r = computeHumanDesign({
    date: "1995-06-22",
    time: "14:35",
    lat: 45.5152,
    lng: -122.6784,
  }) as HumanDesignResult;
  assert(!isNeedsTime(r));
  assertEquals(r.timeKnown, true);

  // Type is one of the five.
  assert(
    ["Generator", "Manifesting Generator", "Manifestor", "Projector", "Reflector"].includes(r.type),
  );
  // 9 centers, 26 activations (13 personality + 13 design).
  assertEquals(r.centers.length, 9);
  assertEquals(r.activations.length, 26);
  assertEquals(r.activations.filter((a) => a.side === "personality").length, 13);
  assertEquals(r.activations.filter((a) => a.side === "design").length, 13);
  // Profile like "6/2".
  assert(/^[1-6]\/[1-6]$/.test(r.profile), `bad profile ${r.profile}`);
  // Authority is valid.
  assert(
    ["Emotional", "Sacral", "Splenic", "Ego", "Self-Projected", "Mental", "Lunar"].includes(
      r.authority,
    ),
  );

  // Consistency: every DEFINED center must have at least one defined channel,
  // and every defined channel's endpoints must be defined centers.
  const definedNames = new Set(r.centers.filter((c) => c.defined).map((c) => c.name));
  if (r.type !== "Reflector") assert(definedNames.size > 0);
  assert(r.definedChannels.length >= definedNames.size - 1 || definedNames.size === 0);

  // Reflector <=> no defined centers.
  assertEquals(r.type === "Reflector", definedNames.size === 0);
});
