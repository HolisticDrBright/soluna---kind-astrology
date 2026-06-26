/**
 * Soluna Output QA runner.
 *
 * Two modes, one command:
 *   - ALWAYS: deterministic analysis of every QA scenario (selection + prompt
 *     shape): banned-language scan, no-fabrication, safety routing, confidence,
 *     practical-action availability, and cross-scenario variety. No network.
 *   - WHEN LLM KEYS ARE PRESENT: also generates a live sample reading per scenario
 *     and scans the real model output for banned/fatalistic language.
 *
 * It writes a Markdown report to docs/qa/soluna-output-qa-report.md.
 *
 * Run (deterministic only):
 *   deno run --allow-read --allow-env --allow-write scripts/run-output-qa.ts
 * Run (with live samples), set one of LLM_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY
 * and add --allow-net, optionally --sample=N to cap live calls:
 *   deno run --allow-read --allow-env --allow-write --allow-net scripts/run-output-qa.ts --sample=12
 */

import { selectKnowledge } from "../supabase/functions/_shared/knowledge/selectKnowledge.ts";
import { formatKnowledgeForPrompt } from "../supabase/functions/_shared/knowledge/formatKnowledgeForPrompt.ts";
import { scanForBannedLanguage } from "../supabase/functions/_shared/knowledge/tone-safety-rules.ts";
import { QA_SCENARIOS, type QaScenario } from "../supabase/functions/_shared/tests/fixtures/output-qa-scenarios.ts";

const REPORT_PATH = "docs/qa/soluna-output-qa-report.md";

function hasLlmKey(): boolean {
  return !!(Deno.env.get("LLM_API_KEY") || Deno.env.get("OPENAI_API_KEY") || Deno.env.get("ANTHROPIC_API_KEY"));
}

function userPrompt(s: QaScenario): string {
  return s.context.userMessage ?? s.context.focus?.problemText ?? `Give me my ${s.kind.replace(/_/g, " ")} reading.`;
}

interface Row {
  id: string;
  kind: string;
  cards: number;
  confidence: string;
  actions: string;
  safety: string;
  fabrication: boolean;
  bannedInCards: string[];
  liveBanned?: string[];
  liveOk?: boolean;
}

function analyze(s: QaScenario): Row {
  const sel = selectKnowledge(s.context);
  const bannedInCards: string[] = [];
  for (const c of sel.selectedKnowledgeCards) {
    if (c.system === "tone") continue;
    const text = [c.plainMeaning, ...c.strengths, ...c.growthEdges, ...c.confidenceNotes].join(" ");
    for (const h of scanForBannedLanguage(text)) bannedInCards.push(`${c.id}:${h.match}`);
  }
  const fabrication = !!s.expect.noWesternCards && sel.selectedKnowledgeCards.some((c) => c.system === "western_astrology");
  return {
    id: s.id,
    kind: s.kind,
    cards: sel.selectedKnowledgeCards.length,
    confidence: sel.confidenceLabel,
    actions: sel.suggestedActionTypes.join("|") || "(none)",
    safety: sel.safetyWarnings.map((w) => w.category).join(",") || "—",
    fabrication,
    bannedInCards,
  };
}

async function generateLive(s: QaScenario, rows: Row[]): Promise<void> {
  const { llmCall } = await import("../supabase/functions/_shared/llm-client.ts");
  const sel = selectKnowledge(s.context);
  const { knowledgeBlock, responseGuide, safetyDirective } = formatKnowledgeForPrompt(sel);
  const system = [knowledgeBlock, "", responseGuide, safetyDirective].filter(Boolean).join("\n");
  const row = rows.find((r) => r.id === s.id)!;
  try {
    const resp = await llmCall(
      [{ role: "system", content: system }, { role: "user", content: userPrompt(s) }],
      { maxTokens: 500, temperature: 0.7 },
    );
    const banned = scanForBannedLanguage(resp.content).map((h) => h.match);
    row.liveBanned = banned;
    row.liveOk = banned.length === 0;
  } catch (err) {
    row.liveBanned = [`(generation error: ${err instanceof Error ? err.message : String(err)})`];
    row.liveOk = false;
  }
}

function pct(n: number, d: number): string {
  return d === 0 ? "n/a" : `${Math.round((n / d) * 100)}%`;
}

