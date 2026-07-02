# Soluna — Deployment & Verification

Everything needed to take Soluna live. Secrets live in three tiers — never mix
them. Real `.env` files are gitignored; only `.env.example` is committed.

| Tier | Set via | Reaches the app bundle? |
|------|---------|-------------------------|
| **Frontend public** (`EXPO_PUBLIC_*`) | Expo/Rork env | **Yes** — public keys only |
| **Backend secret** | `supabase secrets set` | No — Edge Functions only |
| **Supabase auto** (`SUPABASE_URL/ANON/SERVICE_ROLE`) | injected by the Edge runtime | No |

---

## 1. Supabase

```bash
supabase link --project-ref <your-soluna-project-ref>

# Apply migrations IN ORDER (initial schema, then the generated-content hardening)
supabase db push        # or: supabase migration up

# Set backend secrets (see .env.example for the full list)
supabase secrets set --env-file ./supabase/functions/.env

# Deploy every Edge Function (config.toml controls JWT verification)
supabase functions deploy

# Run advisors and fix anything flagged
#   Studio → Advisors, or the MCP get_advisors tool, type: security | performance
```

**config.toml** keeps `verify_jwt = false` only for external/scheduled functions
that do their own auth: `billing-webhook`, `compute-blueprint-worker`,
`generate-daily-readings`, `reconcile-entitlements`, `refresh-transits`,
`send-push`. Every user-facing function (incl. the new `geo`) keeps JWT
verification.

**Worker auth:** the six non-JWT functions require `SOLUNA_INTERNAL_FUNCTION_SECRET`
(bearer or `x-soluna-internal-secret`); `billing-webhook` requires
`REVENUECAT_WEBHOOK_SECRET` and fails closed when it is missing/wrong.

**Scheduling** (pg_cron or external scheduler) must send the internal secret, e.g.

```
Authorization: Bearer $SOLUNA_INTERNAL_FUNCTION_SECRET
```

## 2. Google Maps (birth-place resolution)

Enable **Places API**, **Geocoding API**, and **Time Zone API**, then set
`GOOGLE_MAPS_API_KEY` as a Supabase secret. It is used only server-side by the
`geo` function — never shipped to the client. Onboarding resolves a picked place
to real `lat`/`lng` + a date-aware IANA `timezone`; if it can't resolve, the app
does **not** submit coordinates (no fake `0,0`/`UTC`).

## 3. Astrology provider — AstrologyAPI

AstrologyAPI is the production provider. Set these as Supabase Edge Function
secrets (never in client / `EXPO_PUBLIC_*` config):

```bash
supabase secrets set ASTROLOGY_PROVIDER=astrologyapi \
  ASTROLOGY_API_BASE_URL=https://json.astrologyapi.com \
  ASTROLOGY_API_KEY=<your-access-token>
# only if your plan uses userId + key (HTTP Basic):
#   ASTROLOGY_API_USER_ID=<your-user-id>
```

The adapter calls `POST /v1/western_horoscope` (`x-astrologyapi-key` header;
HTTP Basic added when `ASTROLOGY_API_USER_ID` is set) and maps planets,
ascendant, MC, houses, and aspects into the stored blueprint. The numeric
`tzone` is computed from the birth place's IANA timezone (real `Intl` math).

**No fake fallback:** if AstrologyAPI fails, or birth coordinates are missing,
the chart is returned **blocked** (zero placements) with honest `accuracy_level`
/ `missing_inputs` / `confidence_notes` — never fabricated. The in-app estimate
is disabled in production; `ASTROLOGY_ALLOW_APPROXIMATION=true` re-enables it for
local dev only.

`ASTROLOGY_PROVIDER` also accepts `prokerala` (`PROKERALA_CLIENT_ID/SECRET`) or
`custom` (`ASTROLOGY_API_BASE_URL/natal-chart`) as alternatives.

