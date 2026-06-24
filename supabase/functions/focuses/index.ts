// Soluna Focus — dynamic, user-led guidance around a real-life situation.
//   GET    /focuses                list the user's focuses (?status= filter)
//   POST   /focuses                create + generate first guidance
//   GET    /focuses/:id            focus + latest guidance + check-ins
//   PATCH  /focuses/:id            update title/status/supportMode/context/person
//   POST   /focuses/:id/checkin    add a check-in + updated guidance
//   DELETE /focuses/:id            delete the focus (cascades guidance + check-ins)
//
// Privacy: raw problem text is returned only to its owner (RLS-scoped) and is
// NEVER written to logs — we log metadata only.
import { getUser } from "../_shared/auth.ts";
import { HttpError, json, parse, readJson, serve, subPath, ValidationError } from "../_shared/http.ts";
import {
  focusCheckinInput,
  type FocusCheckinInput,
  focusCreateInput,
  type FocusCreateInput,
  focusPatchInput,
  type FocusPatchInput,
} from "../_shared/schemas.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { logEvent } from "../_shared/log.ts";
import { buildFocusContext, type FocusInput } from "../_shared/focus/context.ts";
import { generateFocusCheckinGuidance, generateFocusGuidance } from "../_shared/focus/guidance.ts";
import type { FocusContext } from "../_shared/focus/types.ts";

const FOCUS_COLS =
  "id, category, title, problem_text, support_mode, selected_connection_id, selected_bond_id, allowed_context, status, created_at, updated_at, resolved_at";

// deno-lint-ignore no-explicit-any
function shapeFocus(r: any) {
  return {
    id: r.id,
    category: r.category,
    title: r.title ?? null,
    problemText: r.problem_text,
    supportMode: r.support_mode,
    selectedConnectionId: r.selected_connection_id ?? null,
    selectedBondId: r.selected_bond_id ?? null,
    allowedContext: r.allowed_context ?? {},
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    resolvedAt: r.resolved_at ?? null,
  };
}

// deno-lint-ignore no-explicit-any
async function assertConnectionOwned(svc: any, userId: string, id: string) {
  const { data } = await svc.from("connections").select("id").eq("id", id).eq("user_id", userId).maybeSingle();
  if (!data) throw new HttpError(404, "That connection isn't yours or doesn't exist.");
}
// deno-lint-ignore no-explicit-any
async function assertBondAllowed(svc: any, userId: string, id: string) {
  const { data } = await svc.from("partner_links").select("id, user_a, user_b, status").eq("id", id).maybeSingle();
  if (!data || (data.user_a !== userId && data.user_b !== userId) || data.status !== "active") {
    throw new HttpError(404, "That Bond isn't available to you.");
  }
}

function toFocusInput(focus: ReturnType<typeof shapeFocus>): FocusInput {
  return {
    category: focus.category,
    title: focus.title ?? undefined,
    problemText: focus.problemText,
    supportMode: focus.supportMode,
    selectedConnectionId: focus.selectedConnectionId,
    selectedBondId: focus.selectedBondId,
    allowedContext: focus.allowedContext,
  };
}

