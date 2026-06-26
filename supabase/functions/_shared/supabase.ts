/**
 * Supabase service helpers for Edge Functions.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/**
 * Enqueue a job to pgmq queue.
 */
export async function enqueueJob(queueName: string, payload: Record<string, unknown>) {
  const sb = getSupabaseAdmin();
  const { error } = await sb.rpc("pgmq_send", {
    queue_name: queueName,
    msg: payload,
  }).single();
  if (error) {
    console.error(`Failed to enqueue to ${queueName}:`, error.message);
    throw error;
  }
}

/**
 * Log an event to the logs table.
 */
export async function logEvent(
  kind: string,
  payload: Record<string, unknown>,
  userId?: string,
) {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("logs").insert({
    kind,
    user_id: userId ?? null,
    payload,
  });
  if (error) {
    console.error(`Failed to log event ${kind}:`, error.message);
  }
}

/**
 * Check if user has premium entitlement.
 */
export async function hasPremiumAccess(userId: string): Promise<boolean> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("subscriptions")
    .select("status, expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!data) return false;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
  return true;
}