**Transits.** The Moon phase is computed deterministically from the date (real
astronomy, no provider needed) and always feeds Today/Ask. Full transit-to-natal
data (planet transits, retrogrades, transit aspects) is **off by default** and
never fabricated. To enable it once your AstrologyAPI plan's transit endpoint is
confirmed:

```bash
supabase secrets set ASTROLOGY_TRANSITS_ENABLED=true \
  ASTROLOGY_TRANSITS_ENDPOINT=<the plan's transit path, e.g. v1/natal_transits/daily>
```

Until both are set, `getTransitCapability()` reports disabled (with a reason) and
the app uses Moon phase only.

## BaZi / Four Pillars (FreeAstroAPI)

Soluna's **true, provider-backed** Eastern depth layer. It is distinct from the
lightweight birth-year Chinese zodiac (which always works from the date alone).
BaZi requires a provider and is **never fabricated**: with no provider it shows an
honest "unavailable" state, and missing birth time/place yields a clearly-marked
*partial* chart (no guessed Hour Pillar). Set these as Edge Function secrets
(backend-only — the key must never reach the client):

```bash
supabase secrets set BAZI_PROVIDER=freeastroapi \
  BAZI_API_BASE_URL=https://api.freeastroapi.com \
  BAZI_API_KEY=<your-key> \
  BAZI_ENABLE_TRUE_SOLAR_TIME=true \
  BAZI_ENABLE_LUCK_CYCLES=true \
  BAZI_ENABLE_COMPATIBILITY=true
#   optional: BAZI_API_ENDPOINT=/bazi   (override if your plan's route differs)
```

