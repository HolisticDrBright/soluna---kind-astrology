/**
 * Sentry crash/error monitoring. Initializes only when EXPO_PUBLIC_SENTRY_DSN is
 * set (a DSN is publishable — it only allows sending events). PII is scrubbed in
 * beforeSend so birth data, journals, and chat content never reach Sentry.
 */
import * as Sentry from "@sentry/react-native";

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";
let initialized = false;

export function initSentry() {
  if (initialized || !DSN) return;
  try {
    Sentry.init({
      dsn: DSN,
      // Never attach default PII (IP, etc.); we only ever keep an opaque user id.
      sendDefaultPii: false,
      tracesSampleRate: 0.2,
      beforeSend(event) {
        if (event.user) event.user = { id: event.user.id };
        if (event.request) delete event.request.data;
        return event;
      },
    });
    initialized = true;
  } catch (e) {
    console.warn("Sentry init failed:", e);
  }
}

export function setSentryUser(id: string | null) {
  if (!initialized) return;
  Sentry.setUser(id ? { id } : null);
}

/** Capture a handled error; logs to console when Sentry is disabled. */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!initialized) {
    console.error("captureError (Sentry off):", error, context ?? "");
    return;
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

/** Wrap the root component (no-op passthrough when Sentry is disabled). */
export function wrapRoot<T>(component: T): T {
  return DSN ? (Sentry.wrap(component as never) as unknown as T) : component;
}
