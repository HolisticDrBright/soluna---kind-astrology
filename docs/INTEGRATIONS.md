# Soluna — External Integrations & Environment

How the real APIs plug in, and exactly which secrets live where. **Three tiers,
never mix them up:**

| Tier | Where it's set | Reaches the client? | Example file |
|------|----------------|---------------------|--------------|
| **Frontend public** | Expo bundler (`EXPO_PUBLIC_*`) | **Yes** — inlined into the app | `expo/.env.local` |
| **Backend secret** | `supabase secrets set` / Edge env | No — server-side only | `supabase/functions/.env` |
| **Supabase auto** | Injected by the Edge runtime | No | (don't set manually) |

> Only `EXPO_PUBLIC_*` values ship in the app binary. Treat everything else as a
> secret. Real `.env` / `.env.local` files are gitignored; only `.env.example`
> is committed.

---

## 1. Supabase (Auth, Postgres + RLS, Edge Functions, Realtime)

- **Frontend public:** `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`,
  optional `EXPO_PUBLIC_FUNCTIONS_URL`.
- **Backend auto-injected:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (service role is used only inside Edge Functions /
  workers; it is never exposed to the client).
- Schema + RLS live in `supabase/migrations/`. Every user-owned table is scoped
  with `auth.uid() = user_id`; partner/Bond rows are readable by both linked
  members; shared content is read-only to authenticated users.

## 2. Astrology provider  (`_shared/providers/astrology/`)

Swappable adapter. Choose with `ASTROLOGY_PROVIDER` (or leave blank to
auto-detect from whichever credentials are present).

- **Prokerala** — `PROKERALA_CLIENT_ID`, `PROKERALA_CLIENT_SECRET` (OAuth2).
- **AstrologyAPI.com** — `ASTROLOGY_API_USER_ID`, `ASTROLOGY_API_KEY` (Basic auth).
- **custom** — `ASTROLOGY_API_BASE_URL` (+ optional `ASTROLOGY_API_KEY`).

Behavior:
- A provider is used **only when real coordinates exist** — never from `0,0`.
- Provider output is normalized to a common shape, then the engine gates angles
  & houses on having **both** birth time and place.
- If the provider fails, we fall back to the in-process MIT ephemeris and **say
  so** (an "approximate" confidence note) — no silent fake precision.
- With no provider configured, the in-process library is used (honest
  `verified_library` precision, flagged via `missingInputs: ["verified_ephemeris"]`).

## 3. Google Maps — Places + Geocoding + Time Zone  (`_shared/providers/geo/`)

- **Backend secret:** `GOOGLE_MAPS_API_KEY` (proxied via the `geo` Edge Function;
  the key never ships to the client).
- `GET /geo/autocomplete?q=` → city suggestions.
- `GET /geo/resolve?placeId=&date=` → `{ lat, lng, timezone, utcOffsetSeconds }`
  using a date-aware (DST-correct) timezone lookup.
- This is what prevents a free-typed city from producing an exact chart:
  coordinates/timezone come **only** from a resolved place. If unresolved,
  onboarding submits no coordinates and the chart is honestly "approximate".

## 4. LLM  (`_shared/llm.ts`)

- `LLM_PROVIDER=anthropic|openai`.
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` (generic `LLM_API_KEY` still works).
- `LLM_MODEL` / `LLM_BASE_URL` optional; route through a zero-retention gateway
  for privacy. Used for Ask Soluna, daily synthesis, the Soluna Shift, weekly
  reports, compatibility, Bond rituals, and insight explanations — always in the
  warm Soluna voice, with structured JSON where possible, evidence chips, and no
  doom / medical / financial / legal certainty. Raw chats are never sent to
  third-party logs.

## 5. RevenueCat  (`billing-webhook`, `_shared/billing.ts`)

- **Backend secret:** `REVENUECAT_WEBHOOK_SECRET` (the webhook rejects a missing
  or wrong `Authorization` header with **401**, fail-closed),
  `REVENUECAT_API_KEY` (server-side subscriber reconciliation).
- **Frontend public:** `EXPO_PUBLIC_REVENUECAT_KEY` (platform SDK key).
- Events are validated, the RevenueCat `app_user_id` is mapped to a real
  Supabase user before any write, renewals are recorded as subscriptions (never
  one-time), and consumables never flip entitlement.

## 6. Expo Push  (`_shared/push.ts`)

- **Backend secret:** `EXPO_ACCESS_TOKEN`.
- Frontend requests permission and saves the Expo token via `PATCH /me`. Crons
  generate short, non-doom copy and send via the Expo Push API, respecting
  `notification_prefs`. Only metadata is logged.

## 7. Optional — Observability & Email

Wire up only if you actually use them:
- `SENTRY_DSN` (crash/error tracking)
- `POSTHOG_API_KEY` (product analytics)
- `RESEND_API_KEY` (transactional email)

---

## Run it locally

```bash
# 1. Backend secrets
cp supabase/functions/.env.example supabase/functions/.env   # fill in keys
supabase start                                               # local stack
supabase db reset                                            # apply migrations
supabase functions serve                                     # Edge Functions

# 2. Frontend
cp expo/.env.example expo/.env.local                         # fill in EXPO_PUBLIC_*
# To hit the real backend in dev, set EXPO_PUBLIC_USE_MOCK_DATA=false
cd expo && npm install && npm run start
```

`USE_MOCK_DATA` is **dev-only**: production builds always use the real backend,
so mock data can never be presented as real. With nothing configured, the app
still runs in dev on mock data.