The chart is computed in `computeBlueprint`, cached on `blueprints.bazi` (and a
connection's chart on `connections.bazi`) by an input fingerprint so the provider
is never charged twice for the same birth data. Run `supabase db push` to apply
`20260627_bazi_four_pillars.sql` (adds the owner-scoped `bazi` columns), then
`supabase functions deploy onboarding connections today ask`. BaZi is a reflective
lens — it is never used for wealth, marriage, health, legal, or fixed-fate
predictions.

## 4. LLM provider

`LLM_PROVIDER=openai|anthropic` with `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`
(generic `LLM_API_KEY` also supported). Optional `LLM_MODEL`, `LLM_BASE_URL`
(route through a zero-retention gateway for privacy).

## 5. RevenueCat (subscriptions, paywall & customer center)

SDKs `react-native-purchases` + `react-native-purchases-ui`, wired in
`expo/lib/revenuecat.ts`, the paywall screen, and Profile.

Keys (publishable — safe in the client; set per platform in production):
- `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` / `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`
  (or the shared `EXPO_PUBLIC_REVENUECAT_API_KEY`). The app falls back to the
  test key `test_mmcZLBWDRvQaAduoydFRbsMNIsV` if none is set.
- `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` — the entitlement id (e.g. `Saluna: Astrology Pro`).
- `REVENUECAT_WEBHOOK_SECRET` — backend secret; the webhook expects
  `Authorization: Bearer $REVENUECAT_WEBHOOK_SECRET` at
  `POST /functions/v1/billing-webhook`.

Dashboard setup:
1. Create the **entitlement** (e.g. "Saluna: Astrology Pro").
2. Create products **lifetime**, **yearly**, **monthly** (App Store Connect /
   Play Console) and attach them to an **Offering**; mark it current.
3. Design a **Paywall** for that offering (RevenueCat → Paywalls). The app
   presents it via `RevenueCatUI.Paywall` — no hardcoded prices.
4. Enable the **Customer Center** (RevenueCat → Customer Center). Profile →
   "Manage subscription" opens it (cancel / change plan / restore / refund).

The client identifies RevenueCat with the Supabase user id (`app_user_id`) so
webhook events map to the account, and records it in `revenuecat_user_mappings`
(migration `20260626_revenuecat_user_mappings.sql`). Premium is always confirmed
by the backend entitlement — never a frontend-only flag.

Verify on a device/simulator (TestFlight or a dev build — **not** Expo Go):
paywall purchase, restore, the Customer Center, and that the webhook flips the
backend entitlement.

## 6. Expo / Rork + push notifications

```bash
cd expo && cp ../.env.example .env.local   # fill EXPO_PUBLIC_* + keep USE_MOCK_DATA off
bun install && bun run start
```
`EXPO_PUBLIC_USE_MOCK_DATA=true` is **dev/demo only**; the paid journey runs on
real backend data.

Push is wired (`expo/lib/push.ts`, Profile → Daily reading toggle): it requests
permission, fetches the Expo push token, and saves it via `PATCH /me` →
`push_tokens`. Requirements:
- `expo.extra.eas.projectId` in `app.json` (run `eas init`) so a token can be
  fetched in standalone builds.
- `EXPO_ACCESS_TOKEN` as a backend secret; `send-push` fails closed without it.
- A native build (dev build / TestFlight) to verify delivery — push doesn't work
  in Expo Go (SDK 53+) or on web.

## 7. Sentry + optional ops

Sentry is wired (`expo/lib/sentry.ts`, root layout). Set `EXPO_PUBLIC_SENTRY_DSN`
for the app (a DSN is publishable); PII is scrubbed in `beforeSend` (no birth
data, journals, or chat content reach Sentry). For native crash symbolication +
source maps, add the `@sentry/react-native/expo` config plugin with your
org/project at build time. `SENTRY_DSN` (Edge Functions), `POSTHOG_API_KEY`,
`RESEND_API_KEY` — wire only if used.

## 8. Soluna Knowledge Base

A structured, original knowledge base now feeds the LLM richer, kinder, more
accurate context. No new secrets or third-party APIs — it is self-contained
TypeScript under `supabase/functions/_shared/knowledge/`, with human-readable
docs under `docs/soluna-knowledge-base/` and full notes in
`docs/KNOWLEDGE_BASE_IMPLEMENTATION.md`.

- **Selection is deterministic** (`selectKnowledge.ts`): real blueprint/transit/
  focus data → relevant cards + agreement/tension/confidence/safety/actions. The
  LLM writes the words; it never picks the knowledge.
- **Wired into** `ask`, `today`, and `connections` (compatibility) via the
  `_shared/synthesis` engine. A provider failure still resolves **no** astrology
  cards — placements are never fabricated.
- **Privacy**: raw journals and another person's chart never reach a prompt; a
  connection contributes only "involved + lens" and only when the user owns the
  focus referencing it.
- **New migration** `20260626_advice_feedback.sql` (owner-scoped helpful /
  not_helpful feedback) — apply it with the others in §1.
- **Bug fix**: Anthropic calls previously dropped all but the first system
  message, silently losing per-user context; now merged in `llm-client.ts`.

---

## 9. Resonance / Personalization ("Tune Soluna to You")

A feedback loop that learns **how** to communicate with each user without ever
changing **what** is true. No new secrets or third-party APIs. Full details in
[`docs/RESONANCE_PERSONALIZATION.md`](docs/RESONANCE_PERSONALIZATION.md).

- **New migration** `20260628_resonance_feedback.sql` — `resonance_feedback`
  (raw, owner-authored, immutable) + `personalization_profiles` (derived, one row
  per user). Apply it with the others in §1.
- **RLS:** both tables are owner-scoped. The profile has **no client write
  policy** — it is written **only** by the `resonance` Edge Function via the
  service role, so the deterministic update rules are the single source of truth.
- **New Edge Function** `resonance` (JWT-verified): `POST /resonance` (submit +
  recompute), `GET /resonance/profile`, `DELETE /resonance/profile` (reset). Add
  it to the `supabase functions deploy` in §1.
- **Deterministic, no-LLM** profile updates (`_shared/personalization.ts`):
  thresholded rules make changes gradual; a single tap never flips a preference.
- **Synthesis integration:** `buildContext` injects a *Personalization Memory*
  block (delivery guidance only) into Today / Ask / Compatibility prompts — only
  when a profile with feedback exists.
- **Guardrails:** feedback never alters placements, BaZi pillars, numbers, tarot,
  transits, or compatibility math; the "reflective lenses, not fixed fate" safety
  language is preserved; never optimizes for flattery; humble on low resonance.
- **Demo:** `submitResonanceFeedback` is a no-op success when
  `EXPO_PUBLIC_USE_MOCK_DATA=true` — demo stays separate from live.

---

## Verification status (this iteration)

Run from a machine with the Soluna project linked + `supabase`/`deno` installed:

| Check | Status here | How to run |
|-------|-------------|------------|
| Frontend `tsc` | ✅ pass | `cd expo && npx tsc --noEmit` |
| Frontend lint | ⚠️ pre-existing warnings/`no-unescaped-entities` only; no new issues | `cd expo && npm run lint` |
| Shared backend tests (worker auth, input validators, numerology, RevenueCat webhook, RLS forgery invariant, geo, astrology providers, accuracy, knowledge schema / selection / safety / prompt, moon phase, transits, compatibility scoring, output QA, **resonance: validation / deterministic rules / no-chart-mutation / prompt-block gating / safety**) | ✅ 113/113 pass | `deno test --allow-env --allow-read supabase/functions/_shared/tests` |
| Migration SQL grammar | ✅ both parse (265 + 6 stmts) | libpg_query / `supabase db lint` |
| Worker internal-secret guard | ✅ enforced in all non-JWT worker functions + unit-tested (`internal_auth_test.ts`) | included in the test run above |
| RevenueCat webhook auth + app_user_id mapping | ✅ Bearer-secret check + UUID mapping unit-tested (`revenuecat_test.ts`) | included in the test run above |
| "No forgeable generated content" RLS invariant | ✅ migration-parsed: every owner write policy on `blueprints`/`daily_readings` is dropped (`rls_policy_test.ts`) | included in the test run above |
| Edge Function `deno check` (knowledge module + ask/today/connections/synthesis) | ✅ passes (also surfaced + fixed a pre-existing null-safety bug in `synthesis/index.ts`) | `deno check supabase/functions/_shared/knowledge/index.ts supabase/functions/{ask,today,connections}/index.ts supabase/functions/_shared/synthesis/index.ts` |
| Live migrations + advisors + function deploy | ⛔ **not possible from this environment** — no Soluna Supabase project is linked to the MCP (only an unrelated `petwell`). | run §1 against the real project |

> Live Supabase verification (advisors, deploy, RLS smoke tests) must be run by
> the maintainer against the actual Soluna project; the steps above are exact.

## Frontend data wiring (demo mode vs. live mode)

Soluna has exactly two runtime modes, controlled by `EXPO_PUBLIC_USE_MOCK_DATA`
and centralised in **`expo/lib/runtimeMode.ts`** (`isDemoMode` / `isLiveMode`):

- **Demo mode** (`EXPO_PUBLIC_USE_MOCK_DATA=true`) — for screenshots, App Store
  preview, and local testing. Renders beautiful, fully-populated **fake** sample
  content (the demo user "Maya", sample connections, journal entries, transits).
  All of that fake content lives in **`expo/constants/demoData.ts`** and is
  imported only behind an `isDemoMode` guard.
- **Live mode** (anything else — the production default) — the commercial app.
  It builds the user **only** from the real `/me` payload and **never**
  substitutes fake data. When a lens isn't available yet it shows an honest state
  instead: "Finish birth details", "Not available yet", "We're still calculating
  this", loading / empty / error+retry, or a polished "Coming soon".

Production-safe shared constants/types (zodiac symbols, number meanings, fonts,
static option vocabularies, reference interpretation labels) stay in
**`expo/constants/mockData.ts`** and may be imported anywhere — they are generic,
never user-specific. `UserData`'s per-lens fields (`chart`, `numerology`,
`chinese`, `humanDesign`) are `… | null`; `useAppState` sets them to null (not a
mock fallback) when the backend hasn't produced them, and screens render honest
states for null. BaZi follows the same standard via its own `available` flag
(`UNAVAILABLE_BAZI`).

