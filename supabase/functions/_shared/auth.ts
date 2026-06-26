import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthUser {
  userId: string;
  email?: string;
}

/**
 * Require authentication from the request's Authorization header.
 * Uses Supabase's built-in JWT validation (native Supabase Auth mode).
 */
export async function requireAuth(req: Request): Promise<AuthUser> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new AuthError("Unauthorized");
  return {
    userId: user.id,
    email: user.email,
  };
}

/**
 * Create a Supabase client scoped to the authenticated user (RLS applies).
 */
export function createUserClient(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
}

/**
 * Create a Supabase admin client (bypasses RLS — use with caution).
 */
export function createAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
