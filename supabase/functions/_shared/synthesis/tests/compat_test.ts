// Proves compatibility is "real": it uses Moon + Human Design when birth times
// are known, and is HONEST (no fake HD/moon comparison) when they are not.
// Runs offline against the deterministic fallback (no LLM key needed).

import { assert, assertEquals } from "../../test_util.ts";
import { generateCompatibility, type CompatPerson } from "../synthesis.ts";

const MAYA: CompatPerson = {
  name: "Maya",
  sunSign: "Cancer",
  moonSign: "Pisces",
  lifePath: 7,
  animal: "Pig",
  element: "Wood",
  hdType: "Projector",
  timeKnown: true,
};
const SAM: CompatPerson = {
  name: "Sam",
  sunSign: "Scorpio",
  moonSign: "Taurus",
  lifePath: 3,
  animal: "Horse",
  element: "Fire",
  hdType: "Generator",
  timeKnown: true,
};

Deno.test("both birth times known: HD + moon ARE part of the read", async () => {
  const { body } = await generateCompatibility(MAYA, SAM, "romance");
  // Structured note fields exist and are grounded.
  assert(body.astrologyNote.includes("Cancer") && body.astrologyNote.includes("Scorpio"));
  assert(body.numerologyNote.includes("7") || body.numerologyNote.includes("3"));
  assert(body.chineseNote.includes("Pig") && body.chineseNote.includes("Horse"));
  // HD note must be the real dynamic (Projector + Generator), not the "add times" prompt.
  assert(!body.humanDesignNote.toLowerCase().includes("add both birth times"));
  // Sources include the HD dimension, and there's no "needs birth time" caveat for HD.
  assert(body.sources.some((s) => s.toLowerCase().includes("human design")));
  assert(body.evidenceBySystem.some((e) => e.system === "humanDesign"));
});

Deno.test("missing birth time: NO fake HD/moon comparison, honest confidence notes", async () => {
  const noTimeA: CompatPerson = { ...MAYA, hdType: null, moonSign: null, timeKnown: false };
  const noTimeB: CompatPerson = { ...SAM, hdType: null, moonSign: null, timeKnown: false };
  const { body } = await generateCompatibility(noTimeA, noTimeB, "friendship");

  // HD note must invite adding birth times rather than fabricate a dynamic.
  assert(body.humanDesignNote.toLowerCase().includes("birth time"));
  // HD is NOT claimed as a source and NOT in the evidence.
  assert(!body.sources.some((s) => s.toLowerCase().includes("human design")));
  assert(!body.evidenceBySystem.some((e) => e.system === "humanDesign"));
  // Confidence notes explicitly call out what's missing.
  assert(body.confidenceNotes.some((n) => n.toLowerCase().includes("moon")));
  assert(body.confidenceNotes.some((n) => n.toLowerCase().includes("human design")));
  // The numeric score still works from the date-exact systems.
  assert(typeof body.score === "number" && body.score > 0);
});

Deno.test("score + structured arrays + confidence are always present", async () => {
  const { body } = await generateCompatibility(MAYA, SAM, "work");
  assert(Array.isArray(body.whereYouFlow) && body.whereYouFlow.length > 0);
  assert(Array.isArray(body.whereYouGrow) && body.whereYouGrow.length > 0);
  assert(Array.isArray(body.howToSupport) && body.howToSupport.length > 0);
  assert(Array.isArray(body.confidenceNotes) && body.confidenceNotes.length > 0);
  assert(Array.isArray(body.sources) && body.sources.length >= 3);
  assert(body.confidence > 0 && body.confidence <= 1);
  assertEquals(body.lens, "work");
});

Deno.test("shared Life Path is described as a mirror, not a generic phrase", async () => {
  const twin: CompatPerson = { ...SAM, lifePath: 7 };
  const { body } = await generateCompatibility(MAYA, twin, "romance");
  assert(body.numerologyNote.toLowerCase().includes("share life path"));
});
