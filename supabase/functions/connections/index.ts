/**
 * GET /connections — list user's connections
 * POST /connections — add a connection
 * GET /connections/:id/compatibility?lens= — compatibility report
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { validateConnection } from "../_shared/schemas.ts";
import { generateCompatibility } from "../_shared/synthesis/compatibility.ts";
import { computeBazi, type BaziOutput } from "../_shared/engines/bazi.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);
    const url = new URL(req.url);
    const pathParts = url.pathname.replace(/\/+$/, "").split("/");
    const lastPart = pathParts[pathParts.length - 1];
    const isCompatibility = pathParts.includes("compatibility");

    // GET /connections
    if (req.method === "GET" && !isCompatibility) {
      const { data } = await supabase.from("connections")
        .select("*")
        .eq("user_id", user.userId)
        .order("created_at", { ascending: false });

      return jsonResponse({ connections: data ?? [] });
    }

    // POST /connections
    if (req.method === "POST" && lastPart === "connections") {
      const body = await req.json();
      const validation = validateConnection(body);
      if (!validation.success) {
        return errorResponse(validation.error ?? "Invalid input", 400);
      }

      const input = validation.data!;
      const { data: conn, error: connErr } = await supabase.from("connections")
        .insert({
          user_id: user.userId,
          name: input.name,
          birth_date: input.birth_date,
          birth_time: input.birth_time ?? null,
          birth_place_label: input.birth_place_label ?? null,
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          timezone: input.timezone ?? "UTC",
          lens: input.lens ?? "romance",
        })
        .select()
        .single();

      if (connErr || !conn) {
        return errorResponse(connErr?.message ?? "Failed to create connection", 500);
      }

      return jsonResponse({ connection: conn }, 201);
    }

    // GET /connections/:id/compatibility?lens=
    if (req.method === "GET" && isCompatibility) {
      const connectionId = pathParts[pathParts.length - 2]; // compatibility is last, id is second-last
      // Clamp to the lenses the schema allows (also what the knowledge layer maps).
      const ALLOWED_LENSES = ["romance", "friendship", "work", "family"];
      const requestedLens = url.searchParams.get("lens") ?? "romance";
      const lens = ALLOWED_LENSES.includes(requestedLens) ? requestedLens : "romance";

      const { data: conn } = await supabase.from("connections")
        .select("*")
        .eq("id", connectionId)
        .eq("user_id", user.userId)
        .single();

      if (!conn) {
        return errorResponse("Connection not found", 404);
      }

      // Check cache — return the flat report body the app renders, not the DB row.
      const { data: cached } = await supabase.from("compatibility_reports")
        .select("*")
        .eq("user_id", user.userId)
        .eq("connection_id", connectionId)
        .eq("lens", lens)
        .single();

      if (cached) {
        return jsonResponse(cached.body ?? cached);
      }

      // Generate a knowledge-driven compatibility reading: the user's REAL
      // blueprint run through the deterministic knowledge SELECTION layer (the same
      // layer Ask and Today use), blended with the connection's date-derived basics
      // (Sun sign, Life Path, Chinese animal). We never fabricate the other person's
      // chart, and the score is computed deterministically from real signals.
      // Compute (and cache) the connection's BaZi so BaZi compatibility can run
      // when BOTH sides have a real chart. Cached by input fingerprint, so the
      // provider is never charged twice. Best-effort: compatibility still works
      // without it, and it is never fabricated.
      let connBazi = (conn.bazi as BaziOutput | null) ?? null;
      try {
        const fresh = await computeBazi({
          date: conn.birth_date,
          time: conn.birth_time ?? null,
          lat: conn.lat ?? null,
          lng: conn.lng ?? null,
          timezone: conn.timezone ?? "UTC",
        }, { cachedBazi: connBazi });
        if (fresh !== connBazi) {
          connBazi = fresh;
          await supabase.from("connections").update({ bazi: fresh })
            .eq("id", connectionId).eq("user_id", user.userId);
        }
      } catch (e) {
        console.error("Connection BaZi compute failed (compatibility continues without it):", e);
      }

      try {
        const result = await generateCompatibility(user.userId, {
          name: conn.name,
          birthDate: conn.birth_date,
          birthTime: conn.birth_time ?? null,
          lens,
          bazi: connBazi,
        });

        const { data: report } = await supabase.from("compatibility_reports")
          .upsert({
            user_id: user.userId,
            connection_id: connectionId,
            lens,
            score: result.score,
            body: result,
          })
          .select()
          .single();

        return jsonResponse(report?.body ?? result);
      } catch (err) {
        // No silent fake-data fallback — surface an honest, retryable error.
        console.error("Compatibility generation error:", err);
        return errorResponse("Could not generate a compatibility reading right now. Please try again.", 502);
      }
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    if (err instanceof AuthError) return errorResponse("Unauthorized", 401);
    console.error("Connections error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
