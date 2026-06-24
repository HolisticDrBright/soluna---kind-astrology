// Personal pattern memory — user-CONTROLLED themes Soluna may keep in mind.
//   GET    /memory-themes        list all of the user's themes (enabled or not)
//   POST   /memory-themes        create a theme {label, description?, enabled?}
//   PATCH  /memory-themes/:id     update label/description/enabled
//   DELETE /memory-themes/:id     remove a theme
//
// Privacy rules baked in: the user sees and controls every theme; only ENABLED
// themes are ever fed to the LLM (see repo.loadEnabledMemoryThemes); we never
// infer or auto-store themes here.
import { getUser } from "../_shared/auth.ts";
import { HttpError, json, parse, readJson, serve, subPath, ValidationError } from "../_shared/http.ts";
import {
  memoryThemeCreateInput,
  type MemoryThemeCreateInput,
  memoryThemePatchInput,
  type MemoryThemePatchInput,
} from "../_shared/schemas.ts";
import { serviceClient } from "../_shared/supabase.ts";

const COLS = "id, label, description, enabled, created_at, updated_at";

// deno-lint-ignore no-explicit-any
function shape(t: any) {
  return {
    id: t.id,
    label: t.label,
    description: t.description ?? null,
    enabled: t.enabled,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const segs = subPath(req, "memory-themes");
  const svc = serviceClient();

  // GET /memory-themes
  if (req.method === "GET" && segs.length === 0) {
    const { data } = await svc.from("user_memory_themes")
      .select(COLS).eq("user_id", user.id).order("created_at", { ascending: true });
    return json({ themes: (data ?? []).map(shape) });
  }

  // POST /memory-themes
  if (req.method === "POST" && segs.length === 0) {
    const body = parse<MemoryThemeCreateInput>(memoryThemeCreateInput, await readJson(req));
    const { data, error } = await svc.from("user_memory_themes").insert({
      user_id: user.id,
      label: body.label,
      description: body.description ?? null,
      enabled: body.enabled ?? true,
    }).select(COLS).single();
    if (error || !data) throw new HttpError(400, error?.message ?? "Could not save theme.");
    return json({ theme: shape(data) }, 201);
  }

  // /memory-themes/:id  (PATCH | DELETE)
  if (segs.length === 1) {
    const id = segs[0];
    // Confirm ownership before mutating (defense in depth alongside RLS).
    const { data: existing } = await svc.from("user_memory_themes")
      .select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!existing) throw new HttpError(404, "Theme not found.");

    if (req.method === "PATCH") {
      const body = parse<MemoryThemePatchInput>(memoryThemePatchInput, await readJson(req));
      const patch: Record<string, unknown> = {};
      if (body.label !== undefined) patch.label = body.label;
      if (body.description !== undefined) patch.description = body.description;
      if (body.enabled !== undefined) patch.enabled = body.enabled;
      if (Object.keys(patch).length === 0) throw new ValidationError("Nothing to update.");
      const { data, error } = await svc.from("user_memory_themes")
        .update(patch).eq("id", id).eq("user_id", user.id).select(COLS).single();
      if (error || !data) throw new HttpError(400, error?.message ?? "Could not update theme.");
      return json({ theme: shape(data) });
    }

    if (req.method === "DELETE") {
      await svc.from("user_memory_themes").delete().eq("id", id).eq("user_id", user.id);
      return json({ ok: true });
    }
  }

  throw new ValidationError("Use GET/POST /memory-themes or PATCH/DELETE /memory-themes/:id");
}));
