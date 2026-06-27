/**
 * BaZi provider adapter — FreeAstroAPI (https://api.freeastroapi.com).
 *
 * Secrets stay backend-only (BAZI_API_KEY). The normalizer is defensive: BaZi
 * responses vary in field naming, so it accepts the common aliases and maps them
 * into the stable BaziOutput. It is pure and exported for offline unit tests; the
 * maintainer can point BAZI_API_ENDPOINT at the exact route their plan exposes.
 *
 * Nothing here fabricates: the hour pillar is forced null when birth time is
 * missing, and an empty/unrecognized response throws so computeBazi degrades to
 * an honest "unavailable" instead of a fake chart.
 */

import type { BaziInput, BaziOutput, BaziPillar, BaziLuckPillar } from "./bazi.ts";

export interface BaziFetchCtx {
  hash: string;
  missingInputs: string[];
  hasTime: boolean;
  hasLocation: boolean;
  provider?: string;
}

export interface BaziCapability {
  enabled: boolean;
  provider: string | null;
  reason: string;
}

/** Whether a real BaZi provider is configured (provider id + secret key). */
export function getBaziCapability(): BaziCapability {
  const explicit = (Deno.env.get("BAZI_PROVIDER") ?? "").trim().toLowerCase();
  const hasKey = !!Deno.env.get("BAZI_API_KEY");
  const provider = explicit || (hasKey ? "freeastroapi" : "");
  if (!provider) return { enabled: false, provider: null, reason: "BAZI_PROVIDER is not set and no BAZI_API_KEY is present." };
  if (!hasKey) return { enabled: false, provider, reason: "BAZI_API_KEY is missing (provider secret, backend-only)." };
  return { enabled: true, provider, reason: "BaZi provider configured." };
}

function envFlag(name: string, dflt: boolean): boolean {
  const v = (Deno.env.get(name) ?? "").trim().toLowerCase();
  if (v === "") return dflt;
  return v === "true" || v === "1" || v === "yes";
}

// ── small defensive helpers ──
// deno-lint-ignore no-explicit-any
function pick(o: any, ...keys: string[]): unknown {
  if (!o || typeof o !== "object") return undefined;
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  return undefined;
}
function str(v: unknown): string {
  return v === undefined || v === null ? "" : String(v);
}
function strArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" && x ? str(pick(x, "name", "stem", "label", "value")) : str(x))).filter(Boolean);
  if (typeof v === "string") return v.split(/[,/]/).map((s) => s.trim()).filter(Boolean);
  return [];
}
const ELEMENT_ALIAS: Record<string, string> = {
  wood: "wood", fire: "fire", earth: "earth", metal: "metal", water: "water",
  "木": "wood", "火": "fire", "土": "earth", "金": "metal", "水": "water",
};
function elementKey(v: unknown): string {
  const s = str(v).toLowerCase().trim();
  return ELEMENT_ALIAS[s] ?? ELEMENT_ALIAS[str(v).trim()] ?? s;
}

// deno-lint-ignore no-explicit-any
function normalizePillar(raw: any): BaziPillar | null {
  if (!raw || typeof raw !== "object") return null;
  const stem = str(pick(raw, "heavenly_stem", "heavenlyStem", "stem", "gan", "heaven_stem"));
  const branch = str(pick(raw, "earthly_branch", "earthlyBranch", "branch", "zhi", "earth_branch"));
  if (!stem && !branch) return null;
  return {
    stem,
    branch,
    element: str(pick(raw, "element", "stem_element", "stemElement", "five_element")),
    yinYang: str(pick(raw, "yin_yang", "yinYang", "polarity")) || undefined,
    animal: str(pick(raw, "animal", "zodiac", "branch_animal")) || undefined,
    hiddenStems: strArr(pick(raw, "hidden_stems", "hiddenStems", "hidden", "hidden_gan")),
    tenGod: str(pick(raw, "ten_god", "tenGod", "god", "ten_gods")) || undefined,
  };
}

