/**
 * GET /connections — list user's connections
 * POST /connections — add a connection
 * GET /connections/:id/compatibility?lens= — compatibility report
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { validateConnection } from "../_shared/schemas.ts";
import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";
import { llmCall } from "../_shared/llm-client.ts";

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
      const lens = url.searchParams.get("lens") ?? "romance";

      const { data: conn } = await supabase.from("connections")
        .select("*")
        .eq("id", connectionId)
        .eq("user_id", user.userId)
        .single();

      if (!conn) {
        return errorResponse("Connection not found", 404);
      }

      // Check cache
      const { data: cached } = await supabase.from("compatibility_reports")
        .select("*")
        .eq("user_id", user.userId)
        .eq("connection_id", connectionId)
        .eq("lens", lens)
        .single();

      if (cached) {
        return jsonResponse(cached);
      }

      // Generate compatibility (mocked with LLM for now)
      const messages = [
        {
          role: "user" as const,
          content: `Generate a warm, constructive compatibility summary for two people. Frame all challenges as growth opportunities. Never doom or fear-based.

Person A: ${user.email ?? "user"}
Person B: ${conn.name} (born ${conn.birth_date})

Lens: ${lens}
Return JSON:
{
  "score": number 60-98,
  "label": "short supportive label",
  "whereYouFlow": ["3-4 areas of natural ease"],
  "whereYouGrow": ["3-4 growth areas framed positively"],
  "howToSupport": ["3 warm tips for supporting each other"],
  "astrologyNote": "one sentence about synastry",
  "numerologyNote": "one sentence about number compatibility"
}`,
        },
      ];

      try {
        const resp = await llmCall(messages, { maxTokens: 500, temperature: 0.7 });
        const jsonMatch = resp.content.match(/\{[\s\S]*\}/);
        const body = jsonMatch ? JSON.parse(jsonMatch[0]) : {
          score: 78,
          label: "Growth pairing",
          whereYouFlow: ["Natural understanding", "Shared values", "Easy conversation"],
          whereYouGrow: ["Learning patience together", "Different emotional rhythms", "Building trust over time"],
          howToSupport: ["Listen more than you fix", "Celebrate small wins together", "Give each other space when needed"],
          astrologyNote: "Your sun signs show complementary qualities.",
          numerologyNote: "Your Life Path numbers suggest natural alignment.",
        };

        const { data: report } = await supabase.from("compatibility_reports")
          .upsert({
            user_id: user.userId,
            connection_id: connectionId,
            lens,
            score: body.score,
            body,
          })
          .select()
          .single();

        return jsonResponse(report ?? body);
      } catch (err) {
        return jsonResponse({
          score: 75,
          label: "Growth pairing",
          whereYouFlow: ["Natural understanding"],
          whereYouGrow: ["Learning each other's rhythms"],
          howToSupport: ["Listen more than you fix"],
        });
      }
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    if (err instanceof AuthError) return errorResponse("Unauthorized", 401);
    console.error("Connections error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
