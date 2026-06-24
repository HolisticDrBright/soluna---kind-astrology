// JWT -> user identity. The Edge gateway already verifies the JWT signature
// (verify_jwt = true), but we still resolve auth.uid() to scope every query.

import { userClient } from "./supabase.ts";

export class UnauthorizedError extends Error {
  constructor(msg = "Unauthorized") {
    super(msg);
    this.name = "UnauthorizedError";
  }
}

export interface AuthUser {
  id: string;
  email: string | null;
}

export async function getUser(req: Request): Promise<AuthUser> {
  const auth = req.headers.get("Authorization");
  if (!auth) throw new UnauthorizedError("Missing Authorization header");
  const { data, error } = await userClient(req).auth.getUser();
  if (error || !data.user) throw new UnauthorizedError(error?.message ?? "Invalid token");
  return { id: data.user.id, email: data.user.email ?? null };
}
