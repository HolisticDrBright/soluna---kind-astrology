// GET /synthesis[?theme=]
// Expanded "where your systems agree". Without ?theme, returns all converging
// themes for today. With ?theme=, returns that theme + a warm combined takeaway.
import { getUser } from "../_shared/auth.ts";
import { HttpError, json, serve } from "../_shared/http.ts";
import { loadBlueprint, loadPreferredName, todayISO } from "../_shared/repo.ts";
import { buildContext } from "../_shared/synthesis/context.ts";
import { detectAgreement } from "../_shared/synthesis/agreement.ts";
import { themeEvidence } from "../_shared/synthesis/evidence.ts";
import { llm } from "../_shared/llm.ts";

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const url = new URL(req.url);
  const themeId = url.searchParams.get("theme");
  const date = url.searchParams.get("date") ?? todayISO();

  const bp = await loadBlueprint(user.id);
  if (!bp) throw new HttpError(409, "No blueprint yet — complete onboarding first.");
  const preferredName = await loadPreferredName(user.id);

  const ctx = await buildContext(user.id, date, bp, preferredName);
  const agreement = detectAgreement(ctx);

  if (!themeId) {
    return json({
      themes: agreement.themes.map((t) => ({
        id: t.id,
        title: t.title,
        systemsAgree: t.score,
        blocks: t.evidence.map((e) => ({ system: e.system, label: e.label, signal: e.signal })),
        // Unified explainable chips (system/signal/detail/confidence/source).
        evidence: themeEvidence(t),
      })),
    });
  }

  const theme = agreement.themes.find((t) => t.id === themeId) ?? agreement.topTheme;
  const combinedTakeaway = await takeaway(theme.title, theme.evidence.map((e) => `${e.system}: ${e.signal}`));

  return json({
    id: theme.id,
    title: theme.title,
    systemsAgree: theme.score,
    blocks: theme.evidence.map((e) => ({ system: e.system, label: e.label, signal: e.signal })),
    evidence: themeEvidence(theme),
    combinedTakeaway,
  });
}));

async function takeaway(title: string, signals: string[]): Promise<string> {
  try {
    return await llm.complete(
      [{
        role: "user",
        content:
          `In 2-3 warm sentences, explain how these independent systems converge on "${title}". ` +
          `Signals: ${signals.join("; ")}. End with one gentle, encouraging line.`,
      }],
      { temperature: 0.6, maxTokens: 250 },
    );
  } catch (_e) {
    return `Several of your systems quietly agree on ${title.toLowerCase()} right now: ` +
      signals.join(" ") +
      " When independent systems point the same way, it's worth a gentle pause to listen.";
  }
}
