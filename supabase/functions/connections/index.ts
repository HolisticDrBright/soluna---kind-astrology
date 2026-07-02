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
import { computeVedicMatch, matchReady, type VedicMatchBirth, type VedicMatchOutput } from "../_shared/engines/vedic-match.ts";

// Stamped into every report body; cache hits require an exact match, so bumping
// this regenerates everyone's reports after a methodology change (e.g. the
// Vedic Guna-Milan note shipping) instead of freezing them forever.
const REPORT_VERSION = 2;

/** Build the Guna-Milan birth input from a birth-profile / connection row. */
function toMatchBirth(row: {
  birth_date?: unknown; birth_time?: unknown; time_known?: unknown;
  lat?: unknown; lng?: unknown; timezone?: unknown; birth_place_label?: unknown; name?: unknown;
}): VedicMatchBirth | null {
  if (!row.birth_date) return null;
  const [y, m, d] = String(row.birth_date).split("-").map(Number);
  const timeStr = row.birth_time ? String(row.birth_time) : null;
  const [hh, mm] = timeStr ? timeStr.split(":").map(Number) : [null, null];
  return {
    year: y, month: m, day: d,
    hour: hh, minute: mm,
    city: row.birth_place_label ? String(row.birth_place_label) : null,
    timezone: row.timezone ? String(row.timezone) : null,
    lat: typeof row.lat === "number" ? row.lat : null,
    lng: typeof row.lng === "number" ? row.lng : null,
    timeKnown: row.time_known !== false && !!timeStr,
  };
}

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
          timezone: input.timezone ?? null,
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

      if (cached?.body && (cached.body as Record<string, unknown>).reportVersion === REPORT_VERSION) {
        return jsonResponse(cached.body);
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
          timezone: conn.timezone ?? null,
        }, { cachedBazi: connBazi });
        if (fresh !== connBazi) {
          connBazi = fresh;
          await supabase.from("connections").update({ bazi: fresh })
            .eq("id", connectionId).eq("user_id", user.userId);
        }
      } catch (e) {
        console.error("Connection BaZi compute failed (compatibility continues without it):", e);
      }

      // Vedic Guna Milan — ROMANCE lens only, and ONLY when BOTH people have a real
      // chart (date + time + place). It hinges on both Moon nakshatras, so without
      // full data on either side we honestly skip it (never fabricated).
      let vedicMatch: VedicMatchOutput | null = null;
      if (lens === "romance") {
        try {
          const connBirth = toMatchBirth(conn);
          if (matchReady(connBirth)) {
            const { data: prof } = await supabase.from("birth_profiles")
              .select("birth_date, birth_time, time_known, lat, lng, timezone, birth_place_label")
              .eq("user_id", user.userId)
              .single();
            const userBirth = prof ? toMatchBirth(prof) : null;
            if (matchReady(userBirth)) {
              vedicMatch = await computeVedicMatch(userBirth!, connBirth!);
            }
          }
        } catch (e) {
          console.error("Vedic match compute failed (compatibility continues without it):", e);
        }
      }

      try {
        const result = await generateCompatibility(user.userId, {
          name: conn.name,
          birthDate: conn.birth_date,
          birthTime: conn.birth_time ?? null,
          lens,
          bazi: connBazi,
          vedicMatch,
        });

        const body = { ...result, reportVersion: REPORT_VERSION };

        // Persist via update-then-insert: the table's uniqueness is a PARTIAL
        // unique index (where connection_id is not null), which ON CONFLICT
        // cannot infer — the previous upsert failed with 42P10 on every call
        // and the error was silently dropped, so reports were never cached and
        // every view paid a provider call + an LLM call.
        const { data: updated, error: updErr } = await supabase.from("compatibility_reports")
          .update({ score: result.score, body, updated_at: new Date().toISOString() })
          .eq("user_id", user.userId)
          .eq("connection_id", connectionId)
          .eq("lens", lens)
          .select("id");
        if (updErr) console.error("Compatibility report update failed:", updErr.message);
        if (!updated?.length) {
          const { error: insErr } = await supabase.from("compatibility_reports")
            .insert({
              user_id: user.userId,
              connection_id: connectionId,
              lens,
              score: result.score,
              body,
            });
          // A racing insert can hit the partial unique index — the fresh body
          // below is still returned, and the winner's row serves future reads.
          if (insErr) console.error("Compatibility report insert failed:", insErr.message);
        }

        return jsonResponse(body);
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
