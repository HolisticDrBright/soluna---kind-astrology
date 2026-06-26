/**
 * GET /rituals — list rituals
 * GET /rituals?phase=new_moon — filter by moon phase
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);
    const url = new URL(req.url);
    const phase = url.searchParams.get("phase");

    let query = supabase.from("rituals").select("*");
    if (phase) {
      query = query.eq("moon_phase", phase);
    }

    const { data } = await query.order("moon_phase");

    return jsonResponse({ rituals: data ?? [] });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse("Unauthorized", 401);
    console.error("Rituals error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
