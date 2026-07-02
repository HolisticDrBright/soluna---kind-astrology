/**
 * POST /ask — Ask Soluna chat. Creates or continues conversation.
 * GET /ask/history — conversation history.
 * Responses are personalized to the user's full blueprint.
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { validateAskMessage } from "../_shared/schemas.ts";
import { generateChatResponse } from "../_shared/synthesis/index.ts";
import { hasPremiumAccess } from "../_shared/supabase.ts";
import { bumpDailyUsage } from "../_shared/quota.ts";

// Per-user daily message caps. Every message is a real LLM call, so an
// unmetered endpoint is an open tab; premium gets generous headroom, free gets
// a warm daily allowance (also the upgrade nudge the spec called for).
const FREE_MESSAGES_PER_DAY = 15;
const PREMIUM_MESSAGES_PER_DAY = 200;

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);
    const url = new URL(req.url);
    const isHistory = url.pathname.endsWith("/history");

    // GET /ask/history
    if (req.method === "GET" && isHistory) {
      const { data: conversations } = await supabase.from("ask_conversations")
        .select("id, created_at")
        .eq("user_id", user.userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!conversations?.length) {
        return jsonResponse({ conversations: [], messages: [] });
      }

      const convId = url.searchParams.get("conversation_id") || conversations[0].id;

      const { data: messages } = await supabase.from("ask_messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      return jsonResponse({
        conversations,
        messages: messages ?? [],
        currentConversationId: convId,
      });
    }

    // POST /ask
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    const body = await req.json();
    const validation = validateAskMessage(body);
    if (!validation.success) {
      return errorResponse(validation.error ?? "Invalid input", 400);
    }

    const { conversation_id, message } = validation.data!;

    // Daily cap BEFORE any LLM work. Fail-open when the counter is unavailable.
    const used = await bumpDailyUsage(user.userId, "ask_message");
    if (used !== null) {
      const premium = await hasPremiumAccess(user.userId);
      const cap = premium ? PREMIUM_MESSAGES_PER_DAY : FREE_MESSAGES_PER_DAY;
      if (used > cap) {
        return errorResponse(
          premium
            ? "You've reached today's conversation limit. Soluna will be ready to continue tomorrow."
            : "You've used today's free questions. Upgrade to Premium for unlimited conversations, or come back tomorrow — Soluna will be here.",
          429,
        );
      }
    }

    // Get or create conversation
    let convId = conversation_id;
    if (!convId) {
      const { data: newConv, error: convErr } = await supabase.from("ask_conversations")
        .insert({ user_id: user.userId })
        .select("id")
        .single();

      if (convErr || !newConv) {
        return errorResponse("Failed to create conversation", 500);
      }
      convId = newConv.id;
    }

    // Verify conversation belongs to user
    const { data: conv } = await supabase.from("ask_conversations")
      .select("id")
      .eq("id", convId)
      .eq("user_id", user.userId)
      .single();

    if (!conv) {
      return errorResponse("Conversation not found", 404);
    }

    // Save user message (keep its id so history can exclude it — the message is
    // passed to the model separately and must not appear twice).
    const { data: savedMsg, error: msgErr } = await supabase.from("ask_messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    }).select("id").single();

    if (msgErr) {
      console.error("Failed to save user message:", msgErr.message);
    }

    // Conversation context = the 20 MOST RECENT messages (chronological order),
    // not the oldest 20 — otherwise Soluna remembers how a long conversation
    // started but forgets everything the user just said.
    let historyQuery = supabase.from("ask_messages")
      .select("id, role, content, systems_referenced")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (savedMsg?.id) historyQuery = historyQuery.neq("id", savedMsg.id);
    const { data: recent } = await historyQuery;
    const history = (recent ?? []).slice().reverse();

    // Generate response
    const response = await generateChatResponse(
      user.userId,
      message,
      history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        systemsReferenced: m.systems_referenced ?? [],
      })),
    );

    // Save assistant response
    const { error: saveErr } = await supabase.from("ask_messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: response.content,
      systems_referenced: response.systemsReferenced,
    });

    if (saveErr) {
      console.error("Failed to save assistant message:", saveErr.message);
    }

    return jsonResponse({
      conversation_id: convId,
      message: {
        role: "assistant",
        content: response.content,
        systems_referenced: response.systemsReferenced,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse("Unauthorized", 401);
    }
    console.error("Ask error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
