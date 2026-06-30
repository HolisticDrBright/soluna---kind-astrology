/**
 * Deterministic, date-rotated content for the daily reading. PURE module — no
 * network/Supabase imports — so it is unit-testable offline and keeps the daily
 * reading fresh even when the AI call is unavailable.
 *
 * Everything here is supportive GENERIC language (the same kind of gentle prompt
 * any wellness app might offer) — never fabricated astrology/chart data. The
 * rotation is keyed by the calendar date: stable within a day, advances daily, and
 * deterministic (never random), so a given date always yields the same content.
 */

export interface DailyFallbackParts {
  affirmation: string;
  doEmbraceEase: { do: string[]; embrace: string[]; easeUpOn: string[] };
  concreteNudge: string;
}

/**
 * Day index from a `YYYY-MM-DD` date: number of whole days since the Unix epoch.
 * Stable within a calendar day, advances by 1 each day. Falls back to 0 for an
 * unparseable date (so the reading is still produced, just not rotated).
 */
export function dayIndexFromISODate(dateISO: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return 0;
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Human-readable label for a `YYYY-MM-DD` date, e.g. "Tuesday, June 30, 2026". */
export function formatDateLabel(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return dateISO;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const AFFIRMATIONS = [
  "I am exactly where I need to be.",
  "I can trust the pace of my own becoming.",
  "Today, I meet myself with patience.",
  "I am allowed to take up space and to rest.",
  "What is meant for me will not pass me by.",
  "I let today be enough — and I am enough within it.",
  "I move gently, and gentleness moves me forward.",
];

const NUDGES = [
  "Today, try pausing for 60 seconds before you check your phone in the morning. Just breathe.",
  "Step outside for five minutes and notice three things you can see, hear, and feel.",
  "Send one honest message to someone you've been meaning to reach.",
  "Drink a full glass of water before your first coffee, and notice how your body responds.",
  "Write down one thing you're proud of from this week — even a small one.",
  "Take the long way somewhere today and let yourself move a little more slowly.",
  "Put one thing back in its place — let a little order settle your mind.",
];

const DEE_SETS: DailyFallbackParts["doEmbraceEase"][] = [
  {
    do: ["Take one mindful breath before each meal", "Reach out to someone you trust", "Move your body gently"],
    embrace: ["The pace that feels right for you today", "A moment of quiet when you can find it", "Whatever you're feeling without judgment"],
    easeUpOn: ["The pressure to have everything figured out", "Comparing your path to anyone else's", "That one worry that keeps circling back"],
  },
  {
    do: ["Write down one intention for the day", "Step outside and feel the air for a minute", "Say one kind thing to yourself out loud"],
    embrace: ["Small progress over perfect progress", "The support that's already around you", "Your own timing"],
    easeUpOn: ["Saying yes when you mean no", "Rushing a decision that can wait", "The urge to do it all at once"],
  },
  {
    do: ["Drink a full glass of water first thing", "Tidy one small corner of your space", "Pause before you respond, not after"],
    embrace: ["Rest as something you've earned, not borrowed", "A slower, softer morning", "The version of you that's still learning"],
    easeUpOn: ["Scrolling when you mean to be resting", "Holding your breath through hard moments", "Being your own harshest critic"],
  },
  {
    do: ["Name one thing you're grateful for", "Reach for nourishing food at least once", "Let yourself finish one thing fully"],
    embrace: ["Quiet confidence over loud certainty", "The people who feel like home", "Your need for both connection and solitude"],
    easeUpOn: ["Measuring today against your busiest days", "The story that you're behind", "Carrying tomorrow's worries into tonight"],
  },
  {
    do: ["Stretch for two minutes when you wake", "Send a message you've been putting off", "Notice one beautiful, ordinary thing"],
    embrace: ["Beginnings that start small", "Feelings as messengers, not verdicts", "The freedom to change your mind"],
    easeUpOn: ["Perfecting what's already good enough", "Apologizing for taking up space", "Filling every silence"],
  },
];

/**
 * Build the date-rotated fallback parts for a given `YYYY-MM-DD` date. The three
 * pools have coprime lengths (7, 7, 5), so the combined affirmation + nudges
 * pattern doesn't repeat for 35 days.
 */
export function buildDailyFallbackParts(dateISO: string): DailyFallbackParts {
  const i = dayIndexFromISODate(dateISO);
  const pick = <T>(arr: T[]): T => arr[((i % arr.length) + arr.length) % arr.length];
  return {
    affirmation: pick(AFFIRMATIONS),
    doEmbraceEase: pick(DEE_SETS),
    concreteNudge: pick(NUDGES),
  };
}
