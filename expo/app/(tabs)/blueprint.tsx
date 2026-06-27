import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useMemo, useCallback } from "react";
import Svg, { Circle, Line, Text as SvgText, G } from "react-native-svg";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { ZODIAC, ZODIAC_SYMBOLS, PLANET_SYMBOLS, CHINESE_ANIMAL_EMOJI, CHINESE_ELEMENT_EMOJI, Fonts, NUMBER_MEANINGS } from "@/constants/mockData";
import type { ZodiacSign, BaziView } from "@/constants/mockData";
import ConfidencePill from "@/components/ConfidencePill";
import type { ConfidenceLevel } from "@/components/ConfidencePill";
import PremiumGateCard from "@/components/PremiumGateCard";
import { Sun, Moon, ChevronRight, Sparkles, ArrowRight, MessageCircle, Bookmark } from "lucide-react-native";
import InsightActionBar from "@/components/InsightActionBar";

type SystemLens = "astrology" | "numerology" | "chinese" | "humanDesign";

function ordinal(n: number): string {
  if (!Number.isFinite(n)) return "th";
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  const d = n % 10;
  if (d === 1) return "st"; if (d === 2) return "nd"; if (d === 3) return "rd";
  return "th";
}

// ─── Natal Chart Wheel ─────────────────────────────────────
function NatalChartWheel({ size }: { size: number }) {
  const chartRadius = Math.max(size / 2, 50);
  const cx = Math.round(size / 2), cy = Math.round(size / 2);
  const ringOuter = Math.max(chartRadius - 4, 2), ringInner = Math.max(ringOuter - 38, 2);
  const houseRing = Math.max(ringInner - 2, 2), houseInner = Math.max(houseRing - 30, 2), innerRing = Math.max(houseInner - 6, 2);

  const zodiacSegments = useMemo(() => ZODIAC.map((sign, i) => {
    const startAngleDeg = i * 30 - 105;
    const midRad = (startAngleDeg + 15) * (Math.PI / 180);
    const mx = cx + (ringOuter - 18) * Math.cos(midRad), my = cy + (ringOuter - 18) * Math.sin(midRad);
    const isActive = sign === "Cancer" || sign === "Pisces" || sign === "Libra";
    const startRad = startAngleDeg * (Math.PI / 180), endRad = (startAngleDeg + 30) * (Math.PI / 180);
    return { sign, startRad, endRad, mx, my, isActive };
  }), [cx, cy, ringOuter]);

  const houseCusps = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ house: i + 1, rad: (i * 30 - 105) * (Math.PI / 180) })), []);
  const planetPositions = [
    { label: "\u2609", angle: 0, dist: Math.max(innerRing - 6, 2), big: true },
    { label: "\u263D", angle: 60, dist: Math.max(innerRing - 16, 2), big: true },
    { label: "\u263F", angle: 85, dist: Math.max(innerRing - 6, 2), big: true },
    { label: "\u2640", angle: 135, dist: Math.max(innerRing - 10, 2), big: false },
    { label: "\u2642", angle: 170, dist: Math.max(innerRing - 16, 2), big: false },
    { label: "\u2643", angle: 220, dist: Math.max(innerRing - 6, 2), big: false },
    { label: "\u2644", angle: 260, dist: Math.max(innerRing - 12, 2), big: false },
    { label: "\u2645", angle: 290, dist: Math.max(innerRing - 16, 2), big: false },
    { label: "\u2646", angle: 320, dist: Math.max(innerRing - 6, 2), big: false },
    { label: "\u2647", angle: 350, dist: Math.max(innerRing - 14, 2), big: false },
  ];

  if (size <= 0 || chartRadius <= 0) return null;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={ringOuter + 6} fill="none" stroke="rgba(232,184,109,0.06)" strokeWidth={6} />
      {zodiacSegments.map((seg) => (
        <G key={seg.sign}>
          <Line x1={cx + ringInner * Math.cos(seg.startRad)} y1={cy + ringInner * Math.sin(seg.startRad)} x2={cx + ringOuter * Math.cos(seg.startRad)} y2={cy + ringOuter * Math.sin(seg.startRad)} stroke={seg.isActive ? "rgba(232,184,109,0.25)" : "rgba(255,255,255,0.06)"} strokeWidth={1} />
          <SvgText x={seg.mx} y={seg.my} fill={seg.isActive ? SolunaColors.warmGold : SolunaColors.creamMuted} fontSize={10} fontWeight={seg.isActive ? "bold" : "normal"} textAnchor="middle">{ZODIAC_SYMBOLS[seg.sign as ZodiacSign]}</SvgText>
        </G>
      ))}
      <Circle cx={cx} cy={cy} r={ringOuter} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />
      <Circle cx={cx} cy={cy} r={ringInner} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={houseRing} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={houseInner} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      {houseCusps.map((h) => (
        <G key={`h${h.house}`}>
          <Line x1={cx + houseInner * Math.cos(h.rad)} y1={cy + houseInner * Math.sin(h.rad)} x2={cx + houseRing * Math.cos(h.rad)} y2={cy + houseRing * Math.sin(h.rad)} stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
          <SvgText x={cx + (houseInner + 12) * Math.cos(h.rad)} y={cy + (houseInner + 12) * Math.sin(h.rad)} fill={SolunaColors.creamSubtle} fontSize={7} textAnchor="middle">{h.house}</SvgText>
        </G>
      ))}
      <Circle cx={cx} cy={cy} r={innerRing} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={18} fill="rgba(232,184,109,0.08)" stroke="rgba(232,184,109,0.2)" strokeWidth={1} />
      <SvgText x={cx} y={cy} fill={SolunaColors.warmGold} fontSize={10} textAnchor="middle" fontWeight="bold">{"\u2609"}</SvgText>
      {planetPositions.map((p, i) => {
        const rad = (p.angle - 90) * (Math.PI / 180);
        const px = cx + p.dist * Math.cos(rad), py = cy + p.dist * Math.sin(rad);
        return (
          <G key={i}>
            {p.big && <Circle cx={px} cy={py} r={12} fill="rgba(232,184,109,0.06)" stroke="rgba(232,184,109,0.2)" strokeWidth={1} />}
            <SvgText x={px} y={py} fill={p.big ? SolunaColors.warmGold : SolunaColors.creamMuted} fontSize={p.big ? 14 : 12} textAnchor="middle" fontWeight={p.big ? "bold" : "normal"}>{p.label}</SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── BodyGraph ─────────────────────────────────────────────
const BG_W = 260; const BG_H = 260;

function BodyGraph() {
  const centerPositions = [
    { name: "Head", x: BG_W / 2, y: 28, defined: false }, { name: "Ajna", x: BG_W / 2, y: 68, defined: false },
    { name: "Throat", x: BG_W / 2, y: 118, defined: true }, { name: "G", x: BG_W / 2, y: 168, defined: true },
    { name: "Heart", x: BG_W / 2 - 46, y: 138, defined: false }, { name: "Sacral", x: BG_W / 2, y: 198, defined: true },
    { name: "Solar Plex", x: BG_W / 2 + 46, y: 155, defined: true }, { name: "Spleen", x: BG_W / 2 - 46, y: 185, defined: false },
    { name: "Root", x: BG_W / 2, y: 238, defined: true },
  ];
  return (
    <Svg width={BG_W} height={BG_H} viewBox={`0 0 ${BG_W} ${BG_H}`}>
      {centerPositions.map((c) => (
        <G key={c.name}>
          <Circle cx={c.x} cy={c.y} r={15} fill={c.defined ? "rgba(232,184,109,0.1)" : "rgba(255,255,255,0.03)"} stroke={c.defined ? "rgba(232,184,109,0.25)" : "rgba(255,255,255,0.06)"} strokeWidth={1} />
          <SvgText x={c.x} y={c.y} fill={c.defined ? SolunaColors.warmGold : SolunaColors.creamSubtle} fontSize={7} textAnchor="middle">{c.name}</SvgText>
        </G>
      ))}
      <Line x1={BG_W / 2} y1={43} x2={BG_W / 2} y2={103} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      <Line x1={BG_W / 2} y1={133} x2={BG_W / 2} y2={153} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      <Line x1={BG_W / 2 - 30} y1={148} x2={BG_W / 2 - 15} y2={162} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      <Line x1={BG_W / 2} y1={198} x2={BG_W / 2} y2={223} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      <Line x1={BG_W / 2 + 30} y1={165} x2={BG_W / 2 + 15} y2={182} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
    </Svg>
  );
}

// ─── Insight Item (meaning + what it gives + growth edge + why + actions) ──
function InsightItem({
  title, meaning, whatItGives, growthEdge, whyText, askPrompt, confidence,
}: {
  title: string; meaning: string; whatItGives: string; growthEdge: string; whyText: string; askPrompt: string; confidence: ConfidenceLevel;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <TouchableOpacity style={is.card} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
      <View style={is.header}>
        <View style={{ flex: 1 }}>
          <Text style={is.title}>{title}</Text>
          <View style={is.confRow}><ConfidencePill level={confidence} /></View>
        </View>
        <ChevronRight size={16} color={SolunaColors.creamSubtle} style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }} />
      </View>
      <Text style={is.meaning}>{meaning.slice(0, expanded ? undefined : 100)}{!expanded && meaning.length > 100 ? "…" : ""}</Text>
      {expanded && (
        <View style={is.expanded}>
          <View style={is.section}>
            <Text style={is.sectionLabel}>What this gives you</Text>
            <Text style={is.sectionText}>{whatItGives}</Text>
          </View>
          <View style={is.section}>
            <Text style={is.sectionLabel}>Gentle growth edge</Text>
            <Text style={is.sectionText}>{growthEdge}</Text>
          </View>
          <View style={is.section}>
            <Text style={is.sectionLabel}>Why you're seeing this</Text>
            <Text style={is.sectionText}>{whyText}</Text>
          </View>
          <View style={is.actions}>
            <TouchableOpacity style={is.askBtn} onPress={() => router.push({ pathname: "/(tabs)/ask", params: { prompt: askPrompt } })}>
              <MessageCircle size={14} color={SolunaColors.warmGold} />
              <Text style={is.askText}>Ask Soluna</Text>
            </TouchableOpacity>
            <TouchableOpacity style={is.saveBtn} onPress={() => setSaved(!saved)}>
              <Bookmark size={14} color={saved ? SolunaColors.warmGold : SolunaColors.creamSubtle} fill={saved ? SolunaColors.warmGold : "transparent"} />
              <Text style={[is.saveText, saved && { color: SolunaColors.warmGold }]}>{saved ? "Saved" : "Save"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}
const is = StyleSheet.create({
  card: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 },
  title: { fontSize: 15, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  confRow: { marginTop: 4 },
  meaning: { fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19, fontFamily: Fonts.body },
  expanded: { marginTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 12 },
  section: { marginBottom: 10 },
  sectionLabel: { fontSize: 10, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", marginBottom: 4 },
  sectionText: { fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19, fontFamily: Fonts.body },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  askBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(232,184,109,0.1)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "rgba(232,184,109,0.15)" },
  askText: { fontSize: 12, fontWeight: "600", color: SolunaColors.warmGold, fontFamily: Fonts.body },
  saveBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  saveText: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
});

// ─── Card wrapper ──────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return <View style={cardS.card}>{children}</View>;
}
const cardS = StyleSheet.create({ card: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 10 } });

function BlueprintContent() {
  const { user } = useAppState();
  const [lens, setLens] = useState<SystemLens>("astrology");
  if (!user) return null;

  const safeGet = <T,>(val: T | undefined | null, fallback: T): T => val != null ? val : fallback;
  const timeConfidence: ConfidenceLevel = user.birthTimeKnown ? "exact" : "needsBirthTime";

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Your Blueprint</Text>
        <Text style={s.sub}>{safeGet(user.preferredName, "You")}'s cosmic design across four lenses</Text>

        {/* Synthesis */}
        <TouchableOpacity style={s.synthesisBtn} onPress={() => router.push({ pathname: "/synthesis-detail", params: { id: "self" } })} activeOpacity={0.8}>
          <View style={s.synthesisInner}>
            <Sparkles size={16} color={SolunaColors.warmGold} />
            <Text style={s.synthesisText}>Where it all connects</Text>
            <ArrowRight size={14} color={SolunaColors.warmGold} />
          </View>
        </TouchableOpacity>

        {/* Confidence */}
        <View style={s.confidenceRow}>
          <ConfidencePill level={timeConfidence} showDetail />
          {!user.birthTimeKnown && <Text style={s.confidenceNote}>Rising sign, houses, and Human Design are approximate without birth time</Text>}
        </View>

        {/* Lens switcher */}
        <View style={s.lensWrap}>
          {(["astrology", "numerology", "chinese", "humanDesign"] as const).map((key) => {
            const labels: Record<SystemLens, string> = { astrology: "Astro", numerology: "Nums", chinese: "Chinese", humanDesign: "HD" };
            const isActive = lens === key;
            return (
              <TouchableOpacity key={key} style={[s.lensTab, isActive && s.lensTabActive]} onPress={() => setLens(key)}>
                <Text style={[s.lensText, isActive && s.lensTextActive]}>{labels[key]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Astrology ── */}
        {lens === "astrology" && user.chart && (
          <View>
            <View style={s.chartWrap}><NatalChartWheel size={300} /></View>
            <ConfidencePill level="verified" />

            <Text style={s.sectionLabel}>Big Three</Text>
            {([{ planet: "Sun", sign: user.chart.sun?.sign ?? "Cancer", house: user.chart.sun?.house ?? 12, icon: Sun, color: SolunaColors.warmGold, conf: "exact" as ConfidenceLevel },
              { planet: "Moon", sign: user.chart.moon?.sign ?? "Pisces", house: user.chart.moon?.house ?? 8, icon: Moon, color: SolunaColors.gentleLavender, conf: "exact" as ConfidenceLevel },
              { planet: "Rising", sign: user.chart.rising ?? "Libra", icon: Sun, color: SolunaColors.softPeach, conf: timeConfidence }] as const).map((item) => {
              const signKey = item.sign as ZodiacSign;
              const symbol = ZODIAC_SYMBOLS[signKey] ?? "";
              const hasHouse = "house" in item && item.house != null;
              return (
                <TouchableOpacity key={item.planet} style={s.bigThreeRow} onPress={() => router.push({ pathname: "/insight-detail", params: { type: "placement", planet: item.planet } })}>
                  <View style={[s.bigThreeIcon, { backgroundColor: `${item.color}15` }]}><item.icon size={18} color={item.color} /></View>
                  <View style={s.bigThreeInfo}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={s.bigThreeLabel}>{item.planet}</Text>
                      <ConfidencePill level={item.conf} />
                    </View>
                    <Text style={s.bigThreeVal}>{symbol} {item.sign}{hasHouse ? ` · ${item.house}${ordinal(item.house!)} House` : ""}</Text>
                  </View>
                  <ChevronRight size={16} color={SolunaColors.creamSubtle} />
                </TouchableOpacity>
              );
            })}

            <Text style={s.sectionLabel}>All Placements</Text>
            {(user.chart.placements ?? []).map((p) => {
              const symbol = ZODIAC_SYMBOLS[p.sign] ?? "";
              const glyph = PLANET_SYMBOLS[p.planet] ?? "";
              return (
                <TouchableOpacity key={p.planet} style={s.placementRow} onPress={() => router.push({ pathname: "/insight-detail", params: { type: "placement", planet: p.planet } })}>
                  <Text style={s.glyphText}>{glyph}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.placementName}>{p.planet}</Text>
                    <Text style={s.placementDetail}>{symbol} {p.sign} · {p.degree}° · House {p.house}</Text>
                  </View>
                  <ChevronRight size={14} color={SolunaColors.creamSubtle} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Numerology ── */}
        {lens === "numerology" && user.numerology && (
          <View>
            <ConfidencePill level="exact" showDetail />
            <Text style={s.sectionLabel}>Core Numbers</Text>
            {[
              { label: "Life Path", value: user.numerology.lifePath, info: NUMBER_MEANINGS[user.numerology.lifePath], color: SolunaColors.warmGold },
              { label: "Expression", value: user.numerology.expression, info: NUMBER_MEANINGS[user.numerology.expression], color: SolunaColors.gentleLavender },
              { label: "Soul Urge", value: user.numerology.soulUrge, info: NUMBER_MEANINGS[user.numerology.soulUrge], color: SolunaColors.softPeach },
            ].map((num) => (
              <InsightItem
                key={num.label}
                title={`${num.label} ${num.value}: ${num.info?.title ?? ""}`}
                meaning={num.info?.description ?? ""}
                whatItGives={num.info?.strengths ? num.info.strengths.map((s) => `• ${s}`).join("\n") : ""}
                growthEdge={num.info?.growthEdge ?? ""}
                whyText={`Your ${num.label} is calculated from your full birth name. The number ${num.value} appears in your chart because of the letters and their numeric values in your name.`}
                askPrompt={`Tell me more about my ${num.label} number ${num.value}`}
                confidence="exact"
              />
            ))}
            <Text style={s.sectionLabel}>Personal Timing</Text>
            {[
              { label: "Personal Year", value: safeGet(user.numerology.personalYear, 0), meaning: safeGet(user.numerology.personalYearMeaning, "") },
              { label: "Personal Month", value: safeGet(user.numerology.personalMonth, 0), meaning: safeGet(user.numerology.personalMonthMeaning, "") },
              { label: "Personal Day", value: safeGet(user.numerology.personalDay, 0), meaning: safeGet(user.numerology.personalDayMeaning, "") },
            ].map((t) => (
              <Card key={t.label}>
                <View style={s.timingRow}>
                  <Text style={s.timingBadge}>{t.value}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.timingLabel}>{t.label}</Text>
                    <Text style={s.timingMeaning}>{t.meaning}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* ── Chinese ── */}
        {lens === "chinese" && user.chinese && (
          <View>
            <View style={s.confidenceRow}><ConfidencePill level="exact" showDetail /></View>
            <Card>
              <View style={s.chineseHeader}>
                <Text style={s.chineseEmoji}>{safeGet(CHINESE_ANIMAL_EMOJI[user.chinese.animal], "")}</Text>
                <View>
                  <Text style={s.chineseTitle}>{safeGet(user.chinese.elementAnimalLabel, "")}</Text>
                  <Text style={s.chineseElement}>{safeGet(CHINESE_ELEMENT_EMOJI[user.chinese.element], "")} {safeGet(user.chinese.element, "")} element</Text>
                </View>
              </View>
              <Text style={s.chineseDesc}>{safeGet(user.chinese.description, "")}</Text>
            </Card>
            <Text style={s.sectionLabel}>Strengths</Text>
            {(user.chinese.strengths ?? []).map((sx, i) => (
              <View key={i} style={s.strengthRow}><Sparkles size={12} color={SolunaColors.warmGold} /><Text style={s.strengthText}>{sx}</Text></View>
            ))}
            <Text style={s.sectionLabel}>Gentle Growth Edge</Text>
            <Card><Text style={s.growthText}>{safeGet(user.chinese.growthEdge, "")}</Text></Card>
            <Text style={s.sectionLabel}>Year & Month Pillars · Chinese Zodiac</Text>
            <Text style={s.baziHint}>A light birth-year zodiac lens — not a full BaZi chart.</Text>
            {(user.chinese.bazi ?? []).map((pillar, i) => (
              <Card key={i}>
                <View style={s.baziRow}>
                  <Text style={s.baziStem}>{safeGet(pillar.heavenlyStem, "")}</Text>
                  <Text style={s.baziBranch}>{safeGet(CHINESE_ANIMAL_EMOJI[pillar.earthlyBranch], "")} {safeGet(pillar.earthlyBranch, "")}</Text>
                  <View style={[s.baziElemBadge, { backgroundColor: "rgba(255,255,255,0.05)" }]}>
                    <Text style={s.baziElemText}>{safeGet(CHINESE_ELEMENT_EMOJI[pillar.element], "")}</Text>
                  </View>
                </View>
                <Text style={s.baziMeaning}>{safeGet(pillar.meaning, "")}</Text>
              </Card>
            ))}

            {/* True, provider-backed BaZi / Four Pillars (distinct from the zodiac above). */}
            <Text style={s.sectionLabel}>BaZi · Four Pillars</Text>
            <BaziFourPillars bazi={user.bazi} />
          </View>
        )}

        {/* ── Human Design ── */}
        {lens === "humanDesign" && user.humanDesign && (
          <View>
            <View style={s.bgWrap}><BodyGraph /></View>
            <View style={s.confidenceRow}>
              <ConfidencePill level={timeConfidence} showDetail />
              {!user.birthTimeKnown && <Text style={s.confidenceNote}>Human Design accuracy depends on exact birth time</Text>}
            </View>
            <Card>
              <Text style={s.hdType}>{safeGet(user.humanDesign.type, "")}</Text>
              <Text style={s.hdDesc}>{safeGet(user.humanDesign.typeDescription, "")}</Text>
            </Card>
            <Text style={s.sectionLabel}>Strategy</Text>
            <Card><Text style={s.hdLabel}>{safeGet(user.humanDesign.strategy, "")}</Text><Text style={s.hdDesc}>{safeGet(user.humanDesign.strategyDescription, "")}</Text></Card>
            <Text style={s.sectionLabel}>Authority</Text>
            <Card><Text style={s.hdLabel}>{safeGet(user.humanDesign.authority, "")}</Text><Text style={s.hdDesc}>{safeGet(user.humanDesign.authorityDescription, "")}</Text></Card>
            <Text style={s.sectionLabel}>Profile</Text>
            <Card><Text style={s.hdLabel}>{safeGet(user.humanDesign.profile, "")}</Text><Text style={s.hdDesc}>{safeGet(user.humanDesign.profileDescription, "")}</Text></Card>
            <Text style={s.sectionLabel}>Signature / Not-Self</Text>
            <View style={s.sigRow}>
              <Card><Text style={s.sigLabel}>Signature</Text><Text style={[s.sigVal, { color: SolunaColors.warmGold }]}>{safeGet(user.humanDesign.signature, "")}</Text></Card>
              <Card><Text style={s.sigLabel}>Not-Self</Text><Text style={[s.sigVal, { color: SolunaColors.softPeach }]}>{safeGet(user.humanDesign.notSelf, "")}</Text></Card>
            </View>
            <Text style={s.sectionLabel}>Strengths</Text>
            {(user.humanDesign.strengths ?? []).map((sx, i) => (
              <View key={i} style={s.strengthRow}><Sparkles size={12} color={SolunaColors.warmGold} /><Text style={s.strengthText}>{sx}</Text></View>
            ))}
          </View>
        )}

        {/* Premium gate */}
        <PremiumGateCard title="Full Blueprint Depth" description="Unlock comprehensive BaZi analysis, deeper Human Design center insights, and full cross-system synthesis reports." feature="Includes all four lenses with complete interpretations" />
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function capWord(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// True, provider-backed BaZi / Four Pillars — renders honest available / partial /
// unavailable states. Never shows fabricated pillars.
function BaziFourPillars({ bazi }: { bazi: BaziView }) {
  if (!bazi?.available) {
    const why = bazi?.missingInputs?.includes("birth_location")
      ? "Add your birth place to unlock your full BaZi / Four Pillars chart."
      : bazi?.missingInputs?.includes("birth_time")
        ? "Add your birth time to unlock your full BaZi / Four Pillars chart."
        : (bazi?.notes?.[0] ?? "Full BaZi / Four Pillars isn't available yet.");
    return (
      <Card>
        <Text style={s.baziUnavailTitle}>Four Pillars not available yet</Text>
        <Text style={s.baziMeaning}>{why}</Text>
      </Card>
    );
  }
  return (
    <View>
      {bazi.dayMaster && (
        <Card>
          <Text style={s.baziDmLabel}>Day Master</Text>
          <Text style={s.baziDmValue}>
            {[bazi.dayMaster.yinYang, capWord(bazi.dayMaster.element)].filter(Boolean).join(" ")}
            {bazi.dayMaster.stem ? ` · ${bazi.dayMaster.stem}` : ""}
          </Text>
          {bazi.dayMasterStrength ? <Text style={s.baziMeaning}>Strength: {capWord(bazi.dayMasterStrength)}</Text> : null}
        </Card>
      )}
      {bazi.pillars.map((p, i) => (
        <Card key={i}>
          <View style={s.baziRow}>
            <Text style={s.baziStem}>{p.label}</Text>
            <Text style={s.baziBranch}>{p.stem}{p.branch}{p.animal ? ` · ${p.animal}` : ""}</Text>
            {p.element ? (
              <View style={[s.baziElemBadge, { backgroundColor: "rgba(255,255,255,0.05)" }]}>
                <Text style={s.baziElemText}>{capWord(p.element)}</Text>
              </View>
            ) : null}
          </View>
        </Card>
      ))}
      {bazi.elementBalance.length > 0 && (
        <>
          <Text style={s.sectionLabel}>Element Balance</Text>
          <Card><Text style={s.baziMeaning}>{bazi.elementBalance.map((e) => `${capWord(e.element)} ${e.count}`).join("  ·  ")}</Text></Card>
        </>
      )}
      {bazi.favorableElements.length > 0 && (
        <>
          <Text style={s.sectionLabel}>Supportive Element</Text>
          <Card><Text style={s.baziMeaning}>Lean gently into {bazi.favorableElements.map(capWord).join(", ")} energy.</Text></Card>
        </>
      )}
      {bazi.luckPillars.length > 0 && (
        <>
          <Text style={s.sectionLabel}>Luck Cycles</Text>
          <Card><Text style={s.baziMeaning}>{bazi.luckPillars.map((l) => `${l.stem}${l.branch}${l.startAge != null ? ` (from age ${l.startAge})` : ""}`).join("  ·  ")}</Text></Card>
        </>
      )}
      {bazi.partial ? (
        <Text style={s.baziHint}>
          {bazi.missingInputs.includes("birth_time") ? "Partial chart — add your birth time for the Hour Pillar." : "Partial chart from the data on file."}
        </Text>
      ) : null}
      <Text style={s.baziHint}>A reflective lens for self-insight, not fixed fate.</Text>
    </View>
  );
}

export default function BlueprintScreen() {
  return <BlueprintContent />;
}

const s = StyleSheet.create({
  gradient: { flex: 1 }, scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  title: { fontSize: 28, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  sub: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body, marginBottom: 16 },
  synthesisBtn: { marginBottom: 10 },
  synthesisInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(232,184,109,0.08)", borderRadius: SolunaRadius.md, paddingVertical: 14, borderWidth: 1, borderColor: "rgba(232,184,109,0.15)" },
  synthesisText: { fontSize: 14, fontWeight: "600" as const, color: SolunaColors.warmGold, fontFamily: Fonts.body },
  confidenceRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  confidenceNote: { flex: 1, fontSize: 11, color: SolunaColors.creamSubtle, fontFamily: Fonts.body, fontStyle: "italic" },
  lensWrap: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: SolunaRadius.md, padding: 4, marginBottom: 20 },
  lensTab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: SolunaRadius.sm, borderWidth: 1, borderColor: "transparent" },
  lensTabActive: { backgroundColor: "rgba(232,184,109,0.1)", borderColor: "rgba(232,184,109,0.2)" },
  lensText: { fontSize: 12, fontWeight: "600" as const, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  lensTextActive: { color: SolunaColors.warmGold },
  chartWrap: { alignItems: "center", marginBottom: 20 },
  sectionLabel: { fontSize: 12, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 2, fontWeight: "700" as const, fontFamily: Fonts.body, marginBottom: 10, marginTop: 12 },
  bigThreeRow: { flexDirection: "row", alignItems: "center", backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, gap: 14, marginBottom: 8 },
  bigThreeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  bigThreeInfo: { flex: 1 },
  bigThreeLabel: { fontSize: 11, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700" as const },
  bigThreeVal: { fontSize: 15, fontWeight: "600" as const, color: SolunaColors.cream, fontFamily: Fonts.body },
  placementRow: { flexDirection: "row", alignItems: "center", backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 12, borderWidth: 1, borderColor: SolunaColors.cardBorder, gap: 12, marginBottom: 6 },
  glyphText: { fontSize: 20, color: SolunaColors.warmGold, width: 36, textAlign: "center" },
  placementName: { fontSize: 14, fontWeight: "600" as const, color: SolunaColors.cream, fontFamily: Fonts.body },
  placementDetail: { fontSize: 11, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  timingRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  timingBadge: { fontSize: 28, fontWeight: "700" as const, color: SolunaColors.warmGold, fontFamily: Fonts.heading, width: 48, textAlign: "center" },
  timingLabel: { fontSize: 13, fontWeight: "600" as const, color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 3 },
  timingMeaning: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body, lineHeight: 17 },
  chineseHeader: { flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 12 },
  chineseEmoji: { fontSize: 40 },
  chineseTitle: { fontSize: 20, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 2 },
  chineseElement: { fontSize: 14, color: SolunaColors.creamMuted },
  chineseDesc: { fontSize: 14, color: SolunaColors.creamMuted, lineHeight: 22, fontFamily: Fonts.body },
  strengthRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 8, paddingHorizontal: 4 },
  strengthText: { flex: 1, fontSize: 13, color: SolunaColors.cream, lineHeight: 19, fontFamily: Fonts.body },
  growthText: { fontSize: 14, color: SolunaColors.softPeach, lineHeight: 22, fontFamily: Fonts.body, fontStyle: "italic" },
  baziRow: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 8 },
  baziStem: { fontSize: 16, fontWeight: "700" as const, color: SolunaColors.warmGold, fontFamily: Fonts.body },
  baziBranch: { fontSize: 14, color: SolunaColors.cream, fontFamily: Fonts.body },
  baziElemBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  baziElemText: { fontSize: 14 },
  baziMeaning: { fontSize: 12, color: SolunaColors.creamMuted, lineHeight: 18, fontFamily: Fonts.body },
  baziHint: { fontSize: 11, color: SolunaColors.creamSubtle, fontStyle: "italic", fontFamily: Fonts.body, marginBottom: 8, lineHeight: 16 },
  baziDmLabel: { fontSize: 10, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", marginBottom: 4 },
  baziDmValue: { fontSize: 18, fontFamily: Fonts.heading, color: SolunaColors.warmGold, marginBottom: 2 },
  baziUnavailTitle: { fontSize: 14, fontWeight: "600", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 4 },
  bgWrap: { alignItems: "center", marginBottom: 10 },
  hdType: { fontSize: 22, fontFamily: Fonts.heading, color: SolunaColors.warmGold, marginBottom: 6 },
  hdDesc: { fontSize: 14, color: SolunaColors.creamMuted, lineHeight: 22, fontFamily: Fonts.body },
  hdLabel: { fontSize: 16, fontWeight: "700" as const, color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 6 },
  sigRow: { flexDirection: "row", gap: 10 },
  sigLabel: { fontSize: 11, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 1, fontWeight: "700" as const, marginBottom: 4 },
  sigVal: { fontSize: 16, fontWeight: "700" as const, fontFamily: Fonts.body },
});
