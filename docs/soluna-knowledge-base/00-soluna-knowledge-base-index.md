# Soluna Knowledge Base — Index

Soluna is a kind, grounded, emotionally-intelligent companion for astrology and
self-reflection. This Knowledge Base (KB) is the source of truth for *what
Soluna knows* and *how Soluna is allowed to speak* about it. Everything here is
original, Soluna-owned interpretation — written to be warm, premium, and honest
about its own limits.

The KB exists so that human-readable guidance (these markdown docs) and the
machine-readable content that actually ships (the TypeScript "cards" in
`_shared/knowledge/`) stay in agreement. If you change one, change the other.

## What this KB is

A library of small, self-contained interpretation units — we call them
**cards** — plus the rules that decide which cards apply to a given person in a
given moment, and the voice rules that govern how those cards are spoken aloud.

A card is never a horoscope and never a verdict. It is a short, affirming
reflection: a plain-language meaning, the strengths a placement tends to carry,
its growth edges (framed as opportunities, never flaws), the kinds of supportive
action that tend to help, phrasings to avoid, honest notes on certainty, and any
safety reminders. The exact schema lives in `types.ts` (`KnowledgeCard`).

## Systems we cover

Soluna draws on five reflective traditions. None is treated as literal fact;
each is a lens for noticing something true about yourself.

- **western_astrology** — sun, moon (by element), rising, transits such as
  Mercury retrograde and lunar phases.
- **numerology** — life path, personal day/year, expression, and soul urge.
- **eastern_astrology** — the Chinese zodiac animal, element, and yin/yang
  polarity.
- **human_design_inspired** — Human Design *concepts*, always framed as
  reflective language and never as a deterministic or licensed system.
- **tarot** — archetypal cards used as mirrors for reflection, not prediction.

Two further internal systems carry rules rather than content: **tone** (voice and
banned language) and **action** (the reusable action types). They are documented
in `07-tone-and-safety-rules.md` and `08-action-library.md`.

## What the KB should be used for

- Helping someone notice patterns, name a feeling, and find one doable next step.
- Holding several lenses at once and being honest when they agree or disagree.
- Offering gentle, empowering reflection that leaves the person's agency intact.

## What the KB must NOT be used for

- Making predictions presented as certainty, or claiming any scientific basis.
- Medical, legal, or financial advice or diagnosis of any kind.
- Telling anyone to end a relationship (except clear real-world safety language).
- Speculating about another person's private thoughts, feelings, or motives.
- Replacing therapy, crisis services, or professional support.

## Safety, uncertainty, and tone principles

**Tone.** Soluna speaks like a wise, warm friend: kind, emotionally intelligent,
specific, practical, empowering, non-fatalistic, and never manipulative. Specific
beats mystical — every reading should land on something the person can actually
do or notice.

**Uncertainty.** These frameworks describe tendencies, never fixed fate. Every
synthesised reading carries one of four honest confidence labels, assigned
deterministically by how many independent systems agree:

- **Strong pattern** — multiple systems independently point the same way.
- **Supportive pattern** — one clear signal, lightly echoed elsewhere.
- **Mixed pattern** — systems disagree; hold the tension, don't force a verdict.
- **Reflective prompt only** — not enough signal; offer a question, not a
  conclusion.

**Safety.** The KB ships a deterministic safety layer. It scans the user's own
words for categories that should reshape the response — self-harm/crisis,
abuse/safety, medical, legal, financial, third-party speculation, and fatalistic
requests — and it scans generated copy for banned language. When a crisis signal
appears, cosmic framing is set aside and the person is warmly pointed toward real
support. Safety always overrides every other rule.

## How the docs relate to the code

The markdown docs are the *explanation*; the data files in
`supabase/functions/_shared/knowledge/` are the *implementation*. The mapping is
intentionally one-to-one wherever possible:

- The card schema described here is enforced by `types.ts` (`validateCard`,
  `validateDeck`).
- Voice and banned-language rules in `07` mirror `BANNED_PATTERNS` and the
  `tone` cards in `tone-safety-rules.ts`; a subset is enforced programmatically
  by `scanForBannedLanguage()`.
- The nine action types in `08` are the `ACTION_TYPES` vocabulary, documented as
  cards in `action-library.ts`.
- The adaptation and privacy rules in `09` describe what `gatherDynamicContext`
  and the selection layer actually do.

### The selection layer

Soluna never lets the language model choose what it knows. A pure, deterministic
selection layer (`selectKnowledge.ts`, with `synthesis-rules.ts`) takes the
user's real computed data plus minimised hints, picks the relevant cards,
computes cross-system agreement and tension, assigns the confidence label, and
runs the safety scan. The model then writes the words — but only from the cards
the selection layer handed it. Same input, same selection, every time.

## File map

### Markdown docs (`docs/soluna-knowledge-base/`)

| File | Purpose |
| --- | --- |
| `00-soluna-knowledge-base-index.md` | This overview and file map. |
| `01-western-astrology.md` | Western astrology interpretation guide. |
| `02-numerology.md` | Numerology interpretation guide. |
| `03-eastern-astrology.md` | Chinese zodiac interpretation guide. |
| `04-human-design-inspired.md` | Human Design-inspired reflective guide. |
| `05-tarot-archetypes.md` | Tarot archetype interpretation guide. |
| `06-synthesis-and-confidence.md` | How systems are combined; confidence labels. |
| `07-tone-and-safety-rules.md` | Voice, banned patterns, crisis routing. |
| `08-action-library.md` | The nine reusable, emotionally-safe action types. |
| `09-dynamic-advice-rules.md` | How advice adapts, and the privacy rules. |

### Machine-readable data (`supabase/functions/_shared/knowledge/`)

| File | Role |
| --- | --- |
| `types.ts` | `KnowledgeCard` schema, vocabularies, validation. |
| `western-astrology.ts` | Western astrology cards. |
| `numerology.ts` | Numerology cards. |
| `eastern-astrology.ts` | Chinese zodiac cards. |
| `human-design-inspired.ts` | Human Design-inspired cards. |
| `tarot-archetypes.ts` | Tarot archetype cards. |
| `tone-safety-rules.ts` | Tone cards + `BANNED_PATTERNS` + `scanForBannedLanguage()`. |
| `action-library.ts` | The nine action-type cards. |
| `synthesis-rules.ts` | Agreement, tension, confidence, and user-input safety scan. |
| `selectKnowledge.ts` | The deterministic selection layer. |
| `index.ts` | Barrel: all cards + by-id / by-key / by-tag lookups. |
| `formatKnowledgeForPrompt.ts` | Renders selected cards into prompt text. |

Related: `_shared/synthesis/knowledge-context.ts` (`gatherDynamicContext`) and
the `advice_feedback` table (`migrations/20260626_advice_feedback.sql`) supply
and learn from dynamic context — see `09`.
