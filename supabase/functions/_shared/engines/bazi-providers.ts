/**
 * BaZi provider adapter — FreeAstroAPI (https://api.freeastroapi.com).
 *
 * Secrets stay backend-only (BAZI_API_KEY). The normalizer maps FreeAstroAPI's
 * real response shape into the stable BaziOutput, and is defensive about field
 * aliases so a plan/version change won't silently break it:
 *   - pillars: an ARRAY of { label, gan, zhi, gan_info, zhi_info, ten_gods } OR
 *     an object keyed by year/month/day/hour
 *   - day_master: { stem, info: { element, polarity } }
 *   - elements: { points|percentages: { Wood, Fire, ... }, dominant }
 *   - professional: { dm_strength, favorable_elements, unfavorable_elements }
 *   - luck_cycle: { pillars: [ { start_age, start_year, gan, zhi } ] }
 *   - interactions: [ { type, branches|stems, transform_to } ]
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
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" && x ? str(pick(x, "name", "stem", "gan", "label", "value")) : str(x))).filter(Boolean);
  if (typeof v === "string") return v.split(/[,/]/).map((s) => s.trim()).filter(Boolean);
  return [];
}
function dedupe(a: string[]): string[] {
  return [...new Set(a)];
}
const ELEMENTS = ["wood", "fire", "earth", "metal", "water"];
const ELEMENT_ALIAS: Record<string, string> = {
  wood: "wood", fire: "fire", earth: "earth", metal: "metal", water: "water",
  mu: "wood", huo: "fire", tu: "earth", jin: "metal", shui: "water",
  "木": "wood", "火": "fire", "土": "earth", "金": "metal", "水": "water",
};
/** Resolve an element token like "Earth (Tu)", "木", "earth" → "earth". */
function elementKey(v: unknown): string {
  const head = str(v).split("(")[0].trim(); // "Earth (Tu)" → "Earth"
  const low = head.toLowerCase();
  return ELEMENT_ALIAS[low] ?? ELEMENT_ALIAS[head] ?? low;
}
function isElement(e: string): boolean {
  return ELEMENTS.includes(e);
}

