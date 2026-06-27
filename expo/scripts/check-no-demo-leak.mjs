#!/usr/bin/env node
// ─── Demo-data leak guard ────────────────────────────────────────────────────
// Fails (exit 1) if fake/demo content could reach live/production mode.
// Runnable with plain Node, no deps:  npm run check:demo   (from expo/)
//
// It enforces three things:
//   1. Any user-facing file that imports @/constants/demoData must also reference
//      a demo-mode gate (isDemoMode / USE_MOCK_DATA), so the demo data can only
//      render in demo mode.
//   2. The production-safe module (@/constants/mockData) must NEVER be used to
//      import a known demo export — those live in demoData.
//   3. state/useAppState.ts builds the live user from real data only: it never
//      spreads MOCK_USER, only references MOCK_USER behind a demo gate, and each
//      per-lens builder returns null (no mock fallback) when data is missing.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOTS = ["app", "state", "components"];

// User-specific FAKE exports that must only ever come from demoData (gated).
const DEMO_NAMES = [
  "MOCK_USER", "MOCK_NUMEROLOGY", "MOCK_CHINESE", "MOCK_HUMAN_DESIGN", "MOCK_CHAT_HISTORY",
  "CONNECTIONS", "JOURNAL_ENTRIES", "MOCK_FOCUS_RESULTS", "MOCK_ACTIVE_FOCUSES",
  "MOCK_WEEKLY_REPORT", "MOCK_PATTERN_THEMES", "MOCK_BOND_RITUALS", "CURRENT_TRANSITS",
  "SYNTHESIS_THEMES", "DAILY_READINGS", "MOCK_THREE_CARD_READING", "SOLUNA_SHIFTS",
  "WIDGET_PREVIEWS", "RITUALS", "getReadingForDate",
];

const GATE = /isDemoMode|USE_MOCK_DATA|EXPO_PUBLIC_USE_MOCK_DATA/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if ([".ts", ".tsx"].includes(extname(p))) out.push(p);
  }
  return out;
}

const errors = [];
const files = ROOTS.flatMap((r) => walk(r));

for (const file of files) {
  const src = readFileSync(file, "utf8");

  // (1) demo import must be gated.
  if (/from\s+["']@\/constants\/demoData["']/.test(src) && !GATE.test(src)) {
    errors.push(`${file}: imports @/constants/demoData but never references a demo-mode gate (isDemoMode / USE_MOCK_DATA).`);
  }

  // (2) no demo export imported from the production-safe module.
  const mockImports = src.match(/import[^;]*from\s+["']@\/constants\/mockData["']/g) ?? [];
  for (const raw of mockImports) {
    const imp = raw.replace(/\s+/g, " ");
    for (const name of DEMO_NAMES) {
      if (new RegExp(`[{,] ?${name} ?[,}]`).test(imp)) {
        errors.push(`${file}: imports demo export '${name}' from @/constants/mockData — it must come from @/constants/demoData (gated).`);
      }
    }
  }
}

// (3) useAppState.ts invariants — the heart of "no MOCK_USER in live mode".
const appState = readFileSync("state/useAppState.ts", "utf8");
if (/\.\.\.\s*MOCK_USER/.test(appState)) {
  errors.push("state/useAppState.ts: spreads ...MOCK_USER — live users would inherit demo data. Build UserData from the real /me payload only.");
}
for (const line of appState.split("\n")) {
  if (/\bMOCK_USER\b/.test(line) && !/useMockData|isDemoMode/.test(line) && !/^\s*\/\//.test(line) && !/^import/.test(line)) {
    errors.push(`state/useAppState.ts: ungated MOCK_USER use → ${line.trim()}`);
  }
}
for (const fn of ["buildChartData", "buildNumerologyData", "buildChineseData", "buildHumanDesignData"]) {
  const body = appState.match(new RegExp(`function ${fn}[\\s\\S]*?\\n\\}`, "m"))?.[0] ?? "";
  if (!body) errors.push(`state/useAppState.ts: ${fn}() not found.`);
  else {
    if (!/return null/.test(body)) errors.push(`state/useAppState.ts: ${fn}() must return null when live data is missing (no mock fallback).`);
    if (/MOCK_USER/.test(body)) errors.push(`state/useAppState.ts: ${fn}() references MOCK_USER — remove the demo fallback.`);
  }
}

if (errors.length) {
  console.error(`✗ Demo-data leak check FAILED:\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log(`✓ Demo-data leak check passed (${files.length} files scanned): no fake data can reach live mode.`);