| Screen | Live source | In live mode when data is missing |
|--------|-------------|-----------------------------------|
| Onboarding reveal | `/onboarding` + `/me` | real blueprint; "Needs birth time" for Rising; never fake signs |
| Home / Today | `getToday()` | honest empty/loading; demo daily reading, Soluna Shift, cosmic-weather & energy cards are demo-only and hidden |
| Blueprint | `/me` blueprint | per-lens "not available yet" for any null lens (no fake placements/numbers/type/animal) |
| Ask | `askSoluna()` | live chat; demo chat history hidden |
| Journal | `getJournal()` / `createJournalEntry()` | live entries + empty state; demo entries hidden |
| Connections | `getConnections()` / `addConnection()` / `getCompatibility()` | live list + empty state; demo people & bond rituals hidden |
| Tarot | `drawTarot()` | live draw; demo 3-card sample hidden |
| Resonance card | `submitResonanceFeedback()` | shown after the primary insight on Today / Ask / Focus / Compatibility / Tarot / Blueprint; demo mode = no-op success; never alters chart facts |
| Profile | `getEntitlements()` + birth-data edit + restore + delete account | real subscription/account; summary chips show only real lenses; Active Focuses / Weekly Report / Pattern Memory / Widget previews are demo-only and hidden |

**"Coming soon" in live mode** — demo-only screens not yet wired to live data
render `components/ComingSoon` (an honest empty state) instead of fake content:
Rituals, Transit detail, Synthesis detail, Compatibility detail, the Focus flow
(setup / active / result / check-in), and the Soluna Shift card.

