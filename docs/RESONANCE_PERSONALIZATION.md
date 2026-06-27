# Resonance Feedback — "Tune Soluna to You"

A personalization feedback loop. After a meaningful insight, Soluna asks **"Did
this resonate with you?"** Over time it learns *how* to communicate with each
user — tone, depth, mysticism, action style, focus, and which reflective lenses
to lean on.

> **The one rule that governs everything here:** feedback only ever changes
> **how** Soluna communicates. It **never** changes **what** is true.

---

## What changes vs. what never changes

| Feedback MAY adjust (delivery) | Feedback NEVER alters (facts & safety) |
|--------------------------------|----------------------------------------|
| Tone (gentle / warm / balanced) | Natal placements (Sun, Moon, Rising, houses, aspects) |
| Detail level (deep vs. concise) | BaZi / Four Pillars, Day Master, element balance |
| Spirituality framing (grounded vs. evocative) | Numerology numbers (Life Path, etc.) |
| Action style (one next step vs. practical list) | Tarot draws |
| Focus emphasis (relationships / work) | Transits / moon phase |
| Which lenses to weight more or less heavily | Compatibility scores & math |
| Examples used | Safety rules & "reflective guidance, not fixed fate" framing |

The personalization layer is **separate** from the engines. It can re-weight and
re-phrase, but the deterministic engines remain the single source of truth for
every fact. Nothing in this feature can fabricate certainty, invent a placement,
or turn guidance into a medical / legal / financial / fixed-fate prediction.

---

## How it works (end to end)

1. **Capture.** After a primary insight (Today, Ask, Focus, Compatibility,
   Tarot, Blueprint interpretation) a compact card asks *"Did this resonate?"* —
   **Yes / Partly / Not really**. A `Partly`/`Not really` opens an optional
   follow-up: *what felt off* (chips), a free-text *what would have helped*, and
   a *reframe* request.
