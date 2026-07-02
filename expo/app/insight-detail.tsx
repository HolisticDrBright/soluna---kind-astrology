import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import {
  PLANET_SYMBOLS, ZODIAC_SYMBOLS, HOUSE_NAMES,
  NUMBER_MEANINGS, CHINESE_INTERPRETATIONS, HD_INTERPRETATIONS,
  HD_TYPE_GUIDANCE, HD_AUTHORITY_MEANINGS, HD_PROFILE_LINES, HD_CENTER_MEANINGS,
  BAZI_PILLAR_MEANINGS, BAZI_ELEMENT_MEANINGS, NAKSHATRA_MEANINGS, DASHA_PLANET_MEANINGS, PLANET_STRENGTH_MEANINGS,
  SOLAR_RETURN_ASC_THEMES, SOLAR_RETURN_SUN_HOUSE,
  getPlacementInterpretation, Fonts, type Planet, type ZodiacSign,
} from "@/constants/mockData";
import ComingSoon from "@/components/ComingSoon";
import { Sparkles, ChevronLeft, MessageCircle } from "lucide-react-native";
import ResonanceFeedbackCard from "@/components/ResonanceFeedbackCard";

function getGenericInterpretation(planet: Planet, sign: ZodiacSign, house: number | null) {
  const planetMeanings: Record<Planet, string> = {
    Sun: "your core self — your identity, vitality, and the essence of who you are",
    Moon: "your emotional world — how you feel, what you need to feel safe, and how you nurture yourself",
    Mercury: "your mind and communication — how you think, learn, and express your ideas",
    Venus: "your heart and values — how you love, what you find beautiful, and what brings you pleasure",
    Mars: "your drive and desire — how you take action, assert yourself, and pursue what you want",
    Jupiter: "your growth and abundance — how you expand, find meaning, and experience optimism",
    Saturn: "your structure and wisdom — how you build, commit, and grow through life's lessons",
    Uranus: "your originality and freedom — how you innovate, break patterns, and express your uniqueness",
    Neptune: "your imagination and transcendence — how you dream, connect spiritually, and experience the ineffable",
    Pluto: "your power and transformation — how you evolve, release what no longer serves, and access your depth",
  };
  const signQualities: Record<ZodiacSign, string> = {
    Aries: "courageous, direct, and pioneering", Taurus: "steady, sensual, and deeply loyal",
    Gemini: "curious, adaptable, and wonderfully expressive", Cancer: "nurturing, intuitive, and emotionally rich",
    Leo: "warm, generous, and naturally radiant", Virgo: "precise, thoughtful, and quietly brilliant",
    Libra: "graceful, fair-minded, and beautifully relational", Scorpio: "intense, perceptive, and profoundly transformative",
    Sagittarius: "adventurous, optimistic, and wisdom-seeking", Capricorn: "determined, wise, and quietly powerful",
    Aquarius: "innovative, humanitarian, and refreshingly original", Pisces: "compassionate, creative, and deeply soulful",
  };
  // Birth time unknown → no house (never guessed): interpret sign + planet only.
  if (house == null) {
    return {
      description: `Your ${planet} in ${sign} means ${planetMeanings[planet]} expresses itself through the lens of ${sign.toLowerCase()} energy — ${signQualities[sign]}. Add your birth time to see which house (life area) this placement colors.\n\nEvery placement in your chart tells part of your story, and this one is a meaningful thread. Take what resonates — your lived experience is the real interpreter here.`,
      strengths: [
        `A natural ${signQualities[sign].split(",")[0]} approach to life`,
        `The ability to bring ${planet.toLowerCase()} energy into your day with grace`,
      ],
      growthEdge: `With ${planet} in ${sign}, you might sometimes feel the pull between your natural ${sign.toLowerCase()} expression and what the world expects. Remember that your chart is not a rulebook — it's an invitation to understand yourself more deeply.`,
    };
  }

  const suffixes = ["th", "st", "nd", "rd"];
  const suffix = suffixes[house % 10 > 3 ? 0 : house % 10] ?? "th";
  return {
    description: `Your ${planet} in ${sign} lives in your ${house}${suffix} house, the ${HOUSE_NAMES[house]?.toLowerCase() ?? `${house}th house`}. This means ${planetMeanings[planet]} expresses itself through the lens of ${sign.toLowerCase()} energy — ${signQualities[sign]}. When filtered through your ${house}${suffix} house, this placement colors how you experience ${HOUSE_NAMES[house]?.toLowerCase() ?? "this area of life"}.\n\nEvery placement in your chart tells part of your story, and this one is a meaningful thread. Take what resonates — your lived experience is the real interpreter here.`,
    strengths: [
      `A natural ${signQualities[sign].split(",")[0]} approach to ${HOUSE_NAMES[house]?.toLowerCase() ?? "this area of life"}`,
      `The ability to bring ${planet.toLowerCase()} energy into ${HOUSE_NAMES[house]?.toLowerCase() ?? "your daily experience"} with grace`,
    ],
    growthEdge: `With ${planet} in ${sign}, you might sometimes feel the pull between your natural ${sign.toLowerCase()} expression and what the world expects. Remember that your chart is not a rulebook — it's an invitation to understand yourself more deeply.`,
  };
}

