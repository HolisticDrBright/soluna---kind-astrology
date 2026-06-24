// POST /journal   -> create an entry (tags, source ref, day's transit context)
// GET  /journal    -> list entries + a gentle "reflection from yesterday" prompt
import { getUser } from "../_shared/auth.ts";
import { HttpError, json, parse, serve } from "../_shared/http.ts";
import { journalInput, type JournalInput } from "../_shared/schemas.ts";
import { todayISO } from "../_shared/repo.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { computeTransits } from "../_shared/engines/astrology.ts";

function yesterdayISO(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const svc = serviceClient();

  if (req.method === "GET") {
    const { data } = await svc.from("journal_entries")
      .select("id, entry_date, title, prompt, body, mood, tags, source_ref, transit_context, created_at")
      .eq("user_id", user.id).order("entry_date", { ascending: false });

    // Lightweight "reflection from yesterday": surface yesterday's reading so the
    // user can journal on how it landed.
    const yday = yesterdayISO();
    const { data: prev } = await svc.from("daily_readings")
      .select("reading_date, hero_text, affirmation").eq("user_id", user.id).eq("reading_date", yday).maybeSingle();
    const reflection = prev
      ? {
        date: prev.reading_date,
        prompt: `Yesterday's reading offered: "${prev.affirmation ?? prev.hero_text ?? ""}" — how did that land for you?`,
        sourceRef: `reading:${prev.reading_date}`,
      }
      : null;

    return json({ entries: data ?? [], reflection });
  }

  if (req.method === "POST") {
    const body = parse<JournalInput>(journalInput, await req.json());
    const date = body.entryDate ?? todayISO();
    const transits = computeTransits(date);
    const { data, error } = await svc.from("journal_entries").insert({
      user_id: user.id,
      entry_date: date,
      title: body.title ?? null,
      prompt: body.prompt ?? null,
      body: body.body,
      mood: body.mood ?? null,
      tags: body.tags ?? [],
      source_ref: body.sourceRef ?? null,
      transit_context: { moon: transits.moon },
    }).select("id, entry_date, title, prompt, body, mood, tags, source_ref, transit_context, created_at").single();
    if (error) throw new HttpError(400, error.message);
    return json({ entry: data }, 201);
  }

  return json({ error: "Use GET or POST /journal" }, 405);
}));
