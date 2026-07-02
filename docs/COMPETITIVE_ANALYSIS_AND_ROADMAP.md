# Soluna — Competitive Analysis, Audit Findings & "Best in the Game" Roadmap

**Date:** 2026-07-02
**Sources:** The Obsidian vault (Drive) contains no standalone Soluna competitive-analysis document — the three `competitive-analysis` files there cover HolisticDrBright.com / DSpiked.com (the health venture). Soluna's competitive positioning lives inside its own build specs (`Soluna_Astrology_-_Rork_Front_End_Prompt_v2__Ultimate_` and the Claude Code backend prompt, both read in full), which bake in a competitor deep-dive: warm tone vs. cold, synthesis-as-hero, show-the-why, honest billing, non-romantic lenses, privacy. Category knowledge of specific competitors (Co-Star, The Pattern, CHANI, Sanctuary, Nebula) comes from AI training data (cutoff Jan 2026), not a vault document.
**Audit method:** two exhaustive code audits (backend: every Edge Function, engine, migration; frontend: every screen, state mapper, lib) with each finding verified at the cited file/line before inclusion.

---

## 1. Competitive position

The market leaders each own one axis:

| App | Owns | Weakness Soluna exploits |
|---|---|---|
| **Co-Star** | Brand, virality, friend graph | Deliberately cold/doomy tone; single system; black-box |
| **The Pattern** | Psychological depth | Single framework; opaque; heavy |
| **CHANI** | Warmth, values, audio production | Single system; astrologer-paced content cadence |
| **Sanctuary / Nebula** | Live readings / aggressive funnels | Monetization dark patterns; low trust |

**Soluna's wedge is real and unoccupied:** no major app reads Western + Vedic + Numerology + BaZi + Human Design + Tarot on one person and surfaces *where independent systems agree*. Combined with the enforced warm voice, the tappable "why," and honest degradation (never fabricate a chart), the design is genuinely differentiated on the four axes that create loyalty: **synthesis, warmth, explainability, honesty**.

**Verdict: A-tier product design, unproven challenger** — with one urgent caveat from the audit below: several shipped details currently *violate* the honesty axis (a decorative chart wheel labeled "verified," a Personal Day that is frozen at onboarding, a body-graph that contradicts the data next to it). The brand is honesty; these are brand-critical, not cosmetic.

---

## 2. Bug register (verified findings)

### P0 — Trust, money, correctness (fix before the next build)

| # | Finding | Where | Why it matters |
|---|---|---|---|
| P0-1 | **Natal chart wheel is decorative** — hardcodes Cancer/Pisces/Libra highlights + fixed planet angles for every user, with a "verified chart data" pill directly beneath it | `expo/app/(tabs)/blueprint.tsx:33-98, ~280` | Fake data labeled verified in the flagship paid surface — brand-fatal for an "honest astrology" app |
| P0-2 | **HD BodyGraph ignores the user's real centers** (hardcoded defined/undefined) and contradicts the accurate centers grid rendered 30 lines below | `blueprint.tsx:103-126` vs `:449-467` | Same screen shows two different truths |
| P0-3 | **Personal Day/Month/Year frozen at onboarding** — computed once at blueprint time, reused verbatim by /today, cron, synthesis themes, prompts, and the persisted reading | `_shared/engines/blueprint-service.ts:117`, `_shared/synthesis/index.ts:210` | A core daily feature is factually wrong every day after day one; also biases the "systems agree" theme the same way forever |
| P0-4 | **"Today" is the UTC date everywhere** (8+ call sites) — cache key, tarot seed, moon phase, horoscope date | `today/index.ts:39`, `generate-daily-readings:18`, `synthesis:18`, `year-ahead:47`, etc. | US-evening users get tomorrow's reading at 4–8pm local; morning reading vanishes mid-evening; header (device-local) disagrees with content |
| P0-5 | **Compatibility reports are NEVER cached** — the upsert targets `onConflict:"user_id,connection_id,lens"` but the DB only has a *partial* unique index (`where connection_id is not null`), which Postgres can't infer → 42P10 on every write, and the error is silently discarded | `connections/index.ts:176-187` + `migrations/20260625_initial_soluna_schema.sql:290-292` | Every compatibility view = 1 Guna-Milan provider call + 1 LLM call, forever; prose re-rolls between views. Silent spend at scale |
| P0-6 | **No rate limit or free-tier cap on any LLM path** — /ask has zero quota; every mood-chip tap regenerates the reading (LLM + 3 provider calls), uncached | `ask/index.ts`, `today/index.ts:44-84` | Unbounded Anthropic + FreeAstroAPI spend per user (or per scripted JWT). The spec required server-side entitlement caps |
| P0-7 | **Turning off auto-renew revokes premium instantly** — RC `CANCELLATION` (user keeps access until period end) is handled like `EXPIRATION` (`status:"inactive"`); `UNCANCELLATION` unhandled | `billing-webhook/index.ts:96-107` | Paying customers lose what they paid for; likely refunds/1-star reviews |
| P0-8 | **"House 0" shown to every birth-time-unknown user** — backend's honest `house: null` coerced to `0` in the mapper | `expo/state/useAppState.ts:140` → `blueprint.tsx:304,322`, `insight-detail.tsx:43,473` | "Your Sun lives in your 0th house" = nonsense text in the core screens |
| P0-9 | **Focus flow is a dead end in live mode** — entry cards on Today + Ask lead through a 4–5-step wizard that ends in "Coming soon" | `index.tsx:481-496`, `ask.tsx:318-335` → `focus/result.tsx:70-76` | Users invest effort and hit a wall, from two prominent tabs |
| P0-10 | **/insight global cache leaks one user's reading to all users** — cache key is (system, key) with no value (e.g. `life_path`), but the generated text embeds the first requester's own number/sign | `insight/index.ts:33-70` | Cross-user leakage of chart-derived content; dormant (app never calls it) but deployed and reachable |

