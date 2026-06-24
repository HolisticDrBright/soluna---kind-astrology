// Partner / Bond routes (verify_jwt off — preview is public, the rest enforce
// auth in-handler):
//   POST   /partner/invite                 create a shareable invite + reward teaser
//   GET    /partner/invite/:code           public preview (inviter name + lens only)
//   POST   /partner/invite/:code/accept    link accounts, referral, reward (idempotent)
//   GET    /partner/bonds                  list active Bonds
//   GET    /partner/bonds/:id              Bond Space: compatibility + today's bond reading
//   PATCH  /partner/bonds/:id              update the caller's share prefs
//   DELETE /partner/bonds/:id              unlink
import { getUser } from "../_shared/auth.ts";
import { HttpError, json, parse, readJson, serve, subPath, ValidationError } from "../_shared/http.ts";
import { partnerInviteInput, type PartnerInviteInput, sharePrefsInput, type SharePrefsInput } from "../_shared/schemas.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { loadBlueprint, loadPreferredName, todayISO } from "../_shared/repo.ts";
import { logEvent } from "../_shared/log.ts";
import { computeTransits } from "../_shared/engines/astrology.ts";
import {
  generateBondReading,
  generateCompatibility,
  shareFacets,
} from "../_shared/synthesis/synthesis.ts";

function inviteCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  return Array.from(bytes).map((b) => alphabet[b % alphabet.length]).join("");
}

