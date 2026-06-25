/**
 * GET /synthesis?theme= — expanded "where systems agree" for a theme
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { buildContext, detectAgreement } from "../_shared/synthesis/index.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  try {
    const user = await requireAuth(req);
    const url = new URL(req.url);
    const theme = url.searchParams.get("theme");
    const today = new Date().toISOString().split("T")[0];

    const ctx = await buildContext(user.userId, today);
    const agreements = detectAgreement(ctx);

    if (theme) {
      const filtered = agreements.filter((a) => a.theme === theme);
      return jsonResponse({ theme, agreements: filtered, allAgreements: agreements });
    }

    return jsonResponse({ agreements });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse("Unauthorized", 401);
    console.error("Synthesis error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
