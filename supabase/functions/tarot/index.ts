// POST /tarot/draw   -> { spread, question? }. Daily spread is free; richer
//                       spreads require Premium. Interpretation is generated in voice.
// GET  /tarot         -> recent readings
import { getUser } from "../_shared/auth.ts";
import { json, parse, PaymentRequiredError, serve, subPath, ValidationError } from "../_shared/http.ts";
import { tarotDrawInput, type TarotDrawInput } from "../_shared/schemas.ts";
import { requirePremium } from "../_shared/entitlements.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { logEvent } from "../_shared/log.ts";
import { drawSpread } from "../_shared/engines/tarot.ts";
import { llm } from "../_shared/llm.ts";
import type { TarotCard } from "../_shared/engines/types.ts";

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const segs = subPath(req, "tarot");
  const svc = serviceClient();

  if (req.method === "GET") {
    const { data } = await svc.from("tarot_readings")
      .select("id, spread, cards, question, interpretation, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    return json({ readings: data ?? [] });
  }

  if (req.method !== "POST" || segs[0] !== "draw") throw new ValidationError("Use POST /tarot/draw");

  const body = parse<TarotDrawInput>(tarotDrawInput, await req.json());

  // Entitlement gate: anything beyond the daily single card needs Premium.
  if (body.spread !== "daily") {
    try {
      await requirePremium(user.id);
    } catch {
      throw new PaymentRequiredError("Multi-card spreads are part of Soluna Premium.");
    }
  }

  const draw = await drawSpread(body.spread, { userId: user.id, question: body.question });
  const interpretation = await interpret(draw.cards, body.question);

  const { data } = await svc.from("tarot_readings").insert({
    user_id: user.id,
    spread: body.spread,
    cards: draw.cards,
    question: body.question ?? null,
    interpretation,
  }).select("id, spread, cards, question, interpretation, created_at").single();

  await logEvent("llm_call", { kind: "tarot", spread: body.spread }, user.id);
  return json({ reading: data });
}));

async function interpret(cards: TarotCard[], question?: string): Promise<string> {
  const list = cards.map((c) => `${c.positionMeaning ?? "Card"}: ${c.name} — ${c.uprightMeaning}`).join("\n");
  try {
    return await llm.complete(
      [{
        role: "user",
        content:
          `Give a warm, cohesive tarot interpretation${question ? ` for the question: "${question}"` : ""}.\n` +
          `Cards:\n${list}\n\nTie them into one supportive narrative ending with a gentle takeaway.`,
      }],
      { temperature: 0.7, maxTokens: 500 },
    );
  } catch (_e) {
    return "Here's your spread. " + cards.map((c) => `${c.positionMeaning}: ${c.uprightMeaning}`).join(" ") +
      " Take what resonates and leave the rest — the cards are a mirror, not a verdict.";
  }
}
