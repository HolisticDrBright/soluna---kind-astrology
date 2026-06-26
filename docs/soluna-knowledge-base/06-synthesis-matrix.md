# 06 — The Synthesis Matrix

> **What this document is.** The single most important document in the knowledge
> base. It defines *exactly* how Soluna combines multiple reflective systems —
> astrology, numerology, Eastern astrology, Human Design-inspired, tarot, plus
> distilled signals from a user's own focus and journals — into one warm,
> honest reading. It describes precisely what the implemented code does:
> `synthesis-rules.ts` (the deterministic brain) and `selectKnowledge.ts` (the
> selection layer), with `formatKnowledgeForPrompt.ts` shaping the final prompt.

---

## The core principle: deterministic selection, generative words

Soluna draws a hard line between **what is decided** and **what is written**:

> **The selection layer decides the *shape* of the reading. The language model only
> writes the *words*.** Same input → same selection, every time. Fully
> unit-testable, no randomness, no model "deciding" what's true about a person.

`selectKnowledge.ts` says it plainly in its header: *"It is pure and deterministic:
same input → same output… The LLM later writes the words, but never chooses the
knowledge."* And `synthesis-rules.ts`: *"The LLM writes the words; THIS decides the
shape."*

This is what makes the synthesis trustworthy: the moments where Soluna sounds
confident, holds a tension, or stays humble are all computed from real data — not
improvised by a generative model.

---

## Step 1 — Selecting cards from real data

`selectKnowledge.ts` takes a `KnowledgeContext` built from the user's **actual
computed blueprint and current context**, and pulls matching cards by exact key
(never at random). Each system contributes a small, fixed set:

| System | What's read from `ctx` | Cards pulled |
|---|---|---|
| **Western astrology** | `astrology.planets` (Sun, Moon), `ascendant` | `sun_<sign>`, `moon_<element>`, `rising_core` |
| **Transits** | `transits.mercuryRetrograde`, `moonPhase` | `mercury_retrograde`, `new_moon` / `full_moon` |
| **Numerology** | `numerology.lifePath`, `personalDay` | `life_path_<n>`, `personal_day_<n>` |
| **Eastern astrology** | `chinese.animal`, `element`, `yinYang` | `animal_<x>`, `element_<x>`, `polarity_<x>` |
| **Human Design-inspired** | `humanDesign.type`, `authority`, `profile`, `undefinedCenters` | one energy-style, one decision-style, one life-theme, open-center cards |
| **Tarot** | `tarot.key` or `tarot.name` | one Major Arcana card |

A `push()` helper de-duplicates by card `id`, so the same card is never added
twice.

### The crucial split: blueprint cards vs. focus-biased signals

Right after the system cards are gathered, the code takes a snapshot:

```
const blueprintCards = [...cards];   // the "real data" cards
```

**Agreement and tension are computed on `blueprintCards`** — the user's actual
blueprint and sky — *not* on the topic the user happens to be asking about. This
prevents Soluna from manufacturing a fake "agreement" just because the user's
question leaned a certain way. Focus and journal signals are still used, but as
*extra signals* (see Tension below), never as fake votes for agreement.

The active **focus** (`focus.category`, `focus.problemText`), any **connection
lens**, and pre-distilled **journal/activity tags** are collected into
`extraSignalTags`. Crucially, these come in already minimised — Soluna never passes
raw journal text or another person's chart downstream. A connection contributes
only `{ involved, lens }`.

---

## Step 2 — Synthesis tags: the bridge vocabulary

Every card, in every system, is labelled with one or more **synthesis tags**. These
18 tags are the shared language that lets a tarot card "talk to" a numerology
number, or an astrology placement "talk to" a Human Design-inspired energy style.

The complete set (`SYNTHESIS_TAGS` in `types.ts`):

| | | |
|---|---|---|
| `communication` | `action_initiative` | `rest_recovery` |
| `connection_love` | `boundaries` | `work_focus` |
| `change_release` | `self_worth` | `creativity` |
| `decision_clarity` | `timing_patience` | `grief_processing` |
| `stress_regulation` | `planning_structure` | `freedom_independence` |
| `nurture_care` | `learning_growth` | `leadership` |

A focus category also maps to tags via `FOCUS_CATEGORY_TAGS` (e.g. `relationship →
connection_love, communication, boundaries`), and free-text problem statements are
distilled to tags by keyword (`TEXT_TAG_HINTS`). This is how a user's real words
gently bias which themes matter — without ever leaking the words themselves.

---

## Step 3 — AGREEMENT (when systems independently point the same way)

`tallyTagsBySystem()` counts how many **distinct systems** contribute each tag.
`agreementTags()` then returns every tag carried by **2 or more distinct systems**,
sorted strongest-first by system count.