In-app account deletion is live: Profile → "Delete my account" confirms, then
calls `POST /functions/v1/delete-account` (requires the user JWT), which hard-
deletes the auth user. Every user table is `ON DELETE CASCADE` from
`profiles` → `auth.users`, so all of the user's data is removed (shared link
fields are `SET NULL`). This satisfies the App Store / Play in-app deletion rule.

RevenueCat purchase/restore, push delivery, and Sentry events require a native
build + live keys to verify on a device.

### Before TestFlight / App Store (live build)
1. **`EXPO_PUBLIC_USE_MOCK_DATA=false`** (or unset) — confirm no fake data renders.
2. `cd expo && npx tsc --noEmit` — types clean.
3. `cd expo && npm run lint` — lint clean (allow only the known local Bun warning).
4. `cd expo && npm run check:demo` — the demo-leak guard must pass (no ungated
   demo imports; `useAppState` never spreads or uses `MOCK_USER` in live mode).
5. Spot-check the search guard — every hit must be an import from
   `@/constants/demoData` **or** sit behind an `isDemoMode` / `USE_MOCK_DATA` gate:
   `rg -n "MOCK_|CONNECTIONS|JOURNAL_ENTRIES|CURRENT_TRANSITS|SYNTHESIS_THEMES" expo/app expo/state expo/components`

### July 2026 wave: quotas, mood-variant caching, user-local dates

- Apply `supabase/migrations/20260702000000_quotas_and_mood_variants.sql` (also in the
  ALL_MIGRATIONS.sql bundle). It adds `daily_readings.mood_variants` plus the
  `usage_counters` table + `increment_usage()` function behind the new per-user
  daily LLM caps (Ask: 15 free / 200 premium; mood reframes: 20/day). Both caps
  FAIL OPEN if the migration isn't applied — the app keeps working, unmetered.
- "Today" is now derived from each user's timezone (birth profile /
  notification prefs), so readings roll over at the user's midnight, not UTC's.
- Compatibility reports now really cache (the old upsert silently failed), and
  carry a `reportVersion` — bump `REPORT_VERSION` in
  `supabase/functions/connections/index.ts` to force regeneration after a
  methodology change.
