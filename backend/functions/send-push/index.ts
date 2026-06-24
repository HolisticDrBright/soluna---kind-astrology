/**
 * Worker: send-push
 * Runs every 5 minutes. Sends pending push notifications via Expo Push API.
 * Respects notification_prefs.
 */

import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";

const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_ACCESS_TOKEN") ?? "";

interface PushNotification {
  userId: string;
  expoToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (_req: Request) => {
  try {
    const sb = getSupabaseAdmin();
    const today = new Date().toISOString().split("T")[0];

    // Find users whose daily reading was just generated and have daily_reading enabled
    const { data: users } = await sb.from("daily_readings")
      .select("user_id, hero_text")
      .eq("reading_date", today)
      .order("generated_at", { ascending: false })
      .limit(20);

    if (!users?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: "No readings to push" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const notifications: PushNotification[] = [];

    for (const { user_id, hero_text } of users) {
      // Check notification preferences
      const { data: prefs } = await sb.from("notification_prefs")
        .select("daily_reading")
        .eq("user_id", user_id)
        .eq("daily_reading", true)
        .maybeSingle();

      if (!prefs) continue;

      // Get push tokens
      const { data: tokens } = await sb.from("push_tokens")
        .select("expo_token")
        .eq("user_id", user_id);

      if (!tokens?.length) continue;

      const preview = (hero_text as string).slice(0, 100) + "...";

      for (const { expo_token } of tokens) {
        notifications.push({
          userId: user_id,
          expoToken: expo_token,
          title: "Your Soluna reading is ready",
          body: preview,
          data: { type: "daily_reading", date: today },
        });
      }
    }

    // Send via Expo Push API in batches of 100
    let sent = 0;
    const batchSize = 100;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      try {
        const resp = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${EXPO_ACCESS_TOKEN}`,
          },
          body: JSON.stringify(batch.map((n) => ({
            to: n.expoToken,
            title: n.title,
            body: n.body,
            data: n.data,
            sound: "default",
          }))),
        });

        if (resp.ok) {
          sent += batch.length;
        } else {
          console.error("Expo push batch failed:", await resp.text());
        }
      } catch (err) {
        console.error("Expo push error:", err);
      }
    }

    await logEvent("push_sent", { sent, total: notifications.length });

    return new Response(JSON.stringify({ ok: true, sent, total: notifications.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Push worker error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
