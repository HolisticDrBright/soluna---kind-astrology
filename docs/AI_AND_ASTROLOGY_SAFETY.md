# Soluna — AI & Astrology Safety

How Soluna stays kind, honest, and safe. This is both a product principle and a
set of enforced behaviours in code.

## What Soluna is — and isn't

Soluna offers **reflective guidance, not fixed fate**. Astrology, BaZi,
numerology, tarot, Chinese astrology, and Human Design–inspired content are
lenses for self-reflection and entertainment. Soluna does **not**:

- predict the future or make deterministic claims;
- give medical, legal, or financial advice;
- diagnose conditions or tell anyone to take/stop medication;
- tell anyone to buy/sell/invest, sue, or end a relationship.

## No fabricated data

Soluna never invents chart facts. Concretely:

- **Astrology** comes from a real provider; if it's unavailable or birth
  coordinates are missing, the chart is returned **blocked** with honest accuracy
  notes — never fabricated placements. In-app approximation is disabled in
  production (`ASTROLOGY_ALLOW_APPROXIMATION=false`).
- **Rising sign / houses / Human Design** are marked approximate without a birth
  time, and the UI shows "Add birth time to reveal" rather than a guessed sign.
- **BaZi** requires a real provider; otherwise it shows an honest "unavailable"
  state (the lightweight Chinese zodiac still works from the date).
- **Transits** use a deterministic moon phase; full transits are off until a
  provider endpoint is configured.
- **Compatibility** uses BaZi only when **both** people have a real chart, and is
  always framed as a reflective lens, never a verdict.
- The app never silently shows demo/mock data in production
  (`expo/lib/config.ts` + `npm run check:demo`).

## Crisis & sensitive-topic handling

The knowledge layer (`supabase/functions/_shared/knowledge/synthesis-rules.ts`)
detects sensitive intents and overrides the cosmic framing with a supportive,
human response:

- **Self-harm / crisis** → set astrology aside; respond with warmth and presence;
  encourage reaching out to a trusted person, therapist, or crisis line.
- **Abuse / safety** → prioritise real-world safety; validate; avoid "repair"
  advice toward an unsafe person; point to real support.
- **Medical** → no diagnosis or medication advice; suggest a qualified professional.
- **Legal** → no legal directives; suggest a qualified professional.
- **Financial** → no buy/sell/invest directives; explore feelings/values only.

These are covered by `_shared/tests/knowledge_safety_test.ts`.

## AI use & personalization

- The LLM **writes prose only**; it never invents the numbers, placements, or
  scores — those are computed deterministically and passed in.
- **Resonance feedback** ("Tune Soluna to you") adjusts *how* Soluna
  communicates — tone, depth, emphasis, examples — and **never** changes chart
  facts, BaZi, numerology, tarot draws, transits, or compatibility math. The
  personalization "memory" is server-side only; user free-text is used for
  keyword signals and is never injected into prompts (no prompt-injection path).
  See `docs/RESONANCE_PERSONALIZATION.md`.

## Privacy in prompts

Raw journals and another person's full chart never reach a prompt. A connection
contributes only "involved + lens", and only for content the user owns.

## Tone

Warm, grounded, reflective, non-fatalistic. Differences are growth invitations,
never doom. Soluna is humble when something doesn't land, and honest when data is
missing.
