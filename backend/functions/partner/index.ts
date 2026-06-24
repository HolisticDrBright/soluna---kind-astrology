/**
 * Partner functions:
 * POST /partner/invite — create invite
 * GET /partner/invite/:code — preview invite
 * POST /partner/invite/:code/accept — accept invite
 * GET /partner/bonds — list linked bonds
 * GET /partner/bonds/:linkId — bond detail
 * PATCH /partner/bonds/:linkId — update share prefs
 * DELETE /partner/bonds/:linkId — unlink
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { validatePartnerInvite } from "../_shared/schemas.ts";
import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `soluna-${code}`;
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.replace(/\/+$/, "").split("/");

    // Public endpoints (no auth required)
    // GET /partner/invite/:code
    if (req.method === "GET" && pathParts.includes("invite") && pathParts.length >= 4) {
      const inviteCode = pathParts[pathParts.length - 1];
      const sb = getSupabaseAdmin();
      const { data: invite } = await sb.from("partner_invites")
        .select("invite_code, lens, status, inviter_user_id")
        .eq("invite_code", inviteCode)
        .single();

      if (!invite || invite.status !== "pending") {
        return errorResponse("Invite not found or expired", 404);
      }

      const { data: inviter } = await sb.from("profiles")
        .select("preferred_name, full_name")
        .eq("id", invite.inviter_user_id)
        .single();

      return jsonResponse({
        inviteCode: invite.invite_code,
        lens: invite.lens,
        inviterName: inviter?.preferred_name ?? inviter?.full_name ?? "a friend",
      });
    }

    // Authenticated endpoints
    const user = await requireAuth(req);
    const supabase = createUserClient(req);

    // POST /partner/invite
    if (req.method === "POST" && pathParts[pathParts.length - 1] === "invite") {
      const body = await req.json();
      const validation = validatePartnerInvite(body);
      if (!validation.success) {
        return errorResponse(validation.error ?? "Invalid input", 400);
      }

      const input = validation.data!;
      const inviteCode = generateInviteCode();

      const { data: invite } = await supabase.from("partner_invites")
        .insert({
          inviter_user_id: user.userId,
          invite_code: inviteCode,
          lens: input.lens ?? "romance",
          invitee_email: input.invitee_email ?? null,
        })
        .select()
        .single();

      await logEvent("partner_invite_created", { lens: input.lens }, user.userId);

      return jsonResponse({
        invite: invite ?? { invite_code: inviteCode, lens: input.lens },
        inviteCode,
        shareableLink: `soluna://partner/join/${inviteCode}`,
      }, 201);
    }

    // POST /partner/invite/:code/accept
    if (req.method === "POST" && pathParts.includes("accept") && pathParts.length >= 5) {
      const inviteCode = pathParts[pathParts.length - 2];
      const sb = getSupabaseAdmin();

      const { data: invite } = await sb.from("partner_invites")
        .select("*")
        .eq("invite_code", inviteCode)
        .single();

      if (!invite || invite.status !== "pending") {
        return errorResponse("Invite not found or already used", 404);
      }

      if (invite.inviter_user_id === user.userId) {
        return errorResponse("You can't accept your own invite", 400);
      }

      // Create partner link
      const userA = invite.inviter_user_id;
      const userB = user.userId;
      const lens = invite.lens;

      const { data: link, error: linkErr } = await sb.from("partner_links")
        .upsert({
          user_a: userA,
          user_b: userB,
          lens,
          status: "active",
        }, { onConflict: "user_a, user_b" })
        .select()
        .single();

      if (linkErr) {
        return errorResponse("Failed to create partner link: " + linkErr.message, 500);
      }

      // Mark invite accepted
      await sb.from("partner_invites")
        .update({
          status: "accepted",
          accepted_user_id: userB,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invite.id);

      // Create referral
      await sb.from("referrals").insert({
        referrer_user_id: userA,
        referred_user_id: userB,
        source: "partner_invite",
        invite_id: invite.id,
      });

      await logEvent("partner_link_created", { userA, userB, lens }, user.userId);

      return jsonResponse({ link, message: `You're now connected!` });
    }

    // GET /partner/bonds
    if (req.method === "GET" && pathParts.includes("bonds") && pathParts.length <= 4) {
      const linkId = pathParts[pathParts.length - 1];
      if (linkId && linkId !== "bonds") {
        // GET /partner/bonds/:linkId — bond detail
        const { data: link } = await supabase.from("partner_links")
          .select("*")
          .eq("id", linkId)
          .or(`user_a.eq.${user.userId},user_b.eq.${user.userId}`)
          .single();

        if (!link) return errorResponse("Bond not found", 404);

        const partnerId = link.user_a === user.userId ? link.user_b : link.user_a;
        const { data: partner } = await supabase.from("profiles")
          .select("preferred_name, full_name, avatar_url")
          .eq("id", partnerId)
          .single();

        // Get today's bond reading
        const today = new Date().toISOString().split("T")[0];
        const { data: bondReading } = await supabase.from("bond_readings")
          .select("*")
          .eq("link_id", linkId)
          .eq("reading_date", today)
          .single();

        return jsonResponse({
          link,
          partner: partner ?? {},
          bondReading: bondReading ?? null,
        });
      }

      // GET /partner/bonds — list bonds
      const { data: links } = await supabase.from("partner_links")
        .select("*")
        .or(`user_a.eq.${user.userId},user_b.eq.${user.userId}`)
        .eq("status", "active");

      const bonds = await Promise.all((links ?? []).map(async (link) => {
        const partnerId = link.user_a === user.userId ? link.user_b : link.user_a;
        const { data: partner } = await supabase.from("profiles")
          .select("preferred_name, full_name, avatar_url")
          .eq("id", partnerId)
          .single();

        return {
          ...link,
          partnerName: partner?.preferred_name ?? partner?.full_name ?? "Partner",
          partnerAvatar: partner?.avatar_url ?? null,
        };
      }));

      return jsonResponse({ bonds });
    }

    // PATCH /partner/bonds/:linkId — update share prefs
    if (req.method === "PATCH" && pathParts.includes("bonds") && pathParts.length >= 5) {
      const linkId = pathParts[pathParts.length - 1];
      const body = await req.json();

      const { data: link } = await supabase.from("partner_links")
        .select("*")
        .eq("id", linkId)
        .or(`user_a.eq.${user.userId},user_b.eq.${user.userId}`)
        .single();

      if (!link) return errorResponse("Bond not found", 404);

      const isA = link.user_a === user.userId;
      const updateField = isA ? "a_share_prefs" : "b_share_prefs";

      const { error: updateErr } = await supabase.from("partner_links")
        .update({ [updateField]: body })
        .eq("id", linkId);

      if (updateErr) return errorResponse("Failed to update share prefs", 500);

      return jsonResponse({ ok: true });
    }

    // DELETE /partner/bonds/:linkId — unlink
    if (req.method === "DELETE" && pathParts.includes("bonds") && pathParts.length >= 5) {
      const linkId = pathParts[pathParts.length - 1];

      const { data: link } = await supabase.from("partner_links")
        .select("id")
        .eq("id", linkId)
        .or(`user_a.eq.${user.userId},user_b.eq.${user.userId}`)
        .single();

      if (!link) return errorResponse("Bond not found", 404);

      const { error } = await supabase.from("partner_links")
        .update({ status: "unlinked" })
        .eq("id", linkId);

      if (error) return errorResponse("Failed to unlink", 500);

      await logEvent("partner_unlinked", { linkId }, user.userId);

      return jsonResponse({ ok: true });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    if (err instanceof AuthError) return errorResponse("Unauthorized", 401);
    console.error("Partner error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
