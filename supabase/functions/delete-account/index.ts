/**
 * POST|DELETE /delete-account — permanently delete the signed-in user's account
 * and ALL associated data (App Store / Play in-app account-deletion requirement).
 *
 * Requires the user's JWT (requireAuth), then deletes via the auth admin API.
 * Every user table is ON DELETE CASCADE from public.profiles → auth.users, so
 * removing the auth user removes all of the user's rows. Shared link fields
 * (e.g. partner accepted_user_id, referrals) are ON DELETE SET NULL, preserving
 * the other party's data without retaining the deleted user's id.
 */

import { requireAuth, AuthError } from "../_shared/auth.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "POST" && req.method !== "DELETE") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const user = await requireAuth(req);
    const admin = getSupabaseAdmin();

    // Audit the request before removal. The logs.user_id FK is ON DELETE SET
    // NULL, so the cascade anonymizes this row afterward (no PII retained).
    await logEvent("account_deletion_requested", {}, user.userId);

    // Hard delete (default). Cascades through profiles to every user table.
    const { error } = await admin.auth.admin.deleteUser(user.userId);
    if (error) {
      console.error("delete-account: deleteUser failed:", error.message);
      return errorResponse("We couldn't delete your account just now. Please try again.", 500);
    }

    await logEvent("account_deleted", {});
    return jsonResponse({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse("Unauthorized", 401);
    console.error("delete-account error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
