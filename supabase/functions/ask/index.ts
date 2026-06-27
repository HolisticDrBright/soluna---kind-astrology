/**
 * POST /ask — Ask Soluna chat. Creates or continues conversation.
 * GET /ask/history — conversation history.
 * Responses are personalized to the user's full blueprint.
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { validateAskMessage } from "../_shared/schemas.ts";
import { generateChatResponse } from "../_shared/synthesis/index.ts";

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

    // Save user message
    const { error: msgErr } = await supabase.from("ask_messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    });

    if (msgErr) {
      console.error("Failed to save user message:", msgErr.message);
    }

    // Load conversation history for context
    const { data: history } = await supabase.from("ask_messages")
      .select("role, content, systems_referenced")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Generate response
    const response = await generateChatResponse(
      user.userId,
      message,
      (history ?? []).map((m) => ({
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
