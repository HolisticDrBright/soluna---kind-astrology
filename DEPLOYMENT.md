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

## 3. Astrology provider

`ASTROLOGY_PROVIDER` selects the implementation:
- `prokerala` → `PROKERALA_CLIENT_ID`, `PROKERALA_CLIENT_SECRET`
- `custom` → `ASTROLOGY_API_BASE_URL` (+ `ASTROLOGY_API_KEY`)

With no provider configured the engine uses its in-repo approximation and labels
results honestly via `accuracy_level` (`exact|partial|approximate|blocked`); it
never presents an approximation as exact.

## 4. LLM provider

`LLM_PROVIDER=openai|anthropic` with `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`
(generic `LLM_API_KEY` also supported). Optional `LLM_MODEL`, `LLM_BASE_URL`
(route through a zero-retention gateway for privacy).

## 5. RevenueCat

- Frontend public SDK key (per platform).
- `REVENUECAT_WEBHOOK_SECRET` + `REVENUECAT_API_KEY` as backend secrets.
- Webhook: `POST /functions/v1/billing-webhook` with
  `Authorization: Bearer $REVENUECAT_WEBHOOK_SECRET`.
- The client must set RevenueCat `app_user_id` to the Supabase user id so events
  map to the right account.

## 6. Expo / Rork

```bash
cd expo && cp ../.env.example .env.local   # fill EXPO_PUBLIC_* + keep USE_MOCK_DATA off
npm install && npm run start
```
`EXPO_PUBLIC_USE_MOCK_DATA=true` is **dev/demo only**; the paid journey runs on
real backend data.

## 7. Optional ops

`SENTRY_DSN`, `POSTHOG_API_KEY`, `RESEND_API_KEY` — wire only if used.

---

## Verification status (this iteration)

Run from a machine with the Soluna project linked + `supabase`/`deno` installed:

| Check | Status here | How to run |
|-------|-------------|------------|
| Frontend `tsc` | ✅ pass | `cd expo && npx tsc --noEmit` |
| Frontend lint | ⚠️ pre-existing warnings/`no-unescaped-entities` only; no new issues | `cd expo && npm run lint` |
| Shared backend tests (worker auth, input validators, numerology, RevenueCat webhook, RLS forgery invariant, geo, astrology providers, accuracy) | ✅ 38/38 pass | `deno test --allow-env --allow-read supabase/functions/_shared/tests` |
| Migration SQL grammar | ✅ both parse (265 + 6 stmts) | libpg_query / `supabase db lint` |
| Worker internal-secret guard | ✅ enforced in all non-JWT worker functions + unit-tested (`internal_auth_test.ts`) | included in the test run above |
| RevenueCat webhook auth + app_user_id mapping | ✅ Bearer-secret check + UUID mapping unit-tested (`revenuecat_test.ts`) | included in the test run above |
| "No forgeable generated content" RLS invariant | ✅ migration-parsed: every owner write policy on `blueprints`/`daily_readings` is dropped (`rls_policy_test.ts`) | included in the test run above |
| Edge Function `deno check` | ⚠️ not runnable here (sandbox can't reach `esm.sh`) | `deno check supabase/functions/**/index.ts` |
| Live migrations + advisors + function deploy | ⛔ **not possible from this environment** — no Soluna Supabase project is linked to the MCP (only an unrelated `petwell`). | run §1 against the real project |

> Live Supabase verification (advisors, deploy, RLS smoke tests) must be run by
> the maintainer against the actual Soluna project; the steps above are exact.