2. **Store.** The raw event is written to `resonance_feedback` (owner-scoped).
3. **Recompute (deterministic).** The `resonance` Edge Function re-derives the
   user's `personalization_profiles` row from their most recent 50 feedbacks
   using fixed rules (no LLM) — see [Update rules](#deterministic-update-rules).
4. **Apply.** On the next generation, `buildContext` loads the profile and
   injects a **Personalization Memory** block into the prompt, instructing the
   model on *delivery only*.

---

## Data model

Migration: `supabase/migrations/20260628_resonance_feedback.sql`

### `resonance_feedback` (raw, immutable, owner-authored)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | → `profiles(id)`, `ON DELETE CASCADE` |
| `source_type` | text | one of `today, ask, focus, compatibility, tarot, blueprint` (CHECK) |
| `source_id` | text | optional — e.g. a date, conversation id, `number-7`, `placement-Moon` |
| `resonance` | text | one of `yes, partly, no` (CHECK) |
| `reason_tags` | text[] | e.g. `too_vague`, `too_mystical`, `not_practical_enough` |
| `free_text` | text | optional, capped at 1000 chars |
| `reframe_requested` | text | optional, e.g. `make_it_more_practical` |
| `systems_referenced` | text[] | which lenses the insight used |
| `created_at` | timestamptz | |

Indexed on `(user_id, source_type, created_at desc)`.

### `personalization_profiles` (derived, one row per user)

`preferred_tone`, `detail_level`, `spirituality_level`, `action_style`,
`preferred_focus_areas[]`, `resonant_systems[]`, `less_resonant_systems[]`,
`avoid_patterns[]`, `helpful_patterns[]`, `summary`, `feedback_count`,
`updated_at`. Keyed by `user_id` (PK → `profiles(id)`, `ON DELETE CASCADE`).

Every field is a **delivery preference**. There is intentionally no column that
could ever hold a placement, number, pillar, or transit.

### Row-Level Security

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `resonance_feedback` | owner | owner | — (immutable) | owner (reset) |
| `personalization_profiles` | owner | — | — | owner (reset) |

The profile has **no client write policy**. It is written **only** by the
`resonance` Edge Function via the service role, so the deterministic rules are
the single source of truth and a client can never hand-craft its own
"preferences".

---

## Edge Function API — `supabase/functions/resonance/index.ts`

All routes require the user JWT (owner-scoped).

| Method & path | Purpose |
|---------------|---------|
| `POST /resonance` | submit feedback → recompute profile → return acknowledgement + summary |
| `GET /resonance/profile` | fetch the caller's personalization profile |
| `DELETE /resonance/profile` | reset personalization (clears profile **and** feedback) |

**POST payload** (camelCase):

```jsonc
{
  "sourceType": "today",              // required
  "sourceId": "2026-06-28",           // optional
  "resonance": "partly",             // required: yes | partly | no
  "reasonTags": ["too_vague"],       // optional, unknown tags dropped
  "freeText": "more concrete steps",  // optional, trimmed + capped at 1000
  "reframeRequested": "make_it_more_practical", // optional, unknown rejected
  "systemsReferenced": ["astrology"] // optional, unknown systems dropped
}
```

**Response:**

```jsonc
{ "ok": true, "message": "Thank you…", "summary": "This user prefers…" | null }
```

Validation lives in `validateResonanceFeedback` (`_shared/schemas.ts`): an invalid
`sourceType`/`resonance` or an unknown `reframeRequested` is **hard-rejected**;
unknown `reasonTags`/`systemsReferenced` are **dropped** (lenient), free text is
trimmed and capped.

---

## Deterministic update rules

Pure function `recomputePersonalization(rows)` in
`supabase/functions/_shared/personalization.ts`. **No LLM** — same rows in, same
profile out. Changes are **gradual**: a standing preference only shifts once a
signal *repeats* (threshold `3`), so a single tap never flips anything.

| Signal (from tags / reframe / free text) | Effect once repeated |
|------------------------------------------|----------------------|
| `too_vague`, `wanted_more_depth`, `go_deeper` | `detail_level = deep`; avoid "vague language" |
| `too_mystical`, `make_it_less_mystical` | `spirituality_level = grounded`; avoid "overly mystical phrasing" |
| `too_intense`, `make_it_gentler` | `preferred_tone = gentle` |
| `wanted_more_support`, `tone_didnt_fit` | `preferred_tone = warm` |
| `not_practical_enough`, `make_it_more_practical` | `action_style = practical` |
| `give_me_one_next_step` | `action_style = one_step` |
| `focus_on_work` / `focus_on_relationships` / keywords in free text | `preferred_focus_areas` (threshold `2`) |
| repeatedly **high** resonance for a system (≥3 appearances, yes>low) | `resonant_systems` |
| repeatedly **low** resonance for a system (≥3 appearances, low>yes) | `less_resonant_systems` |

A short, warm `summary` string is built deterministically from the resolved
fields. Nothing learned yet → `summary = null` and no prompt block is emitted.

---

## AI synthesis integration

`personalizationMemoryBlock(profile)` renders the profile into a prompt block
that is injected by `buildContext` (`_shared/synthesis/index.ts`) — so it reaches
**every** generator that builds context: Today, Ask, and Compatibility. The block
is included **only** when a profile with `feedback_count > 0` exists, keeping
prompts clean for new users.

The block always ends with the guardrail:

> Keep astrology, BaZi, numerology, tarot, Human Design-inspired, and Chinese
> astrology as reflective lenses, **not fixed fate**. Do not invent certainty or
> change any underlying data based on this — only the delivery.

---

## Guardrails & tone

- **Never claims the chart changed.** The acknowledgement and the prompt block
  both speak only about *how* Soluna communicates.
- **Never optimizes for flattery.** High resonance does not make Soluna more
  agreeable or self-congratulatory; it simply notes which lenses land.
- **Humble on low resonance:** *"Thank you. I'll tune future guidance toward what
  feels more useful for you."*
- **No medical / legal / financial / deterministic predictions** can be produced
  from feedback. The reflective-lens, not-fixed-fate safety language is preserved.

---

## Privacy

- All feedback and the derived profile are strictly owner-scoped by RLS.
- Free text is the user's own words about *Soluna's delivery* — it is never mixed
  into another user's prompt and never leaves the user's own context.
- The profile contains only delivery preferences — no chart data, no PII beyond
  the `user_id` foreign key.

---

## Reset

A user can clear everything Soluna has learned:

```
DELETE /functions/v1/resonance/profile
```

This deletes the `personalization_profiles` row **and** the user's
`resonance_feedback` history. (Both also cascade-delete with the account.) After a
reset, generations contain no Personalization Memory block until new feedback
accrues.

---

## Demo vs. live

In demo mode (`EXPO_PUBLIC_USE_MOCK_DATA=true`) `submitResonanceFeedback`
is a **no-op that resolves successfully** — it shows the acknowledgement without
writing anything, keeping demo strictly separate from live data.

---

## Testing

`supabase/functions/_shared/tests/resonance_test.ts`:

```bash
deno test --allow-env --allow-read supabase/functions/_shared/tests
```

Covers: payload validation (valid passes; invalid `sourceType`/`resonance` and
unknown reframe rejected; unknown tags/systems dropped); each deterministic rule;
gradualness (one tap never flips a preference); the **"derived profile only ever
contains delivery preferences — never chart facts"** invariant; prompt-block
gating (only when a profile with feedback exists); and the safety guardrails baked
into the memory block (reflective-lens language present; no medical / legal /
financial / certainty directives).

Frontend: `cd expo && npx tsc --noEmit` and `cd expo && npm run lint`
(`ResonanceFeedbackCard.tsx` is lint-clean).
