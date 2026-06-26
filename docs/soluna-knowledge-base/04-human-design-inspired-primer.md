# 04 — Human Design-Inspired Primer

> **What this document is.** A plain-language guide to the *Human Design-inspired*
> reflection layer in Soluna's knowledge base, and a faithful description of what
> the data file `human-design-inspired.ts` actually contains. Everything here is a
> gentle lens for self-reflection. Nothing here is a rule, a diagnosis, or a
> prediction.

---

## ⚠️ Licensing & framing caveat (read this first)

```
┌──────────────────────────────────────────────────────────────────────┐
│  HUMAN DESIGN-INSPIRED — NOT A LICENSED OR OFFICIAL SYSTEM             │
│                                                                        │
│  "Human Design" as a named, packaged system carries proprietary and   │
│  trademark associations tied to its original authors and bodies.       │
│  Soluna does NOT claim affiliation, certification, endorsement, or     │
│  any license from those parties.                                       │
│                                                                        │
│  What Soluna offers is a "Human Design-INSPIRED" reflection layer:     │
│  original, plainly-worded content that borrows the broad SHAPE of the  │
│  idea (energy styles, decision styles, life themes, consistency        │
│  themes) without reproducing proprietary charts, jargon, gate/channel  │
│  catalogues, or copyrighted descriptive text.                          │
│                                                                        │
│  RULES FOR ALL SOLUNA SURFACES:                                        │
│   • Always say "Human Design-inspired," never "your Human Design."     │
│   • Prefer plain language: "energy style," "decision style,"           │
│     "life theme," "consistency theme."                                 │
│   • Avoid proprietary jargon and trademarked phrasings.                │
│   • Present it as ONE reflective lens among several — never as the     │
│     authoritative or deterministic truth about a person.               │
│   • Never imply Soluna is a substitute for an official reading.        │
└──────────────────────────────────────────────────────────────────────┘
```

Every card in this layer also carries this framing *in its own data*. The
`confidenceNotes` field on each card opens with a line such as:

> "A Human Design-inspired reflection, offered as a lens, not a rule."

That note is part of the content the model sees, so the caveat travels with the
card wherever it is used.

---

## Why this layer exists

People find it genuinely useful to have language for *how they tend to operate* —
when their energy is best spent, how they reach clear decisions, what their longer
life arc tends to emphasise, and which parts of themselves are steady versus
absorptive. The Human Design-inspired framework gives Soluna a warm vocabulary for
exactly that.

But "useful framing" is not "fixed fact." Soluna treats this layer the way a kind
friend would offer an observation: *"Here's a pattern I notice — does it fit?"* The
user remains the authority on their own life. Nothing here is destiny.

