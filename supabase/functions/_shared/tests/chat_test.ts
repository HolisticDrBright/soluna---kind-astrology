// Proves Ask Soluna never sends a duplicated (or dropped) current message to
// the LLM, however the history was loaded.

import { assert, assertEquals } from "../test_util.ts";
import { buildChatMessages, type RawMessage } from "../chat.ts";

Deno.test("current message appears exactly once when history includes it (by id)", () => {
  const history: RawMessage[] = [
    { id: "m1", role: "user", content: "hi" },
    { id: "m2", role: "assistant", content: "hello" },
    { id: "m3", role: "user", content: "what's my moon sign?" }, // the just-inserted row
  ];
  const out = buildChatMessages(history, "what's my moon sign?", "m3");
  const occurrences = out.filter((m) => m.content === "what's my moon sign?").length;
  assertEquals(occurrences, 1);
  assertEquals(out[out.length - 1], { role: "user", content: "what's my moon sign?" });
});

Deno.test("dedupes by content even when the id wasn't captured", () => {
  const history: RawMessage[] = [
    { id: "m1", role: "assistant", content: "hello" },
    { id: "m2", role: "user", content: "tell me about Saturn" },
  ];
  const out = buildChatMessages(history, "tell me about Saturn", undefined);
  assertEquals(out.filter((m) => m.content === "tell me about Saturn").length, 1);
});

Deno.test("current message is appended when history doesn't contain it (long convo case)", () => {
  // Simulates loading recent history that, after excluding the current row, has
  // older turns — the current message must still be the final turn.
  const history: RawMessage[] = [
    { id: "a", role: "user", content: "older q" },
    { id: "b", role: "assistant", content: "older a" },
  ];
  const out = buildChatMessages(history, "brand new question", "current-not-in-history");
  assertEquals(out.length, 3);
  assertEquals(out[out.length - 1], { role: "user", content: "brand new question" });
});

Deno.test("empty history yields just the current message", () => {
  const out = buildChatMessages([], "first message ever", "x1");
  assertEquals(out, [{ role: "user", content: "first message ever" }]);
});

Deno.test("system rows are filtered out; order preserved", () => {
  const history: RawMessage[] = [
    { id: "s", role: "system", content: "SYSTEM PROMPT" },
    { id: "u1", role: "user", content: "q1" },
    { id: "a1", role: "assistant", content: "a1" },
  ];
  const out = buildChatMessages(history, "q2", "current");
  assertEquals(out, [
    { role: "user", content: "q1" },
    { role: "assistant", content: "a1" },
    { role: "user", content: "q2" },
  ]);
});

Deno.test("a genuine earlier repeat of the same text is NOT stripped (only trailing)", () => {
  // If the user asked the same thing earlier in the conversation, that earlier
  // turn (followed by an assistant reply) must be preserved as context.
  const history: RawMessage[] = [
    { id: "u1", role: "user", content: "am I a Generator?" },
    { id: "a1", role: "assistant", content: "Yes — a Generator." },
    { id: "u2", role: "user", content: "am I a Generator?" }, // current, just inserted
  ];
  const out = buildChatMessages(history, "am I a Generator?", "u2");
  // earlier user turn + assistant turn + one current turn = 3
  assertEquals(out.length, 3);
  assertEquals(out[0], { role: "user", content: "am I a Generator?" });
  assertEquals(out[1], { role: "assistant", content: "Yes — a Generator." });
  assertEquals(out[2], { role: "user", content: "am I a Generator?" });
});
