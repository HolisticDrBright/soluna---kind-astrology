// HTTP helpers: CORS, JSON responses, error normalization, tiny router.

import { UnauthorizedError } from "./auth.ts";
import { LLMUnavailableError } from "./llm.ts";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

export function preflight(req: Request): Response | null {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  return null;
}

export function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json", ...extra },
  });
}

export class HttpError extends Error {
  constructor(public status: number, msg: string) {
    super(msg);
    this.name = "HttpError";
  }
}

export class ValidationError extends HttpError {
  constructor(msg: string) {
    super(400, msg);
    this.name = "ValidationError";
  }
}

export class PaymentRequiredError extends HttpError {
  constructor(msg = "This feature requires Soluna Premium.") {
    super(402, msg);
    this.name = "PaymentRequiredError";
  }
}

/** Map any thrown error to a clean JSON response (never leak internals). */
export function errorResponse(err: unknown): Response {
  if (err instanceof UnauthorizedError) return json({ error: err.message }, 401);
  if (err instanceof HttpError) return json({ error: err.message }, err.status);
  if (err instanceof LLMUnavailableError) {
    return json({ error: "Guidance is briefly unavailable. Please try again." }, 503);
  }
  console.error("Unhandled error:", err);
  return json({ error: "Something went wrong. Please try again." }, 500);
}

/** The path AFTER the function name, e.g. invoke("blueprint/astrology") -> ["astrology"]. */
export function subPath(req: Request, fnName: string): string[] {
  const { pathname } = new URL(req.url);
  const idx = pathname.indexOf(`/${fnName}`);
  const rest = idx >= 0 ? pathname.slice(idx + fnName.length + 1) : pathname;
  return rest.split("/").map((s) => s.trim()).filter(Boolean);
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
}

/** Wrap a handler with CORS preflight + uniform error handling. */
export function serve(fn: (req: Request) => Promise<Response>): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const pf = preflight(req);
    if (pf) return pf;
    try {
      return await fn(req);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Validate a parsed body against a zod schema, throwing a 400 on failure. */
// deno-lint-ignore no-explicit-any
export function parse<T>(schema: { safeParse: (v: unknown) => any }, value: unknown): T {
  const r = schema.safeParse(value);
  if (!r.success) {
    const msg = r.error?.issues?.map((i: { path: string[]; message: string }) =>
      `${i.path.join(".")}: ${i.message}`
    ).join("; ") ?? "Invalid input";
    throw new ValidationError(msg);
  }
  return r.data as T;
}