// deno-lint-ignore no-explicit-any
function normalizeLuck(raw: any): BaziLuckPillar | null {
  if (!raw || typeof raw !== "object") return null;
  const stem = str(pick(raw, "heavenly_stem", "stem", "gan"));
  const branch = str(pick(raw, "earthly_branch", "branch", "zhi"));
  if (!stem && !branch) return null;
  const startAge = pick(raw, "start_age", "startAge", "age");
  const startYear = pick(raw, "start_year", "startYear", "year");
  return {
    startAge: startAge == null ? null : Number(startAge),
    startYear: startYear == null ? null : Number(startYear),
    stem,
    branch,
    element: str(pick(raw, "element", "stem_element")) || undefined,
    tenGod: str(pick(raw, "ten_god", "tenGod")) || undefined,
  };
}

/**
 * Pure normalizer for a BaZi provider response → BaziOutput. Exported for tests.
 * Throws when the response has no usable pillars so the caller degrades honestly.
 */
// deno-lint-ignore no-explicit-any
export function normalizeBazi(data: any, ctx: BaziFetchCtx): BaziOutput {
  const root = data?.data ?? data?.result ?? data ?? {};
  const pillarsRaw = pick(root, "pillars", "four_pillars", "fourPillars") ?? root;

  const year = normalizePillar(pick(pillarsRaw, "year", "year_pillar", "yearPillar"));
  const month = normalizePillar(pick(pillarsRaw, "month", "month_pillar", "monthPillar"));
  const day = normalizePillar(pick(pillarsRaw, "day", "day_pillar", "dayPillar"));
  // Hour pillar is NEVER kept without a real birth time, even if the provider guesses one.
  const hour = ctx.hasTime ? normalizePillar(pick(pillarsRaw, "hour", "hour_pillar", "hourPillar")) : null;

  if (!year && !month && !day) {
    throw new Error("bazi: no usable pillars in response");
  }

  // Day Master.
  const dmRaw = pick(root, "day_master", "dayMaster", "day_master_info");
  let dayMaster: BaziOutput["dayMaster"] = null;
  if (dmRaw && typeof dmRaw === "object") {
    dayMaster = {
      stem: str(pick(dmRaw, "stem", "heavenly_stem", "name")),
      element: elementKey(pick(dmRaw, "element", "five_element")),
      yinYang: str(pick(dmRaw, "yin_yang", "yinYang", "polarity")),
    };
  } else if (dmRaw) {
    dayMaster = { stem: str(dmRaw), element: day ? elementKey(day.element) : "", yinYang: day?.yinYang ?? "" };
  } else if (day) {
    dayMaster = { stem: day.stem, element: elementKey(day.element), yinYang: day.yinYang ?? "" };
  }

  // Five-element balance.
  const beRaw = pick(root, "five_elements", "five_element_balance", "element_balance", "elements", "element_counts");
  const fiveElementBalance: Record<string, number> = {};
  if (beRaw && typeof beRaw === "object" && !Array.isArray(beRaw)) {
    for (const [k, v] of Object.entries(beRaw as Record<string, unknown>)) {
      const ek = elementKey(k);
      const n = Number(typeof v === "object" && v ? pick(v, "count", "value", "score") : v);
      if (["wood", "fire", "earth", "metal", "water"].includes(ek) && Number.isFinite(n)) fiveElementBalance[ek] = n;
    }
  } else if (Array.isArray(beRaw)) {
    for (const item of beRaw) {
      const ek = elementKey(pick(item, "element", "name"));
      const n = Number(pick(item, "count", "value", "score"));
      if (["wood", "fire", "earth", "metal", "water"].includes(ek) && Number.isFinite(n)) fiveElementBalance[ek] = n;
    }
  }

  // Ten Gods present across the chart.
  const tenGodSet = new Set<string>();
  for (const p of [year, month, day, hour]) if (p?.tenGod) tenGodSet.add(p.tenGod);
  for (const g of strArr(pick(root, "ten_gods", "tenGods"))) tenGodSet.add(g);

  const interactionsRaw = pick(root, "interactions", "relations") ?? root;
  const luckRaw = pick(root, "luck_pillars", "luckPillars", "da_yun", "dayun", "decade_luck", "luck_cycles");
  const tstRaw = pick(root, "true_solar_time", "trueSolarTime", "solar_time");

  const partial = ctx.missingInputs.length > 0;
  const confidenceNotes: string[] = [
    "BaZi / Four Pillars is a reflective lens for self-insight and entertainment, never fixed fate.",
  ];
  if (ctx.missingInputs.includes("birth_time")) {
    confidenceNotes.push("No birth time on file, so the Hour Pillar is omitted (never guessed) and Day Master strength is approximate.");
  }
  if (ctx.missingInputs.includes("birth_location")) {
    confidenceNotes.push("No birth place on file, so true solar time isn't applied — hold near-midnight pillars loosely.");
  }

  return {
    pillars: { year, month, day, hour },
    dayMaster,
    dayMasterStrength: str(pick(root, "day_master_strength", "dayMasterStrength", "strength")) || null,
    tenGods: [...tenGodSet],
    fiveElementBalance,
    favorableElements: strArr(pick(root, "favorable_elements", "favorableElements", "useful_god", "yong_shen", "supportive_elements", "favorable")).map(elementKey).filter((e) => ["wood", "fire", "earth", "metal", "water"].includes(e)),
    unfavorableElements: strArr(pick(root, "unfavorable_elements", "unfavorableElements", "avoid_elements", "ji_shen")).map(elementKey).filter((e) => ["wood", "fire", "earth", "metal", "water"].includes(e)),
    interactions: {
      clashes: strArr(pick(interactionsRaw, "clashes", "clash", "chong")),
      combinations: strArr(pick(interactionsRaw, "combinations", "combos", "he", "combination")),
      harms: strArr(pick(interactionsRaw, "harms", "harm", "hai")),
      punishments: strArr(pick(interactionsRaw, "punishments", "punishment", "xing")),
    },
    luckPillars: Array.isArray(luckRaw) ? luckRaw.map(normalizeLuck).filter((x): x is BaziLuckPillar => !!x) : [],
    trueSolarTime: {
      applied: ctx.hasLocation && !!tstRaw,
      adjustedTime: tstRaw ? str(pick(tstRaw, "adjusted_time", "time", "value")) || null : null,
      note: ctx.hasLocation ? undefined : "true solar time requires a birth location",
    },
    source: "provider",
    provider: ctx.provider ?? "freeastroapi",
    partial,
    missingInputs: ctx.missingInputs,
    confidenceNotes,
    sourceInputHash: ctx.hash,
  };
}

