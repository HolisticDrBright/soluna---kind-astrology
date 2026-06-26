/**
 * GET /saved — list saved items
 * POST /saved — save item
 * DELETE /saved/:id — unsave item
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);
    const url = new URL(req.url);
    const pathParts = url.pathname.replace(/\/+$/, "").split("/");
    const lastPart = pathParts[pathParts.length - 1];

    // GET /saved
    if (req.method === "GET") {
      const { data } = await supabase.from("saved_items")
        .select("*")
        .eq("user_id", user.userId)
        .order("created_at", { ascending: false });

      return jsonResponse({ items: data ?? [] });
    }

    // POST /saved
    if (req.method === "POST") {
      const body = await req.json();
      if (!body.kind || !body.ref_id) {
        return errorResponse("kind and ref_id are required", 400);
      }

      const { data, error } = await supabase.from("saved_items")
        .insert({
          user_id: user.userId,
          kind: body.kind,
          ref_id: body.ref_id,
        })
        .select()
        .single();

      if (error) return errorResponse(error.message, 500);

      return jsonResponse({ item: data }, 201);
    }

    // DELETE /saved/:id
    if (req.method === "DELETE" && lastPart !== "saved") {
      const { error } = await supabase.from("saved_items")
        .delete()
        .eq("id", lastPart)
        .eq("user_id", user.userId);

      if (error) return errorResponse(error.message, 500);

      return jsonResponse({ ok: true });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    if (err instanceof AuthError) return errorResponse("Unauthorized", 401);
    console.error("Saved error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
