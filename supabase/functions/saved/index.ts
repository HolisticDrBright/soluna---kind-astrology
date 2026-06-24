// POST   /saved        -> save an item (idempotent per kind+ref)
// GET    /saved[?kind=] -> list saved items
// DELETE /saved/:id     -> remove
import { getUser } from "../_shared/auth.ts";
import { HttpError, json, parse, serve, subPath } from "../_shared/http.ts";
import { savedInput, type SavedInput } from "../_shared/schemas.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const segs = subPath(req, "saved");
  const svc = serviceClient();

  if (req.method === "GET") {
    const kind = new URL(req.url).searchParams.get("kind");
    let q = svc.from("saved_items").select("id, kind, ref_id, payload, created_at").eq("user_id", user.id);
    if (kind) q = q.eq("kind", kind);
    const { data } = await q.order("created_at", { ascending: false });
    return json({ saved: data ?? [] });
  }

  if (req.method === "POST") {
    const body = parse<SavedInput>(savedInput, await req.json());
    const { data, error } = await svc.from("saved_items").upsert(
      { user_id: user.id, kind: body.kind, ref_id: body.refId, payload: body.payload ?? null },
      { onConflict: "user_id,kind,ref_id" },
    ).select("id, kind, ref_id, payload, created_at").single();
    if (error) throw new HttpError(400, error.message);
    return json({ saved: data }, 201);
  }

  if (req.method === "DELETE" && segs.length === 1) {
    const { error } = await svc.from("saved_items").delete().eq("id", segs[0]).eq("user_id", user.id);
    if (error) throw new HttpError(400, error.message);
    return json({ ok: true });
  }

  return json({ error: "Unsupported route" }, 405);
}));
