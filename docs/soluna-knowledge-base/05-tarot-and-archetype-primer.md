# 05 — Tarot & Archetype Primer

> **What this document is.** Soluna's own, original meanings for the 22 Major
> Arcana, treated as **archetypes for reflection** — never as fortune-telling. It
> also explains exactly how those meanings are encoded in the data file
> `tarot-archetypes.ts`, so the words a user eventually reads always trace back to
> a kind, non-fatalistic source.

---

## Tarot in Soluna: a mirror, not a forecast

Soluna uses tarot the way a thoughtful journaling prompt uses a metaphor — to help
someone *see their own situation from a new angle*. A card never tells the future,
never warns of doom, and never claims certainty. Each card is a doorway into a
question worth sitting with.

Every card in the data file carries, in its `confidenceNotes`, a small reminder of
this. For example, The Fool's note ends:

> "A card is a mirror for reflection, not a forecast of what will happen."

That line is part of the content the model sees, so the framing travels with the
card.

> **Non-fatalistic by design.** The two cards people most fear — Death and The
> Tower — are deliberately written as *transformation/release* and *sudden
> clarity/necessary change*. They each also carry a `safetyNotes` entry instructing
> that they must **never** be read as literal harm or catastrophe. More on this
> below.

---

## The Soluna model for every card

Soluna describes each archetype with four gentle facets:

1. **Light** — the gift the card invites: what's strong, generative, or available.
2. **Shadow** — the gentle growth edge: where to soften, balance, or look honestly
   (framed as an *invitation*, never a flaw).
3. **Question to ask** — one reflective question to sit with.
4. **Gentle action** — a small, doable, emotionally-safe next step.

### How the data file encodes the model

The Soluna model maps directly onto fields in each `KnowledgeCard`:

| Soluna facet | Data field | Notes |
|---|---|---|
| **Light** | `strengths` | The card's gifts, as a short list. |
| **Shadow** | `growthEdges` | Always phrased as "An invitation to…" / "A nudge to…". |
| **Question to ask** | `confidenceNotes[0]` | Always begins with the literal prefix **`"Question to ask:"`** |
| **Gentle action** | `supportiveActions` | Action *types* (e.g. `journal_prompt`); the model writes the wording. |

Two more fields keep the tone safe on every card:

- `avoidSaying` — fear-based or fatalistic phrasings the model must never use
  (e.g. for The Fool: *"You are being reckless and will fall."*).
- `synthesisTags` — the bridge vocabulary that lets a card combine with other
  systems (see doc 06).

So when Soluna eventually speaks, "the light" is paraphrased from `strengths`, "the
shadow" from `growthEdges`, the reflective question is lifted from
`confidenceNotes[0]`, and the gentle action is chosen from `supportiveActions`.

---

## The 22 Major Arcana — Soluna meanings

For each card: **Light** / **Shadow** / **Question to ask** / **Gentle action**.
The questions below are the exact `confidenceNotes[0]` text (minus the prefix); the
gentle actions name the `supportiveActions` on the card.

### 0 — The Fool
- **Light:** Open-hearted curiosity, a beginner's mind, courage to start.
- **Shadow:** Pair spontaneity with a little grounding; notice avoidance dressed up
  as adventure.
- **Question:** What new beginning am I being invited to trust, and what one small
  step feels possible?
- **Gentle action:** Next-step plan; journal prompt.

### 1 — The Magician
- **Light:** Resourcefulness, focused intention, turning ideas into action.
- **Shadow:** Make sure words and actions match; use your gifts for something true.
- **Question:** What do I already have that I have been overlooking?
- **Gentle action:** Next-step plan; values check.

### 2 — The High Priestess
- **Light:** Deep intuition, patience, listening beneath the noise.
- **Shadow:** Trust your quiet signals; share what you sense.
- **Question:** What does my quieter, wiser self already sense that I have been
  talking over?
- **Gentle action:** Journal prompt; nervous-system reset.

### 3 — The Empress
- **Light:** Nurturing warmth, creative energy, comfort and ease.
- **Shadow:** Receive care, not only give it.
- **Question:** Where could I offer myself the same care I so easily give others?
- **Gentle action:** Nervous-system reset; gratitude reframe.

### 4 — The Emperor
- **Light:** Grounded leadership, healthy structure, clear boundaries.
- **Shadow:** Keep structure flexible enough to breathe; lead with warmth.
- **Question:** Where would a little more structure actually free me up?
- **Gentle action:** Next-step plan; boundary script.

### 5 — The Hierophant
- **Light:** Respect for wisdom and mentorship, belonging, principled grounding.
- **Shadow:** Keep what serves you; gently question what no longer fits.
- **Question:** Which beliefs here are truly mine, and which did I simply inherit?
- **Gentle action:** Values check; journal prompt.

### 6 — The Lovers
- **Light:** Genuine connection, values-aligned choices, heart-and-mind harmony.
- **Shadow:** Choose from values rather than fear of missing out.
- **Question:** If I chose from my values rather than my fears, which way would I
  lean?
- **Gentle action:** Decision clarity; relationship repair.

### 7 — The Chariot
- **Light:** Determination, focus, uniting opposing forces toward a goal.
- **Shadow:** Steer with intention rather than pushing through exhaustion.
- **Question:** What would it look like to move forward with focus and without
  forcing?
- **Gentle action:** Next-step plan; focus exercise.

### 8 — Strength
- **Light:** Gentle courage, emotional resilience, calm amid intensity.
- **Shadow:** Be as kind to yourself as you are brave for others.
- **Question:** Where could meeting myself with gentleness be stronger than pushing
  harder?
- **Gentle action:** Nervous-system reset; journal prompt.