// Reusable detail layout for the BaZi / Human Design / Vedic tap-to-explain
// screens — mirrors the astrology placement layout (hero + sections + Ask).
function DetailView(props: {
  glyph: string;
  glyphColor?: string;
  kicker: string;
  title: string;
  meta?: string;
  body: string;
  bodyTitle?: string;
  strengths?: string[];
  growthEdge?: string;
  why?: string;
  askLabel: string;
  askPrompt: string;
  resonanceId: string;
  systems: string[];
}) {
  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={SolunaColors.cream} />
        </TouchableOpacity>
        <View style={s.heroWrap}>
          <View style={[s.glyphCircle, { borderColor: "rgba(185,163,227,0.3)", backgroundColor: "rgba(185,163,227,0.08)" }]}>
            <Text style={[s.glyphText, { color: props.glyphColor ?? SolunaColors.gentleLavender }, props.glyph.length > 2 ? { fontSize: 22 } : null]}>
              {props.glyph}
            </Text>
          </View>
          <Text style={s.heroTitle}>{props.kicker}</Text>
          <Text style={s.heroSign}>{props.title}</Text>
          {props.meta ? <Text style={s.heroHouse}>{props.meta}</Text> : null}
        </View>
        <View style={s.section}>
          <Text style={s.interpretationTitle}>{props.bodyTitle ?? "What This Means"}</Text>
          <Text style={s.interpretationText}>{props.body}</Text>
        </View>
        {props.strengths && props.strengths.length ? (
          <View style={s.section}>
            <Text style={s.interpretationTitle}>What This Gives You</Text>
            {props.strengths.map((sx, i) => (
              <View key={i} style={s.strengthRow}>
                <Sparkles size={14} color={SolunaColors.warmGold} />
                <Text style={s.strengthText}>{sx}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {props.growthEdge ? (
          <View style={s.section}>
            <Text style={s.interpretationTitle}>Gentle Growth Edge</Text>
            <Text style={s.growthText}>{props.growthEdge}</Text>
          </View>
        ) : null}
        {props.why ? (
          <View style={s.section}>
            <Text style={s.interpretationTitle}>Why You're Seeing This</Text>
            <Text style={s.whyText}>{props.why}</Text>
          </View>
        ) : null}
        <ResonanceFeedbackCard sourceType="blueprint" sourceId={props.resonanceId} systemsReferenced={props.systems} />
        <TouchableOpacity
          style={s.askBtn}
          onPress={() => router.push({ pathname: "/(tabs)/ask", params: { prompt: props.askPrompt } })}
        >
          <MessageCircle size={18} color={SolunaColors.warmGold} />
          <Text style={s.askBtnText}>{props.askLabel}</Text>
        </TouchableOpacity>
        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

export default function InsightDetailScreen() {
  const { type, planet, number, value, facet, kind, sign, house, year, moon } = useLocalSearchParams<{
    type: string; planet: string; number: string; value: string; facet: string; kind: string;
    sign: string; house: string; year: string; moon: string;
  }>();
  const { user } = useAppState();
  if (!user || !type) return <ComingSoon title="Nothing to show here" description="This insight isn't available yet — it may need more birth details or a refreshed blueprint." />;

  // ── Number insight ──
  if (type === "number" && number) {
    const num = parseInt(number, 10);
    const info = NUMBER_MEANINGS[num];
    if (!info) return <ComingSoon title="Nothing to show here" description="This insight isn't available yet — it may need more birth details or a refreshed blueprint." />;
    return (
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
        <ScrollView contentContainerStyle={s.scrollContent}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={SolunaColors.cream} />
          </TouchableOpacity>
          <View style={s.heroWrap}>
            <View style={[s.glyphCircle, { borderColor: "rgba(185,163,227,0.3)", backgroundColor: "rgba(185,163,227,0.08)" }]}>
              <Text style={[s.glyphText, { color: SolunaColors.gentleLavender }]}>{num}</Text>
            </View>
            <Text style={s.heroTitle}>Number {num}</Text>
            <Text style={s.heroSign}>{info.title}</Text>
          </View>
          <View style={s.section}><Text style={s.interpretationTitle}>What This Means</Text><Text style={s.interpretationText}>{info.description}</Text></View>
          <View style={s.section}><Text style={s.interpretationTitle}>What This Gives You</Text>{info.strengths.map((sx, i) => (<View key={i} style={s.strengthRow}><Sparkles size={14} color={SolunaColors.warmGold} /><Text style={s.strengthText}>{sx}</Text></View>))}</View>
          <View style={s.section}><Text style={s.interpretationTitle}>Gentle Growth Edge</Text><Text style={s.growthText}>{info.growthEdge}</Text></View>
          <View style={s.section}><Text style={s.interpretationTitle}>Why You're Seeing This</Text><Text style={s.whyText}>In numerology, each number carries an archetypal vibration. Your {num} emerges from calculations based on your full birth name and birth date — it's not random, it's mathematical. This number describes a core thread in your life's pattern.</Text></View>
          <ResonanceFeedbackCard sourceType="blueprint" sourceId={`number-${num}`} systemsReferenced={["numerology"]} />
          <TouchableOpacity style={s.askBtn} onPress={() => router.push({ pathname: "/(tabs)/ask", params: { prompt: `Tell me more about my number ${num}` } })}>
            <MessageCircle size={18} color={SolunaColors.warmGold} /><Text style={s.askBtnText}>Ask Soluna about this number</Text>
          </TouchableOpacity>
          <View style={{ height: 60 }} />
        </ScrollView>
      </LinearGradient>
    );
  }

  // ── BaZi: Day Master ──
  if (type === "bazi-daymaster") {
    const dm = user.bazi?.dayMaster;
    const rawEl = dm?.element ?? "";
    const el = rawEl ? rawEl.charAt(0).toUpperCase() + rawEl.slice(1).toLowerCase() : "";
    const info = BAZI_ELEMENT_MEANINGS[el];
    if (!dm || !info) return <ComingSoon title="Nothing to show here" description="This insight isn't available yet — it may need more birth details or a refreshed blueprint." />;
    return (
      <DetailView
        glyph="☯"
        kicker="BaZi · Day Master"
        title={`${dm.yinYang} ${el}`.trim()}
        meta={dm.stem ? `Heavenly Stem · ${dm.stem}` : undefined}
        body={info.description}
        strengths={info.strengths}
        growthEdge={info.growthEdge}
        why={`Your Day Master is the heavenly stem of your Day Pillar — the "you" that the rest of your BaZi chart relates to. It comes from the day you were born, and its element (${el}) sets the tone for how you meet life.`}
        askLabel="Ask Soluna about your Day Master"
        askPrompt={`What does my ${dm.yinYang} ${el} Day Master mean?`}
        resonanceId="bazi-daymaster"
        systems={["bazi"]}
      />
    );
  }

  // ── BaZi: a single pillar ──
  if (type === "bazi-pillar" && value) {
    const info = BAZI_PILLAR_MEANINGS[value];
    if (!info) return <ComingSoon title="Nothing to show here" description="This insight isn't available yet — it may need more birth details or a refreshed blueprint." />;
    const pillar = user.bazi?.pillars?.find((p) => p.label === value);
    const pillarLine = pillar
      ? `Your ${value} Pillar: ${[pillar.stem, pillar.branch].filter(Boolean).join("")}${pillar.animal ? ` · ${pillar.animal}` : ""}${pillar.element ? ` · ${pillar.element}` : ""}.`
      : "";
    return (
      <DetailView
        glyph="☯"
        kicker={`BaZi · ${info.represents}`}
        title={`${value} Pillar`}
        meta={pillar?.animal ? `${pillar.element ?? ""} ${pillar.animal}`.trim() : undefined}
        body={`${info.description}${pillarLine ? `\n\n${pillarLine}` : ""}`}
        why={"The Four Pillars (Year, Month, Day, Hour) come from your exact birth moment — each is a heavenly stem + earthly branch that colours a different area and season of life."}
        askLabel={`Ask Soluna about your ${value} Pillar`}
        askPrompt={`What does my ${value} Pillar mean in my BaZi chart?`}
        resonanceId={`bazi-pillar-${value}`}
        systems={["bazi"]}
      />
    );
  }

  // ── Human Design facets ──
  if (type === "hd" && facet) {
    const hd = user.humanDesign;
    if (!hd) return <ComingSoon title="Nothing to show here" description="This insight isn't available yet — it may need more birth details or a refreshed blueprint." />;
    if (facet === "type") {
      const info = HD_INTERPRETATIONS[hd.type];
      return (
        <DetailView glyph="⚡" glyphColor={SolunaColors.warmGold} kicker="Human Design · Type" title={hd.type}
          body={hd.typeDescription || info?.description || ""}
          strengths={hd.strengths?.length ? hd.strengths : info?.strengths}
          growthEdge={hd.growthEdge || info?.growthEdge}
          why={"Your Type comes from which energy centers are defined in your chart, calculated from your exact birth date, time, and place."}
          askLabel="Ask Soluna about your Type" askPrompt={`What does being a ${hd.type} mean for me?`}
          resonanceId="hd-type" systems={["human_design"]} />
      );
    }
    if (facet === "strategy") {
      const g = HD_TYPE_GUIDANCE[hd.type];
      return (
        <DetailView glyph="⚡" glyphColor={SolunaColors.warmGold} kicker="Human Design · Strategy" title={hd.strategy || "Strategy"}
          body={hd.strategyDescription || g?.strategyDescription || ""}
          why={"Your Strategy follows from your Type — it's the way you're designed to engage with life so things flow with less resistance."}
          askLabel="Ask Soluna about your Strategy" askPrompt={`How do I live my Human Design strategy (${hd.strategy})?`}
          resonanceId="hd-strategy" systems={["human_design"]} />
      );
    }
    if (facet === "authority") {
      const label = (hd.authority || "").split(/[—–]/)[0].trim();
      return (
        <DetailView glyph="⚡" glyphColor={SolunaColors.warmGold} kicker="Human Design · Authority" title={label || "Authority"}
          body={hd.authorityDescription || HD_AUTHORITY_MEANINGS[label] || ""}
          why={"Your Authority is your body's most reliable way to make decisions, based on which centers are defined in your chart."}
          askLabel="Ask Soluna about your Authority" askPrompt={`How do I use my ${label || "inner"} authority to decide?`}
          resonanceId="hd-authority" systems={["human_design"]} />
      );
    }
    if (facet === "profile") {
      const [a, b] = (hd.profile || "").split("/").map((n) => Number(n.trim()));
      const la = HD_PROFILE_LINES[a], lb = HD_PROFILE_LINES[b];
      const body = la && lb
        ? `Your ${hd.profile} profile blends two lines.\n\nLine ${a} — the ${la.name}: ${la.theme}.\n\nLine ${b} — the ${lb.name}: ${lb.theme}.\n\nTogether, you lead with the ${la.name} (your conscious approach) expressed through the ${lb.name} (the way others meet you) — the rhythm of how you learn and show up.`
        : (hd.profileDescription || "");
      return (
        <DetailView glyph="⚡" glyphColor={SolunaColors.warmGold} kicker="Human Design · Profile" title={hd.profile || "Profile"}
          body={body}
          why={"Your Profile is the two lines of your conscious and unconscious Sun/Earth — a 'costume' for how you're here to learn and interact."}
          askLabel="Ask Soluna about your Profile" askPrompt={`What does my ${hd.profile} profile mean?`}
          resonanceId="hd-profile" systems={["human_design"]} />
      );
    }
    if (facet === "center" && value) {
      const info = HD_CENTER_MEANINGS[value];
      if (!info) return <ComingSoon title="Nothing to show here" description="This insight isn't available yet — it may need more birth details or a refreshed blueprint." />;
      const defined = !!hd.centers?.find((x) => x.name === value)?.defined;
      return (
        <DetailView glyph="⚡" glyphColor={SolunaColors.warmGold}
          kicker={`Human Design · ${defined ? "Defined" : "Open"} Center`} title={value} meta={info.theme}
          body={defined ? info.defined : info.open}
          why={`The ${value} center is ${defined ? "defined (consistent) — a reliable energy you can count on and that others feel from you" : "open (undefined) — a place you take in and amplify the world, designed for wisdom rather than consistency"}. This comes from your full chart.`}
          askLabel={`Ask Soluna about your ${value}`} askPrompt={`What does my ${defined ? "defined" : "open"} ${value} center mean?`}
          resonanceId={`hd-center-${value}`} systems={["human_design"]} />
      );
    }
    return <ComingSoon title="Nothing to show here" description="This insight isn't available yet — it may need more birth details or a refreshed blueprint." />;
  }

  // ── Vedic facets ──
  if (type === "vedic" && kind) {
    const v = user.vedic;
    if (!v?.available) return <ComingSoon title="Nothing to show here" description="This insight isn't available yet — it may need more birth details or a refreshed blueprint." />;
    if (kind === "moon" || kind === "nakshatra") {
      const nak = kind === "moon" ? (v.moonNakshatra ?? value) : value;
      const info = nak ? NAKSHATRA_MEANINGS[nak] : undefined;
      if (!nak || !info) return <ComingSoon title="Nothing to show here" description="This insight isn't available yet — it may need more birth details or a refreshed blueprint." />;
      return (
        <DetailView glyph="☾" kicker={kind === "moon" ? "Vedic · Moon Nakshatra" : "Vedic · Nakshatra"} title={nak} meta="Lunar mansion"
          body={info.description} strengths={info.strengths} growthEdge={info.growthEdge}
          why={"Nakshatras are the 27 lunar mansions of Vedic astrology. The Moon's nakshatra is the heart of a Vedic reading — a reflective lens, never fixed fate."}
          askLabel="Ask Soluna about this nakshatra" askPrompt={`What does the nakshatra ${nak} mean for me?`}
          resonanceId={`vedic-nak-${nak}`} systems={["vedic"]} />
      );
    }
    if (kind === "ascendant" && v.ascendant) {
      const asc = v.ascendant;
      const nakInfo = asc.nakshatra ? NAKSHATRA_MEANINGS[asc.nakshatra] : undefined;
      return (
        <DetailView glyph="ASC" glyphColor={SolunaColors.softPeach} kicker="Vedic · Ascendant (Lagna)" title={asc.sign}
          meta={asc.nakshatra ? `Nakshatra · ${asc.nakshatra}` : undefined}
          body={`Your sidereal Ascendant (Lagna) is ${asc.sign} — the sign rising on the eastern horizon at your birth in the Vedic (sidereal) zodiac. It shapes your outlook, vitality, and the lens through which the rest of the chart is read.${nakInfo ? `\n\nIts nakshatra, ${asc.nakshatra}: ${nakInfo.description}` : ""}`}
          why={"The Lagna needs an accurate birth time — it changes roughly every two hours. The sidereal zodiac is intentionally offset from the Western one."}
          askLabel="Ask Soluna about your Lagna" askPrompt={`What does my Vedic ascendant in ${asc.sign} mean?`}
          resonanceId="vedic-ascendant" systems={["vedic"]} />
      );
    }
    if (kind === "planet" && value) {
      const p = v.planets.find((x) => x.planet === value);
      if (!p) return <ComingSoon title="Nothing to show here" description="This insight isn't available yet — it may need more birth details or a refreshed blueprint." />;
      const nakInfo = p.nakshatra ? NAKSHATRA_MEANINGS[p.nakshatra] : undefined;
      return (
        <DetailView glyph={PLANET_SYMBOLS[value as Planet] ?? "✦"} kicker="Vedic · Sidereal Placement" title={`${value} in ${p.sign}`}
          meta={[p.house != null ? `House ${p.house}` : "", p.retrograde ? "Retrograde" : ""].filter(Boolean).join(" · ") || undefined}
          body={`In your Vedic (sidereal) chart, ${value} sits in ${p.sign}${p.house != null ? `, in your ${p.house}th house` : ""}${p.nakshatra ? `, in the nakshatra ${p.nakshatra}${p.nakshatraLord ? ` (ruled by ${p.nakshatraLord})` : ""}` : ""}. Sidereal signs are shifted from the Western zodiac, so this often differs from your Western chart — that contrast is the point.${nakInfo ? `\n\n${p.nakshatra}: ${nakInfo.description}` : ""}`}
          strengths={nakInfo?.strengths} growthEdge={nakInfo?.growthEdge}
          why={"Vedic positions come from a real sidereal ephemeris (Lahiri ayanamsha) for your birth moment — a separate tradition from your Western chart."}
          askLabel={`Ask Soluna about your Vedic ${value}`} askPrompt={`What does my Vedic ${value} in ${p.sign} mean?`}
          resonanceId={`vedic-planet-${value}`} systems={["vedic"]} />
      );
    }
    if (kind === "dasha" && v.dasha?.maha) {
      const maha = v.dasha.maha;
      const antar = v.dasha.antar;
      const mInfo = DASHA_PLANET_MEANINGS[maha.planet];
      const aInfo = antar ? DASHA_PLANET_MEANINGS[antar.planet] : undefined;
      const endLabel = (iso: string) => { const [y, m] = iso.split("-"); const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m)-1]; return mo ? `${mo} ${y}` : y; };
      return (
        <DetailView glyph="◉" glyphColor={SolunaColors.warmGold} kicker={`Vedic · ${v.dasha.system} Dasha`} title={`${maha.planet} Mahādashā`}
          meta={`Current period · until ${endLabel(maha.end)}`}
          body={`In Vedic astrology your life unfolds in Dashas — planetary chapters, each ruled by one graha that colours its whole season. You're currently in your ${maha.planet} Mahādashā (until ${endLabel(maha.end)}).${mInfo ? `\n\n${mInfo.theme}: ${mInfo.description}` : ""}${antar ? `\n\nWithin it runs the ${antar.planet} Antardashā (a sub-period, until ${endLabel(antar.end)})${aInfo ? ` — ${aInfo.theme.toLowerCase()}. ${aInfo.description}` : "."}` : ""}`}
          strengths={mInfo?.strengths} growthEdge={mInfo?.growthEdge}
          why={"The Vimshottari Dasha timeline is fixed at birth from the Moon's nakshatra; which period is active is simple date math. A reflective lens for the theme and timing of a season — never fixed fate."}
          askLabel={`Ask Soluna about your ${maha.planet} period`} askPrompt={`What does my ${maha.planet} Mahadasha${antar ? ` with ${antar.planet} Antardasha` : ""} mean for this chapter of my life?`}
          resonanceId={`vedic-dasha-${maha.planet}`} systems={["vedic"]} />
      );
    }
    if (kind === "strength" && v.strength?.strongest && v.strength?.weakest) {
      const strong = v.strength.strongest;
      const weak = v.strength.weakest;
      const sInfo = PLANET_STRENGTH_MEANINGS[strong.planet];
      const wInfo = PLANET_STRENGTH_MEANINGS[weak.planet];
      return (
        <DetailView glyph="⚖" glyphColor={SolunaColors.warmGold} kicker="Vedic · Shadbala (Planetary Strength)" title={`${strong.planet} is your strongest`}
          meta={wInfo ? `${weak.planet} is your developing one` : undefined}
          body={`Shadbala measures how clearly each planet can express itself in your chart. Your strongest is ${strong.planet}${sInfo ? ` (${sInfo.domain})` : ""} — ${sInfo ? sInfo.strong.charAt(0).toLowerCase() + sInfo.strong.slice(1) : "an area of natural ease."}\n\nYour developing planet is ${weak.planet}${wInfo ? ` (${wInfo.domain})` : ""} — ${wInfo ? wInfo.developing.charAt(0).toLowerCase() + wInfo.developing.slice(1) : "an area to nurture with intention."}\n\nThis isn't a ranking of worth — every planet plays its part. It simply points to where things come easily and where a little conscious care goes a long way.`}
          strengths={sInfo ? [sInfo.strong] : undefined}
          why={"Shadbala is a real six-fold calculation from your sidereal chart. A reflective lens on ease vs. effort — never a verdict on your worth, and not about health or longevity."}
          askLabel={`Ask Soluna about your ${strong.planet} strength`} askPrompt={`In my Vedic chart ${strong.planet} is strongest and ${weak.planet} is developing — what does that mean for how I move through life?`}
          resonanceId={`vedic-strength-${strong.planet}`} systems={["vedic"]} />
      );
    }
    return <ComingSoon title="Nothing to show here" description="This insight isn't available yet — it may need more birth details or a refreshed blueprint." />;
  }

  // ── Solar Return ("year ahead") insight ── (data passed via params from the card)
  if (type === "solar" && sign) {
    const ascTheme = SOLAR_RETURN_ASC_THEMES[sign];
    const h = house ? parseInt(house, 10) : NaN;
    const houseInfo = Number.isFinite(h) ? SOLAR_RETURN_SUN_HOUSE[h] : undefined;
    return (
      <DetailView glyph="☉" glyphColor={SolunaColors.warmGold} kicker={`Solar Return${year ? ` · ${year}` : ""}`} title={`${sign} rising this year`}
        meta={houseInfo ? `Focus: ${houseInfo.area}` : undefined}
        body={`Your Solar Return is the chart cast for the moment the Sun returned to its birth position this year — a traditional snapshot of the year's themes.\n\nWith ${sign} on your Solar Return Ascendant, ${ascTheme ?? "the year takes on that sign's flavour."}${houseInfo ? `\n\n${houseInfo.theme}` : ""}${moon ? `\n\nYour Solar Return Moon in ${moon} colours the year's emotional weather.` : ""}`}
        why={"A Solar Return needs an accurate birth time and place — it's cast for an exact moment. Reflective themes for the year ahead, never fixed predictions."}
        askLabel="Ask Soluna about my year ahead" askPrompt={`My Solar Return this year has ${sign} rising${houseInfo ? ` with the Sun in the house of ${houseInfo.area}` : ""}. What themes might the year hold?`}
        resonanceId={`solar-return-${year || sign}`} systems={["astrology"]} />
    );
  }

  // ── Rising sign insight ──
  if (type === "placement" && planet === "Rising") {
    const rising = user.chart?.rising;
    if (!rising) {
      return (
        <ComingSoon
          title="Rising sign"
          description="Add your birth time in Profile to reveal your Rising sign — we won't guess it."
        />
      );
    }
    return (
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
        <ScrollView contentContainerStyle={s.scrollContent}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={SolunaColors.cream} />
          </TouchableOpacity>
          <View style={s.heroWrap}>
            <View style={[s.glyphCircle, { borderColor: "rgba(242,168,141,0.25)" }]}>
              <Text style={[s.glyphText, { color: SolunaColors.softPeach, fontSize: 28 }]}>ASC</Text>
            </View>
            <Text style={s.heroTitle}>Rising Sign</Text>
            <Text style={s.heroSign}>{ZODIAC_SYMBOLS[rising]} {rising}</Text>
            <Text style={s.heroHouse}>Ascendant · 1st House</Text>
          </View>
          <View style={s.section}>
            <Text style={s.interpretationTitle}>What This Means</Text>
            <Text style={s.interpretationText}>
              Your rising sign (or ascendant) is the zodiac sign that was literally rising on the eastern horizon at the exact moment you were born. It changes about every two hours — which is why your birth time matters so much. Your rising sign shapes your personal style, your instinctive reactions, and the energy you bring into a room before you even say a word. Think of it as the doorway through which everything else in your chart enters the world. With {rising} rising, you greet the world with warmth and grace — people feel at ease around you.
            </Text>
          </View>
          {!user.birthTimeKnown && (
            <View style={s.warningCard}>
              <Text style={s.warningTitle}>Why this is approximate</Text>
              <Text style={s.warningText}>
                Without an exact birth time, your Rising sign is estimated at noon. The actual rising sign could differ. Add your birth time in Profile to get an exact reading.
              </Text>
            </View>
          )}
          <ResonanceFeedbackCard sourceType="blueprint" sourceId="placement-rising" systemsReferenced={["astrology"]} />
          <TouchableOpacity
            style={s.askBtn}
            onPress={() =>
              router.push({ pathname: "/(tabs)/ask", params: { prompt: "Tell me more about my Rising sign" } })
            }
          >
            <MessageCircle size={18} color={SolunaColors.warmGold} />
            <Text style={s.askBtnText}>Ask Soluna about your Rising sign</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ── Astrology placement insight ──
  if (type === "placement" && planet) {
    const placement = user.chart?.placements.find((p) => p.planet === planet);
    if (!placement) return <ComingSoon title="Nothing to show here" description="This insight isn't available yet — it may need more birth details or a refreshed blueprint." />;
    const interp =
      getPlacementInterpretation(placement.planet, placement.sign, placement.house) ??
      getGenericInterpretation(placement.planet, placement.sign, placement.house);

    return (
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
        <ScrollView contentContainerStyle={s.scrollContent}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={SolunaColors.cream} />
          </TouchableOpacity>
          <View style={s.heroWrap}>
            <View style={s.glyphCircle}>
              <Text style={s.glyphText}>{PLANET_SYMBOLS[placement.planet]}</Text>
            </View>
            <Text style={s.heroTitle}>{placement.planet}</Text>
            <Text style={s.heroSign}>
              {ZODIAC_SYMBOLS[placement.sign]} {placement.sign}
            </Text>
            <Text style={s.heroHouse}>
              {placement.degree}° · House {placement.house}
            </Text>
          </View>
          <View style={s.section}>
            <Text style={s.interpretationTitle}>What This Means</Text>
            <Text style={s.interpretationText}>{interp.description}</Text>
          </View>
          <View style={s.section}>
            <Text style={s.interpretationTitle}>What This Gives You</Text>
            {interp.strengths.map((sx, i) => (
              <View key={i} style={s.strengthRow}>
                <Sparkles size={14} color={SolunaColors.warmGold} />
                <Text style={s.strengthText}>{sx}</Text>
              </View>
            ))}
          </View>
          <View style={s.section}>
            <Text style={s.interpretationTitle}>Gentle Growth Edge</Text>
            <Text style={s.growthText}>{interp.growthEdge}</Text>
          </View>
          <View style={s.section}>
            <Text style={s.interpretationTitle}>Why You're Seeing This</Text>
            <Text style={s.whyText}>
              This placement comes from the exact position of {placement.planet} at the moment of your birth — {placement.degree}° into {placement.sign}, falling in your {placement.house}th house. Your birth time and location determine which house each planet falls into.
            </Text>
          </View>
          <ResonanceFeedbackCard sourceType="blueprint" sourceId={`placement-${placement.planet}`} systemsReferenced={["astrology"]} />
          <TouchableOpacity
            style={s.askBtn}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/ask",
                params: { prompt: `Tell me more about my ${placement.planet} in ${placement.sign}` },
              })
            }
          >
            <MessageCircle size={18} color={SolunaColors.warmGold} />
            <Text style={s.askBtnText}>Ask Soluna about this placement</Text>
          </TouchableOpacity>
          <View style={{ height: 60 }} />
        </ScrollView>
      </LinearGradient>
    );
  }

  return <ComingSoon title="Nothing to show here" description="This insight isn't available yet — it may need more birth details or a refreshed blueprint." />;
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  heroWrap: { alignItems: "center", marginBottom: 28 },
  glyphCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 2, borderColor: "rgba(255,255,255,0.08)" },
  glyphText: { fontSize: 36, color: SolunaColors.warmGold },
  heroTitle: { fontSize: 13, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 2, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 6 },
  heroSign: { fontSize: 32, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 6 },
  heroHouse: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  section: { marginBottom: 24 },
  interpretationTitle: { fontSize: 15, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 10 },
  interpretationText: { fontSize: 15, color: SolunaColors.creamMuted, lineHeight: 24, fontFamily: Fonts.body, marginBottom: 12 },
  strengthRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 10 },
  strengthText: { flex: 1, fontSize: 14, color: SolunaColors.cream, lineHeight: 21, fontFamily: Fonts.body },
  growthText: { fontSize: 15, color: SolunaColors.softPeach, lineHeight: 24, fontFamily: Fonts.body, fontStyle: "italic" },
  whyText: { fontSize: 14, color: SolunaColors.creamMuted, lineHeight: 22, fontFamily: Fonts.body },
  askBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "rgba(232,184,109,0.08)", borderRadius: SolunaRadius.lg, paddingVertical: 16, borderWidth: 1, borderColor: "rgba(232,184,109,0.12)", marginTop: 8 },
  askBtnText: { fontSize: 14, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
  warningCard: { backgroundColor: "rgba(242,168,141,0.06)", borderRadius: SolunaRadius.md, padding: 14, borderWidth: 1, borderColor: "rgba(242,168,141,0.1)", marginBottom: 20 },
  warningTitle: { fontSize: 13, fontWeight: "700", color: SolunaColors.softPeach, fontFamily: Fonts.body, marginBottom: 4 },
  warningText: { fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19, fontFamily: Fonts.body },
});