> **A tag is an agreement signal when ≥ 2 *distinct systems* share it.** Distinct
> matters: two cards from the same system don't count as agreement — they're one
> voice repeating itself.

### Worked example — `action_initiative` agreement

Suppose the user's real blueprint produces:

- **Astrology:** an Aries Sun card tagged `action_initiative` (the sky says "act").
- **Numerology:** Personal Day 1 card tagged `action_initiative` (a fresh-start
  day).
- **Eastern astrology:** a fire-animal card (e.g. Horse) tagged
  `action_initiative`.

Three *different* systems independently carry `action_initiative`. `agreementTags()`
returns it with `systemCount: 3`. That's a genuine multi-system agreement, and it
**raises confidence** (see Step 5). When `formatKnowledgeForPrompt.ts` renders it,
the model sees:

```
WHERE SYSTEMS AGREE:
- action initiative — agreed by western_astrology, numerology, eastern_astrology (3 systems)
```

Soluna may then speak with gentle confidence about a leaning toward starting
something — because three independent lenses pointed the same way, not because the
model decided to.

---

## Step 4 — TENSION (when signals pull in opposite directions)

Some themes naturally pull against each other. When **both** sides of a known pair
are active, Soluna does not pick a winner — it **names the tension and softens**.

The implemented `TENSION_PAIRS` (`synthesis-rules.ts`):

| Tag A | Tag B | The pull |
|---|---|---|
| `action_initiative` | `rest_recovery` | push to act vs. need to rest |
| `work_focus` | `rest_recovery` | drive to produce vs. need to recover |
| `action_initiative` | `timing_patience` | move now vs. let it ripen |
| `freedom_independence` | `connection_love` | space/autonomy vs. closeness |
| `change_release` | `planning_structure` | let go/transform vs. build/stabilise |

`tensionTags(cards, extraSignalTags)` builds the set of active tags from the
selected cards **plus** the injected `extraSignalTags` (focus, connection lens,
journal/activity themes). This is deliberate: it lets *lived context* create a
tension that the blueprint alone wouldn't show.

### Worked example — astrology says act, journals say burnout

- The blueprint cards carry `action_initiative` (e.g. an Aries Sun, a Personal Day
  1).
- The user's recent journals were pre-distilled to `rest_recovery` (words like
  "exhausted," "burned out," "depleted" → `rest_recovery` via the text-tag hints).
- That `rest_recovery` arrives as an `extraSignalTag`.

Now both `action_initiative` and `rest_recovery` are present →
`["action_initiative", "rest_recovery"]` is a `TENSION_PAIR` → a tension is
detected. `formatKnowledgeForPrompt.ts` renders:

```
TENSIONS TO HOLD:
- action initiative vs rest recovery — hold both; soften any push
```

So instead of cheering "go start something!", Soluna **holds the tension**: it might
acknowledge the pull toward beginning *and* the body's call for rest, and gently
ask which is most true right now. The cosmic "act" signal never gets to steamroll
the lived "I'm exhausted" signal.

---

## Step 5 — UNCERTAINTY & confidence labels (exact thresholds)

`confidenceLabel(agreement, tension, matchedCardCount)` assigns one of four labels,
fully deterministically. Here is the exact logic, in order:

```
topSystemCount  = strongest agreement's system count (0 if none)
strongAgreement = topSystemCount >= 3  OR  agreement.length >= 2
anyAgreement    = agreement.length >= 1
hasTension      = tension.length > 0

if matchedCardCount === 0            -> "reflective"
if strongAgreement && !hasTension    -> "strong"
if anyAgreement   && !hasTension     -> "supportive"
if anyAgreement   &&  hasTension     -> "mixed"     (agreement cancelled by tension)
if hasTension                        -> "mixed"     (tension, no clear agreement)
if matchedCardCount >= 2             -> "supportive"
                                     -> "reflective"
```

Mapped to the user-facing label text (`CONFIDENCE_LABELS`):

| Internal label | Triggers when… | User-facing text |
|---|---|---|
| **strong** | a tag agreed by **≥ 3 systems**, OR **≥ 2 distinct agreement tags** — **and no tension** | **"Strong pattern"** |
| **supportive** | at least **one 2-system agreement** with no tension (or ≥ 2 cards with no signal either way) | **"Supportive pattern"** |
| **mixed** | agreement **cancelled by tension**, OR tension present with no clear agreement | **"Mixed pattern"** |
| **reflective** | little or no signal (no cards matched) | **"Reflective prompt only"** |

Two things worth underlining:

- **Tension always softens.** Even a strong 3-system agreement collapses to *Mixed*
  the moment a tension is also present. Soluna would rather be honest than
  impressive.