Deno.serve(serve(async (req) => {
  const segs = subPath(req, "partner");
  const svc = serviceClient();

  // ── POST /partner/invite ──
  if (req.method === "POST" && segs[0] === "invite" && segs.length === 1) {
    const user = await getUser(req);
    const body = parse<PartnerInviteInput>(partnerInviteInput, await readJson(req));
    let code = inviteCode();
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await svc.from("partner_invites").insert({
        inviter_user_id: user.id,
        invite_code: code,
        lens: body.lens,
        invitee_email: body.inviteeEmail ?? null,
      });
      if (!error) break;
      if (attempt === 2) throw new HttpError(500, "Could not create invite. Please try again.");
      code = inviteCode();
    }
    await logEvent("webhook", { kind: "partner_invite_created", lens: body.lens }, user.id);
    return json({
      inviteCode: code,
      link: `soluna://invite/${code}`,
      lens: body.lens,
      rewardTeaser: "When they join, you both unlock a free Bond reading ✨",
    });
  }

  // ── GET /partner/invite/:code  (public preview) ──
  if (req.method === "GET" && segs[0] === "invite" && segs.length === 2) {
    const code = segs[1];
    const { data: invite } = await svc.from("partner_invites")
      .select("inviter_user_id, lens, status").eq("invite_code", code).maybeSingle();
    if (!invite) throw new HttpError(404, "This invite link isn't valid.");
    if (invite.status !== "pending") return json({ valid: false, status: invite.status });
    const inviterName = await loadPreferredName(invite.inviter_user_id);
    return json({ valid: true, inviterName, lens: invite.lens });
  }

  // ── POST /partner/invite/:code/accept ──
  if (req.method === "POST" && segs[0] === "invite" && segs[2] === "accept") {
    const user = await getUser(req);
    const code = segs[1];
    const { data: invite } = await svc.from("partner_invites")
      .select("id, inviter_user_id, lens, status, reward_granted").eq("invite_code", code).maybeSingle();
    if (!invite) throw new HttpError(404, "This invite link isn't valid.");
    if (invite.status === "expired") throw new HttpError(410, "This invite has expired.");
    const inviter = invite.inviter_user_id;
    if (inviter === user.id) throw new ValidationError("You can't accept your own invite.");

    // Idempotent: reuse an existing link in either direction.
    const { data: existing } = await svc.from("partner_links").select("id")
      .or(`and(user_a.eq.${inviter},user_b.eq.${user.id}),and(user_a.eq.${user.id},user_b.eq.${inviter})`)
      .maybeSingle();
    let linkId = existing?.id;
    if (!linkId) {
      const { data: link, error } = await svc.from("partner_links")
        .insert({ user_a: inviter, user_b: user.id, lens: invite.lens, status: "active" })
        .select("id").single();
      if (error || !link) throw new HttpError(500, "Could not link your accounts. Please try again.");
      linkId = link.id;
    }

    await svc.from("partner_invites")
      .update({ status: "accepted", accepted_user_id: user.id, accepted_at: new Date().toISOString() })
      .eq("id", invite.id).eq("status", "pending");
    await svc.from("referrals").upsert(
      { referrer_user_id: inviter, referred_user_id: user.id, source: "partner_invite", invite_id: invite.id },
      { onConflict: "referrer_user_id,referred_user_id" },
    );
    if (!invite.reward_granted) {
      await svc.from("partner_invites").update({ reward_granted: true }).eq("id", invite.id);
    }
    await logEvent("webhook", { kind: "partner_invite_accepted", linkId }, user.id);
    return json({ linkId, lens: invite.lens });
  }

  // ── GET /partner/bonds ──
  if (req.method === "GET" && segs[0] === "bonds" && segs.length === 1) {
    const user = await getUser(req);
    const { data: links } = await svc.from("partner_links")
      .select("id, user_a, user_b, lens, status")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`).eq("status", "active");
    const rows = links ?? [];
    const otherIds = rows.map((l) => (l.user_a === user.id ? l.user_b : l.user_a));
    const names = new Map<string, string>();
    if (otherIds.length) {
      const { data: users } = await svc.from("users").select("id, preferred_name").in("id", otherIds);
      for (const u of users ?? []) names.set(u.id, u.preferred_name ?? "Your partner");
    }
    const { data: compat } = await svc.from("compatibility_reports")
      .select("link_id, score").in("link_id", rows.map((l) => l.id));
    const scoreByLink = new Map<string, number>();
    for (const c of compat ?? []) if (c.link_id) scoreByLink.set(c.link_id, c.score);

    return json({
      bonds: rows.map((l) => ({
        linkId: l.id,
        partnerName: names.get(l.user_a === user.id ? l.user_b : l.user_a) ?? "Your partner",
        lens: l.lens,
        status: l.status,
        score: scoreByLink.get(l.id) ?? null,
      })),
    });
  }

  // ── /partner/bonds/:id  (GET | PATCH | DELETE) ──
  if (segs[0] === "bonds" && segs.length === 2) {
    const user = await getUser(req);
    const linkId = segs[1];
    const { data: link } = await svc.from("partner_links")
      .select("*").eq("id", linkId).maybeSingle();
    if (!link || (link.user_a !== user.id && link.user_b !== user.id)) {
      throw new HttpError(404, "Bond not found.");
    }
    const isA = link.user_a === user.id;
    const otherId = isA ? link.user_b : link.user_a;

    if (req.method === "DELETE") {
      await svc.from("partner_links").update({ status: "unlinked" }).eq("id", linkId);
      return json({ ok: true });
    }

    if (req.method === "PATCH") {
      const prefs = parse<SharePrefsInput>(sharePrefsInput, await readJson(req));
      const col = isA ? "a_share_prefs" : "b_share_prefs";
      const merged = { ...(isA ? link.a_share_prefs : link.b_share_prefs), ...prefs };
      await svc.from("partner_links").update({ [col]: merged }).eq("id", linkId);
      // Regenerate today's bond with the new prefs on next open.
      await svc.from("bond_readings").delete().eq("link_id", linkId);
      return json({ ok: true, sharePrefs: merged });
    }

    // GET — Bond Space
    if (link.status !== "active") throw new HttpError(409, "This bond has been unlinked.");
    const [selfBp, otherBp, selfName, otherName] = await Promise.all([
      loadBlueprint(user.id),
      loadBlueprint(otherId),
      loadPreferredName(user.id),
      loadPreferredName(otherId),
    ]);
    if (!selfBp || !otherBp) {
      throw new HttpError(409, "You both need a completed blueprint to see your Bond.");
    }

    // Compatibility (cache per link+lens).
    let compatBody;
    const { data: cachedCompat } = await svc.from("compatibility_reports")
      .select("body").eq("link_id", linkId).eq("lens", link.lens).maybeSingle();
    if (cachedCompat) {
      compatBody = cachedCompat.body;
    } else {
      const { body, usedFallback } = await generateCompatibility(
        {
          name: selfName,
          sunSign: selfBp.summary.sunSign,
          moonSign: selfBp.summary.moonSign,
          lifePath: selfBp.summary.lifePath,
          animal: selfBp.summary.animal,
          element: selfBp.summary.element,
          hdType: selfBp.summary.hdType,
          timeKnown: selfBp.summary.timeKnown,
        },
        {
          name: otherName,
          sunSign: otherBp.summary.sunSign,
          moonSign: otherBp.summary.moonSign,
          lifePath: otherBp.summary.lifePath,
          animal: otherBp.summary.animal,
          element: otherBp.summary.element,
          hdType: otherBp.summary.hdType,
          timeKnown: otherBp.summary.timeKnown,
        },
        link.lens,
      );
      compatBody = body;
      await svc.from("compatibility_reports").upsert(
        { user_id: user.id, connection_id: null, link_id: linkId, lens: link.lens, score: body.overall, body },
        { onConflict: "link_id,lens" },
      );
      await logEvent("llm_call", { kind: "bond_compatibility", usedFallback }, user.id);
    }

    // Today's bond reading (cache per link/day), respecting both share prefs.
    const date = todayISO();
    let bond;
    const { data: cachedBond } = await svc.from("bond_readings")
      .select("together_text, flow_grow, shared_weather").eq("link_id", linkId).eq("reading_date", date).maybeSingle();
    if (cachedBond) {
      bond = {
        togetherText: cachedBond.together_text,
        flowGrow: cachedBond.flow_grow,
        sharedWeather: cachedBond.shared_weather,
      };
    } else {
      const transits = computeTransits(date);
      const a = shareFacets(selfName, selfBp.summary, link.a_share_prefs);
      const b = shareFacets(otherName, otherBp.summary, link.b_share_prefs);
      const { reading, usedFallback } = await generateBondReading(
        isA ? a : b,
        isA ? b : a,
        link.lens,
        { moonPhase: transits.moon.phase, moonSign: transits.moon.sign },
      );
      bond = reading;
      await svc.from("bond_readings").upsert(
        {
          link_id: linkId,
          reading_date: date,
          together_text: reading.togetherText,
          flow_grow: reading.flowGrow,
          shared_weather: reading.sharedWeather,
        },
        { onConflict: "link_id,reading_date" },
      );
      await logEvent("llm_call", { kind: "bond_reading", usedFallback }, user.id);
    }

    return json({
      link: { id: link.id, lens: link.lens, status: link.status },
      partner: { name: otherName },
      sharePrefs: isA ? link.a_share_prefs : link.b_share_prefs,
      compatibility: { score: compatBody.overall, ...compatBody },
      bond,
    });
  }

  throw new ValidationError("Unsupported partner route");
}));