### P1 — Broken flows & money leaks

| # | Finding | Where |
|---|---|---|
| P1-1 | Tarot, Journal, Rituals screens fully built (Journal/Tarot wired to live APIs) but **zero navigation reaches them**; `saveItem`/`getSaved`/`getRituals`/`getInsight`/`getAskHistory` never called | `app/tarot.tsx`, `app/journal.tsx`, `app/rituals.tsx` |
| P1-2 | "Ask Soluna about this" deep-link works **once per app session** (ref never resets; prompt also double-sends: auto-send + left in input) | `ask.tsx:158,245-252` |
| P1-3 | Cron-generated daily readings (all push users) **permanently lack moon/horoscope/BaZi-today** — worker never calls `computeDailyCosmos`; /today returns the cached row as-is | `generate-daily-readings/index.ts:62-87` |
| P1-4 | Ask context loads the **oldest 20 messages** (drops the recent ones) and duplicates the just-sent message | `ask/index.ts:87-113` |
| P1-5 | Anonymous/aliased RevenueCat purchases never map to a user — webhook skips the `revenuecat_user_mappings` table that exists for exactly this | `billing-webhook/index.ts:52-71` |
| P1-6 | Notification toggles never hydrated from server (always show defaults) and "Reading time" is a hardcoded, non-editable "8:00 AM" row (backend supports `daily_time`) | `profile.tsx:613-616,737` |
| P1-7 | Cached-user privacy leak on shared devices: cache not keyed by user id and not cleared on server-side sign-out | `lib/userCache.ts:15`, `useAppState.ts:541-561` |
| P1-8 | `useAsyncData`: refetch during initial load leaves `loading` stuck true forever (repro: add a connection while list loads → permanent spinner) | `hooks/useAsyncData.ts:45-65` |
| P1-9 | Free users can't draw any offered tarot spread (only premium spreads listed; 402 shown as raw text, no paywall route) | `app/tarot.tsx`, `tarot/index.ts:31-39` |
| P1-10 | Dead CTAs shipped live: partner "Send an invite" (no onPress), compatibility "Share this result", all Save buttons (local-state only), About rows | `connections.tsx:431,442`, `compatibility-detail.tsx:193`, `index.tsx:169`, `blueprint.tsx:165` |
| P1-11 | Chat history never restored across launches (backend persists it; app starts empty and fragments `conversation_id`) | `ask.tsx:150` |
| P1-12 | Journal entries dated a day early west of UTC; connection birth dates can shift a day (`new Date("YYYY-MM-DD")` = UTC midnight); place→timezone resolved against the wrong date if date edited after picking city | `journal.tsx:228`, `connections.tsx:21-27,107`, `onboarding.tsx:143` |
| P1-13 | `ALL_MIGRATIONS.sql` bundle stale (missing vedic/daily-cosmos/solar-return) — a DB provisioned from it makes every /today upsert fail → readings never cached, pushes silently stop | `supabase/ALL_MIGRATIONS.sql`, `today/index.ts:115-117` |
| P1-14 | Mood-chip taps give no in-flight indicator and swallow errors (looks dead for the 3–8s LLM round-trip); un-tapping refetches again | `index.tsx:160,371-381` |
| P1-15 | Live Ask bubbles show hardcoded system chips (demo user's Cancer glyph) instead of the API's `systems_referenced` | `ask.tsx:102-107` |

### P2 — Hardening & polish

- Compute-blueprint worker only ever examines the 10 oldest profiles → backfill dead (`compute-blueprint-worker:19-38`)
- Send-push notifies people who just opened the app organically; Expo per-receipt errors ignored (dead tokens never pruned) (`send-push:26-35,98-101`)
- `TRANSFER`/`PRODUCT_CHANGE` leaves subscriptions `inactive` (`billing-webhook:109-121`)
- BaZi fetch is the only provider call without retry → onboarding-burst 429 flaps it to "unavailable" (`bazi-providers.ts:364-369`)
- Chinese year pillar ignores the Feb-4 boundary → Jan/early-Feb birthdays get the wrong animal, feeding compatibility + agreement (`chinese.ts:44-56`)
- LLM calls have no timeout (providers all use 12s) (`llm-client.ts:114`)
- Partner invites never expire; `Math.random` codes; share-prefs PATCH stores unvalidated JSON (`partner/index.ts:39-58,226-228`)
- Year-ahead cache write no-ops for blueprint-less users → provider call per view (`year-ahead:76-79`)
- Insight-detail branches return blank screens on unexpected params; blueprint lenses blank when a lens is null; ResonanceFeedbackCard usable once; yearAhead refetches on every lens re-entry; up-to-90s cold-start spinner before cache fallback; "Good morning" at all hours; identical Rising text for all 12 signs; HD "Self-Projected" title truncated to "Self"

**Verified clean (from the same audits):** JWT auth & user-scoped clients; constant-time internal/webhook auth; RLS owner-scoping incl. service-role-only generated content; provider engines' honest degradation + input-hash cache-busting on birth edits; blueprint anti-flap guards (incl. the new dasha/strength nesting); deterministic compatibility scoring with LLM-as-prose-only; no cross-user prompt-injection path; no PII in logs; hard account deletion; LLM fallbacks on every consumer.

---

## 3. Roadmap to "best in the game"

### CHANGE (restore the honesty axis — this is the brand)
1. Drive the chart wheel + BodyGraph from the user's real placements/centers, or hide them (and the "verified" pill) until they do (P0-1/2).
2. Live Personal Day/Month/Year recomputed per date in `buildContext` (P0-3).
3. User-timezone "today" everywhere via one shared helper (birth-profile / notification tz) (P0-4, P1-12).
4. Fix compatibility caching (real unique constraint + error check + `report_version` for future invalidation) (P0-5).
5. LLM cost safety: per-user daily caps on /ask + mood reframes; persist mood variants per (user, date, mood); reuse the base reading's cosmos (P0-6).
6. Billing truth: CANCELLATION keeps access until `expires_at`; handle UNCANCELLATION + TRANSFER; use the mappings table (P0-7, P1-5).

### ADD (ship what's built; close the spec gaps)
1. **Navigation to Tarot / Journal / Rituals** (they already work) + free daily spread + paywall-routed 402 (P1-1, P1-9).
2. **Notification time picker + hydrated prefs** — the daily push at *your* chosen time is the retention spine of this category (P1-6, P1-3).
3. **Restore Ask history + streaming responses + real system chips** (spec called for SSE; perceived speed is the #1 chat-quality signal) (P1-11, P1-4, P1-15).
4. **Real Save/bookmarks + a Saved library** (backend exists) and **share cards** (affirmation + compatibility) — the viral loop (P1-10).
5. **Partner Bonds**: wire the invite CTA → the fully-built partner backend (invite → accept → daily two-person reading = a daily ritual for two).
6. Home-screen widget (spec promise; still a genuine gap vs Co-Star), biorhythm dial, moon-ritual card on new/full moons, house-system toggle, pay-per-reading purchase flow.

### ENHANCE (widen the moat)
1. **Make "systems agree" the daily push hook**: "3 of your systems point the same way today" — no competitor can copy this without rebuilding their product.
2. **Transit-tied journal prompts** (spec promise) + surface the weekly integration report.
3. **Ask memory**: extract durable facts per the spec (`ask_memory`) so Soluna visibly remembers you week over week.
4. **Solar Return birthday moment**: a "your year ahead" push + shareable card on the user's birthday (the feature just shipped; make it an event).
5. **Instant mood reframes**: pre-generate the 5 variants alongside the daily reading (or cache on first tap) so chips feel magical, not slow.
6. Trust surface: an in-app "How Soluna works / what we never do" page (no data sale, no doom, never fabricate) — turn the engineering honesty into visible marketing.

### Suggested sequencing
- **Wave 1 (this week, before build 19):** P0-1..10 — trust + money. Nothing else matters if the honest-app promise is visibly broken and LLM spend is uncapped.
- **Wave 2:** P1 last-mile wiring (orphaned screens, deep-link, notifications, history, saves).
- **Wave 3:** Growth loops (shares, Bonds, widget, birthday moment) + P2 hardening.
