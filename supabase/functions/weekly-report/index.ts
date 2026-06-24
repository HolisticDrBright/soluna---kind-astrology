// GET /weekly-report?weekStart=YYYY-MM-DD
// A weekly integration report woven from the week's daily readings, saved items,
// journal entries, and agreement evidence. Cached per user/week; the in-progress
// week refreshes at most once a day. Returns a warm, honest empty state when
// there isn't enough data yet, and never overstates certainty.
import { getUser } from "../_shared/auth.ts";
import { json, serve, ValidationError } from "../_shared/http.ts";
import { loadPreferredName, todayISO } from "../_shared/repo.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { logEvent } from "../_shared/log.ts";
import {
  emptyWeeklyBody,
  generateWeeklyNarrative,
  summarizeWeek,
  weekEndFor,
  type WeeklyReport,
} from "../_shared/weekly.ts";
import { buildWeeklyNotify } from "../_shared/notify.ts";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function currentWeekStart(): string {
  const now = new Date();
  const diff = (now.getUTCDay() + 6) % 7; // days since Monday
  const mon = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${mon.getUTCFullYear()}-${p(mon.getUTCMonth() + 1)}-${p(mon.getUTCDate())}`;
}

function nextDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`;
}

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const url = new URL(req.url);
  const weekStart = url.searchParams.get("weekStart") ?? currentWeekStart();
  if (!DATE_RE.test(weekStart)) throw new ValidationError("weekStart must be YYYY-MM-DD");
  const weekEnd = weekEndFor(weekStart);
  const svc = serviceClient();

  const today = todayISO();
  const isCurrentWeek = today >= weekStart && today <= weekEnd;

  // Cache: past weeks are immutable; the in-progress week refreshes once a day.
  const { data: cachedRow } = await svc.from("weekly_reports")
    .select("body, generated_at").eq("user_id", user.id).eq("week_start", weekStart).maybeSingle();
  if (cachedRow) {
    const staleForToday = isCurrentWeek && String(cachedRow.generated_at ?? "").slice(0, 10) < today;
    if (!staleForToday) return json({ report: cachedRow.body, cached: true });
  }

  // Gather the week's signals.
  const [{ data: readings }, { data: saved }, { data: journal }, preferredName] = await Promise.all([
    svc.from("daily_readings").select("reading_date, hero_text, agreement")
      .eq("user_id", user.id).gte("reading_date", weekStart).lte("reading_date", weekEnd)
      .order("reading_date", { ascending: true }),
    svc.from("saved_items").select("id, kind, ref_id, payload, created_at")
      .eq("user_id", user.id).gte("created_at", weekStart).lt("created_at", nextDay(weekEnd))
      .order("created_at", { ascending: false }),
    svc.from("journal_entries").select("entry_date, title, body")
      .eq("user_id", user.id).gte("entry_date", weekStart).lte("entry_date", weekEnd)
      .order("entry_date", { ascending: true }),
    loadPreferredName(user.id),
  ]);

  const readingRows = readings ?? [];
  const savedRows = saved ?? [];
  const journalRows = journal ?? [];

  let body: WeeklyReport;
  if (readingRows.length + savedRows.length + journalRows.length === 0) {
    body = emptyWeeklyBody(weekStart, weekEnd, 0);
  } else {
    const sum = summarizeWeek(readingRows, savedRows, journalRows);
    const { carryForward, shiftForNextWeek } = await generateWeeklyNarrative(
      preferredName,
      sum.repeatingThemes,
      sum.systemsThatAgreed,
      sum.daysWithReadings,
    );
    const enoughData = sum.daysWithReadings >= 3;
    body = {
      weekStart,
      weekEnd,
      repeatingThemes: sum.repeatingThemes,
      systemsThatAgreed: sum.systemsThatAgreed,
      savedReadings: sum.savedReadings,
      journalHighlights: sum.journalHighlights,
      carryForward,
      shiftForNextWeek,
      daysWithReadings: sum.daysWithReadings,
      enoughData,
      // Weekly integration is interpretive — never "exact".
      accuracyLevel: sum.daysWithReadings >= 4 ? "partial" : "approximate",
      confidenceNotes: [
        `Woven from ${sum.daysWithReadings} ${sum.daysWithReadings === 1 ? "day" : "days"} of readings` +
        `${journalRows.length ? `, ${journalRows.length} journal ${journalRows.length === 1 ? "entry" : "entries"}` : ""}` +
        `${savedRows.length ? `, and ${savedRows.length} saved ${savedRows.length === 1 ? "item" : "items"}` : ""}.`,
        ...(enoughData ? [] : ["A few more daily check-ins will make next week's reflection even richer."]),
      ],
    };
  }

  // Attach widget/push copy for the report.
  const notify = buildWeeklyNotify(body.repeatingThemes, body.carryForward, body.shiftForNextWeek);
  const fullBody = { ...body, notify };

  await svc.from("weekly_reports").upsert(
    { user_id: user.id, week_start: weekStart, body: fullBody, generated_at: new Date().toISOString() },
    { onConflict: "user_id,week_start" },
  );
  await logEvent("llm_call", { kind: "weekly_report", weekStart, days: body.daysWithReadings }, user.id);
  return json({ report: fullBody, cached: false });
}));
