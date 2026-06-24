// GET /rituals[?phase=Full%20Moon]  -> shared ritual content, optionally filtered by moon phase
import { getUser } from "../_shared/auth.ts";
import { json, serve } from "../_shared/http.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(serve(async (req) => {
  await getUser(req); // authenticated read
  const phase = new URL(req.url).searchParams.get("phase");
  const svc = serviceClient();
  let q = svc.from("rituals").select("id, moon_phase, title, description, steps, intention, active_window");
  if (phase) q = q.ilike("moon_phase", `%${phase}%`);
  const { data } = await q;
  return json({ rituals: data ?? [] });
}));
