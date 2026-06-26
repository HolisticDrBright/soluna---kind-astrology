/**
 * Dynamic context gathering for the knowledge layer.
 *
 * Reads ONLY the current user's own data and distils it into minimised signals
 * (tags + an active-focus summary). Privacy rules enforced here:
 *  - Raw journal text is NEVER returned or forwarded — only distilled tags.
 *  - A connection contributes only "involved + lens", never its birth chart.
 *  - A connection is used only when the user owns the focus that references it.
 */

import { getSupabaseAdmin } from "../supabase.ts";
import { tagsFromText } from "../knowledge/synthesis-rules.ts";
import type { SynthesisTag } from "../knowledge/types.ts";

export interface DynamicContext {
  journalThemeTags: SynthesisTag[];
  focus: { category?: string; problemText?: string } | null;
  connection: { involved: boolean; lens?: string } | null;
}

const EMPTY: DynamicContext = { journalThemeTags: [], focus: null, connection: null };

export async function gatherDynamicContext(userId: string): Promise<DynamicContext> {
  try {
    const sb = getSupabaseAdmin();

    // Recent journals (own) -> theme tags only. Raw bodies never leave here.
    const { data: journals } = await sb
      .from("journal_entries")
      .select("body, tags")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const jTags = new Set<SynthesisTag>();
    for (const j of journals ?? []) {
      for (const t of tagsFromText(String(j.body ?? ""))) jTags.add(t);
    }

    // Most recent active focus.
    const { data: focuses } = await sb
      .from("focuses")
      .select("category, problem_text, selected_connection_id, allowed_context, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1);

    const f = focuses?.[0] ?? null;
    const focus = f ? { category: f.category as string, problemText: f.problem_text as string } : null;

    // Connection — only if the user's active focus references one they own.
    let connection: { involved: boolean; lens?: string } | null = null;
    const allowConn = !f?.allowed_context || (f.allowed_context as Record<string, unknown>)?.use_connection !== false;
    if (f?.selected_connection_id && allowConn) {
      const { data: conn } = await sb
        .from("connections")
        .select("lens")
        .eq("id", f.selected_connection_id)
        .eq("user_id", userId) // ownership check — never another user's record
        .single();
      if (conn) connection = { involved: true, lens: conn.lens as string };
    }

    return { journalThemeTags: [...jTags], focus, connection };
  } catch (_err) {
    // Dynamic context is best-effort; never block a reading on it.
    return EMPTY;
  }
}
