// POST /journal   -> create an entry (captures the day's transit context)
// GET  /journal    -> list entries
import { getUser } from "../_shared/auth.ts";
import { HttpError, json, parse, serve } from "../_shared/http.ts";
import { journalInput, type JournalInput } from "../_shared/schemas.ts";
import { todayISO } from "../_shared/repo.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { computeTransits } from "../_shared/engines/astrology.ts";

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const svc = serviceClient();

  if (req.method === "GET") {
    const { data } = await svc.from("journal_entries")
      .select("id, entry_date, title, prompt, body, mood, transit_context, created_at")
      .eq("user_id", user.id).order("entry_date", { ascending: false });
    return json({ entries: data ?? [] });
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
      transit_context: { moon: transits.moon },
    }).select("id, entry_date, title, prompt, body, mood, transit_context, created_at").single();
    if (error) throw new HttpError(400, error.message);
    return json({ entry: data }, 201);
  }

  return json({ error: "Use GET or POST /journal" }, 405);
}));
