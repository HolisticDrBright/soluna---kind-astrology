// Server-side entitlement checks. Premium routes (full lenses, unlimited Ask,
// extra tarot spreads) gate on this — never trust the client.
import { serviceClient } from "./supabase.ts";
import { PaymentRequiredError } from "./http.ts";

export type Entitlement = "free" | "premium";

export interface EntitlementState {
  entitlement: Entitlement;
  status: string;
  expiresAt: string | null;
}

/** Pure check: a subscription grants premium only if active AND not expired. */
export function isEntitlementActive(status: string, expiresAt: string | null, now: number = Date.now()): boolean {
  const notExpired = !expiresAt || new Date(expiresAt).getTime() > now;
  return status === "active" && notExpired;
}

export async function getEntitlement(userId: string): Promise<EntitlementState> {
  const { data } = await serviceClient()
    .from("subscriptions")
    .select("entitlement, status, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return { entitlement: "free", status: "inactive", expiresAt: null };

  const active = isEntitlementActive(data.status, data.expires_at);
  return {
    entitlement: active ? (data.entitlement as Entitlement) : "free",
    status: data.status,
    expiresAt: data.expires_at,
  };
}

export async function requirePremium(userId: string): Promise<void> {
  const e = await getEntitlement(userId);
  if (e.entitlement !== "premium") throw new PaymentRequiredError();
}
