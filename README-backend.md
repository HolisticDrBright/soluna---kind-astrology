# Soluna — Backend (Supabase-native)

The complete backend for Soluna: a warm, multi-system cosmic-guidance app that
blends **astrology, numerology, Chinese astrology (BaZi), Human Design, tarot,
and biorhythms** into one unified Blueprint, then uses an LLM to synthesize
supportive, personalized guidance that highlights **where the systems agree**.

Architecture: **Supabase-native** — Postgres + RLS for data, Supabase Auth for
identity, Edge Functions (Deno/TypeScript) for the API, `pg_cron` for schedules,
Supabase Queues (`pgmq`) for async work. No separate server, no Redis.

```
supabase/
├── config.toml                 # project + per-function JWT settings
├── migrations/                 # extensions, schema, RLS, cron + queues
├── seed.sql                    # rituals + content templates (db reset)
├── seed/seed_mock_user.ts      # one full mock user + 7 days of readings
└── functions/
    ├── deno.json               # import map + tasks
    ├── .env.example            # all secrets
    ├── _shared/                # voice, llm, auth, http, crypto, schemas, repo…
    │   ├── engines/            # the 6 blueprint engines + BlueprintService
    │   └── synthesis/          # buildContext, detectAgreement (moat), LLM phrasing
    ├── onboarding/ blueprint/ today/ insight/ synthesis/ ask/ connections/
    ├── tarot/ journal/ rituals/ saved/ me/ entitlements/ billing-webhook/
    └── cron-drain-queue/ cron-daily-readings/ cron-refresh-transits/
```

## What's built

**Blueprint engines** (`functions/_shared/engines/`) — isolated, unit-tested:

| Engine | Source | Notes |
|---|---|---|
| Numerology | pure TS | Pythagorean, master numbers 11/22/33, Y-vowel rule |
| Biorhythm | pure TS | 23/28/33-day sine cycles |
| Chinese | `lunar-typescript` (MIT) | animal + element + yin/yang, BaZi Four Pillars |
| Tarot | pure TS | full 78-card deck, crypto-seeded deterministic draws |
| Astrology | adapter: hosted API → `circular-natal-horoscope-js` (MIT) | **never** AGPL Swiss Ephemeris |
| Human Design | computed from longitudes | Personality + Design (~88° solar arc), gates/centers/type/authority/profile |

Honesty: with **no birth time**, time-dependent outputs (Rising, houses, full
Human Design) return a `needsBirthTime` state — never a guess.

**The moat** (`functions/_shared/synthesis/agreement.ts`) — `detectAgreement` is
a *deterministic* pass that scores cross-system convergence into a theme set
(rest, action, connection, focus, change). The LLM only phrases the result.