// deno-lint-ignore no-explicit-any
function normalizePillar(raw: any): BaziPillar | null {
  if (!raw || typeof raw !== "object") return null;
  // FreeAstroAPI nests element/polarity in gan_info, and zodiac/hidden in zhi_info.
  const ganInfo = pick(raw, "gan_info", "stem_info") as Record<string, unknown> | undefined;
  const zhiInfo = pick(raw, "zhi_info", "branch_info") as Record<string, unknown> | undefined;
  const stem = str(pick(raw, "heavenly_stem", "heavenlyStem", "stem", "gan", "heaven_stem"));
  const branch = str(pick(raw, "earthly_branch", "earthlyBranch", "branch", "zhi", "earth_branch"));
  if (!stem && !branch) return null;

  // ten god: { stem: "Hurting Officer", hidden: [...] } object, or a plain string.
  const tenGodsObj = pick(raw, "ten_gods", "tenGods");
  let tenGod: string | undefined = str(pick(raw, "ten_god", "tenGod", "god")) || undefined;
  if (!tenGod && tenGodsObj && typeof tenGodsObj === "object") tenGod = str(pick(tenGodsObj, "stem")) || undefined;
  else if (!tenGod && typeof tenGodsObj === "string") tenGod = tenGodsObj;

  return {
    stem,
    branch,
    element: str(pick(ganInfo, "element") ?? pick(raw, "element", "stem_element", "stemElement", "five_element")),
    yinYang: (str(pick(ganInfo, "polarity") ?? pick(raw, "yin_yang", "yinYang", "polarity")) || undefined),
    animal: (str(pick(zhiInfo, "zodiac") ?? pick(raw, "animal", "zodiac", "branch_animal")) || undefined),
    hiddenStems: strArr(pick(zhiInfo, "hidden") ?? pick(raw, "hidden_stems", "hiddenStems", "hidden", "hidden_gan")),
    tenGod,
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

/** Find a pillar by label whether `pillars` is an array or an object. */
// deno-lint-ignore no-explicit-any
function pillarByLabel(pillarsRaw: any, label: string): unknown {
  if (Array.isArray(pillarsRaw)) {
    return pillarsRaw.find((p) => str(pick(p, "label", "name", "type")).toLowerCase() === label);
  }
  return pick(pillarsRaw, label, `${label}_pillar`, `${label}Pillar`);
}

/**
 * Pure normalizer for a BaZi provider response → BaziOutput. Exported for tests.
 * Throws when the response has no usable pillars so the caller degrades honestly.
 */
// deno-lint-ignore no-explicit-any
export function normalizeBazi(data: any, ctx: BaziFetchCtx): BaziOutput {
  const root = data?.data ?? data?.result ?? data ?? {};
  const pillarsRaw = pick(root, "pillars", "four_pillars", "fourPillars") ?? root;
  // deno-lint-ignore no-explicit-any
  const professional = (pick(root, "professional", "analysis") ?? {}) as any;

  const year = normalizePillar(pillarByLabel(pillarsRaw, "year"));
  const month = normalizePillar(pillarByLabel(pillarsRaw, "month"));
  const day = normalizePillar(pillarByLabel(pillarsRaw, "day"));
  // Hour pillar is NEVER kept without a real birth time, even if the provider guesses one.
  const hour = ctx.hasTime ? normalizePillar(pillarByLabel(pillarsRaw, "hour")) : null;

  if (!year && !month && !day) {
    throw new Error("bazi: no usable pillars in response");
  }

  // Day Master. FreeAstroAPI: { stem, info: { element, polarity } }.
  const dmRaw = pick(root, "day_master", "dayMaster", "day_master_info");
  let dayMaster: BaziOutput["dayMaster"] = null;
  if (dmRaw && typeof dmRaw === "object") {
    const dmInfo = pick(dmRaw, "info") as Record<string, unknown> | undefined;
    dayMaster = {
      stem: str(pick(dmRaw, "stem", "heavenly_stem", "name")),
      element: elementKey(pick(dmInfo, "element") ?? pick(dmRaw, "element", "five_element")),
      yinYang: str(pick(dmInfo, "polarity") ?? pick(dmRaw, "yin_yang", "yinYang", "polarity")),
    };
  } else if (dmRaw) {
    dayMaster = { stem: str(dmRaw), element: day ? elementKey(day.element) : "", yinYang: day?.yinYang ?? "" };
  } else if (day) {
    dayMaster = { stem: day.stem, element: elementKey(day.element), yinYang: day.yinYang ?? "" };
  }

  // Five-element balance. FreeAstroAPI nests counts under elements.points / .percentages.
  const elementsRaw = pick(root, "five_elements", "five_element_balance", "element_balance", "elements", "element_counts");
  let balanceSource: unknown = elementsRaw;
  if (elementsRaw && typeof elementsRaw === "object" && !Array.isArray(elementsRaw)) {
    balanceSource = pick(elementsRaw, "points", "counts", "scores", "percentages") ?? elementsRaw;
  }
  const fiveElementBalance: Record<string, number> = {};
  if (balanceSource && typeof balanceSource === "object" && !Array.isArray(balanceSource)) {
    for (const [k, v] of Object.entries(balanceSource as Record<string, unknown>)) {
      const ek = elementKey(k);
      const n = Number(typeof v === "object" && v ? pick(v, "count", "value", "score") : v);
      if (isElement(ek) && Number.isFinite(n)) fiveElementBalance[ek] = n;
    }
  } else if (Array.isArray(balanceSource)) {
    for (const item of balanceSource) {
      const ek = elementKey(pick(item, "element", "name"));
      const n = Number(pick(item, "count", "value", "score", "points"));
      if (isElement(ek) && Number.isFinite(n)) fiveElementBalance[ek] = n;
    }
  }

  // Ten Gods present across the chart.
  const tenGodSet = new Set<string>();
  for (const p of [year, month, day, hour]) if (p?.tenGod) tenGodSet.add(p.tenGod);
  for (const g of strArr(pick(root, "ten_gods", "tenGods"))) tenGodSet.add(g);

  // Interactions: FreeAstroAPI returns an array of typed relations; older shapes
  // return an object of string arrays. Support both.
  const interactionsRaw = pick(root, "interactions", "relations");
  const clashes: string[] = [], combinations: string[] = [], harms: string[] = [], punishments: string[] = [];
  if (Array.isArray(interactionsRaw)) {
    for (const it of interactionsRaw) {
      const typeLabel = str(pick(it, "type", "name"));
      const type = typeLabel.toLowerCase();
      const parts = [...strArr(pick(it, "branches")), ...strArr(pick(it, "stems"))];
      const to = str(pick(it, "transform_to", "transformTo"));
      const label = `${parts.join("–")}${to ? ` → ${to}` : ""}${typeLabel ? ` (${typeLabel})` : ""}`.trim();
      if (!label) continue;
      if (/combin|combo|\bhe\b|harmony/.test(type)) combinations.push(label);
      else if (/harm|hai/.test(type)) harms.push(label);
      else if (/punish|xing/.test(type)) punishments.push(label);
      else if (/clash|chong|break|\bpo\b|destruct/.test(type)) clashes.push(label);
    }
  } else {
    const o = interactionsRaw ?? root;
    clashes.push(...strArr(pick(o, "clashes", "clash", "chong")));
    combinations.push(...strArr(pick(o, "combinations", "combos", "he", "combination")));
    harms.push(...strArr(pick(o, "harms", "harm", "hai")));
    punishments.push(...strArr(pick(o, "punishments", "punishment", "xing")));
  }

  // Luck pillars. FreeAstroAPI: luck_cycle.pillars[]. Older: an array directly.
  let luckRaw = pick(root, "luck_pillars", "luckPillars", "da_yun", "dayun", "decade_luck", "luck_cycles", "luck_cycle");
  if (luckRaw && !Array.isArray(luckRaw) && typeof luckRaw === "object") {
    luckRaw = pick(luckRaw, "pillars", "luck_pillars", "cycles") ?? [];
  }
  const luckPillars = Array.isArray(luckRaw)
    ? luckRaw.map(normalizeLuck).filter((x): x is BaziLuckPillar => !!x)
    : [];

  // Favorable / unfavorable ("yong shen") — top-level or under professional.
  const favRaw = pick(root, "favorable_elements", "favorableElements", "useful_god", "yong_shen", "supportive_elements", "favorable") ??
    pick(professional, "favorable_elements", "yong_shen_candidates", "favorable");
  const unfavRaw = pick(root, "unfavorable_elements", "unfavorableElements", "avoid_elements", "ji_shen") ??
    pick(professional, "unfavorable_elements", "avoid");
  const favorableElements = dedupe(strArr(favRaw).map(elementKey).filter(isElement));
  const unfavorableElements = dedupe(strArr(unfavRaw).map(elementKey).filter(isElement));

  const dayMasterStrength = str(
    pick(root, "day_master_strength", "dayMasterStrength", "strength") ??
    pick(professional, "dm_strength", "day_master_strength", "strength"),
  ) || null;

  // True solar time: explicit field, else FreeAstroAPI's astro_debug.
  const astroDebug = pick(root, "astro_debug", "astroDebug") as Record<string, unknown> | undefined;
  const tstRaw = pick(root, "true_solar_time", "trueSolarTime", "solar_time") as Record<string, unknown> | undefined;
  const adjustedTime = tstRaw
    ? (str(pick(tstRaw, "adjusted_time", "time", "value")) || null)
    : (str(pick(astroDebug, "effective_solar_time_local", "effective_solar_time")) || null);

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
    dayMasterStrength,
    tenGods: [...tenGodSet],
    fiveElementBalance,
    favorableElements,
    unfavorableElements,
    interactions: { clashes, combinations, harms, punishments },
    luckPillars,
    trueSolarTime: {
      applied: ctx.hasLocation && (!!tstRaw || !!astroDebug),
      adjustedTime,
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

  // Send both discrete fields and an ISO datetime so common FreeAstroAPI request
  // shapes are covered; override the route with BAZI_API_ENDPOINT if your plan differs.
  const body: Record<string, unknown> = {
    year: y, month: mo, day: d,
    datetime: ctx.hasTime ? `${input.date}T${input.time}` : input.date,
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
