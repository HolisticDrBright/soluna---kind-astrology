/**
 * Timezone-safe date formatting for stored birth dates.
 *
 * Birth dates are stored as plain ISO calendar strings ("YYYY-MM-DD") with NO
 * time or zone. Passing one to `new Date("1984-09-11")` parses it as UTC
 * midnight, and `toLocaleDateString` then renders it in the device's local zone —
 * which shifts the day BACKWARD for anyone west of UTC (e.g. Sept 11 → Sept 10 in
 * the Americas). These helpers format by the literal calendar parts so the day
 * shown always matches the day the user entered (and the day the blueprint was
 * computed from).
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Parse "YYYY-MM-DD" into [year, month(1-12), day] or null if malformed. */
function parts(iso: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return [y, mo, d];
}

/** "1984-09-11" → "September 11, 1984" (never shifts the day). Falls back to the
 *  raw string if it isn't a plain ISO date. */
export function formatISODateLong(iso: string): string {
  const p = parts(iso);
  if (!p) return iso ?? "";
  const [y, mo, d] = p;
  return `${MONTHS[mo - 1]} ${d}, ${y}`;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_SHORT = MONTHS;

/** "2026-07-02" → "Thursday, July 2" — by calendar parts (never shifts the day).
 *  Used for the Today header so the date shown always matches the reading's
 *  actual reading_date. Falls back to the raw string if malformed. */
export function formatISODateWeekday(iso: string): string {
  const p = parts(iso);
  if (!p) return iso;
  const [y, mo, d] = p;
  const weekday = WEEKDAYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
  return `${weekday}, ${MONTHS_SHORT[mo - 1]} ${d}`;
}

// ─── Birth-date input parsing (Hermes-proof) ────────────────────────────────
// `new Date("01/23/1996")` / `new Date("July 5, 1993")` are NOT reliably parsed
// by Hermes (Expo's JS engine) — which is why "perfect" input could get stuck.
// Everything below parses by parts and never feeds a string to the Date ctor.

const MONTH_INDEX: Record<string, number> = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
  may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8,
  september: 9, sept: 9, sep: 9, october: 10, oct: 10,
  november: 11, nov: 11, december: 12, dec: 12,
};

function validBirthYMD(y: number, m: number, d: number): string | null {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (y < 1900 || y > new Date().getFullYear()) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  // Real-calendar check (numeric Date ctor is safe on Hermes): 02/30 rolls over,
  // so a round-trip mismatch means the date doesn't exist.
  const probe = new Date(y, m - 1, d);
  if (probe.getFullYear() !== y || probe.getMonth() !== m - 1 || probe.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Parse a typed birth date into ISO YYYY-MM-DD, accepting:
 *   01/23/1996 · 1/23/1996 · 01-23-1996 · 01.23.1996   (US month-first)
 *   1996-01-23 · 1996/01/23                             (ISO year-first)
 *   January 23, 1996 · Jan 23 1996 · 23 January 1996    (month names)
 *   01231996                                            (bare digits, MMDDYYYY)
 * Returns null when invalid — never guesses.
 */
export function parseFlexibleBirthDate(text: string): string | null {
  const t = text.trim();
  if (!t) return null;

  const us = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(t);
  if (us) return validBirthYMD(Number(us[3]), Number(us[1]), Number(us[2]));

  const iso = /^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/.exec(t);
  if (iso) return validBirthYMD(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const monthFirst = /^([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{4})$/.exec(t);
  if (monthFirst) {
    const m = MONTH_INDEX[monthFirst[1].toLowerCase()];
    if (m) return validBirthYMD(Number(monthFirst[3]), m, Number(monthFirst[2]));
    return null;
  }

  const dayFirst = /^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\.?\s*,?\s*(\d{4})$/.exec(t);
  if (dayFirst) {
    const m = MONTH_INDEX[dayFirst[2].toLowerCase()];
    if (m) return validBirthYMD(Number(dayFirst[3]), m, Number(dayFirst[1]));
    return null;
  }

  const bare = /^(\d{2})(\d{2})(\d{4})$/.exec(t);
  if (bare) return validBirthYMD(Number(bare[3]), Number(bare[1]), Number(bare[2]));

  return null;
}

/**
 * Live input formatter: as the user types digits, slashes appear automatically
 * (0 1 2 3 1 9 9 6 → "01/23/1996"). Month-name and ISO-style input is left
 * untouched so every accepted format stays typeable/pasteable.
 */
export function formatBirthDateTyping(text: string): string {
  if (/[A-Za-z]/.test(text)) return text;      // "January 23, 1996"
  if (/^\d{4}[\/\-.]/.test(text)) return text; // "1996-01-23"
  if (/[\-.]/.test(text)) return text;          // "01-23-1996" manual separators
  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
