// pg_cron (every minute): drain pgmq queues.
//  - compute_blueprint: recompute + persist a user's blueprint
//  - send_push:        deliver Expo notifications (respecting prefs)
import { assertCron } from "../_shared/cron.ts";
import { json, serve } from "../_shared/http.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { birthInputFor, saveBlueprint } from "../_shared/repo.ts";
import { computeBlueprint } from "../_shared/engines/blueprint.ts";
import { type ExpoMessage, prefsAllow, sendExpoPush } from "../_shared/push.ts";
import { logEvent } from "../_shared/log.ts";

Deno.serve(serve(async (req) => {
  assertCron(req);
  const svc = serviceClient();
  const result = { blueprints: 0, pushes: 0 };

  // ── compute_blueprint ──
  const { data: bpMsgs } = await svc.rpc("queue_pop", { p_queue: "compute_blueprint", p_qty: 10 });
  for (const m of (bpMsgs ?? []) as Array<{ msg_id: number; message: { user_id: string } }>) {
    try {
      const input = await birthInputFor(m.message.user_id);
      if (input) {
        const { blueprint, placements } = await computeBlueprint(input);
        await saveBlueprint(m.message.user_id, blueprint, placements);
        result.blueprints++;
      }
      await svc.rpc("queue_ack", { p_queue: "compute_blueprint", p_msg_id: m.msg_id });
    } catch (e) {
      console.error("compute_blueprint drain error:", e);
    }
  }

  // ── send_push ──
  const { data: pushMsgs } = await svc.rpc("queue_pop", { p_queue: "send_push", p_qty: 100 });
  const expo: ExpoMessage[] = [];
  for (
    const m of (pushMsgs ?? []) as Array<
      { msg_id: number; message: { user_id: string; title: string; body: string; kind: string; data?: Record<string, unknown> } }
    >
  ) {
    try {
      const { user_id, title, body, kind, data } = m.message;
      const { data: prefs } = await svc.from("notification_prefs").select("*").eq("user_id", user_id).maybeSingle();
      if (prefsAllow(prefs, kind)) {
        const { data: tokens } = await svc.from("push_tokens").select("expo_token").eq("user_id", user_id);
        for (const t of tokens ?? []) expo.push({ to: t.expo_token, title, body, data });
      }
      await svc.rpc("queue_ack", { p_queue: "send_push", p_msg_id: m.msg_id });
      result.pushes++;
    } catch (e) {
      console.error("send_push drain error:", e);
    }
  }
  const delivered = await sendExpoPush(expo);

  await logEvent("cron", { fn: "drain-queue", ...result, delivered });
  return json({ ...result, delivered });
}));
