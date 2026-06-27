/**
 * POST /tarot/draw — draw tarot cards
 * Entitlement-checked for spreads beyond daily.
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { validateTarotDraw } from "../_shared/schemas.ts";
import { drawCards } from "../_shared/engines/tarot.ts";
import { hasPremiumAccess, logEvent } from "../_shared/supabase.ts";
import { llmCall } from "../_shared/llm-client.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);
    const body = await req.json();

    const validation = validateTarotDraw(body);
    if (!validation.success) {
      return errorResponse(validation.error ?? "Invalid input", 400);
    }

    const { spread = "daily", question } = validation.data!;

    // Entitlement check for non-daily spreads
    if (spread !== "daily") {
      const isPremium = await hasPremiumAccess(user.userId);
      const { data: purchases } = await supabase.from("purchases")
        .select("id")
        .eq("user_id", user.userId)
        .eq("product_id", `tarot_${spread}`);

      if (!isPremium && (!purchases || purchases.length === 0)) {
        return errorResponse("Premium or one-time purchase required for full spreads. Daily card is free.", 402);
      }
    }

    // Draw cards with deterministic seed
    const seed = `${user.userId}:${new Date().toISOString().split("T")[0]}:${spread}:v1`;
    const cards = drawCards(seed, spread);

    // Generate warm interpretation via LLM
    const cardNames = cards.map((c) => `${c.name}${c.reversed ? " (reversed)" : ""}`).join(", ");
    const messages = [
      {
        role: "user" as const,
        content: `Interpret this ${spread === "daily" ? "daily card" : spread === "three_card" ? "3-card spread" : "Celtic Cross"} tarot draw in the warm Soluna voice.

Cards drawn: ${cardNames}
${question ? `Question asked: ${question}` : ""}

Return JSON:
{
  "interpretation": "warm 3-5 sentence interpretation",
  "positions": [{"name": "card name", "meaning": "short meaning per position"}],
  "nudge": "one concrete, kind nudge for the day"
}`,
      },
    ];

    let interpretation: string;
    let positions: Array<{ name: string; meaning: string }> = [];
    let nudge = "Trust the wisdom of the cards — they reflect what you already know deep down.";

    try {
      const resp = await llmCall(messages, { maxTokens: 500, temperature: 0.7 });
      const jsonMatch = resp.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        interpretation = parsed.interpretation;
        positions = parsed.positions ?? [];
        nudge = parsed.nudge ?? nudge;
      } else {
        interpretation = resp.content;
      }
    } catch {
      interpretation = `The ${cards[0]?.name ?? "cards"} invite you to reflect on what's stirring beneath the surface today. Take a moment to sit with the image and see what arises — your intuition is sharper than you think.`;
    }

    // Save reading
    const { data: saved } = await supabase.from("tarot_readings")
      .insert({
        user_id: user.userId,
        spread,
        cards: cards.map((c) => ({ name: c.name, reversed: c.reversed, arcana: c.arcana })),
        question: question ?? null,
        interpretation,
      })
      .select()
      .single();

    await logEvent("tarot_draw", { spread }, user.userId);

    return jsonResponse({
      reading: saved ?? { spread, cards, interpretation },
      cards,
      interpretation,
      positions,
      nudge,
    });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse("Unauthorized", 401);
    console.error("Tarot error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
