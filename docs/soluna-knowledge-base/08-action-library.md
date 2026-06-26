# Action Library

Soluna never leaves a person with insight and nowhere to put it. Every reading
can offer a small, doable, emotionally-safe next move. The Action Library is the
fixed set of **nine action TYPES** Soluna draws from. It mirrors the
`actionLibraryCards` in `_shared/knowledge/action-library.ts` and the
`ACTION_TYPES` vocabulary in `types.ts`.

A crucial design choice: actions are *types*, not fixed scripts. The selection
layer decides which types fit the moment; the language model writes the final,
personalised wording. This keeps readings specific without ever sounding canned,
and keeps every action inside safe, non-clinical bounds.

## Emotional-safety guardrails (read first)

- Actions are reflection tools and gentle nudges — never therapy, never medical
  treatment.
- **`nervous_system_reset` must never suggest pain, cold-shock, ice, rubber-band
  snapping, or any self-punishing "coping."** Those reinforce harm. Only gentle,
  body-based settling is allowed.
- Never push relationship repair where there is abuse or coercion.
- Never give medical, legal, or financial directives inside any action.
- If an action surfaces crisis-level distress, drop the action and route to real
  support (see `07-tone-and-safety-rules.md`).

## The nine action types

### 1. `journal_prompt` — Journal prompt

**When to use:** almost any mood; when the person needs to hear their own
feelings before anything else. The safest, most universal action.

**Safe wording example:** "If you have a quiet minute: what is one thing you're
needing today that you haven't said out loud yet?" Keep it to a *single* open
question — a wall of prompts overwhelms. Never "write about everything that's
wrong" or "analyse why you're like this."

### 2. `boundary_script` — Boundary script

**When to use:** when a feeling needs to become a clear, kind sentence that
protects the person's time, energy, or values.

**Safe wording example:** "You could try: 'I care about this, and I'm not able
to take it on this week.'" A boundary is about your own limit, not controlling
the other person. Never tell them to call someone toxic or cut them off.

### 3. `relationship_repair` — Relationship repair script

**When to use:** when there's tension in a *basically safe* relationship that is
worth tending rather than ending.

**Safe wording example:** "If it feels right, you might open with: 'I've been
quiet and I miss you — can we talk?'" Repair is an invitation; the other person
still gets to choose their response. Never push repair toward an unsafe person.

### 4. `decision_clarity` — Decision clarity exercise

**When to use:** when the person is at a crossroads and reactivity or fear is
clouding their own answer.

**Safe wording example:** "Name your two real options out loud, then notice which
one your body relaxes around — and give it a night before deciding." The goal is
*their* clarity, not a verdict from outside. Never "you should definitely do X"
or "the cards say leave / quit / buy."

### 5. `focus_exercise` — Work / school focus exercise

**When to use:** when overwhelm is blocking a start on work or study.

**Safe wording example:** "Pick the single smallest piece — one paragraph, one
email — and set a ten-minute timer. That's the whole task for now." Start smaller
than feels impressive; momentum compounds. Never "just push through" or
"discipline is all you need."

### 6. `nervous_system_reset` — Nervous-system reset

**When to use:** when activation or anxiety is high and the person needs to
settle *before* deciding or acting.

**Safe wording example:** "Before anything else: one slow breath out, longer than
the breath in. Maybe step outside for a moment, or feel your feet on the floor."
Regulation first, problem-solving second. **Never suggest pain, cold-shock, ice,
a snapped rubber band, or any self-punishing technique** — and never "calm
down."

### 7. `values_check` — Values check

**When to use:** when a choice or conflict needs to be measured against the
person's own compass, especially amid people-pleasing.

**Safe wording example:** "What matters most to you in this situation — honesty,
peace, loyalty, your own rest? Let that be the thing you weigh against." Values
can conflict; the work is choosing which leads *today*, not erasing the other.
Never "your values are wrong" or "a good person would choose X."

### 8. `gratitude_reframe` — Gratitude / reframe

**When to use:** to widen the frame and soften a harsh inner voice — *alongside*
hard feelings, never to bypass them.

**Safe wording example:** "This is genuinely hard. And it might help to also name
one thing that's still steady for you right now." A reframe honours reality; it
doesn't deny it. Never "just be positive" or "others have it worse," and never
use gratitude to dismiss grief, anger, or real distress.

### 9. `next_step_plan` — Planning the next step

**When to use:** at the end of a reading, to turn insight into motion.

**Safe wording example:** "If one small step would help: what's the single thing
you could do before tomorrow night?" One next step is enough; the whole staircase
can wait. It is a suggestion to try, never a command — never "here's your 10-step
life plan" or "do this today or else."

## How actions are chosen

The selection layer (`selectKnowledge.ts`) ranks action types by how often the
selected cards recommend them, weighting types that match the active focus more
heavily, and returns up to four. If nothing matches, it falls back to the safe,
universal `journal_prompt`. In a detected crisis (self-harm or abuse), it
suppresses directive actions entirely and offers only `nervous_system_reset`,
alongside the crisis routing in `07`.
