/**
 * GET /entitlements — current premium status for paywall/gating
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);

    const { data: sub } = await supabase.from("subscriptions")
      .select("*")
      .eq("user_id", user.userId)
      .maybeSingle();

    const isPremium = sub?.status === "active" && (
      !sub.expires_at || new Date(sub.expires_at) > new Date()
    );

    return jsonResponse({
      isPremium,
      entitlement: sub?.entitlement ?? "free",
      status: sub?.status ?? "inactive",
      expiresAt: sub?.expires_at ?? null,
    });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse("Unauthorized", 401);
    console.error("Entitlements error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