function buildReport(rows: Row[], live: boolean, stampedAt: string): string {
  const total = rows.length;
  const clean = rows.filter((r) => r.bannedInCards.length === 0).length;
  const noFab = rows.filter((r) => !r.fabrication).length;
  const withAction = rows.filter((r) => r.actions !== "(none)").length;
  const confidences = new Map<string, number>();
  const byKind = new Map<string, number>();
  for (const r of rows) {
    confidences.set(r.confidence, (confidences.get(r.confidence) ?? 0) + 1);
    byKind.set(r.kind, (byKind.get(r.kind) ?? 0) + 1);
  }
  const distinctActionSets = new Set(rows.map((r) => r.actions)).size;

  const lines: string[] = [];
  lines.push("# Soluna Output QA Report");
  lines.push("");
  lines.push(`_Generated: ${stampedAt} · ${total} scenarios · mode: ${live ? "deterministic + live LLM samples" : "deterministic only"}_`);
  lines.push("");
  lines.push("This report is produced by `scripts/run-output-qa.ts`. The deterministic checks run with no network; live samples run only when an LLM key is set.");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Check | Result |");
  lines.push("| --- | --- |");
  lines.push(`| Scenarios | ${total} |`);
  lines.push(`| No banned language in selected cards | ${clean}/${total} (${pct(clean, total)}) |`);
  lines.push(`| No fabricated placements when chart unavailable | ${noFab}/${total} (${pct(noFab, total)}) |`);
  lines.push(`| Practical next-step seed available | ${withAction}/${total} (${pct(withAction, total)}) |`);
  lines.push(`| Distinct suggested-action sets (variety) | ${distinctActionSets} |`);
  lines.push(`| Distinct confidence labels (variety) | ${confidences.size} |`);
  if (live) {
    const liveScanned = rows.filter((r) => r.liveOk !== undefined).length;
    const liveClean = rows.filter((r) => r.liveOk).length;
    lines.push(`| Live LLM samples clean of banned language | ${liveClean}/${liveScanned} (${pct(liveClean, liveScanned)}) |`);
  }
  lines.push("");
  lines.push("## Coverage by category");
  lines.push("");
  lines.push("| Category | Scenarios |");
  lines.push("| --- | --- |");
  for (const [k, n] of [...byKind.entries()].sort()) lines.push(`| ${k} | ${n} |`);
  lines.push("");
  lines.push("## Confidence distribution");
  lines.push("");
  for (const [c, n] of [...confidences.entries()].sort()) lines.push(`- **${c}**: ${n}`);
  lines.push("");
  lines.push("## Per-scenario (deterministic)");
  lines.push("");
  lines.push("| Scenario | Kind | Cards | Confidence | Safety | Banned? | Fabrication? |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const r of rows) {
    lines.push(`| ${r.id} | ${r.kind} | ${r.cards} | ${r.confidence} | ${r.safety} | ${r.bannedInCards.length ? "⚠️ " + r.bannedInCards.join(", ") : "clean"} | ${r.fabrication ? "⚠️ yes" : "no"} |`);
  }
  if (live) {
    lines.push("");
    lines.push("## Live LLM sample scan");
    lines.push("");
    lines.push("| Scenario | Banned in output? |");
    lines.push("| --- | --- |");
    for (const r of rows.filter((x) => x.liveOk !== undefined)) {
      lines.push(`| ${r.id} | ${r.liveOk ? "clean" : "⚠️ " + (r.liveBanned ?? []).join(", ")} |`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

// ── main ──
const live = hasLlmKey();
const sampleArg = Deno.args.find((a) => a.startsWith("--sample="));
const sampleN = sampleArg ? Number(sampleArg.split("=")[1]) : QA_SCENARIOS.length;
const stampArg = Deno.args.find((a) => a.startsWith("--stamp="));
const stampedAt = stampArg ? stampArg.split("=")[1] : "(pass --stamp=YYYY-MM-DD)";

const rows = QA_SCENARIOS.map(analyze);
if (live) {
  console.log(`LLM key detected — generating up to ${sampleN} live samples…`);
  for (const s of QA_SCENARIOS.slice(0, sampleN)) await generateLive(s, rows);
} else {
  console.log("No LLM key — running deterministic analysis only.");
}

const report = buildReport(rows, live, stampedAt);
await Deno.mkdir("docs/qa", { recursive: true });
await Deno.writeTextFile(REPORT_PATH, report);

const offenders = rows.filter((r) => r.bannedInCards.length || r.fabrication);
console.log(`Wrote ${REPORT_PATH} — ${rows.length} scenarios, ${offenders.length} deterministic offenders.`);
if (offenders.length) {
  for (const o of offenders) console.log(`  ⚠️ ${o.id}: banned=${o.bannedInCards.join(",")} fabrication=${o.fabrication}`);
  Deno.exit(1);
}
