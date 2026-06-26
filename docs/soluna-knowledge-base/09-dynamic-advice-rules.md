# Dynamic Advice Rules

Soluna's readings get more useful the more it understands a person's current
moment — but only ever from that person's *own* data, and only in minimised,
privacy-safe form. This document describes how Soluna adapts advice and, just as
importantly, the privacy and minimisation rules that are actually enforced in
code. The implementation lives in
`_shared/synthesis/knowledge-context.ts` (`gatherDynamicContext`) and the
selection layer in `_shared/knowledge/selectKnowledge.ts`. When this doc and the
code disagree, the code wins.

## What Soluna can adapt to

Soluna can shape a reading using:

- **Previous app activity** — recurring topics (for example, repeated Ask
  questions about the same theme) distilled into theme tags.
- **Saved readings** — what a person has chosen to keep, as a signal of what
  resonates.
- **Journal history (themes only)** — never the words, only distilled themes
  (see Privacy below).
- **Ask history** — recurring questions, as theme signals.
- **Current focus / problem input** — the active focus's category and a short
  problem statement, which bias which cards come forward.
- **Connections / relationship context** — only as "involved + lens" (for
  example, a romantic or work lens), never another person's chart or data.
- **Subscription tier, where relevant** — tier may gate *how much* dynamic
  context or which surfaces are available, but it never changes the safety,
  scope, or tone rules. A free reading and a premium reading are equally honest
  and equally safe.

These become the minimised hints the selection layer consumes: `focus`,
`connection` (involved + lens), and pre-distilled tag lists
(`journalThemeTags`, `activityTags`).

## Privacy and minimisation — as actually implemented

`gatherDynamicContext(userId)` reads **only the current user's own data** and
returns only minimised signals: distilled theme tags, an active-focus summary,
and an optional connection lens. The concrete rules it enforces:

- **Raw journal text is never forwarded.** It reads the person's most recent
  journal entries, runs each body through `tagsFromText(...)` to distil
  `SynthesisTag`s, and returns *only those tags*. The raw bodies never leave the
  function and are never placed in a prompt.
- **A connection contributes only "involved + lens."** Never a birth chart,
  never the other person's private data — just whether a connection is involved
  and which relational lens applies.
- **A connection is used only when the user owns the focus that references it.**
  The connection is pulled only if the user's active focus references it, and
  the query is scoped by `user_id` so it can never read another user's record —
  an explicit ownership check.
- **Focus-level opt-out is respected.** If the active focus's `allowed_context`
  sets `use_connection: false`, the connection is not used at all.
- **Best-effort, never blocking.** If anything fails, it returns empty context
  rather than blocking the reading. Dynamic context enriches; it is never
  required.

## No diagnosing, no speculation

Dynamic context makes readings more *relevant*, never more *clinical*. Soluna
does not infer or assert a diagnosis from journal themes, activity, or focus
text. It does not claim to know what another person (a connection) thinks or
feels — the connection only ever contributes a lens. The third-party
speculation and medical rules in `07-tone-and-safety-rules.md` apply in full to
dynamically-informed readings.

## Crisis routing inside dynamic advice

Adaptation never overrides safety. The selection layer runs
`scanUserInputSafety` on the user's own words on every reading. When a self-harm
or abuse signal is detected, dynamic personalisation steps back: directive
actions are suppressed, the response leads with grounding
(`nervous_system_reset`) and warmth, and the person is pointed to real-world
support per `SAFETY_GUIDANCE`. No amount of context changes this.

## The learning signal: `advice_feedback`

So that dynamic advice can learn what actually lands, Soluna records lightweight
feedback in the `advice_feedback` table
(`migrations/20260626_advice_feedback.sql`). Each row is owner-scoped and
minimal:

- **`rating`** — `helpful` or `not_helpful` (the core signal).
- **`surface`** — where the reading appeared: `ask`, `today`, `focus`,
  `compatibility`, or `insight`.
- **`confidence_label`** — the label that reading carried (`strong`,
  `supportive`, `mixed`, or `reflective`), so feedback can be read against how
  confident Soluna was.
- Optional `ref_id` and a short free-text `reason`.

The table is protected by owner-scoped row-level security: a person can read,
add, and delete only their own feedback, and feedback is immutable once given
(correct it by deleting and re-adding). Aggregated over time, the
`helpful` / `not_helpful` signal — especially read alongside `surface` and
`confidence_label` — tells the team which kinds of readings genuinely help, and
where to tune the knowledge and the voice.

## Putting it together

1. `gatherDynamicContext` reads the user's own data and returns minimised
   signals (journal theme tags, focus, connection lens) under the privacy rules
   above.
2. `selectKnowledge` combines those signals with the person's real computed
   blueprint, deterministically picks cards, computes agreement and tension,
   assigns the confidence label, and runs the safety scan.
3. The model writes the reading from the selected cards, in Soluna's voice,
   ending on a safe action.
4. The person's `helpful` / `not_helpful` feedback flows into `advice_feedback`,
   closing the loop so the advice keeps getting kinder and more useful — without
   ever widening what Soluna stores or assumes about them.
