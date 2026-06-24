// Supabase client factories.
//
// - serviceClient(): service-role, BYPASSES RLS. Used for all privileged writes
//   inside Edge Functions. NEVER returned to the client.
// - userClient(req): anon key + the caller's JWT, so RLS applies as that user.

import { createClient, type SupabaseClient } from "supabase";

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function userClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export type { SupabaseClient };
