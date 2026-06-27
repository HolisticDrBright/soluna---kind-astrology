# Soluna Knowledge Base — Implementation Notes

How the Soluna Knowledge Base is built, where it lives, how it is wired into the
backend, what is verified, and what still needs a human.

## What was added

A structured, original, Soluna-owned knowledge base plus a deterministic
selection layer that feeds richer, kinder, more accurate context to the LLM
across Western astrology, numerology, Chinese/Eastern astrology, Human
Design-inspired concepts, and tarot/archetypes — without overclaiming certainty
or copying proprietary content.

1. **Human-readable docs** — `docs/soluna-knowledge-base/` (files `00`–`09`).
2. **Machine-readable cards** — `supabase/functions/_shared/knowledge/` (one deck
   per system, all conforming to a shared `KnowledgeCard` schema).
3. **Deterministic selection layer** — `selectKnowledge.ts`: real data in →
   relevant cards + agreement/tension/confidence/safety/actions out.
4. **Prompt construction upgrade** — Ask, Today, and compatibility now receive
   selected knowledge, synthesis signals, tone/safety rules, the user's focus,
   and minimised dynamic context.
5. **One small migration** — `advice_feedback` (helpful / not_helpful).
6. **Tests** — 30 new Deno tests (schema, selection, synthesis, safety, prompt).
7. **A latent bug fix** — Anthropic calls previously dropped every system message
   after the first, silently losing per-user context. Now merged.

## Depth upgrade (best-in-game pass)

A later pass deepened the decks and wiring substantially, while keeping every
guardrail (original content, no fabrication, kind/non-fatalistic, reflective
framing):

- **Western**: added 60 planet-in-sign cards (Mercury/Venus/Mars/Jupiter/Saturn ×
  12), 12 houses (gated on an accurate birth time), 5 core aspects, and two moon-
  phase cards. Selection now picks planet-in-sign, the Sun/Moon house cards, and
  the two tightest natal aspects — houses/aspects only from a REAL provider chart.
- **Transits**: a deterministic Moon-phase engine (real astronomy from the date)
  feeds Today/Ask; full transit-to-natal data is capability-gated and OFF until a
  plan endpoint is confirmed (`getTransitCapability`), never fabricated.
- **Tarot**: completed the full 78-card deck (all 56 Minor Arcana), keys matching
  the draw engine.
- **Eastern (Chinese zodiac)**: added the four harmony trines + a year-cycle card.
  This stays the lightweight birth-year lens.
- **BaZi / Four Pillars (new "bazi" system, provider-backed)**: a true Eastern
  depth layer via FreeAstroAPI — 44 cards (Day Masters, Ten Gods, element balance,
  pillars, luck), selected ONLY from a real chart, cached on the blueprint,
  partial/unavailable when inputs/provider are missing, with BaZi compatibility
  when both sides have a chart. Never fabricated; never fixed-fate. See primer 10.
- **Human Design-inspired**: added Identity/Heart/Spleen center cards; a test now
  forbids proprietary specifics (gates/channels/incarnation cross) and
  deterministic "you are a <type>" claims.
- **Prompt balance**: the prompt now round-robins cards across systems (cap 12) so
  deeper western depth can't crowd out multi-system synthesis.
- **Output QA**: 52 scenarios + a deterministic quality gate
  (`output_quality_test.ts`) + a live runner (`scripts/run-output-qa.ts` →
  `docs/qa/soluna-output-qa-report.md`).

### Knowledge Depth Coverage

