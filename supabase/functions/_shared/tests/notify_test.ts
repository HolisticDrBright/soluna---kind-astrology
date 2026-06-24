// Notification / widget copy: concrete, actionable, never doom or fortune-cookie.

import { assert } from "../test_util.ts";
import { buildDailyNotify, buildWeeklyNotify } from "../notify.ts";

const DOOM = ["death", "disaster", "doom", "warning", "beware", "danger", "curse", "bad luck"];

function noDoom(payload: object) {
  const all = Object.values(payload).join(" ").toLowerCase();
  for (const bad of DOOM) assert(!all.includes(bad), `copy should not contain "${bad}"`);
}

Deno.test("daily notify is complete + concrete + no doom", () => {
  const shift = {
    reframe: "Today is an invitation to slow down — rest is how you refill.",
    reset: "Take five slow breaths, longer on the exhale.",
    braveTinyAction: "Say a gentle no to one draining thing.",
    journalPrompt: "Where am I running on empty?",
  };
  const n = buildDailyNotify("rest", 3, shift);
  assert(n.widgetTitle && n.widgetBody && n.pushTitle && n.pushBody);
  noDoom(n);
  // With multiple systems aligned, the widget names the agreement.
  assert(n.widgetTitle.toLowerCase().includes("agree"));
});

Deno.test("daily notify with a single signal favors an invitation, not agreement", () => {
  const shift = {
    reframe: "A small beginning is enough today.",
    reset: "Three energizing breaths before you start.",
    braveTinyAction: "Take the first two-minute step.",
    journalPrompt: "What would I start if I trusted it?",
  };
  const n = buildDailyNotify("action", 1, shift);
  assert(n.widgetTitle.toLowerCase().includes("favors"));
  noDoom(n);
});

Deno.test("weekly notify is complete + no doom", () => {
  const n = buildWeeklyNotify(
    ["Rest & Reflection"],
    "Carry forward the rest that helped.",
    "Pick one small supportive practice.",
  );
  assert(n.widgetTitle && n.widgetBody && n.pushTitle && n.pushBody);
  noDoom(n);
});
