/**
 * GET /journal — list journal entries
 * POST /journal — create journal entry
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { validateJournalEntry } from "../_shared/schemas.ts";
import { logEvent } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);

    // GET /journal
    if (req.method === "GET") {
      const url = new URL(req.url);
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50);

      const { data } = await supabase.from("journal_entries")
        .select("*")
        .eq("user_id", user.userId)
        .order("entry_date", { ascending: false })
        .limit(limit);

      return jsonResponse({ entries: data ?? [] });
    }

    // POST /journal
    if (req.method === "POST") {
      const body = await req.json();
      const validation = validateJournalEntry(body);
      if (!validation.success) {
        return errorResponse(validation.error ?? "Invalid input", 400);
      }

      const input = validation.data!;
      const entryDate = input.entry_date ?? new Date().toISOString().split("T")[0];

      const { data: entry, error } = await supabase.from("journal_entries")
        .insert({
          user_id: user.userId,
          entry_date: entryDate,
          body: input.body,
          mood: input.mood ?? null,
          prompt: input.prompt ?? null,
        })
        .select()
        .single();

      if (error || !entry) {
        return errorResponse(error?.message ?? "Failed to save journal entry", 500);
      }

      await logEvent("journal_entry_created", { date: entryDate }, user.userId);

      return jsonResponse({ entry }, 201);
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    if (err instanceof AuthError) return errorResponse("Unauthorized", 401);
    console.error("Journal error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