| Area | Status | Notes |
|------|--------|-------|
| Western — signs (Sun/Moon/Rising, elements, modalities) | ✅ implemented | Moon by element; Rising needs birth time |
| Western — planet-in-sign | ✅ implemented | Mercury/Venus/Mars/Jupiter/Saturn × 12 (60 cards) |
| Western — houses | ✅ implemented | 12 cards; selected only with an accurate birth time |
| Western — aspects (natal) | ✅ implemented | 5 core aspects; selected from real provider aspects |
| Transits — Moon phase | ✅ implemented | deterministic real astronomy (date-only) |
| Transits — planet/retrograde/transit-to-natal | ⏳ depends on provider | capability-gated OFF until `ASTROLOGY_TRANSITS_ENABLED` + endpoint |
| Numerology | ✅ implemented | life path (1–9 + masters), personal day, expression, soul urge |
| Eastern — animal / element / polarity / trine / year-cycle | ✅ implemented | birth-year zodiac |
| Eastern — full BaZi / Four Pillars | ✅ implemented (provider-backed) | FreeAstroAPI; pillars / Day Master / Ten Gods / elements / luck. Off → honest "unavailable"; missing time/place → partial, never fabricated |
| BaZi compatibility | ✅ implemented | only when BOTH have a real chart; real Five-Element cycles |
| Human Design-inspired (type / authority / profile / centers) | ✅ implemented | reflective framing; no gates/channels |
| Tarot — full 78 | ✅ implemented | 22 Major + 56 Minor |
| Compatibility | ✅ implemented | real blueprint + knowledge layer (see connections endpoint) |
| Dynamic personal context | ✅ implemented | journal *themes*, active focus, connection *lens* only |
| Output QA | ✅ implemented | 52 scenarios, deterministic gate + live runner |

## Where the files live

```
docs/soluna-knowledge-base/
  00-soluna-knowledge-base-index.md     06-synthesis-matrix.md
  01-western-astrology-primer.md        07-tone-and-safety-rules.md
  02-numerology-primer.md               08-action-library.md
  03-chinese-and-eastern-astrology-primer.md  09-dynamic-advice-rules.md
  04-human-design-inspired-primer.md
  05-tarot-and-archetype-primer.md

supabase/functions/_shared/knowledge/
  types.ts                  # KnowledgeCard schema + validateCard/validateDeck
  western-astrology.ts      # 113 cards (signs, planet-in-sign, houses, aspects, phases)
  numerology.ts             # 25 cards
  eastern-astrology.ts      # 25 cards (animals, elements, polarity, trines, year-cycle)
  bazi.ts                   # 44 cards (day masters, ten gods, elements, pillars, luck)
  human-design-inspired.ts  # 30 cards (types, authorities, profiles, centers)
  tarot-archetypes.ts       # 78 cards (full deck: 22 Major + 56 Minor)
  tone-safety-rules.ts      # tone cards + BANNED_PATTERNS + scanForBannedLanguage()
  action-library.ts         # 9 reusable action types
  synthesis-rules.ts        # agreement/tension/confidence + input safety scan
  selectKnowledge.ts        # the deterministic selection layer
  formatKnowledgeForPrompt.ts  # selection -> compact prompt blocks (system-balanced)
  index.ts                  # barrel: ALL_CARDS (329) + by-id/key/tag lookups

supabase/functions/_shared/engines/
  moon-phase.ts             # deterministic real Moon phase from a date
  astrology-providers.ts    # + getTransitCapability / normalizeTransits (gated)

supabase/functions/_shared/synthesis/
  knowledge-context.ts      # gatherDynamicContext() — privacy-minimised reads
  index.ts                  # generateChatResponse / generateDailyReading upgraded

supabase/migrations/
  20260626_advice_feedback.sql
```

## How the knowledge base is used (request flow)

1. A user hits **Ask** (`/ask`) or **Today** (`/today`).
2. `buildContext()` assembles the user's REAL blueprint (provider data only).
3. For Ask, `gatherDynamicContext()` adds minimised signals: recent journal
   *themes* (tags, never raw text), the active focus, and — only if the user owns
   the focus that references it — a connection's *lens* (never its chart).
4. `selectKnowledge()` deterministically maps that context to knowledge cards and
   computes agreement, tension, a confidence label, safety warnings, and
   suggested action types. Same input → same output (unit-tested).
5. `formatKnowledgeForPrompt()` renders compact prompt blocks. Cards are balanced
   round-robin across systems (cap 12) so no single system crowds out the rest.
   The Moon phase (deterministic) is added as a transit signal.
6. The Edge Function composes a single context system message + the response
   shape + an internal safety directive, then calls the LLM. The LLM writes the
   words; it never chooses the knowledge.

The required response shape: what Soluna is seeing → why it matters → where
systems agree → where it's mixed/uncertain → one practical next step → one
reflection prompt → a gentle disclaimer where appropriate.