/** Call the configured BaZi provider. Throws on any failure (caller degrades). */
export async function fetchBazi(input: BaziInput, ctx: BaziFetchCtx): Promise<BaziOutput> {
  const cap = getBaziCapability();
  if (!cap.enabled) throw new Error(`bazi disabled: ${cap.reason}`);
  const key = Deno.env.get("BAZI_API_KEY")!;
  const base = (Deno.env.get("BAZI_API_BASE_URL") || "https://api.freeastroapi.com").replace(/\/$/, "");
  let endpoint = (Deno.env.get("BAZI_API_ENDPOINT") || "/bazi").trim();
  if (!endpoint.startsWith("/")) endpoint = `/${endpoint}`;

  const [y, mo, d] = input.date.split("-").map(Number);
  const [h, mi] = (input.time ?? "00:00").split(":").map(Number);

  const body: Record<string, unknown> = {
    year: y, month: mo, day: d,
    timezone: input.timezone,
    true_solar_time: envFlag("BAZI_ENABLE_TRUE_SOLAR_TIME", true) && ctx.hasLocation,
    luck_cycles: envFlag("BAZI_ENABLE_LUCK_CYCLES", true),
  };
  if (ctx.hasTime) { body.hour = h; body.minute = mi; }
  if (ctx.hasLocation) { body.latitude = input.lat; body.longitude = input.lng; }

  const resp = await fetch(`${base}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`bazi provider ${resp.status}`);
  return normalizeBazi(await resp.json(), { ...ctx, provider: cap.provider ?? "freeastroapi" });
}