**Voice + wellbeing** (`functions/_shared/voice.ts`) — one `SOLUNA_VOICE`
constant is prepended to every LLM call. A deterministic crisis pre-screen
short-circuits to a supportive message with resources before any LLM call.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/local-development) (`supabase`)
- [Deno](https://deno.land) 2.x (the Edge Functions runtime)
- Docker (for the local Supabase stack)
- Accounts/APIs: an LLM provider with a **no-training / zero-retention** policy
  (Anthropic Claude by default), optionally a hosted astrology API, RevenueCat
  (billing), Expo (push), a geocoder for birth-place → lat/lng/timezone.

## Local development

```bash
supabase start                              # boots Postgres, Auth, Edge runtime
supabase db reset                           # applies migrations + seed.sql

# Secrets for local functions:
cp supabase/functions/.env.example supabase/functions/.env
#   set LLM_API_KEY, APP_ENCRYPTION_KEY (openssl rand -base64 32), CRON_SECRET…
#   SUPABASE_* are auto-injected locally.

supabase functions serve                    # serve all functions with .env

# Optional: seed one full mock user (blueprint + 7 days of readings)
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=<local service role key from `supabase start`> \
APP_ENCRYPTION_KEY=$(openssl rand -base64 32) \
deno run --allow-env --allow-net --allow-read supabase/seed/seed_mock_user.ts
```

### Run the engine tests

```bash
cd supabase/functions
deno test --allow-net --allow-env --allow-read _shared/
```

36 tests cover the engines (numerology master numbers, the gate-wheel calibration
checkpoint `0° Aries → Gate 25`, Wood-Pig BaZi, etc.), the deterministic
agreement scoring, the wellbeing guardrails, and an offline `blueprint → today`
end-to-end pipeline.

## Deploy

```bash
supabase link --project-ref <ref>
supabase db push                            # apply migrations to the remote DB

# Set production secrets (never commit them):
supabase secrets set --env-file supabase/functions/.env

supabase functions deploy                   # deploy all functions
```

### Enable the scheduled jobs (one-time, after deploy)

`pg_cron` jobs call Edge Functions via `pg_net`, authenticated with a shared
secret read from Vault. Set these once in the SQL editor:

```sql
select vault.create_secret('https://<ref>.supabase.co', 'project_url');
select vault.create_secret('<the same value as CRON_SECRET>', 'cron_secret');
```

The migrations already register the schedules (`soluna-drain-queue` every minute,
`soluna-daily-readings` hourly, `soluna-refresh-transits` daily,
`soluna-bond-readings` daily, `soluna-reconcile` nightly). Confirm with
`select * from cron.job;`.

### Partner / Bond system

Two users can link into a **Bond**: one sends a `partner/invite` (shareable
code), the other opens the public `partner/invite/:code` preview and POSTs to
`.../accept`, which links the accounts (`partner_links`), records a `referral`,
and grants both a free Bond reading — all idempotent. `partner/bonds/:id` returns
blended compatibility plus a daily two-person `bond_reading` (cached per link/day,
generated on demand and by the `soluna-bond-readings` cron, which also pushes both
partners). RLS lets **both** linked users read the shared `partner_links` and
`bond_readings` rows; each side's `share_prefs` control which facets appear in the
shared reading. The mock-user seed creates one linked Bond (Maya ❤ Sam).

### RevenueCat webhook

Point a RevenueCat webhook at
`https://<ref>.supabase.co/functions/v1/billing-webhook` and set its
Authorization header to your `REVENUECAT_WEBHOOK_SECRET`. The client must set the
RevenueCat `appUserID` to the Supabase user id so events map to users.

## API

All routes are Edge Functions, JWT-verified (except `billing-webhook` + cron),
zod-validated, RLS-scoped. Call via `supabase.functions.invoke("<name>/...")`.

| Method | Route | Purpose |
|---|---|---|
| POST | `onboarding/blueprint` | Save birth profile, compute blueprint, return reveal summary |
| GET | `blueprint` · `blueprint/:system` | Full blueprint / one lens |
| GET | `today` | Today's reading (generates + caches on demand) |
| GET | `insight?system=&key=` | Warm interpretation + "why you're seeing this" |
| GET | `synthesis?theme=` | Expanded "where your systems agree" |
| POST/GET | `ask` · `ask/history` | Ask Soluna — **streams SSE** + persists memory |
| GET/POST | `connections` · `connections/:id/compatibility?lens=` | People + blended compatibility |
| POST/GET | `partner/invite` · `partner/invite/:code` (public preview) · `.../accept` | Create invite, preview, link accounts (referral + free-Bond reward, idempotent) |
| GET/PATCH/DELETE | `partner/bonds` · `partner/bonds/:id` | Bonds list + Bond Space (compatibility + daily two-person reading), share prefs, unlink |
| POST/GET | `tarot/draw` · `tarot` | Draw (spreads beyond daily are Premium) |
| POST/GET | `journal` | Journal entries |
| GET | `rituals?phase=` | Moon-phase rituals |
| POST/GET/DELETE | `saved` · `saved/:id` | Saved items |
| GET/PATCH | `me` | Profile, prefs, push token, birth (re-enqueues compute) |
| GET | `entitlements` | Entitlement state for paywall/gating |
| POST | `billing-webhook` | RevenueCat → subscriptions |

## Privacy & security

- **RLS on every user table** — a signed-in user touches only their own rows.
  Service-role writes happen server-side inside Edge Functions only.
- **Encrypted at rest** — the full birth name is AES-256-GCM encrypted
  (`APP_ENCRYPTION_KEY`); plaintext is never stored.
- **No-training LLM only** — set `LLM_BASE_URL` to a zero-retention gateway if
  needed. Raw chat is never logged to third parties; only metadata goes to `logs`.
- **Honest billing** — entitlements are checked server-side; cancellation stays
  one tap via the store.

## Connecting the frontend

The Expo app (`expo/`) talks to this backend per **Part 2 — Connection**: set
`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and
`EXPO_PUBLIC_FUNCTIONS_URL` (`https://<ref>.functions.supabase.co`), then replace
the `USE_MOCK_DATA` modules with `supabase.functions.invoke` calls. The response
shapes above mirror the mock data the UI already renders.
