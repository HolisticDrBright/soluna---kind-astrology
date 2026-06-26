# Soluna Supabase Deployment

The Edge Functions live in `supabase/functions` so the Supabase CLI can deploy them directly.

## Required secrets

Set these in Supabase Edge Function secrets before deploying:

```bash
supabase secrets set --env-file .env
```

Minimum production secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REVENUECAT_WEBHOOK_SECRET`
- `SOLUNA_INTERNAL_FUNCTION_SECRET`
- `LLM_API_KEY` or the selected provider-specific key (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY`)
- `LLM_PROVIDER` and `LLM_MODEL`
- `ASTROLOGY_PROVIDER=astrologyapi`, `ASTROLOGY_API_BASE_URL=https://json.astrologyapi.com`, and `ASTROLOGY_API_KEY` (AstrologyAPI is the production astrology provider; add `ASTROLOGY_API_USER_ID` only if your plan uses HTTP Basic). No fake placements are generated if it fails — readings degrade to a blocked/partial state.
- `GOOGLE_MAPS_API_KEY` for birth-place autocomplete, geocoding, and time-zone resolution
- `SENTRY_DSN` for error monitoring (optional, recommended)
- `EXPO_ACCESS_TOKEN` before push sending is enabled

## Deploy functions

```bash
supabase link --project-ref <project-ref>
supabase functions deploy
```

App-facing functions keep Supabase's default user-JWT verification and also call `requireAuth` inside the handler.

External or scheduled functions are configured with `verify_jwt = false` in `supabase/config.toml`:

- `billing-webhook` verifies `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`.
- `compute-blueprint-worker`, `generate-daily-readings`, `reconcile-entitlements`, `refresh-transits`, and `send-push` verify either `Authorization: Bearer <SOLUNA_INTERNAL_FUNCTION_SECRET>` or `x-soluna-internal-secret`.

## Verify after deploy

Run Supabase advisors after schema/function deployment:

```bash
supabase db advisors
```

Then test at least:

- Signed-in `POST /functions/v1/onboarding`
- Signed-in `GET /functions/v1/me`
- RevenueCat webhook with the configured authorization header
- One internal worker with `x-soluna-internal-secret`