## Confidence labels

Assigned deterministically in `synthesis-rules.ts > confidenceLabel()`:

| Label | When |
|-------|------|
| **Strong pattern** | a tag agreed by ≥3 systems, or ≥2 agreement tags — and no tension |
| **Supportive pattern** | at least one 2-system agreement |
| **Mixed pattern** | agreement cancelled by tension, or tension with no clear agreement |
| **Reflective prompt only** | little or no signal |

## Safety model

- **Input scan** (`scanUserInputSafety`) flags self-harm/crisis, abuse, medical,
  legal, financial, third-party speculation, and fatalistic requests in the
  user's own words, and routes the reply (crisis → grounding + real support;
  medical/legal/financial → no directives; third-party → no mind-reading).
- **Output linter** (`scanForBannedLanguage`) catches "you must", certainty
  predictions, fatalistic relationship language, and medical/legal/financial
  directives — usable as a last-line guard and in tests.
- **Privacy/minimisation**: raw journals and another person's chart never reach a
  prompt; connection use requires focus ownership; `allowed_context.use_connection`
  can opt out.

## What is still static / demo-only

Frontend wiring of these screens remains demo-gated (`EXPO_PUBLIC_USE_MOCK_DATA`)
and is tracked in PR #1 — unchanged by this pass (no expo files were modified):
Soluna Shift card, cosmic-weather / energy accordions, compatibility-detail
screen, weekly report, pattern memory, widget previews, rituals, focus
result/active screens, and Ask history hydration. The backend now produces
richer Ask/Today/compatibility content; surfacing it on those specific screens is
the remaining frontend task.

## Live APIs required

No new third-party APIs. The knowledge base is self-contained TypeScript. It uses
the existing **LLM provider** (`LLM_PROVIDER` + key) and reads existing tables. As
before, **AstrologyAPI** remains the source of real placements; when it fails the
chart stays blocked and the selection layer simply resolves no astrology cards —
it never fabricates placements.

## How to test

```bash
# Backend unit tests (no network needed; pure TS)
deno test --allow-env --allow-read supabase/functions/_shared/tests
#   -> 100 passed (knowledge schema/selection/safety/prompt, moon phase, transits,
#      BaZi engine/normalizer/selection/compatibility,
#      compatibility scoring, output QA, plus the pre-existing backend tests)

# Generate the output-quality report (deterministic; add an LLM key + --allow-net
# for live samples):
deno run --allow-read --allow-env --allow-write scripts/run-output-qa.ts --stamp=YYYY-MM-DD
#   -> writes docs/qa/soluna-output-qa-report.md

# Type-check the knowledge module + touched functions
deno check supabase/functions/_shared/knowledge/index.ts \
  supabase/functions/ask/index.ts supabase/functions/today/index.ts \
  supabase/functions/connections/index.ts \
  supabase/functions/_shared/synthesis/index.ts

# Frontend (unchanged this pass)
cd expo && npx tsc --noEmit
```

## Safety / legal caveats

- All knowledge is **original Soluna interpretation**. No text was copied from
  astrology/Human Design/tarot sources or competitor apps.
- **Human Design-inspired** framing is used throughout; it is presented as a
  reflective lens, never a licensed or deterministic system. Resolve licensing
  before using literal Human Design terminology in user-facing copy.
- Nothing claims scientific certainty. Eastern astrology is kept high-level
  because only birth-year animal/element/yin-yang is available.

## Future improvements

- Surface the new structured signals (agreement/tension/confidence) on the
  demo-only screens listed above.
- Moon phase now feeds `selectKnowledge` (deterministic). Enable full transit-to-
  natal (mercury retrograde, planet transits, transit aspects) by confirming the
  plan's transit endpoint and setting `ASTROLOGY_TRANSITS_ENABLED=true` +
  `ASTROLOGY_TRANSITS_ENDPOINT` (see `getTransitCapability`).
- Use `advice_feedback` to down-weight action types a user repeatedly marks
  unhelpful.
- Expand decks (planets-in-signs, more profiles) as needed — the schema and tests
  scale without code changes.
