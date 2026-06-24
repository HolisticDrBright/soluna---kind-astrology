// Shared secret check for pg_cron-invoked functions (verify_jwt is off for them).
import { UnauthorizedError } from "./auth.ts";

export function assertCron(req: Request): void {
  const secret = Deno.env.get("CRON_SECRET");
  const got = req.headers.get("x-cron-secret");
  if (!secret || got !== secret) throw new UnauthorizedError("Invalid cron secret");
}
