// POST /ask            -> Ask Soluna, STREAMS tokens as SSE; persists messages + memory
// GET  /ask/history     -> conversations or a conversation's messages
//
// Wellbeing: a deterministic crisis pre-screen short-circuits BEFORE any LLM call
// and returns a supportive message with resources instead of a "prediction".
import { getUser } from "../_shared/auth.ts";
import { CORS_HEADERS, json, parse, serve, subPath } from "../_shared/http.ts";
import { askInput, type AskInput } from "../_shared/schemas.ts";
import { loadBlueprint, loadEnabledMemoryThemes } from "../_shared/repo.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { logEvent } from "../_shared/log.ts";
import { llm, LLMUnavailableError } from "../_shared/llm.ts";
import { CRISIS_RESPONSE, detectCrisis } from "../_shared/voice.ts";
import { getEntitlement } from "../_shared/entitlements.ts";
import { buildChatSystem, extractMemoryFacts } from "../_shared/synthesis/synthesis.ts";
import { askEvidence } from "../_shared/synthesis/evidence.ts";
import { buildChatMessages } from "../_shared/chat.ts";

// Free users get a generous daily allowance; Premium is unlimited.
const FREE_DAILY_ASK = 5;

const SYSTEM_KEYWORDS: Array<[string, RegExp]> = [
  ["astrology", /\b(astrolog|moon|sun sign|rising|transit|venus|mars|mercury|saturn|jupiter|house)\b/i],
  ["numerology", /\b(numerolog|life path|personal (year|month|day)|expression|soul urge)\b/i],
  ["chinese", /\b(chinese|bazi|pillar|wood|metal|water pig|zodiac animal|rat|ox|tiger|dragon)\b/i],
  ["human_design", /\b(human design|generator|projector|manifestor|reflector|sacral|authority|profile|gate)\b/i],
  ["tarot", /\b(tarot|card|arcana)\b/i],
];

function referencedSystems(text: string): string[] {
  return SYSTEM_KEYWORDS.filter(([, re]) => re.test(text)).map(([s]) => s);
}

