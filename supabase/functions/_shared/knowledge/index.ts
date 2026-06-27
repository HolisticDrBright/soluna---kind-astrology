/**
 * Knowledge base barrel — aggregates every deck and exposes lookup helpers.
 * Importing this gives you the full deck plus by-id / by-key / by-tag indexes.
 */

import type { KnowledgeCard, KnowledgeSystem, SynthesisTag } from "./types.ts";
import { westernAstrologyCards } from "./western-astrology.ts";
import { numerologyCards } from "./numerology.ts";
import { easternAstrologyCards } from "./eastern-astrology.ts";
import { baziCards } from "./bazi.ts";
import { humanDesignInspiredCards } from "./human-design-inspired.ts";
import { tarotArchetypeCards } from "./tarot-archetypes.ts";
import { toneSafetyCards } from "./tone-safety-rules.ts";
import { actionLibraryCards } from "./action-library.ts";

export * from "./types.ts";
export * from "./synthesis-rules.ts";
export { scanForBannedLanguage, BANNED_PATTERNS } from "./tone-safety-rules.ts";

export const ALL_CARDS: KnowledgeCard[] = [
  ...westernAstrologyCards,
  ...numerologyCards,
  ...easternAstrologyCards,
  ...baziCards,
  ...humanDesignInspiredCards,
  ...tarotArchetypeCards,
  ...toneSafetyCards,
  ...actionLibraryCards,
];

export const CARDS_BY_SYSTEM: Record<KnowledgeSystem, KnowledgeCard[]> = {
  western_astrology: westernAstrologyCards,
  numerology: numerologyCards,
  eastern_astrology: easternAstrologyCards,
  bazi: baziCards,
  human_design_inspired: humanDesignInspiredCards,
  tarot: tarotArchetypeCards,
  tone: toneSafetyCards,
  action: actionLibraryCards,
};

const _byId = new Map<string, KnowledgeCard>();
const _byKey = new Map<string, KnowledgeCard>(); // key -> first card with that key
const _byTag = new Map<SynthesisTag, KnowledgeCard[]>();

for (const c of ALL_CARDS) {
  _byId.set(c.id, c);
  if (!_byKey.has(c.key)) _byKey.set(c.key, c);
  for (const t of c.synthesisTags) {
    if (!_byTag.has(t)) _byTag.set(t, []);
    _byTag.get(t)!.push(c);
  }
}

export function cardById(id: string): KnowledgeCard | undefined {
  return _byId.get(id);
}

/** First card matching an engine key (e.g. "sun_aries", "life_path_7"). */
export function cardByKey(key: string): KnowledgeCard | undefined {
  return _byKey.get(key);
}

export function cardsByTag(tag: SynthesisTag): KnowledgeCard[] {
  return _byTag.get(tag) ?? [];
}

/** Find a card by key within a single system (avoids cross-system key clashes). */
export function cardByKeyInSystem(system: KnowledgeSystem, key: string): KnowledgeCard | undefined {
  return CARDS_BY_SYSTEM[system].find((c) => c.key === key);
}