- **No signal → no verdict.** When nothing resolves, Soluna labels it *Reflective
  prompt only* and offers a question instead of a conclusion.

`formatKnowledgeForPrompt.ts` passes the label text into the prompt and adds a tone
instruction: *"'Strong pattern' can speak with gentle confidence; 'Mixed' should
hold tension; 'Reflective prompt only' should offer a question, not a conclusion.
Never say 'you must' or predict fixed outcomes."*

---

## Step 6 — Relationships: repair language, never doom

When a connection is involved, `selectKnowledge.ts` adds only a **lens** (e.g.
`romance`, `friendship`, `family`, `work`) — never the other person's private data.
The lens maps to tags via `LENS_TAGS`, biasing the reading toward themes like
`connection_love` and `communication`.

If a relationship focus surfaces a **tension** (for example `freedom_independence`
vs. `connection_love` — one partner needing space while the other needs closeness),
Soluna's job is **repair language, not a verdict**. It holds both needs as real and
offers a `relationship_repair` action (a kind way to reopen the conversation),
rather than declaring the relationship "incompatible" or "doomed."

This is reinforced at the safety layer: the input scanner flags
`third_party_speculation` ("does he secretly love me?") and `fatalistic_request`
("is my relationship doomed?"), and the guidance for those categories redirects to
the user's own feelings and to what's open and within their influence — never
predicting another person's hidden thoughts or a fixed fate.

---

## Step 7 — Feeding the LLM (and the required response shape)

Once selection is done, `formatKnowledgeForPrompt.ts` produces three text blocks,
capped at **8 cards** to stay token-light, paraphrasing only distilled knowledge
(never raw private data):

1. **`knowledgeBlock`** — the selected cards (system, title, plain meaning, top
   growth edge, and any `avoid` phrasings), plus the confidence label, the
   *where-systems-agree* lines, the *tensions-to-hold* lines, and the suggested
   action types.
2. **`responseGuide`** — the required response shape (below).
3. **`safetyDirective`** — internal-only safety instructions, shown to the model
   but **never to the user**, that reshape the whole reply if the user's words
   tripped a safety category.

### The required response shape

The model is told to weave these naturally into warm prose — **not** as literal
headers:

1. **What Soluna is seeing** — name the relevant placements in plain language.
2. **Why it matters** for them right now.
3. **Where multiple systems agree** — only if they genuinely do.
4. **Where things are mixed or uncertain** — name it honestly; don't force a
   verdict.
5. **One practical next step** — using a suggested action type.
6. **One reflection prompt** — a question to sit with.
7. **A gentle disclaimer** where appropriate (these are reflective lenses, not fixed
   fate).

Plus the tone rule: match certainty to the confidence label, and **never** say "you
must" or predict fixed outcomes.

### Safety overrides everything

If `scanUserInputSafety()` detects a crisis category (`self_harm_crisis`,
`abuse_safety`), `selectKnowledge.ts` suppresses directive actions entirely and
leads with grounding plus real-world support (`suggestedActionTypes =
["nervous_system_reset"]`). The `safetyDirective` then instructs the model to set
cosmic framing aside and respond with warmth and a pointer to real help. No reading
is ever placed above a person's safety.

---

## End-to-end example

> **Context:** Aries Sun, Personal Day 1, Year of the Horse (fire), a `work` focus,
> and recent journals distilled to `rest_recovery`.

1. **Selection** pulls the Aries Sun, Personal Day 1, and Horse cards (all carrying
   `action_initiative`); `work` focus adds `work_focus`, `planning_structure`,
   `leadership` as signals; journals inject `rest_recovery`.
2. **Agreement:** `action_initiative` is carried by 3 distinct systems →
   `systemCount: 3`.
3. **Tension:** `action_initiative` + `rest_recovery` (from journals) →
   `["action_initiative","rest_recovery"]` tension detected.
4. **Confidence:** there *is* strong agreement, **but** a tension is present →
   the label collapses to **Mixed pattern**.
5. **Prompt:** Soluna is told three lenses lean toward starting something, *and*
   that the body is asking for rest — hold both, soften any push.
6. **Reading:** Soluna names the pull toward beginning, honours the exhaustion,
   suggests one gentle nervous-system reset, and asks: *which of these is most true
   for you today?* — closing with a light reminder that these are reflective
   lenses, not fixed fate.

That is the synthesis matrix doing its job: combining many systems, raising
confidence only when independent lenses truly agree, softening the moment lived
context pushes back, and always handing the user a kind next step and an honest
question — never a verdict.

---

*Deterministic selection, generative wording. Reflective lenses, never fixed fate.*
