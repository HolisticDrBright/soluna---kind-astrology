// Short, useful notification + widget copy derived from Today / Weekly data.
// Deterministic and on-voice: concrete, never doom, never vague fortune-cookie.
// Whether to actually SEND is decided by notification_prefs in the cron jobs;
// this module only produces the copy.

import type { ThemeId } from "./synthesis/agreement.ts";
import type { NotifyPayload, SolunaShift } from "./synthesis/types.ts";

// What today "favors" — framed as an invitation, never a warning.
const THEME_FAVORS: Record<ThemeId, string> = {
  rest: "rest, not pressure",
  action: "a brave first step",
  connection: "reaching out",
  focus: "focus, gently held",
  change: "release, not force",
};

// One-word agreement headline (matches product copy like "systems agree: simplify").
const THEME_WORD: Record<ThemeId, string> = {
  rest: "simplify",
  action: "begin",
  connection: "connect",
  focus: "focus",
  change: "release",
};

function clip(s: string, n: number): string {
  const t = (s ?? "").trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const sp = cut.lastIndexOf(" ");
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).trim() + "…";
}

/** Notification + widget copy for a daily reading + its Shift. */
export function buildDailyNotify(
  theme: ThemeId,
  score: number,
  shift: SolunaShift,
): NotifyPayload {
  const favors = THEME_FAVORS[theme] ?? "a kind, steady pace";
  const word = THEME_WORD[theme] ?? "begin gently";
  return {
    // Widget: glanceable + actionable.
    widgetTitle: score >= 2 ? `Your systems agree: ${word}` : `Today favors ${favors}`,
    widgetBody: clip(shift.braveTinyAction || shift.reset, 90),
    // Push: a warm nudge that names the concrete next thing.
    pushTitle: "Your 2-minute reset is ready",
    pushBody: clip(shift.reframe, 140),
  };
}

/** Notification + widget copy for a weekly integration report. */
export function buildWeeklyNotify(
  repeatingThemes: string[],
  carryForward: string,
  shiftForNextWeek: string,
): NotifyPayload {
  const headline = repeatingThemes[0]
    ? `This week kept returning to ${repeatingThemes[0].toLowerCase()}`
    : "Your weekly reflection is ready";
  return {
    widgetTitle: "Your week, woven together",
    widgetBody: clip(shiftForNextWeek || carryForward, 90),
    pushTitle: "Your weekly reflection is ready",
    pushBody: clip(headline, 140),
  };
}
