// GET    /connections                          -> list
// POST   /connections                          -> add (computes their blueprint summary)
// GET    /connections/:id/compatibility?lens=   -> blended compatibility (cached per lens)
import { getUser } from "../_shared/auth.ts";
import { HttpError, json, parse, serve, subPath, ValidationError } from "../_shared/http.ts";
import { connectionInput, type ConnectionInput, lensSchema } from "../_shared/schemas.ts";
import { loadBlueprint } from "../_shared/repo.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { logEvent } from "../_shared/log.ts";
import { computeBlueprint } from "../_shared/engines/blueprint.ts";
import { generateCompatibility } from "../_shared/synthesis/synthesis.ts";

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const segs = subPath(req, "connections");
  const svc = serviceClient();

  // GET /connections
  if (req.method === "GET" && segs.length === 0) {
    const { data } = await svc.from("connections")
      .select("id, name, relationship, birth_date, birth_place_label, blueprint, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    return json({ connections: data ?? [] });
  }

  // POST /connections
  if (req.method === "POST" && segs.length === 0) {
    const body = parse<ConnectionInput>(connectionInput, await req.json());
    const timeKnown = body.timeKnown ?? !!body.birthTime;
    const { blueprint } = await computeBlueprint({
      date: body.birthDate,
      time: timeKnown ? (body.birthTime ?? null) : null,
      lat: body.lat,
      lng: body.lng,
      timezone: body.timezone,
      fullName: body.name,
    });
    const { data, error } = await svc.from("connections").insert({
      user_id: user.id,
      name: body.name,
      relationship: body.relationship ?? null,
      birth_date: body.birthDate,
      birth_time: timeKnown ? (body.birthTime ?? null) : null,
      time_known: timeKnown,
      birth_place_label: body.birthPlaceLabel ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      timezone: body.timezone ?? null,
      blueprint: { summary: blueprint.summary },
    }).select("id, name, relationship, birth_date, blueprint, created_at").single();
    if (error) throw new HttpError(400, error.message);
    await logEvent("engine_compute", { source: "connection" }, user.id);
    return json({ connection: data }, 201);
  }

  // GET /connections/:id/compatibility?lens=
  if (req.method === "GET" && segs.length === 2 && segs[1] === "compatibility") {
    const connectionId = segs[0];
    const lens = parse<string>(lensSchema, new URL(req.url).searchParams.get("lens") ?? "romance");

    const { data: conn } = await svc.from("connections")
      .select("id, name, blueprint").eq("id", connectionId).eq("user_id", user.id).maybeSingle();
    if (!conn) throw new HttpError(404, "Connection not found");

    // Cache per (connection, lens).
    const { data: cached } = await svc.from("compatibility_reports")
      .select("score, body").eq("connection_id", connectionId).eq("lens", lens).maybeSingle();
    if (cached) return json({ ...cached.body, score: cached.score, cached: true });

    const self = await loadBlueprint(user.id);
    if (!self) throw new HttpError(409, "Complete onboarding first.");
    const otherSummary = conn.blueprint?.summary;
    if (!otherSummary) throw new HttpError(409, "Connection blueprint missing.");

    const { body, usedFallback } = await generateCompatibility(
      {
        name: "You",
        sunSign: self.summary.sunSign,
        moonSign: self.summary.moonSign,
        lifePath: self.summary.lifePath,
        animal: self.summary.animal,
        element: self.summary.element,
        hdType: self.summary.hdType,
        timeKnown: self.summary.timeKnown,
      },
      {
        name: conn.name,
        sunSign: otherSummary.sunSign,
        moonSign: otherSummary.moonSign,
        lifePath: otherSummary.lifePath,
        animal: otherSummary.animal,
        element: otherSummary.element,
        hdType: otherSummary.hdType,
        timeKnown: otherSummary.timeKnown,
      },
      lens,
    );

    await svc.from("compatibility_reports").upsert(
      { user_id: user.id, connection_id: connectionId, lens, score: body.overall, body },
      { onConflict: "connection_id,lens" },
    );
    await logEvent("llm_call", { kind: "compatibility", lens, usedFallback }, user.id);
    return json({ ...body, score: body.overall, cached: false });
  }

  throw new ValidationError("Unsupported route");
}));
