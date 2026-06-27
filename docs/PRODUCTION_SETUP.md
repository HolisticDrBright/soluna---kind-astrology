# Soluna — Production Setup

Everything needed to take Soluna from this repo to a real TestFlight / App Store
build with real data. Pair this with `DEPLOYMENT.md` (deep backend/provider
detail) and `docs/REVENUECAT_SETUP.md` (billing).

> **Golden rule:** only **publishable** values live in the app (`EXPO_PUBLIC_*`,
> inlined into the JS bundle by Expo). Every secret — service-role key, model/API
> keys, webhook secret — is a **Supabase Edge Function secret** and must never
> appear in `EXPO_PUBLIC_*`, in `app.json`, or in any client file.

---

## 1. Environment variables — exactly what goes where

### A. Client (app bundle) — `EXPO_PUBLIC_*` only, publishable values

Set these in EAS (`eas env` / EAS dashboard) or `expo/.env.local` for local runs.
Read centrally by `expo/lib/config.ts`.

| Var | Required | Prod value | Purpose |
|-----|----------|------------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | your project URL | Supabase REST/Auth/Edge base |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | anon key | Supabase anon/publishable key |
| `EXPO_PUBLIC_ENABLE_DEMO_MODE` | ✅ | `false` | Master demo switch — **must be false in prod** |
| `EXPO_PUBLIC_ENABLE_MOCK_READINGS` | ✅ | `false` | Canned sample readings (demo only) |
| `EXPO_PUBLIC_ENABLE_BILLING_FALLBACK` | ✅ | `false` | Allow RC test key when unset (demo only) |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | ✅ (iOS) | `appl_…` | RevenueCat publishable iOS key |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | ✅ (Android) | `goog_…` | RevenueCat publishable Android key |
| `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` | optional | `premium` | Entitlement id (default `premium`) |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | optional | support@… | Shown for data export / deletion |
| `EXPO_PUBLIC_SENTRY_DSN` | optional | DSN | Crash/error reporting (a DSN is publishable) |

Legacy aliases still honoured (prefer the names above): `EXPO_PUBLIC_USE_MOCK_DATA`,
`EXPO_PUBLIC_REVENUECAT_API_KEY_IOS/ANDROID/—`.

### B. Server only — Supabase Edge Function secrets (never in the app)

Set with `supabase secrets set ...`. `SUPABASE_URL` / `SUPABASE_ANON_KEY` /
`SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the Edge runtime.

| Var | Required | Purpose |
|-----|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | auto | Privileged DB writes (webhooks, workers) — **server only** |
| `LLM_PROVIDER` | ✅ | `openai` or `anthropic` |
| `LLM_API_KEY` | ✅ | Model key (or `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`) |
| `LLM_MODEL` | optional | Model id override |
| `LLM_BASE_URL` | optional | Route via a zero-retention gateway |
| `ASTROLOGY_PROVIDER` | ✅ | `astrologyapi` (prod provider) |
| `ASTROLOGY_API_BASE_URL` | ✅ | e.g. `https://json.astrologyapi.com` |
| `ASTROLOGY_API_KEY` | ✅ | Provider key |
| `ASTROLOGY_API_USER_ID` | optional | Only if plan uses userId + key (Basic) |
| `ASTROLOGY_ALLOW_APPROXIMATION` | ✅ `false` | Must be false in prod (no fabricated charts) |
| `ASTROLOGY_TRANSITS_ENABLED` / `_ENDPOINT` | optional | Full transits (off until confirmed) |
| `BAZI_PROVIDER` / `BAZI_API_BASE_URL` / `BAZI_API_KEY` | optional | True BaZi (else honest "unavailable") |
| `GOOGLE_MAPS_API_KEY` | ✅ | Birthplace resolution (server-side `geo`) |
| `REVENUECAT_WEBHOOK_SECRET` | ✅ | Webhook `Authorization: Bearer <secret>` |
| `REVENUECAT_API_KEY` | optional | RC **secret** REST key (server only) |
| `SOLUNA_INTERNAL_FUNCTION_SECRET` | ✅ | Auth for non-JWT worker functions |
| `EXPO_ACCESS_TOKEN` | optional | Server-side Expo push sends |

> `expo/scripts/check-no-demo-leak.mjs` (`npm run check:demo`) and the grep in
> `docs/PRODUCTION_QA.md` enforce that no secret/service-role value is referenced
> from the Expo app and that demo data can't reach live mode.

---

## 2. Supabase

```bash
supabase link --project-ref <your-soluna-project-ref>
supabase db push                                   # apply ALL migrations in order
supabase secrets set --env-file ./supabase/functions/.env
supabase functions deploy                          # deploys every Edge Function
# Studio → Advisors (security + performance) and fix anything flagged
```

`config.toml` keeps `verify_jwt = false` only for self-authenticating worker
functions (`billing-webhook`, `compute-blueprint-worker`,
`generate-daily-readings`, `reconcile-entitlements`, `refresh-transits`,
`send-push`). Everything user-facing keeps JWT verification.

---

## 3. App identity (already set in `app.json`)

| Field | Value |
|-------|-------|
| name | Soluna |
| slug | `soluna-kind-astrology` |
| scheme | `soluna` |
| iOS bundle id | `com.holisticdrbright.soluna` |
| Android package | `com.holisticdrbright.soluna` |

iOS `infoPlist` declares `ITSAppUsesNonExemptEncryption=false` plus location /
photo / camera purpose strings. These cover the bundled `expo-location` /
`expo-image-picker` native modules; if those features are never shipped, remove
the deps **and** their strings together. Notifications (`expo-notifications`,
used by `lib/push.ts`) need no purpose string.

---

## 4. EAS build & submit (TestFlight)

`expo/eas.json` defines three profiles:

- **development** — dev client, internal, `ENABLE_DEMO_MODE=true`.
- **preview** — internal distribution, demo off (real data smoke test).
- **production** — `environment: "production"`, `autoIncrement: true`, all demo /
  mock / billing-fallback flags forced false.

```bash
cd expo
npm install
eas login
eas init                      # links the project + writes extra.eas.projectId
eas env:push production        # or set EXPO_PUBLIC_* in the EAS dashboard
eas build --profile production --platform ios
eas submit --profile production --platform ios     # → TestFlight
```

Build numbers auto-increment remotely (`cli.appVersionSource = "remote"`); bump
the marketing `version` in `app.json` for each public release.

---

## 5. Pre-flight checklist

- [ ] `EXPO_PUBLIC_ENABLE_DEMO_MODE=false` (and `ENABLE_MOCK_READINGS`,
      `ENABLE_BILLING_FALLBACK` false) in the production profile.
- [ ] Real `EXPO_PUBLIC_SUPABASE_URL` / `ANON_KEY` set.
- [ ] RevenueCat iOS/Android publishable keys set; entitlement id matches the
      dashboard (`premium`).
- [ ] All server secrets set via `supabase secrets set` (none in `EXPO_PUBLIC_*`).
- [ ] `ASTROLOGY_ALLOW_APPROXIMATION` unset/false.
- [ ] `npm run typecheck`, `npm run lint`, `npm run check:demo` pass.
- [ ] Walk `docs/PRODUCTION_QA.md`.
