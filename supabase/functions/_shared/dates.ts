/**
 * Date helpers — the user's LOCAL calendar date, not the server's UTC date.
 *
 * Everything "daily" in Soluna (the reading cache key, the tarot card of the
 * day, the moon phase, the personal horoscope date, the Solar Return rollover)
 * must flip at the USER's midnight. Deriving "today" from
 * `new Date().toISOString()` flips at UTC midnight instead — 4–8pm for users in
 * the Americas — so their morning reading would vanish mid-evening and be
 * replaced by "tomorrow's". Every daily surface should go through todayInTz
 * with the user's IANA timezone (birth profile / notification prefs).
 */

/**
 * The current calendar date (YYYY-MM-DD) in an IANA timezone. Falls back to
 * UTC when the timezone is missing or invalid — degraded, never crashing.
 * `at` exists for tests.
 */
export function todayInTz(tz: string | null | undefined, at: Date = new Date()): string {
  const timeZone = tz && tz.trim() ? tz : "UTC";
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(at);
  } catch {
    return at.toISOString().split("T")[0];
  }
}
