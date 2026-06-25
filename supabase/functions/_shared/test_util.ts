/**
 * Zero-dependency test assertions, so the suite runs in this environment without
 * fetching from jsr/deno.land (which are network-blocked here). Mirrors the
 * small subset of @std/assert we use. Run: `deno test supabase/functions`.
 */

export function assert(cond: unknown, msg = "assertion failed"): void {
  if (!cond) throw new Error(msg);
}

export function assertEquals<T>(actual: T, expected: T, msg?: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(msg ?? `assertEquals failed:\n  actual:   ${a}\n  expected: ${e}`);
  }
}

export function assertThrows(fn: () => unknown, msg?: string): void {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  if (!threw) throw new Error(msg ?? "expected function to throw");
}
