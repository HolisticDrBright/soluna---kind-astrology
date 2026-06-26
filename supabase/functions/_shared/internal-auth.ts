import { errorResponse } from "./cors.ts";

const INTERNAL_SECRET_HEADER = "x-soluna-internal-secret";

export function requireInternalSecret(req: Request): Response | null {
  const configuredSecret = Deno.env.get("SOLUNA_INTERNAL_FUNCTION_SECRET") ?? "";
  if (!configuredSecret) {
    console.error("SOLUNA_INTERNAL_FUNCTION_SECRET is not configured");
    return errorResponse("Internal function secret is not configured", 500);
  }

  const bearer = req.headers.get("Authorization") ?? "";
  const headerSecret = req.headers.get(INTERNAL_SECRET_HEADER) ?? "";
  const bearerSecret = bearer.startsWith("Bearer ") ? bearer.slice("Bearer ".length) : "";

  if (headerSecret !== configuredSecret && bearerSecret !== configuredSecret) {
    return errorResponse("Unauthorized", 401);
  }

  return null;
}
