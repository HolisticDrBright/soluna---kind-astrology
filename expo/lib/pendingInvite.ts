// Holds an invite code when a deep link arrives before the user is signed in,
// so the auth gate can resume the accept flow after login. In-memory for the
// session is sufficient — the deep link re-supplies the code on a cold start.
let pending: string | null = null;

export function setPendingInvite(code: string | null): void {
  pending = code;
}

export function takePendingInvite(): string | null {
  const c = pending;
  pending = null;
  return c;
}
