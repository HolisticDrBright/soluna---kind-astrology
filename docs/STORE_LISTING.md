# Soluna — App Store Listing

Draft listing copy + the App Privacy answers. Review before submission.

## Identity

| Field | Value |
|-------|-------|
| App name | Soluna |
| Subtitle | Kind, cross-system astrology |
| Bundle id (iOS) | `com.holisticdrbright.soluna` |
| Package (Android) | `com.holisticdrbright.soluna` |
| Category | Lifestyle (secondary: Health & Fitness / Reference) |
| Age rating | 12+ (infrequent/mild mature themes; reflective guidance) |

## Short description

Soluna is a warm, grounded astrology companion. It weaves Western astrology,
BaZi/Four Pillars, numerology, tarot, Chinese astrology, and Human Design–inspired
insight into gentle, reflective daily guidance — never fixed-fate predictions.

## Long description (draft)

Meet Soluna — astrology that's kind to you. Soluna blends several wisdom
traditions into one calm, coherent daily practice:

- **Your Blueprint** — a real birth-chart reading across Western astrology, BaZi,
  numerology, Chinese zodiac, and Human Design–inspired lenses.
- **Today** — a gentle daily reading grounded in your real chart and the moon phase.
- **Ask Soluna** — a thoughtful conversation that draws on your blueprint.
- **Compatibility** — reflective relationship insight (a lens, not a verdict).
- **Tarot, Journal, Rituals, Focus** — supportive tools for reflection.
- **Tune Soluna to you** — feedback gently adjusts *how* Soluna talks with you,
  never the underlying chart facts.

Soluna is for reflection and self-understanding. It does not predict the future
and is not medical, legal, or financial advice.

## Premium

Soluna Premium (entitlement `premium`) unlocks the full Blueprint, unlimited Ask
Soluna, and cross-system reports. Offered as monthly / yearly / lifetime via
RevenueCat; managed in-app (restore + Customer Center). See
`docs/REVENUECAT_SETUP.md`.

## App Privacy (data the app collects)

| Data | Used for | Linked to user | Tracking |
|------|----------|----------------|----------|
| Email | Account / auth | Yes | No |
| Name, birth date/time/place | Core astrology features | Yes | No |
| User content (journal, chat, feedback) | App functionality | Yes | No |
| Purchases | Subscription management (RevenueCat) | Yes | No |
| Crash/diagnostics (Sentry, PII-scrubbed) | Stability | No | No |

Soluna does **not** use third-party advertising or cross-app tracking → **App
Tracking Transparency not required** (no `NSUserTrackingUsageDescription`).
`ITSAppUsesNonExemptEncryption=false` (standard HTTPS only).

## Required URLs

- Privacy Policy — host `docs/PRIVACY_POLICY.md`.
- Terms of Use (EULA) — host `docs/TERMS.md`.
- Support — `EXPO_PUBLIC_SUPPORT_EMAIL`.

## Review notes (for the App Review team)

- Provide a demo build or a test account. A demo mode exists
  (`EXPO_PUBLIC_ENABLE_DEMO_MODE=true`) showing sample content for screenshots;
  the shipped build runs on real data.
- Astrology/numerology/tarot content is entertainment + self-reflection, framed
  as reflective guidance, not fixed fate, and not medical/legal/financial advice
  (see `docs/AI_AND_ASTROLOGY_SAFETY.md`).

## Assets checklist

- [ ] App icon (1024×1024, no alpha)
- [ ] iPhone 6.7" + 6.5" screenshots (capture in demo mode)
- [ ] iPad screenshots (only if `supportsTablet` is enabled — currently false)
- [ ] Optional preview video
