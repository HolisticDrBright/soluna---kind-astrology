# Soluna — RevenueCat Setup

Soluna uses RevenueCat for subscriptions. Premium is **always** confirmed by the
backend entitlement (`/entitlements`, backed by the `subscriptions` table the
webhook maintains) — the client SDK check is for immediate UX only. There is no
local "fake unlock" path.

## Keys (where they go)

| Key | Type | Where |
|-----|------|-------|
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (`appl_…`) | publishable | client (EAS env) |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (`goog_…`) | publishable | client (EAS env) |
| `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` | id (default `premium`) | client (EAS env) |
| `REVENUECAT_WEBHOOK_SECRET` | secret | Supabase Edge Function secret |
| `REVENUECAT_API_KEY` | secret REST key | Supabase Edge Function secret (optional) |

The **publishable** keys are safe in the client. The webhook secret and REST key
are **server only** — never `EXPO_PUBLIC_*`.

If no publishable key is set, billing is **unavailable** (honest state); the test
key is used only when `EXPO_PUBLIC_ENABLE_BILLING_FALLBACK=true` (demo/dev).

## Dashboard configuration

1. **Entitlement** — create `premium` (or set `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT`
   to your id). This is the single premium tier.
2. **Products** — create in App Store Connect / Play Console and import:

   | Product | Suggested id | Type |
   |---------|--------------|------|
   | Monthly | `soluna_premium_monthly` | auto-renewing |
   | Yearly | `soluna_premium_yearly` | auto-renewing |
   | Lifetime | `soluna_premium_lifetime` | non-renewing |

   Attach all three to the `premium` entitlement.
3. **Offering** — create an offering (e.g. `default`), add the packages, mark it
   **current**. The app renders the current offering via `RevenueCatUI.Paywall`
   (no hardcoded prices).
4. **Paywall** — design it in RevenueCat → Paywalls for that offering.
5. **Customer Center** — enable it (RevenueCat → Customer Center). Profile →
   "Manage subscription" opens it (cancel / change / restore / refund).
6. **Webhook** — point RevenueCat at
   `POST https://<project>.supabase.co/functions/v1/billing-webhook` with header
   `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`. The function rejects a
   missing/invalid secret (401/500, constant-time compare) — it never just logs.

## How identity maps

The client identifies RevenueCat with the **Supabase user id** as `app_user_id`
and records it in `revenuecat_user_mappings`, so webhook events resolve to the
right account. The webhook upserts `subscriptions` (active/expired/inactive) and
`/entitlements` derives `isPremium`.

## Verify on a device (TestFlight or dev build — not Expo Go)

- [ ] Paywall shows the current offering and real prices.
- [ ] Purchase (sandbox) → `/entitlements` returns `isPremium: true`.
- [ ] Restore purchases works on a fresh install.
- [ ] Customer Center opens and can manage/cancel.
- [ ] Cancel/expire → webhook flips the backend entitlement to inactive/expired.
- [ ] With no publishable key set, the paywall shows the honest "unavailable"
      state instead of a broken paywall.