In the data file, **every card** includes an `avoidSaying` list of phrasings the
model must never use — almost all of them are deterministic, fatalistic, or
shaming statements ("Your design means you'll burn out if you don't follow the
rules"). The point is to keep the lens soft.

---

## The four families of cards

The file `human-design-inspired.ts` is organised into four clearly-commented
sections. Each card shares the same shape used everywhere in the knowledge base:
a `title`, a `plainMeaning`, `strengths` (the light), `growthEdges` (the gentle
edges), `supportiveActions`, `avoidSaying`, `synthesisTags` (the bridge vocabulary
used by the synthesis engine — see doc 06), and `confidenceNotes`.

| Family | "Borrowed shape" | Soluna's plain name | Cards in file |
|---|---|---|---|
| Energy styles | type | "type-like energy" | 5 |
| Decision styles | authority | "decision style" | 8 |
| Life themes | profile | "life theme" | 4 |
| Consistency themes | centers | "consistency theme" | 9 |

---

## 1. Energy styles (the five)

How your energy tends to want to move. Soluna describes five recognisable energy
styles. None is better than another; each simply has a natural rhythm.

### Generator-style energy
A steady, renewable energy that comes alive **in response** to what's genuinely in
front of you. Deep stamina for work that lights you up; a clear inner yes/no when
you slow down enough to feel it; mastery through repetition.
- Gentle edge: noticing the difference between a true *yes* and a *should*.
- Avoid saying: "You can't ever initiate — you must always wait."

### Manifesting Generator-style energy
A fast, multi-passionate energy that thrives on responding to a real yes and then
moving quickly. Skips steps, juggles several things, finds the path by doing.
- Gentle edge: looping back to finish or inform others after you've leapt ahead.

### Manifestor-style energy
An initiating energy that likes to start things and set them in motion. Feels best
with the freedom to act on its own impulse; things go smoother with a heads-up to
others first.
- Gentle edge: letting people in with a simple heads-up before you act.

### Projector-style energy
A perceptive, guiding energy that shines brightest when its insight is genuinely
welcomed. Sees how people and systems work; thrives on recognition and rest rather
than constant output.
- Gentle edge: honouring rest as part of the work, not a failure of it.

### Reflector-style energy
A rare, sampling energy that takes in and mirrors the mood of the people and places
around it. Reads environments deeply; often needs more time before big decisions
feel clear.
- Gentle edge: giving yourself real time before locking in big choices.

> **Defined vs. open, in plain terms.** Across this whole layer Soluna uses a
> simple distinction: a part of you that is **defined** tends to be *consistent* —
> it works the same reliable way most of the time. A part that is **open** tends
> to *take in and amplify* what's around it — it's more variable and more
> influenced by environment. Reflector-style energy is the most "open" of the five.

---

## 2. Decision styles (authority-like)

*How clarity tends to arrive for you.* The file holds eight decision-style cards.
Soluna's selection layer maps a user's computed authority onto one of these (see
`HD_AUTHORITY_KEY` in `selectKnowledge.ts`).

| Card | Clarity tends to come from… |
|---|---|
| **Emotional decision style** | Time. Sleeping on it; feeling the same choice across a few moods. |
| **Gut-response decision style** | An immediate felt yes that lifts you, or a no that flattens you. |
| **In-the-moment instinct style** | A quiet, one-time nudge about timing and safety — easy to miss. |
| **Heart-and-willpower decision style** | Asking what you *truly want* and have the heart to commit to. |
| **Talk-it-out decision style** | Speaking it aloud to a listener who simply listens. |
| **Sounding-board decision style** | Thinking out loud with trusted people and the right environment. |
| **Full-cycle decision style** | Letting a choice ripen across a fuller cycle of moods and views. |

Each of these resists the fatalistic trap. For example, the Emotional decision
style explicitly avoids saying *"You must never decide quickly about anything"* and
*"Your emotions make you unreliable."* The aim is to describe a *tendency to
experiment with*, never a fixed instruction.

---

## 3. Life themes (profile-like)

*A longer arc — what your path tends to emphasise over time.* Soluna includes four
representative life themes, each describing a blend of two natural orientations.

- **1/3 life theme** — needing solid foundations *and* learning by trial and
  error. Reframes "failed" experiments as useful data, not personal flaws.
- **4/6 life theme** — close, trusted relationships *and* a long arc toward
  becoming a steady role model. Opportunities often come through people you know.
- **5/1 life theme** — being seen as someone who can help *and* a deep need to
  understand things first. Clear, honest communication keeps projections real.
- **6/2 life theme** — natural, easy talents *and* a maturing wisdom that becomes
  quietly influential. Honours the need to retreat without guilt.

These are presented as themes to *explore*, never predictions about your path. The
`avoidSaying` lists block phrasings like *"This profile means your relationships
are doomed to break"* and *"You have to wait decades before life gets good."*

---

## 4. Consistency themes (centers-like)

*Which parts of you are steady, and which take in and amplify the room.* This is
where the **defined = consistent / open = takes-in-and-amplifies** distinction does
its clearest work. The file holds nine consistency-theme cards.

**Defined / consistent examples**

- **Consistent emotional weather** (defined Solar Plexus) — your emotional life
  moves in its own fairly consistent waves; letting a wave crest and settle before
  acting usually serves you.
- **Consistent life-force energy** (defined Sacral) — a steady, renewable supply of
  energy for things that spark a real yes; rest once it's spent.
- **Consistent self-expression** (defined Throat) — a fairly steady, reliable voice;
  speaking when there's a genuine opening tends to land best.

**Open / amplifying examples**

- **Amplified emotional weather** (open Solar Plexus) — you absorb and amplify the
  emotional weather around you, so a feeling may not be yours at all. The key
  question: *"Is this feeling mine, or am I absorbing it?"*
- **Variable life-force energy** (open Sacral) — energy is more borrowed; you can
  push past your limits without noticing. Rest *before* you crash.
- **Variable self-expression** (open Throat) — your voice varies; you communicate
  best with a genuine invitation rather than forcing yourself forward.
- **Open mental space** (open Head/Ajna) — your mind takes in questions from
  everywhere; you're wired to sample and share, not to settle every question.
- **Amplified pressure to act** (open Root) — you feel and amplify urgency from your
  environment. Ask: *"Is this urgency mine, or am I absorbing it?"*

> Notice the pattern: **open** cards almost always carry a gentle "is this mine?"
> question and a boundary- or rest-flavoured supportive action, because the wisdom
> of an open theme is learning to tell your own signal apart from the room's.

---

## How a user's data becomes cards (a quick map)

`selectKnowledge.ts` reads the user's computed Human Design-inspired data and pulls
the matching cards — deterministically, never randomly:

- `humanDesign.type` → one energy-style card (via `HD_TYPE_KEY`).
- `humanDesign.authority` → one decision-style card (via `HD_AUTHORITY_KEY`).
- `humanDesign.profile` (e.g. `"1/3"`) → the matching life-theme card.
- `humanDesign.undefinedCenters` → if "solar plexus" or "root" is open, the
  matching open consistency-theme card is added.

So at most a handful of cards from this layer are ever active at once, and they are
chosen from the user's *actual* blueprint — not assumed.

---

## What this layer must never do

- It must never say "your Human Design **is**…" — always "Human Design-**inspired**."
- It must never present an energy style, decision style, life theme, or consistency
  theme as a fixed identity, a limitation, or a prediction.
- It must never use the `avoidSaying` phrasings, which are deterministic or shaming.
- It must never override the user's own sense of themselves.

It is a mirror, offered kindly. The user decides whether the reflection fits.

---

*Reflective lens only. Not a licensed system, not a diagnosis, not a forecast.*
