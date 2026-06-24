// Audit logging. Writes metadata-only rows to public.logs. Never logs raw chat
// content or prompts — only structured metadata for auditability.
import { serviceClient } from "./supabase.ts";

export type LogKind =
  | "engine_compute"
  | "llm_call"
  | "webhook"
  | "push"
  | "guardrail_trip"
  | "cron"
  | "cron_error";

export async function logEvent(
  kind: LogKind,
  payload: Record<string, unknown>,
  userId?: string | null,
): Promise<void> {
  try {
    await serviceClient().from("logs").insert({ kind, payload, user_id: userId ?? null });
  } catch (e) {
    // Logging must never break a request.
    console.error("logEvent failed:", e);
  }
}