// Metadata-only audit — NEVER the problem text.
function logMeta(
  ctx: FocusContext,
  focus: ReturnType<typeof shapeFocus>,
  usedFallback: boolean,
  kind: string,
  userId: string,
) {
  return logEvent(ctx.crisis ? "guardrail_trip" : "llm_call", {
    kind,
    category: focus.category,
    supportMode: focus.supportMode,
    hasConnection: !!focus.selectedConnectionId,
    hasBond: !!focus.selectedBondId,
    included: ctx.included,
    usedFallback,
    crisis: ctx.crisis,
  }, userId);
}

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const segs = subPath(req, "focuses");
  const svc = serviceClient();

  // ── GET /focuses ──
  if (req.method === "GET" && segs.length === 0) {
    const status = new URL(req.url).searchParams.get("status");
    let q = svc.from("focuses").select(FOCUS_COLS).eq("user_id", user.id);
    if (status) q = q.eq("status", status);
    const { data } = await q.order("updated_at", { ascending: false });
    return json({ focuses: (data ?? []).map(shapeFocus) });
  }

  // ── POST /focuses ──
  if (req.method === "POST" && segs.length === 0) {
    const body = parse<FocusCreateInput>(focusCreateInput, await readJson(req));
    if (body.selectedConnectionId) await assertConnectionOwned(svc, user.id, body.selectedConnectionId);
    if (body.selectedBondId) await assertBondAllowed(svc, user.id, body.selectedBondId);

    const { data: row, error } = await svc.from("focuses").insert({
      user_id: user.id,
      category: body.category,
      title: body.title ?? null,
      problem_text: body.problemText,
      support_mode: body.supportMode,
      selected_connection_id: body.selectedConnectionId ?? null,
      selected_bond_id: body.selectedBondId ?? null,
      allowed_context: body.allowedContext,
    }).select(FOCUS_COLS).single();
    if (error || !row) throw new HttpError(400, error?.message ?? "Could not create focus.");
    const focus = shapeFocus(row);

    const ctx = await buildFocusContext(user.id, toFocusInput(focus), focus.id);
    const { guidance, usedFallback } = await generateFocusGuidance(ctx);
    await svc.from("focus_guidance").insert({
      focus_id: focus.id,
      user_id: user.id,
      guidance,
      evidence: guidance.evidence,
      accuracy_level: ctx.accuracy.accuracyLevel,
      confidence_notes: ctx.accuracy.confidenceNotes,
    });
    await logMeta(ctx, focus, usedFallback, "focus_guidance", user.id);
    return json({ focus, guidance, accuracy: ctx.accuracy }, 201);
  }

  // ── /focuses/:id ──
  if (segs.length >= 1) {
    const id = segs[0];
    const { data: row } = await svc.from("focuses").select(FOCUS_COLS)
      .eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!row) throw new HttpError(404, "Focus not found.");
    const focus = shapeFocus(row);

    // GET /focuses/:id
    if (req.method === "GET" && segs.length === 1) {
      const [{ data: g }, { data: checkins }] = await Promise.all([
        svc.from("focus_guidance").select("guidance, evidence, accuracy_level, confidence_notes, generated_at")
          .eq("focus_id", id).order("generated_at", { ascending: false }).limit(1).maybeSingle(),
        svc.from("focus_checkins").select("checkin_status, checkin_text, updated_guidance, created_at")
          .eq("focus_id", id).order("created_at", { ascending: false }).limit(20),
      ]);
      return json({
        focus,
        guidance: g?.guidance ?? null,
        accuracy: g
          ? { accuracyLevel: g.accuracy_level, confidenceNotes: g.confidence_notes ?? [], missingInputs: [] }
          : null,
        checkins: (checkins ?? []).map((c) => ({
          status: c.checkin_status,
          text: c.checkin_text ?? null,
          guidance: c.updated_guidance ?? null,
          createdAt: c.created_at,
        })),
      });
    }

    // PATCH /focuses/:id
    if (req.method === "PATCH" && segs.length === 1) {
      const body = parse<FocusPatchInput>(focusPatchInput, await readJson(req));
      const patch: Record<string, unknown> = {};
      if (body.title !== undefined) patch.title = body.title;
      if (body.supportMode !== undefined) patch.support_mode = body.supportMode;
      if (body.allowedContext !== undefined) patch.allowed_context = body.allowedContext;
      if (body.status !== undefined) {
        patch.status = body.status;
        patch.resolved_at = body.status === "resolved" ? new Date().toISOString() : null;
      }
      if (body.selectedConnectionId !== undefined) {
        if (body.selectedConnectionId) await assertConnectionOwned(svc, user.id, body.selectedConnectionId);
        patch.selected_connection_id = body.selectedConnectionId;
      }
      if (body.selectedBondId !== undefined) {
        if (body.selectedBondId) await assertBondAllowed(svc, user.id, body.selectedBondId);
        patch.selected_bond_id = body.selectedBondId;
      }
      if (Object.keys(patch).length === 0) throw new ValidationError("Nothing to update.");
      const { data: updated } = await svc.from("focuses").update(patch)
        .eq("id", id).eq("user_id", user.id).select(FOCUS_COLS).single();
      return json({ focus: shapeFocus(updated ?? row) });
    }

    // POST /focuses/:id/checkin
    if (req.method === "POST" && segs[1] === "checkin") {
      if (focus.status === "archived") throw new HttpError(409, "This focus is archived.");
      const body = parse<FocusCheckinInput>(focusCheckinInput, await readJson(req));
      const ctx = await buildFocusContext(user.id, toFocusInput(focus), focus.id);
      const { guidance, usedFallback } = await generateFocusCheckinGuidance(
        ctx,
        body.checkinStatus,
        body.checkinText,
      );
      await svc.from("focus_checkins").insert({
        focus_id: focus.id,
        user_id: user.id,
        checkin_status: body.checkinStatus,
        checkin_text: body.checkinText ?? null,
        updated_guidance: guidance,
      });
      // Touch the focus so it sorts to the top.
      await svc.from("focuses").update({ updated_at: new Date().toISOString() }).eq("id", id);
      await logMeta(ctx, focus, usedFallback, "focus_checkin", user.id);
      return json({ guidance }, 201);
    }

    // DELETE /focuses/:id
    if (req.method === "DELETE" && segs.length === 1) {
      await svc.from("focuses").delete().eq("id", id).eq("user_id", user.id);
      return json({ ok: true });
    }
  }

  throw new ValidationError("Unsupported focuses route");
}));
