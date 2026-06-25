/**
 * Worker auth: scheduled / internal Edge Functions (compute-blueprint-worker,
 * generate-daily-readings, reconcile-entitlements, refresh-transits, send-push)
 * must require SOLUNA_INTERNAL_FUNCTION_SECRET. A normal user token must not pass.
 * Run: `deno test --allow-env --allow-read supabase/functions/_shared/tests`.
 */

import { assert, assertEquals } from "../test_util.ts";
import { requireInternalSecret } from "../internal-auth.ts";

const SECRET = "test-internal-secret-123";

function reqWith(headers: Record<string, string>): Request {
  return new Request("https://example.invalid/worker", { method: "POST", headers });
}

Deno.test("500 when the internal secret is not configured", () => {
  Deno.env.delete("SOLUNA_INTERNAL_FUNCTION_SECRET");
  const res = requireInternalSecret(reqWith({}));
  assert(res !== null);
  assertEquals(res?.status, 500);
});

Deno.test("401 when no secret is provided", () => {
  Deno.env.set("SOLUNA_INTERNAL_FUNCTION_SECRET", SECRET);
  const res = requireInternalSecret(reqWith({}));
  assert(res !== null);
  assertEquals(res?.status, 401);
});

Deno.test("401 on a wrong secret", () => {
  Deno.env.set("SOLUNA_INTERNAL_FUNCTION_SECRET", SECRET);
  const res = requireInternalSecret(reqWith({ "x-soluna-internal-secret": "nope" }));
  assert(res !== null);
  assertEquals(res?.status, 401);
});

Deno.test("passes with the correct x-soluna-internal-secret header", () => {
  Deno.env.set("SOLUNA_INTERNAL_FUNCTION_SECRET", SECRET);
  const res = requireInternalSecret(reqWith({ "x-soluna-internal-secret": SECRET }));
  assertEquals(res, null);
});

Deno.test("passes with the correct Authorization Bearer secret", () => {
  Deno.env.set("SOLUNA_INTERNAL_FUNCTION_SECRET", SECRET);
  const res = requireInternalSecret(reqWith({ "Authorization": `Bearer ${SECRET}` }));
  assertEquals(res, null);
});

Deno.test("a normal user JWT (Bearer) does not unlock worker endpoints", () => {
  Deno.env.set("SOLUNA_INTERNAL_FUNCTION_SECRET", SECRET);
  const res = requireInternalSecret(reqWith({ "Authorization": "Bearer eyJhbGciOi.userjwt.sig" }));
  assert(res !== null);
  assertEquals(res?.status, 401);
});
