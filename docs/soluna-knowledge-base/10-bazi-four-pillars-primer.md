# BaZi / Four Pillars — Soluna Primer

A reflective primer for Soluna's **true, provider-backed** BaZi layer. This is
distinct from the lightweight birth-year Chinese zodiac (primer 03). BaZi here is
a **reflective lens for self-insight and entertainment — never fixed fate**, and
is never used for wealth, marriage, health, legal, or destiny predictions.

## What BaZi is in Soluna

BaZi (八字, "eight characters"), or the Four Pillars of Destiny, maps a birth
moment into four pillars — **Year, Month, Day, Hour** — each a Heavenly Stem over
an Earthly Branch. From those eight characters we read elemental balance, the
**Day Master** (the Day stem, standing for the self), the Ten Gods (relational
archetypes), and the **luck pillars** (Da Yun) that describe life's changing
seasons.

Soluna computes this from a **real provider** (FreeAstroAPI) using accurate birth
date, time, and place. We do **not** fabricate it:

- **No provider configured** → BaZi is shown as *unavailable*; the Chinese-zodiac
  lens still applies.
- **No birth time** → a *partial* chart with **no Hour Pillar** (never guessed)
  and approximate Day-Master strength.
- **No birth place** → *partial*; true solar time isn't applied, so near-midnight
  pillars are held loosely.
- **Provider call fails** → *unavailable*, never a fake chart.

Only a chart with `source: "provider"` and a real Day Master is ever labelled
"BaZi / Four Pillars" in the app.

## The pieces (all framed as reflection, not fate)

- **Day Master** — your core self, one of ten: each element (Wood, Fire, Earth,
  Metal, Water) in its Yang or Yin expression (e.g. Yang Wood = a tall tree;
  Yin Water = dew and mist). A temperament mirror, not a verdict.
- **Day-Master strength** — *strong* (self-assured, learning to yield), *weak*
  (receptive/collaborative, learning to self-source), or *balanced*. Strong/weak
  describe an energy balance, never "better" or "worse."
- **Five-Element balance** — which elements are abundant or quiet in the chart.
  Abundance is energy to channel; a quiet element is a quality to cultivate, never
  a deficiency to fear.
- **Useful / supportive element** (用神) — the element that brings the chart into
  balance, framed as a gentle theme to lean into (e.g. "lean into Water: rest,
  reflection, flow").
- **Ten Gods** — relational archetypes (Companion, Bold Drive, Easy Expression,
  Expressive Nonconformity, Steady Stewardship, Resourcefulness, Structure &
  Responsibility, Courage Under Pressure, Nurture & Learning, Unconventional
  Insight). The two "wealth" gods are framed as **diligence and resourcefulness**
  — never money predictions.
- **Pillars** — Year (roots / outer self), Month (growth, work), Day (core self &
  closeness), Hour (inner world & what you're growing toward). Windows for
  reflection, never forecasts.
- **Luck pillars (Da Yun)** — decade-long seasons. A rhythm to work with; no
  season is "good luck" or "bad luck."

## Compatibility

BaZi compatibility runs **only when both people have a real provider chart**. It
uses the genuine Five-Element generating (生) and controlling (克) cycles to
reflect on two Day Masters (kindred / nourishing / dynamic / independent) plus a
complementarity check. If either chart is missing, Soluna does **not** fake it.

## Tone & safety rules (specific to BaZi)

- Never predict wealth, marriage, children, health, lifespan, or fixed outcomes.
- Never give medical, legal, or financial direction.
- Strong/weak, clashes, and controlling cycles are growth lenses, never warnings.
- Always hold it as one lens among many, and let the person's lived experience
  lead.

## Provider configuration (backend only)

Set as Edge Function secrets (never client-side): `BAZI_PROVIDER=freeastroapi`,
`BAZI_API_BASE_URL`, `BAZI_API_KEY`, and the feature flags
`BAZI_ENABLE_TRUE_SOLAR_TIME`, `BAZI_ENABLE_LUCK_CYCLES`,
`BAZI_ENABLE_COMPATIBILITY`. See `DEPLOYMENT.md`.

---

*Reflective lens only. BaZi in Soluna is a mirror for self-insight and
entertainment, not fixed fate, and not advice about health, money, or major life
decisions.*
