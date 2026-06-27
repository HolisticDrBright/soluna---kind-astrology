import { errorResponse } from "./cors.ts";

const INTERNAL_SECRET_HEADER = "x-soluna-internal-secret";

/**
 * Constant-time string comparison so a mismatch can't be located byte-by-byte
 * via response timing. (Length is allowed to leak; the secret is fixed-length.)
 */
function timingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0);
  }
  return diff === 0;
}

export function requireInternalSecret(req: Request): Response | null {
  const configuredSecret = Deno.env.get("SOLUNA_INTERNAL_FUNCTION_SECRET") ?? "";
  if (!configuredSecret) {
    console.error("SOLUNA_INTERNAL_FUNCTION_SECRET is not configured");
    return errorResponse("Internal function secret is not configured", 500);
  }

  const bearer = req.headers.get("Authorization") ?? "";
  const headerSecret = req.headers.get(INTERNAL_SECRET_HEADER) ?? "";
  const bearerSecret = bearer.startsWith("Bearer ") ? bearer.slice("Bearer ".length) : "";

  if (!timingSafeEqual(headerSecret, configuredSecret) && !timingSafeEqual(bearerSecret, configuredSecret)) {
    return errorResponse("Unauthorized", 401);
  }

  return null;
}
