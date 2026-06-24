// GET   /me   -> profile, birth details (no plaintext name), prefs, entitlement
// PATCH /me   -> preferred name, push token, notification prefs, birth details
//                (birth change re-enqueues blueprint compute)
import { getUser } from "../_shared/auth.ts";
import { json, parse, serve } from "../_shared/http.ts";
import { mePatchInput, type MePatchInput } from "../_shared/schemas.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { encryptField } from "../_shared/crypto.ts";
import { getEntitlement } from "../_shared/entitlements.ts";

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const svc = serviceClient();

  if (req.method === "GET") {
    const [{ data: u }, { data: profile }, { data: prefs }, entitlement] = await Promise.all([
      svc.from("users").select("preferred_name, email").eq("id", user.id).maybeSingle(),
      svc.from("birth_profiles")
        .select("birth_date, birth_time, time_known, birth_place_label, lat, lng, timezone, house_system")
        .eq("user_id", user.id).maybeSingle(),
      svc.from("notification_prefs").select("*").eq("user_id", user.id).maybeSingle(),
      getEntitlement(user.id),
    ]);
    return json({ user: u, birth: profile, notificationPrefs: prefs, entitlement });
  }

  if (req.method === "PATCH") {
    const body = parse<MePatchInput>(mePatchInput, await req.json());

    if (body.preferredName) {
      await svc.from("users").update({ preferred_name: body.preferredName }).eq("id", user.id);
    }

    if (body.pushToken) {
      await svc.from("push_tokens").upsert(
        { user_id: user.id, expo_token: body.pushToken, platform: body.pushPlatform ?? null },
        { onConflict: "user_id,expo_token" },
      );
    }

    if (body.notificationPrefs) {
      const p = body.notificationPrefs;
      await svc.from("notification_prefs").upsert({
        user_id: user.id,
        ...(p.dailyTime !== undefined ? { daily_time: p.dailyTime } : {}),
        ...(p.tz !== undefined ? { tz: p.tz } : {}),
        ...(p.dailyReading !== undefined ? { daily_reading: p.dailyReading } : {}),
        ...(p.personalDay !== undefined ? { personal_day: p.personalDay } : {}),
        ...(p.moonAlerts !== undefined ? { moon_alerts: p.moonAlerts } : {}),
        ...(p.transitAlerts !== undefined ? { transit_alerts: p.transitAlerts } : {}),
      }, { onConflict: "user_id" });
    }

    let recompute = false;
    if (body.birth) {
      const b = body.birth;
      const patch: Record<string, unknown> = {};
      if (b.fullBirthName) patch.full_birth_name_enc = await encryptField(b.fullBirthName);
      if (b.birthDate) patch.birth_date = b.birthDate;
      if (b.timeKnown !== undefined) {
        patch.time_known = b.timeKnown;
        patch.birth_time = b.timeKnown ? (b.birthTime ?? null) : null;
      } else if (b.birthTime !== undefined) {
        patch.birth_time = b.birthTime;
      }
      if (b.birthPlaceLabel !== undefined) patch.birth_place_label = b.birthPlaceLabel;
      if (b.lat !== undefined) patch.lat = b.lat;
      if (b.lng !== undefined) patch.lng = b.lng;
      if (b.timezone !== undefined) patch.timezone = b.timezone;
      if (b.houseSystem !== undefined) patch.house_system = b.houseSystem;

      if (Object.keys(patch).length) {
        await svc.from("birth_profiles").update(patch).eq("user_id", user.id);
        recompute = true;
        // Re-enqueue blueprint compute; drained within a minute. Also clear today's
        // cached reading so the next /today reflects the new chart.
        await svc.rpc("enqueue_blueprint", { p_user: user.id });
        await svc.from("daily_readings").delete().eq("user_id", user.id);
      }
    }

    return json({ ok: true, recompute });
  }

  return json({ error: "Use GET or PATCH /me" }, 405);
}));