function sse(data: string): Uint8Array {
  return new TextEncoder().encode(`data: ${data}\n\n`);
}

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const segs = subPath(req, "ask");

  if (req.method === "GET" && segs[0] === "history") {
    return await history(req, user.id);
  }
  if (req.method !== "POST") {
    return json({ error: "Use POST /ask or GET /ask/history" }, 405);
  }

  const body = parse<AskInput>(askInput, await req.json());
  const svc = serviceClient();

  // Resolve / create the conversation.
  let conversationId = body.conversationId;
  if (conversationId) {
    const { data } = await svc.from("ask_conversations").select("id")
      .eq("id", conversationId).eq("user_id", user.id).maybeSingle();
    if (!data) conversationId = undefined;
  }
  if (!conversationId) {
    const { data } = await svc.from("ask_conversations")
      .insert({ user_id: user.id, title: body.message.slice(0, 60) }).select("id").single();
    conversationId = data!.id;
  }
  const convId: string = conversationId!;

  // Persist the user message immediately (so it survives a dropped stream).
  // Capture its id so we can exclude it from the history we feed back to the LLM.
  const { data: insertedMsg } = await svc.from("ask_messages").insert({
    conversation_id: convId,
    role: "user",
    content: body.message,
  }).select("id").single();
  const currentMsgId: string | undefined = insertedMsg?.id;

  // Crisis short-circuit — no LLM, supportive resources instead.
  if (detectCrisis(body.message)) {
    await logEvent("guardrail_trip", { kind: "crisis_prescreen", conversationId: convId }, user.id);
    await svc.from("ask_messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: CRISIS_RESPONSE,
    });
    return streamOnce(CRISIS_RESPONSE, convId);
  }

  // Entitlement gate: cap free users' daily messages; Premium is unlimited.
  const entitlement = await getEntitlement(user.id);
  if (entitlement.entitlement !== "premium") {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const { data: convRows } = await svc.from("ask_conversations").select("id").eq("user_id", user.id);
    const convIds = (convRows ?? []).map((c) => c.id);
    let todayCount = 0;
    if (convIds.length) {
      const { count } = await svc.from("ask_messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convIds).eq("role", "user").gte("created_at", since.toISOString());
      todayCount = count ?? 0;
    }
    // The current user message is already persisted, so it's counted.
    if (todayCount > FREE_DAILY_ASK) {
      await logEvent("guardrail_trip", { kind: "ask_rate_limit", todayCount }, user.id);
      const gate =
        "We've had a lovely run today 💛 You've reached today's free messages with me. " +
        "Soluna Premium unlocks unlimited Ask — or I'll be right here again tomorrow. " +
        "You can upgrade anytime from your profile, and cancel in one tap.";
      await svc.from("ask_messages").insert({ conversation_id: convId, role: "assistant", content: gate });
      return streamOnce(gate, convId);
    }
  }

  const bp = await loadBlueprint(user.id);
  if (!bp) return json({ error: "Complete onboarding first." }, 409);

  // Memory facts + user-curated (enabled-only) memory themes.
  const [{ data: mem }, themes] = await Promise.all([
    svc.from("ask_memory").select("fact")
      .eq("user_id", user.id).order("salience", { ascending: false }).limit(12),
    loadEnabledMemoryThemes(user.id),
  ]);
  const memory = (mem ?? []).map((m) => m.fact);
  // Load the MOST RECENT 20 messages (desc), then restore chronological order.
  // Loading oldest-first would drop the current turn in long conversations.
  const { data: hist } = await svc.from("ask_messages").select("id, role, content")
    .eq("conversation_id", convId).order("created_at", { ascending: false }).limit(20);
  const historyChrono = (hist ?? []).slice().reverse();
  // buildChatMessages excludes the just-inserted row and appends the current
  // message exactly once — no duplicate, no dropped turn.
  const priorMessages = buildChatMessages(historyChrono, body.message, currentMsgId);

  let system = buildChatSystem(bp, memory, { themes, supportMode: body.supportMode });

  // Optional: let the chat reference an ACTIVE focus the user chose (own row only).
  let activeFocusId: string | null = null;
  if (body.focusId) {
    const { data: f } = await svc.from("focuses")
      .select("id, category, problem_text, status").eq("id", body.focusId).eq("user_id", user.id).maybeSingle();
    if (f && f.status === "active") {
      activeFocusId = f.id;
      const snippet = String(f.problem_text).slice(0, 400);
      system += `\n\nThey're navigating an active Focus (${f.category}): "${snippet}". ` +
        `If this question relates to it, weave in supportive, user-led guidance — never deterministic, never fear-based.`;
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        for await (const delta of llm.stream(priorMessages, { system, temperature: 0.7, maxTokens: 900 })) {
          full += delta;
          controller.enqueue(sse(JSON.stringify({ token: delta })));
        }
      } catch (e) {
        if (e instanceof LLMUnavailableError && full.length === 0) {
          full = "I'm having a little trouble reaching the stars right now — but I'm still here. " +
            "Could you try asking me again in a moment?";
          controller.enqueue(sse(JSON.stringify({ token: full })));
        }
      }
      // Explainable chips for the systems this answer drew on, grounded in the
      // user's real blueprint — emitted as a final structured frame before DONE.
      const evidence = askEvidence(bp.summary, referencedSystems(full));
      if (evidence.length) controller.enqueue(sse(JSON.stringify({ evidence })));
      if (activeFocusId) controller.enqueue(sse(JSON.stringify({ focusId: activeFocusId })));
      controller.enqueue(sse("[DONE]"));
      controller.close();

      // Persist + learn in the background (don't delay stream close).
      const finalize = (async () => {
        await svc.from("ask_messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: full,
          systems_referenced: referencedSystems(full),
        });
        await logEvent("llm_call", { kind: "ask", conversationId: convId }, user.id);
        const facts = await extractMemoryFacts(body.message);
        if (facts.length) {
          await svc.from("ask_memory").insert(facts.map((f) => ({ user_id: user.id, fact: f })));
        }
      })();
      // deno-lint-ignore no-explicit-any
      const rt = (globalThis as any).EdgeRuntime;
      if (rt?.waitUntil) rt.waitUntil(finalize);
      else await finalize;
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "x-conversation-id": convId,
    },
  });
}));

function streamOnce(text: string, conversationId: string): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(sse(JSON.stringify({ token: text })));
      controller.enqueue(sse("[DONE]"));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "x-conversation-id": conversationId,
    },
  });
}

async function history(req: Request, userId: string): Promise<Response> {
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  const svc = serviceClient();
  if (conversationId) {
    const { data: conv } = await svc.from("ask_conversations").select("id")
      .eq("id", conversationId).eq("user_id", userId).maybeSingle();
    if (!conv) return json({ messages: [] });
    const { data } = await svc.from("ask_messages")
      .select("id, role, content, systems_referenced, created_at")
      .eq("conversation_id", conversationId).order("created_at", { ascending: true });
    return json({ conversationId, messages: data ?? [] });
  }
  const { data } = await svc.from("ask_conversations")
    .select("id, title, created_at").eq("user_id", userId).order("created_at", { ascending: false });
  return json({ conversations: data ?? [] });
}
