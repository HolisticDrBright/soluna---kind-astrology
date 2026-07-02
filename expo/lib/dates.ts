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
