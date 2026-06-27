# Soluna — Production QA

Run this against a **production-config** build (demo off) before every release.
The goal: confirm real data flows, and that nothing fake or fabricated reaches a
paying user.

## 0. Static gates (CI / local)

```bash
cd expo
npm run typecheck     # tsc --noEmit
npm run lint          # eslint (0 errors)
npm run check:demo    # no demo data can reach live mode

# Secret-leak greps (must return nothing):
grep -rnE "SERVICE_ROLE|service_role" expo/ --include=*.ts --include=*.tsx | grep -v node_modules
grep -rnE "EXPO_PUBLIC_[A-Z_]*(SECRET|SERVICE_ROLE|PRIVATE)" expo/ .env.example | grep -v node_modules
```

## 1. Mode & config

- [ ] Production build reports demo **off** (`config.demoMode === false`).
- [ ] No "Maya" demo user, demo connections, demo journal, demo chat, or sample
      tarot/daily anywhere.
- [ ] With Supabase env **missing**, the app shows the honest "can't connect"
      path (no fake client, no silent success) — not a white screen.

## 2. Auth (real Supabase)

- [ ] Sign up → email confirmation flow.
- [ ] Sign in / sign out / reset password / resend confirmation.
- [ ] Signed-out users see the auth gate, not app content.

## 3. Core flows — real data + honest states

For each: verify it loads real backend data, and shows **loading / empty / error
+ retry** (and offline) states rather than fake content.

- [ ] **Onboarding** → submits real birth data; birthplace resolves via Google
      (typed search); no fake `0,0`/UTC.
- [ ] **Today / Home** → `getToday()`; empty/loading honest; no fabricated transits.
- [ ] **Blueprint** → real placements; Rising shows "Add birth time to reveal"
      (never a fabricated sign) when birth time is unknown; per-lens "not
      available yet" for any missing lens.
- [ ] **Ask** → real `askSoluna()`; free-tier cap enforced; typing + error/retry.
- [ ] **Profile / me** → real subscription + account; data export + delete account.
- [ ] **Compatibility / Connections** → real list + per-connection reading; BaZi
      only when both have a real chart.
- [ ] **Tarot** → real `drawTarot()`.
- [ ] **Journal / Saved / Rituals / Focus** → real entries + empty states; demo-only
      surfaces render `ComingSoon` in live mode.

## 4. Astrology honesty

- [ ] No birth time → Rising/houses/Human Design clearly marked approximate.
- [ ] Provider down or coords missing → chart returns **blocked** (no fabricated
      placements), with honest accuracy notes.
- [ ] Moon phase present (deterministic); full transits only if the provider
      endpoint is configured.

## 5. Billing (see REVENUECAT_SETUP.md)

- [ ] Premium status comes from the backend entitlement (`/entitlements`), not a
      local flag.
- [ ] Paywall renders the RC offering; **with no key configured it shows the
      honest "billing unavailable" state**, never a broken/empty paywall.
- [ ] Purchase → entitlement unlocks; Restore works; Manage subscription opens
      the RC Customer Center.
- [ ] Webhook with a bad/missing `Authorization` is **rejected (401/500)**, not
      silently accepted.

## 6. Safety (see AI_AND_ASTROLOGY_SAFETY.md)

- [ ] Self-harm / abuse / medical / legal / financial prompts trigger the
      supportive, non-deterministic safety response (no diagnosis, no
      buy/sell/sue advice, no fixed-fate claims).
- [ ] Resonance feedback changes tone/emphasis only — never chart facts.

## 7. Ops

- [ ] Sentry receives a test error (PII scrubbed).
- [ ] Push registration + a test notification (TestFlight/dev build).
- [ ] Account deletion removes all user data (cascades).
