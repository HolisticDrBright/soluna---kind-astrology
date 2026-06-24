// Support mode adjusts TONE only — never facts. Verifies the directive is empty
// when unset and otherwise names the mode and the tone-only contract.

import { assert, assertEquals } from "../test_util.ts";
import { SUPPORT_MODES, supportModeDirective } from "../voice.ts";

Deno.test("no mode => no directive (default voice)", () => {
  assertEquals(supportModeDirective(), "");
  assertEquals(supportModeDirective(undefined), "");
  assertEquals(supportModeDirective(null), "");
});

Deno.test("every support mode yields a tone-only directive", () => {
  for (const m of SUPPORT_MODES) {
    const d = supportModeDirective(m);
    assert(d.length > 0, `expected a directive for ${m}`);
    assert(d.includes(m), `directive should name the mode ${m}`);
    const lc = d.toLowerCase();
    assert(lc.includes("tone"), "directive must mention tone");
    // The hard contract: never change the facts.
    assert(lc.includes("never the facts"), "directive must protect the facts");
  }
});

Deno.test("an unknown mode is ignored safely", () => {
  // deno-lint-ignore no-explicit-any
  assertEquals(supportModeDirective("hype" as any), "");
});
