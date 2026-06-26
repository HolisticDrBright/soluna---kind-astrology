import type { KnowledgeCard } from "./types.ts";

export const humanDesignInspiredCards: KnowledgeCard[] = [
  // ─── Energy-style "type-like" cards ──────────────────────────────
  {
    id: "hd.type.generator",
    system: "human_design_inspired",
    key: "type_generator",
    title: "Generator-style energy",
    plainMeaning:
      "A steady, renewable kind of energy that comes alive when you respond to what's actually in front of you. You tend to do your best work on things that light up a real yes inside, rather than ideas you talk yourself into.",
    strengths: [
      "Deep, sustainable stamina for work that genuinely lights you up",
      "A clear inner yes/no when you slow down enough to feel it",
      "Mastery through repetition — you get better by sticking with things",
    ],
    growthEdges: [
      "Noticing the difference between a true yes and a should",
      "Letting yourself respond rather than forcing a start from nothing",
    ],
    supportiveActions: ["decision_clarity", "focus_exercise", "next_step_plan"],
    avoidSaying: [
      "You can't ever initiate — you must always wait",
      "Your design means you'll burn out if you don't follow the rules",
    ],
    synthesisTags: ["work_focus", "action_initiative"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "Treat this as a working-style cue to test against your own experience, not a fixed identity.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.type.manifesting_generator",
    system: "human_design_inspired",
    key: "type_manifesting_generator",
    title: "Manifesting Generator-style energy",
    plainMeaning:
      "A fast, multi-passionate energy that thrives on responding to a real yes and then moving quickly. You often skip steps, juggle several things at once, and find your path by doing rather than planning it all first.",
    strengths: [
      "Speed and versatility across several interests at once",
      "An instinct for shortcuts and efficient paths",
      "Energy that surges when something truly excites you",
    ],
    growthEdges: [
      "Looping back to finish or inform others after you've leapt ahead",
      "Giving a quick gut-check a moment before committing",
    ],
    supportiveActions: ["next_step_plan", "decision_clarity", "focus_exercise"],
    avoidSaying: [
      "You must do everything in order or you'll fail",
      "Your type means you can never slow down",
    ],
    synthesisTags: ["work_focus", "action_initiative"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "An energy-style cue, not a verdict on what you should pursue.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.type.manifestor",
    system: "human_design_inspired",
    key: "type_manifestor",
    title: "Manifestor-style energy",
    plainMeaning:
      "An initiating energy that likes to start things and set things in motion. You tend to feel best with freedom to act on your own impulse — and things go smoother when you give people a heads-up before you move.",
    strengths: [
      "Natural ability to start, spark, and set direction",
      "Independence and a strong inner sense of what to do",
      "Catalytic impact — you get things moving for others too",
    ],
    growthEdges: [
      "Letting people in with a simple heads-up before you act",
      "Resting between bursts instead of pushing through",
    ],
    supportiveActions: ["next_step_plan", "boundary_script", "nervous_system_reset"],
    avoidSaying: [
      "You're meant to dominate and ignore everyone else",
      "Informing people is mandatory or you're doing it wrong",
    ],
    synthesisTags: ["action_initiative", "freedom_independence", "leadership"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "An invitation to notice how initiating feels for you, not a fixed law.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.type.projector",
    system: "human_design_inspired",
    key: "type_projector",
    title: "Projector-style energy",
    plainMeaning:
      "A perceptive, guiding energy that shines brightest when your insight is genuinely welcomed. You tend to see how systems and people work, and you thrive on recognition and rest rather than constant output.",
    strengths: [
      "A gift for seeing people, patterns, and what could work better",
      "Wisdom that lands well when it's invited",
      "Quality over quantity — depth rather than grind",
    ],
    growthEdges: [
      "Waiting for genuine interest before offering your insight",
      "Honoring rest as part of the work, not a failure of it",
    ],
    supportiveActions: ["nervous_system_reset", "values_check", "journal_prompt"],
    avoidSaying: [
      "You must wait for permission for everything",
      "Your design means you're not allowed to work hard",
    ],
    synthesisTags: ["rest_recovery", "timing_patience", "communication"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A cue about pacing and recognition, offered gently, not as a constraint.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.type.reflector",
    system: "human_design_inspired",
    key: "type_reflector",
    title: "Reflector-style energy",
    plainMeaning:
      "A rare, sampling kind of energy that takes in and mirrors the mood of the people and places around you. You read environments deeply, and you often need more time — a fuller cycle — before big decisions feel clear.",
    strengths: [
      "A sensitive read on the health of a group or space",
      "Wisdom that comes from sampling many perspectives",
      "A natural mirror that helps others see themselves",
    ],
    growthEdges: [
      "Giving yourself real time before locking in big choices",
      "Choosing environments and company that feel nourishing",
    ],
    supportiveActions: ["nervous_system_reset", "journal_prompt", "values_check"],
    avoidSaying: [
      "You must wait exactly a month or your choice is invalid",
      "You can't trust yourself without others around",
    ],
    synthesisTags: ["rest_recovery", "change_release", "timing_patience"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "An invitation to honor your sensitivity to environment, not a rigid timeline.",
    ],
    safetyNotes: [],
  },

  // ─── Decision-style "authority-like" cards ───────────────────────
  {
    id: "hd.authority.emotional",
    system: "human_design_inspired",
    key: "authority_emotional",
    title: "Emotional decision style",
    plainMeaning:
      "Clarity tends to arrive over time, not in the heat of the moment. Sleeping on it and feeling the same choice across a few different moods usually tells you more than a quick yes ever could.",
    strengths: [
      "Rich emotional depth that informs wise choices",
      "Decisions that hold up because you've felt them from several angles",
      "Patience that protects you from reactive commitments",
    ],
    growthEdges: [
      "Resisting the urge to answer big things on the spot",
      "Letting a wave of feeling pass before you decide",
    ],
    supportiveActions: ["decision_clarity", "journal_prompt", "nervous_system_reset"],
    avoidSaying: [
      "You must never decide quickly about anything",
      "Your emotions make you unreliable",
    ],
    synthesisTags: ["timing_patience", "decision_clarity"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A decision-style cue to experiment with, not a fixed instruction.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.authority.sacral",
    system: "human_design_inspired",
    key: "authority_sacral",
    title: "Gut-response decision style",
    plainMeaning:
      "Your clearest answers often show up as an immediate gut response — a felt yes that lifts your energy or a no that flattens it. The body tends to know before the mind has finished arguing.",
    strengths: [
      "Fast, honest signals straight from the body",
      "A reliable energetic yes/no when you tune in",
      "Less overthinking when you trust the first gut read",
    ],
    growthEdges: [
      "Tuning in to the body before the mind talks over it",
      "Trusting a no even when it's inconvenient",
    ],
    supportiveActions: ["decision_clarity", "focus_exercise", "values_check"],
    avoidSaying: [
      "Your gut is always right and thinking is pointless",
      "You must answer instantly or you're ignoring your design",
    ],
    synthesisTags: ["decision_clarity", "action_initiative"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A body-awareness cue, not a guarantee of the right answer.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.authority.splenic",
    system: "human_design_inspired",
    key: "authority_splenic",
    title: "In-the-moment instinct style",
    plainMeaning:
      "Your guidance often comes as a quiet, in-the-moment nudge — a quick instinct that speaks once, softly. It can be easy to miss or talk yourself out of, but it tends to be wise about timing and safety.",
    strengths: [
      "A fast, intuitive read on what's healthy or off",
      "Present-moment awareness that protects you",
      "Subtle but trustworthy instinct when you stay quiet enough to hear it",
    ],
    growthEdges: [
      "Catching the soft first nudge before doubt drowns it out",
      "Acting on a clear instinct rather than re-deliberating",
    ],
    supportiveActions: ["decision_clarity", "nervous_system_reset", "focus_exercise"],
    avoidSaying: [
      "If you missed the nudge you've ruined everything",
      "Instinct replaces all caution and judgment",
    ],
    synthesisTags: ["decision_clarity", "stress_regulation"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "An instinct-awareness cue, not a substitute for real-world care.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.authority.ego",
    system: "human_design_inspired",
    key: "authority_ego",
    title: "Heart-and-willpower decision style",
    plainMeaning:
      "You tend to find clarity by asking what you truly want and what you actually have the heart to commit to. When your willpower and desire are genuinely behind a choice, it tends to stick.",
    strengths: [
      "A strong, honest sense of what you really want",
      "Willpower that follows through on heartfelt commitments",
      "Clarity through asking 'do I genuinely want this?'",
    ],
    growthEdges: [
      "Honoring when the heart isn't in it, even under pressure",
      "Resting your willpower instead of overpromising",
    ],
    supportiveActions: ["values_check", "decision_clarity", "boundary_script"],
    avoidSaying: [
      "You should commit to whatever sounds impressive",
      "Your worth depends on how much you can push through",
    ],
    synthesisTags: ["self_worth", "decision_clarity"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A cue about following genuine desire, not a measure of your value.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.authority.self_projected",
    system: "human_design_inspired",
    key: "authority_self_projected",
    title: "Talk-it-out decision style",
    plainMeaning:
      "You often hear your own truth by talking out loud. Speaking a choice to a trusted listener — who simply listens — lets you notice what your voice does when it lands on the real answer.",
    strengths: [
      "Clarity that surfaces through honest conversation",
      "A strong inner sense of identity and direction once spoken",
      "Insight from hearing your own voice, not just your thoughts",
    ],
    growthEdges: [
      "Finding listeners who reflect rather than advise",
      "Listening to your own tone, not just the other person's input",
    ],
    supportiveActions: ["journal_prompt", "decision_clarity", "values_check"],
    avoidSaying: [
      "You should just decide silently and stop talking it through",
      "Other people's opinions should make the choice for you",
    ],
    synthesisTags: ["communication", "decision_clarity"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A reflective cue about how you process, not a fixed method.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.authority.mental",
    system: "human_design_inspired",
    key: "authority_mental",
    title: "Sounding-board decision style",
    plainMeaning:
      "You often reach clarity by thinking out loud with trusted people and the right environment, gathering perspectives over time. The clarity comes less from any single answer and more from sensing where you feel most at home.",
    strengths: [
      "A thoughtful, perspective-gathering approach",
      "Wisdom drawn from many trusted voices",
      "Sensitivity to which environments feel right for you",
    ],
    growthEdges: [
      "Giving choices time and several conversations to settle",
      "Noticing the environment's effect, not just the advice",
    ],
    supportiveActions: ["journal_prompt", "decision_clarity", "values_check"],
    avoidSaying: [
      "You should decide alone and ignore outside input",
      "More opinions always means a better decision",
    ],
    synthesisTags: ["timing_patience", "decision_clarity"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A processing-style cue, not a strict requirement.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.authority.lunar",
    system: "human_design_inspired",
    key: "authority_lunar",
    title: "Full-cycle decision style",
    plainMeaning:
      "Your clearest decisions tend to ask for time — a fuller cycle of moods, environments, and perspectives — before they feel settled. Rushing rarely helps; letting a choice ripen almost always does.",
    strengths: [
      "Deep, well-seasoned clarity once you've let time work",
      "Resistance to impulsive choices you'd regret",
      "A wide, sampled view before you commit",
    ],
    growthEdges: [
      "Protecting your timeline from outside pressure to decide now",
      "Trusting that waiting is wisdom, not avoidance",
    ],
    supportiveActions: ["decision_clarity", "journal_prompt", "nervous_system_reset"],
    avoidSaying: [
      "You must wait an exact number of days or it's wrong",
      "Taking time means you're indecisive",
    ],
    synthesisTags: ["timing_patience", "decision_clarity"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A timing cue to honor gently, not a rigid countdown.",
    ],
    safetyNotes: [],
  },

  // ─── Profile-like life-theme cards ───────────────────────────────
  {
    id: "hd.profile.1_3",
    system: "human_design_inspired",
    key: "profile_1_3",
    title: "1/3 life theme",
    plainMeaning:
      "A blend of needing solid foundations and learning by trial and error. You feel safest when you've studied something deeply, and you grow through real-life experiments — including the ones that don't work out.",
    strengths: [
      "A drive to understand things thoroughly before relying on them",
      "Resilience and learning that comes from hands-on experience",
      "Honesty about what actually works versus what sounds good",
    ],
    growthEdges: [
      "Reframing 'failed' experiments as useful data, not personal flaws",
      "Trusting your foundation enough to step out and try",
    ],
    supportiveActions: ["journal_prompt", "next_step_plan", "gratitude_reframe"],
    avoidSaying: [
      "Your mistakes prove you're not ready",
      "This profile means your relationships are doomed to break",
    ],
    synthesisTags: ["learning_growth", "change_release"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A life-theme cue to explore, not a prediction about your path.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.profile.4_6",
    system: "human_design_inspired",
    key: "profile_4_6",
    title: "4/6 life theme",
    plainMeaning:
      "A blend of close, trusted relationships and a longer arc of becoming a steady role model. Opportunities often come through people you know, and your sense of self tends to deepen and settle over time.",
    strengths: [
      "Warm, loyal bonds that open doors naturally",
      "A growing wisdom others come to trust",
      "Influence that comes from being yourself, not pushing",
    ],
    growthEdges: [
      "Tending friendships rather than chasing cold opportunities",
      "Being patient with the seasons of your own growth",
    ],
    supportiveActions: ["relationship_repair", "journal_prompt", "values_check"],
    avoidSaying: [
      "You have to wait decades before life gets good",
      "Your worth depends on being a perfect example",
    ],
    synthesisTags: ["connection_love", "learning_growth"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A life-theme cue, not a timeline you're locked into.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.profile.5_1",
    system: "human_design_inspired",
    key: "profile_5_1",
    title: "5/1 life theme",
    plainMeaning:
      "A blend of being seen as someone who can help and a deep need to understand things first. People often project hopes onto you, so clear, honest communication and solid grounding keep things real.",
    strengths: [
      "A practical gift for offering useful solutions",
      "Depth and preparation that back up what you offer",
      "Natural credibility when you're genuinely grounded",
    ],
    growthEdges: [
      "Naming what you can and can't do before assumptions build",
      "Protecting your reputation with honest boundaries",
    ],
    supportiveActions: ["boundary_script", "values_check", "journal_prompt"],
    avoidSaying: [
      "Everyone's expectations are your responsibility to meet",
      "You must rescue people to be worthy",
    ],
    synthesisTags: ["communication", "boundaries"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A life-theme cue about projection and grounding, not a fixed fate.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.profile.6_2",
    system: "human_design_inspired",
    key: "profile_6_2",
    title: "6/2 life theme",
    plainMeaning:
      "A blend of natural talents and a long arc toward becoming a wise example. You have gifts that flow easily when you're not forcing them, and you tend to grow into a calmer, more trusted version of yourself over time.",
    strengths: [
      "Effortless, natural talents others notice",
      "A maturing wisdom that becomes quietly influential",
      "A healthy need for alone time to recharge",
    ],
    growthEdges: [
      "Honoring your need to retreat without guilt",
      "Trusting that your example matters more than your effort",
    ],
    supportiveActions: ["nervous_system_reset", "journal_prompt", "values_check"],
    avoidSaying: [
      "Needing alone time means you're antisocial or broken",
      "You must have it all figured out by now",
    ],
    synthesisTags: ["rest_recovery", "learning_growth"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A life-theme cue, not a measure of where you should be.",
    ],
    safetyNotes: [],
  },

  // ─── Center-like consistency-theme cards ─────────────────────────
  {
    id: "hd.center.solar_plexus_defined",
    system: "human_design_inspired",
    key: "center_solar_plexus_defined",
    title: "Consistent emotional weather (defined Solar Plexus)",
    plainMeaning:
      "Your emotional life tends to move in its own waves and rhythms, fairly consistent from within. Your mood often sets the tone in a room, so giving feelings time to crest and settle usually serves you and others.",
    strengths: [
      "A rich, reliable emotional inner life",
      "Genuine warmth and depth others can feel",
      "Clarity that comes once a wave has passed",
    ],
    growthEdges: [
      "Letting a strong wave settle before acting on it",
      "Owning your mood's effect on a room with care",
    ],
    supportiveActions: ["journal_prompt", "nervous_system_reset", "decision_clarity"],
    avoidSaying: [
      "Your moods are a problem to fix or suppress",
      "You're too emotional to be trusted",
    ],
    synthesisTags: ["timing_patience", "stress_regulation"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A consistency cue about your emotional rhythm, not a diagnosis.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.center.solar_plexus_open",
    system: "human_design_inspired",
    key: "center_solar_plexus_open",
    title: "Amplified emotional weather (open Solar Plexus)",
    plainMeaning:
      "You tend to absorb and amplify the emotional weather around you, so a feeling may not be yours at all. Naming 'is this mine?' and stepping away from heavy rooms can give you back your own baseline.",
    strengths: [
      "Deep empathy and a finely tuned read on others' feelings",
      "Wisdom about emotion gathered from many people",
      "A natural sense of when a room is tense or warm",
    ],
    growthEdges: [
      "Asking 'is this feeling mine, or am I absorbing it?'",
      "Taking space to discharge what you've picked up",
    ],
    supportiveActions: ["boundary_script", "nervous_system_reset", "journal_prompt"],
    avoidSaying: [
      "You can't avoid conflict because of your design",
      "Feeling everyone's emotions makes you weak",
    ],
    synthesisTags: ["boundaries", "stress_regulation"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A cue about sensitivity to others' moods, not a fixed limitation.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.center.sacral_defined",
    system: "human_design_inspired",
    key: "center_sacral_defined",
    title: "Consistent life-force energy (defined Sacral)",
    plainMeaning:
      "You tend to carry a steady, renewable supply of energy for work and life — especially for things that spark a real yes. Spending it on what truly engages you, and resting once it's used up, keeps the well full.",
    strengths: [
      "Reliable stamina for engaging, meaningful work",
      "A clear energetic yes when something genuinely fits",
      "Endurance that deepens skill over time",
    ],
    growthEdges: [
      "Spending energy on real yeses rather than obligations",
      "Going to sleep a little tired, fully emptied for the day",
    ],
    supportiveActions: ["focus_exercise", "next_step_plan", "values_check"],
    avoidSaying: [
      "You should have endless energy for everything",
      "Resting means you're lazy",
    ],
    synthesisTags: ["work_focus", "action_initiative"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "An energy-consistency cue, not a performance standard.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.center.sacral_open",
    system: "human_design_inspired",
    key: "center_sacral_open",
    title: "Variable life-force energy (open Sacral)",
    plainMeaning:
      "Your energy is more borrowed and variable — you can amplify the drive of busy environments and push past your limits without noticing. Knowing when you've truly done enough, and resting before you crash, protects you.",
    strengths: [
      "A flexible sense of others' energy and effort",
      "Capacity for intense bursts when the setting calls for it",
      "Wisdom about work, rest, and what 'enough' really means",
    ],
    growthEdges: [
      "Stopping before exhaustion rather than after",
      "Resting away from high-energy environments to recharge",
    ],
    supportiveActions: ["nervous_system_reset", "boundary_script", "next_step_plan"],
    avoidSaying: [
      "You must keep up with everyone else's pace",
      "Needing rest means something is wrong with you",
    ],
    synthesisTags: ["rest_recovery", "stress_regulation"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A cue about pacing your energy, not a fixed rule about capacity.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.center.throat_defined",
    system: "human_design_inspired",
    key: "center_throat_defined",
    title: "Consistent self-expression (defined Throat)",
    plainMeaning:
      "You tend to have a fairly steady, reliable way of expressing yourself and making things happen through your voice. Speaking when there's a genuine response or opening — rather than to fill silence — tends to land best.",
    strengths: [
      "A clear, consistent voice and presence",
      "An ability to put things into words and motion",
      "Communication others can count on",
    ],
    growthEdges: [
      "Speaking when there's real openness, not just to fill space",
      "Letting timing shape when your words land",
    ],
    supportiveActions: ["journal_prompt", "boundary_script", "values_check"],
    avoidSaying: [
      "You should always be the loudest in the room",
      "Staying quiet means you've failed to show up",
    ],
    synthesisTags: ["communication", "leadership"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "An expression-style cue, not a rule about when to speak.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.center.throat_open",
    system: "human_design_inspired",
    key: "center_throat_open",
    title: "Variable self-expression (open Throat)",
    plainMeaning:
      "Your voice can feel more variable — sometimes you stay quiet, sometimes you feel pressure to speak up and be noticed. You often communicate best when there's a genuine invitation or response, rather than forcing yourself forward.",
    strengths: [
      "A flexible, adaptive way of communicating",
      "Sensitivity to when words are truly wanted",
      "A range of voices depending on the room",
    ],
    growthEdges: [
      "Easing the pressure to speak just to be seen",
      "Waiting for a real opening so your words land",
    ],
    supportiveActions: ["journal_prompt", "nervous_system_reset", "boundary_script"],
    avoidSaying: [
      "You must speak up constantly or you'll be invisible",
      "Your quiet moments mean you have nothing to offer",
    ],
    synthesisTags: ["communication", "stress_regulation"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A cue about how expression varies for you, not a fixed trait.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.center.head_ajna_open",
    system: "human_design_inspired",
    key: "center_head_ajna_open",
    title: "Open mental space (open Head/Ajna)",
    plainMeaning:
      "Your mind is open and impressionable — you take in questions and ideas from everywhere and can amplify mental pressure to figure it all out. You're wired to think for sampling and sharing, not to settle every question for yourself.",
    strengths: [
      "Open, curious thinking that holds many perspectives",
      "A gift for inspiring questions in others",
      "Flexibility instead of fixed opinions",
    ],
    growthEdges: [
      "Letting some questions stay open instead of solving them all",
      "Noticing whose mental pressure you've absorbed",
    ],
    supportiveActions: ["journal_prompt", "nervous_system_reset", "focus_exercise"],
    avoidSaying: [
      "You should have firm answers to everything",
      "An undecided mind means you're confused or unintelligent",
    ],
    synthesisTags: ["learning_growth", "stress_regulation"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A cue about mental openness, not a statement about your intelligence.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.center.root_open",
    system: "human_design_inspired",
    key: "center_root_open",
    title: "Amplified pressure to act (open Root)",
    plainMeaning:
      "You tend to feel and amplify pressure and urgency from your environment — the sense that everything must be done now. Slowing down to ask which deadlines are truly yours can release a rush that was never really yours.",
    strengths: [
      "A drive and adaptability that can power real momentum",
      "Sensitivity to the pace and stress of a situation",
      "Wisdom about pressure, timing, and what's actually urgent",
    ],
    growthEdges: [
      "Asking 'is this urgency mine, or am I absorbing it?'",
      "Releasing the rush to clear things off just to feel free",
    ],
    supportiveActions: ["nervous_system_reset", "next_step_plan", "boundary_script"],
    avoidSaying: [
      "You have to handle everything immediately",
      "Feeling pressure means you're behind or failing",
    ],
    synthesisTags: ["stress_regulation", "rest_recovery"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A cue about absorbed pressure, not a verdict on your productivity.",
    ],
    safetyNotes: [],
  },

  // ─── More centers (identity, willpower, instinct) ─────────────────
  {
    id: "hd.center.g_defined",
    system: "human_design_inspired",
    key: "center_g_defined",
    title: "Steady sense of direction (defined Identity)",
    plainMeaning:
      "A fairly consistent sense of who you are and where you're headed — your identity and direction tend to feel reliable from the inside, even when life shifts around you.",
    strengths: ["A steady inner compass", "A consistent sense of self to return to", "Direction that feels self-sourced"],
    growthEdges: ["Letting your direction evolve rather than feeling locked in", "Staying open to others' paths being different from yours"],
    supportiveActions: ["values_check", "journal_prompt"],
    avoidSaying: ["Your path is fixed and can't change", "You should always know exactly where you're going"],
    synthesisTags: ["self_worth", "decision_clarity"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A cue about how identity tends to feel for you — never a fixed diagnosis.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.center.g_open",
    system: "human_design_inspired",
    key: "center_g_open",
    title: "Fluid sense of direction (open Identity)",
    plainMeaning:
      "Your sense of identity and direction can shift with your surroundings and the people you're near. This is a gift for empathy and adaptability — and an invitation to choose the environments that help you feel most like yourself.",
    strengths: ["Adaptable and empathic", "Able to understand many ways of being", "Sensitive to the right environment"],
    growthEdges: ["Choosing where and who you're around with care", "Letting direction emerge rather than forcing a fixed one"],
    supportiveActions: ["journal_prompt", "values_check"],
    avoidSaying: ["You have no real identity", "Not knowing your direction means something is wrong"],
    synthesisTags: ["change_release", "self_worth"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A cue about flexibility, not a verdict that you're lost.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.center.heart_defined",
    system: "human_design_inspired",
    key: "center_heart_defined",
    title: "Steady willpower (defined Heart)",
    plainMeaning:
      "A fairly consistent access to willpower and a sense of your own worth — when you commit to something that matters, you can usually find the resolve to follow through.",
    strengths: ["Reliable willpower and resolve", "A grounded sense of your own value", "Able to make and keep meaningful commitments"],
    growthEdges: ["Letting rest count, not only effort and proof", "Pacing willpower so it doesn't tip into pressure"],
    supportiveActions: ["next_step_plan", "values_check"],
    avoidSaying: ["You must always push through to prove yourself", "Your worth depends on what you accomplish"],
    synthesisTags: ["self_worth", "leadership"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A cue about willpower's rhythm for you — never a measure of your worth.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.center.heart_open",
    system: "human_design_inspired",
    key: "center_heart_open",
    title: "You don't have to keep proving yourself (open Heart)",
    plainMeaning:
      "Willpower may come and go rather than being constantly on tap, and you can feel a pull to prove your worth. The gentle truth here: your value isn't something to earn over and over.",
    strengths: ["Sensitivity to where worth is being measured", "Wisdom about ego and proving", "Freedom when you stop competing to prove"],
    growthEdges: ["Letting worth be a given, not a contest", "Making promises your energy can actually keep"],
    supportiveActions: ["gratitude_reframe", "boundary_script"],
    avoidSaying: ["You must prove you're enough", "Weak willpower means you're lazy"],
    synthesisTags: ["self_worth", "boundaries"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A cue about the urge to prove, not a verdict on your discipline.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.center.spleen_defined",
    system: "human_design_inspired",
    key: "center_spleen_defined",
    title: "Steady instinct (defined Spleen)",
    plainMeaning:
      "A fairly consistent, in-the-moment instinct for what feels safe and well — a quiet gut sense that tends to be there when you listen for it.",
    strengths: ["Reliable gut instinct", "A steady sense of well-being", "Quick read on what feels safe"],
    growthEdges: ["Trusting the quiet, one-time nudge instead of overriding it", "Letting instinct and reflection work together"],
    supportiveActions: ["nervous_system_reset", "decision_clarity"],
    avoidSaying: ["Your instincts are always right and need no thought", "Ignoring a gut feeling guarantees disaster"],
    synthesisTags: ["decision_clarity", "stress_regulation"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A cue about instinct's steadiness for you — not medical or safety advice.",
    ],
    safetyNotes: [],
  },
  {
    id: "hd.center.spleen_open",
    system: "human_design_inspired",
    key: "center_spleen_open",
    title: "Sensitive instinct (open Spleen)",
    plainMeaning:
      "You may be especially attuned to others' well-being and to fear or worry in a room. The growth here is learning to tell a true, quiet intuition from anxiety you've absorbed from around you.",
    strengths: ["Deep sensitivity to well-being and mood", "Wisdom about fear and what's truly worth heeding", "Empathy for others' states"],
    growthEdges: ["Separating absorbed fear from your own true signal", "Giving worries a moment before acting on them"],
    supportiveActions: ["nervous_system_reset", "journal_prompt"],
    avoidSaying: ["Every fear you feel is a real warning", "You're too anxious to trust yourself"],
    synthesisTags: ["stress_regulation", "boundaries"],
    confidenceNotes: [
      "A Human Design-inspired reflection, offered as a lens, not a rule.",
      "A cue about absorbed fear, not a clinical or safety judgment.",
    ],
    safetyNotes: [],
  },
];
