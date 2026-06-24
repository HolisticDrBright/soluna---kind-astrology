// Zero-dependency test assertions (so the suite runs without network/jsr access).
// Mirrors the small subset of @std/assert we use.

export function assertEquals<T>(actual: T, expected: T, msg?: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(msg ?? `assertEquals failed:\n  actual:   ${a}\n  expected: ${e}`);
  }
}

export function assert(cond: unknown, msg = "assertion failed"): void {
  if (!cond) throw new Error(msg);
}

export function assertAlmostEquals(actual: number, expected: number, tol = 1e-7, msg?: string): void {
  if (Math.abs(actual - expected) > tol) {
    throw new Error(msg ?? `assertAlmostEquals failed: ${actual} vs ${expected} (tol ${tol})`);
  }
}

export function assertStringIncludes(actual: string, needle: string, msg?: string): void {
  if (!actual.includes(needle)) {
    throw new Error(msg ?? `expected string to include "${needle}"`);
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