### 9 — The Hermit
- **Light:** Comfort with solitude and reflection, inner wisdom, willingness to
  slow down.
- **Shadow:** Make space for rest without slipping into isolation.
- **Question:** What might become clear if I gave myself a little quiet right now?
- **Gentle action:** Journal prompt; nervous-system reset.

### 10 — Wheel of Fortune
- **Light:** Adaptability, trust in life's cycles, openness to turning points.
- **Shadow:** Focus on your response, not only the circumstances.
- **Question:** Within this change, what is still mine to shape?
- **Gentle action:** Journal prompt; values check.

### 11 — Justice
- **Light:** Fairness, honesty, accountability, integrity.
- **Shadow:** Hold fairness without harshness; let compassion sit beside clarity.
- **Question:** What would the fairest, most honest version of this situation look
  like?
- **Gentle action:** Values check; decision clarity.

### 12 — The Hanged Man
- **Light:** Willingness to pause and reconsider, fresh perspective, patience with
  the in-between.
- **Shadow:** Find meaning in waiting; release what you can't control right now.
- **Question:** What might I see if I let go of needing to fix this immediately?
- **Gentle action:** Journal prompt; nervous-system reset.

### 13 — Death  *(transformation / release — never literal)*
- **Light:** Capacity to release what no longer fits; openness to meaningful
  transformation; honesty that a chapter has ended.
- **Shadow:** Grieve what is ending while trusting space is being made; let go
  gently rather than gripping the old shape.
- **Question:** What am I being invited to lovingly release so something new has
  room?
- **Gentle action:** Journal prompt; gratitude reframe.
- **Safety note (in data):** *"Never read as literal harm or catastrophe; this card
  is about transformation and release."* The `avoidSaying` list explicitly blocks
  *"This means a literal death or loss of life."*

### 14 — Temperance
- **Light:** Balance, patience, blending opposites into harmony.
- **Shadow:** Trust slow, steady progress over quick extremes.
- **Question:** Where could a more balanced, patient pace serve me better than
  extremes?
- **Gentle action:** Nervous-system reset; values check.

### 15 — The Devil
- **Light:** Honesty about what holds you back, awareness of patterns, courage to
  reclaim your power.
- **Shadow:** Question the belief that you have no choice; set a boundary with what
  drains you, without shame.
- **Question:** What story of being stuck might have more give in it than I assumed?
- **Gentle action:** Boundary script; values check.

### 16 — The Tower  *(sudden clarity / necessary change — never disaster)*
- **Light:** Openness to needed change; honesty when something no longer holds;
  resilience and the chance for a truer rebuild.
- **Shadow:** Treat sudden clarity as information, not punishment; be tender while
  things rearrange.
- **Question:** If something shaky is giving way, what truer thing wants room to be
  built?
- **Gentle action:** Nervous-system reset; journal prompt.
- **Safety note (in data):** *"Never read as literal harm or catastrophe; this card
  is about sudden clarity and necessary change."* The `avoidSaying` list blocks
  *"Disaster and ruin are coming."*

### 17 — The Star
- **Light:** Hope, renewed faith, gentle healing, calm trust.
- **Shadow:** Let yourself rest and refill; believe you're worthy of the calm you
  long for.
- **Question:** What would help me feel quietly replenished right now?
- **Gentle action:** Gratitude reframe; nervous-system reset.

### 18 — The Moon
- **Light:** Rich intuition and imagination, comfort with the unknown, emotional
  honesty.
- **Shadow:** Separate old fears from present facts; be patient as clarity arrives.
- **Question:** Which of my worries are about right now, and which are echoes of the
  past?
- **Gentle action:** Journal prompt; nervous-system reset.

### 19 — The Sun
- **Light:** Warmth, optimism, vitality, clarity, shared joy.
- **Shadow:** Receive good things without bracing for the catch; let yourself be
  seen.
- **Question:** What small good thing can I let myself fully enjoy today?
- **Gentle action:** Gratitude reframe; journal prompt.

### 20 — Judgement
- **Light:** Honest self-reflection, capacity for forgiveness and renewal,
  readiness to answer a deeper calling.
- **Shadow:** Review the past with compassion, not self-criticism; act on the call
  you've been hearing.
- **Question:** If I looked back with kindness, what would I forgive and what would I
  answer?
- **Gentle action:** Journal prompt; values check.

### 21 — The World
- **Light:** Completion, wholeness, integration of lessons, gratitude.
- **Shadow:** Pause to honour how far you've come; carry growth forward without
  rushing the next beginning.
- **Question:** What feels complete enough to honor before I look toward what is
  next?
- **Gentle action:** Gratitude reframe; next-step plan.

---

## How a card enters a reading

`selectKnowledge.ts` accepts a tarot draw by `key` (e.g. `"the_fool"`) or by `name`
(e.g. `"The Fool"`, which it lowercases and underscores). At most **one** Major
Arcana card is active per reading, and it's pulled by exact key — never picked at
random by the prose layer. Once selected, the card contributes its `synthesisTags`
to the agreement/tension engine just like every other system (see doc 06).

---

## The rules this primer enforces

- Tarot is for **reflection, not prediction**. Always frame a card as a mirror.
- **No fear-based readings.** Death = transformation/release. The Tower = sudden
  clarity/necessary change. Honour the `safetyNotes` and `avoidSaying` on every
  card.
- **Light before shadow.** Lead with the gift; offer the edge as a gentle
  invitation.
- **Always leave the user with a question and a small, kind action.**

A card can clarify a choice, but it can never make it for you — and it can never
tell you what will happen.

---

*Reflective archetypes only. Tarot in Soluna is a mirror for self-reflection, not a
forecast.*
