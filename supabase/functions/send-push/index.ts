/**
 * Worker: send-push
 * Runs every 5 minutes. Sends pending push notifications via Expo Push API.
 * Respects notification_prefs.
 */

import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";
import { requireInternalSecret } from "../_shared/internal-auth.ts";

const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_ACCESS_TOKEN") ?? "";

interface PushNotification {
  userId: string;
  expoToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  const unauthorized = requireInternalSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const sb = getSupabaseAdmin();
    // Readings are dated in each USER's timezone, which can sit one day either
    // side of the server's UTC date — a ±1-day window catches them all.
    const utcToday = new Date().toISOString().split("T")[0];
    const utcYesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

    // Find fresh readings that haven't been pushed yet (pushed_at marks
    // delivery so we never re-notify the same user on a later 5-minute run).
    const { data: users } = await sb.from("daily_readings")
      .select("user_id, hero_text, agreement, reading_date")
      .gte("reading_date", utcYesterday)
      .is("pushed_at", null)
      .order("generated_at", { ascending: false })
      .limit(500);

    if (!users?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: "No readings to push" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const notifications: PushNotification[] = [];
    const rowDates = new Map<string, string>();

    for (const { user_id, hero_text, agreement, reading_date } of users) {
      rowDates.set(user_id, String(reading_date));
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

      // Lead with the signature moment when systems converge — that's the hook
      // no single-system app can send.
      const agreeCount = Array.isArray((agreement as Record<string, unknown> | null)?.systems)
        ? ((agreement as Record<string, unknown>).systems as unknown[]).length
        : 0;
      const title = agreeCount >= 2
        ? `${agreeCount} of your systems agree today ✨`
        : "Your Soluna reading is ready";

      for (const { expo_token } of tokens) {
        notifications.push({
          userId: user_id,
          expoToken: expo_token,
          title,
          body: preview,
          data: { type: "daily_reading", date: String(reading_date) },
        });
      }
    }

    // Send via Expo Push API in batches of 100
    let sent = 0;
    const batchSize = 100;
    const pushedUserIds = new Set<string>();

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
          for (const n of batch) pushedUserIds.add(n.userId);
        } else {
          console.error("Expo push batch failed:", await resp.text());
        }
      } catch (err) {
        console.error("Expo push error:", err);
      }
    }

    // Mark delivered readings so the next run doesn't push them again. Rows are
    // dated per-user (local timezones), so mark each user's own reading_date.
    for (const userId of pushedUserIds) {
      const { error: markErr } = await sb.from("daily_readings")
        .update({ pushed_at: new Date().toISOString() })
        .eq("reading_date", rowDates.get(userId) ?? utcToday)
        .eq("user_id", userId);
      if (markErr) {
        console.error("Failed to mark readings pushed:", markErr.message);
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
