import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useMemo, useCallback } from "react";
import Svg, { Circle, Line, Text as SvgText, G } from "react-native-svg";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { ZODIAC, ZODIAC_SYMBOLS, PLANET_SYMBOLS, CHINESE_ANIMAL_EMOJI, CHINESE_ELEMENT_EMOJI, Fonts, NUMBER_MEANINGS, NAKSHATRA_MEANINGS, DASHA_PLANET_MEANINGS } from "@/constants/mockData";
import type { ZodiacSign, BaziView, VedicView, UserData } from "@/constants/mockData";
import ConfidencePill from "@/components/ConfidencePill";
import type { ConfidenceLevel } from "@/components/ConfidencePill";
import PremiumGateCard from "@/components/PremiumGateCard";
import { Sun, Moon, ChevronRight, Sparkles, ArrowRight, MessageCircle, Bookmark, Compass } from "lucide-react-native";
import InsightActionBar from "@/components/InsightActionBar";

type SystemLens = "astrology" | "numerology" | "chinese" | "humanDesign" | "vedic";

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

// A Card you can tap to open its detail screen, with a subtle "Tap to explore"
// affordance so every system reads like the tappable astrology cards.
function TapCard({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <View style={cardS.card}>
        {children}
        <View style={tapS.row}>
          <Text style={tapS.hint}>Tap to explore</Text>
          <ChevronRight size={14} color={SolunaColors.creamSubtle} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
const tapS = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 2, marginTop: 8 },
  hint: { fontSize: 11, color: SolunaColors.creamSubtle, fontFamily: Fonts.body },
});

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

        {/* Which systems fit you (learned from your resonance) */}
        <TouchableOpacity style={s.synthesisBtn} onPress={() => router.push("/your-systems")} activeOpacity={0.8}>
          <View style={s.synthesisInner}>
            <Compass size={16} color={SolunaColors.warmGold} />
            <Text style={s.synthesisText}>Which systems fit you</Text>
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
          {(["astrology", "numerology", "chinese", "humanDesign", "vedic"] as const).map((key) => {
            const labels: Record<SystemLens, string> = { astrology: "Astro", numerology: "Nums", chinese: "Chinese", humanDesign: "HD", vedic: "Vedic" };
            const isActive = lens === key;
            return (
              <TouchableOpacity key={key} style={[s.lensTab, isActive && s.lensTabActive]} onPress={() => setLens(key)}>
                <Text style={[s.lensText, isActive && s.lensTextActive]}>{labels[key]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Consistent per-lens "what this reveals about you" lead-in (real data only). */}
        <LensAbout text={lensAboutText(lens, user)} />

        {/* ── Astrology ── */}
        {lens === "astrology" && user.chart && (
          <View>
            <View style={s.chartWrap}><NatalChartWheel size={300} /></View>
            <ConfidencePill level="verified" />

            <Text style={s.sectionLabel}>Big Three</Text>
            {([
              { planet: "Sun", sign: user.chart.sun?.sign ?? null, house: user.chart.sun?.house ?? null, icon: Sun, color: SolunaColors.warmGold, conf: "exact" as ConfidenceLevel },
              { planet: "Moon", sign: user.chart.moon?.sign ?? null, house: user.chart.moon?.house ?? null, icon: Moon, color: SolunaColors.gentleLavender, conf: "exact" as ConfidenceLevel },
              { planet: "Rising", sign: user.chart.rising ?? null, house: null as number | null, icon: Sun, color: SolunaColors.softPeach, conf: timeConfidence },
            ] as { planet: string; sign: ZodiacSign | null; house: number | null; icon: typeof Sun; color: string; conf: ConfidenceLevel }[]).map((item) => {
              const symbol = item.sign ? (ZODIAC_SYMBOLS[item.sign] ?? "") : "";
              return (
                <TouchableOpacity
                  key={item.planet}
                  style={s.bigThreeRow}
                  disabled={!item.sign}
                  onPress={() => router.push({ pathname: "/insight-detail", params: { type: "placement", planet: item.planet } })}
                >
                  <View style={[s.bigThreeIcon, { backgroundColor: `${item.color}15` }]}><item.icon size={18} color={item.color} /></View>
                  <View style={s.bigThreeInfo}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={s.bigThreeLabel}>{item.planet}</Text>
                      <ConfidencePill level={item.conf} />
                    </View>
                    {/* Never fabricate a sign: show an honest prompt when it isn't known yet. */}
                    <Text style={s.bigThreeVal}>
                      {item.sign
                        ? `${symbol} ${item.sign}${item.house != null ? ` · ${item.house}${ordinal(item.house)} House` : ""}`
                        : "Add birth time to reveal"}
                    </Text>
                  </View>
                  {item.sign ? <ChevronRight size={16} color={SolunaColors.creamSubtle} /> : null}
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
            {/* Gentle growth edge — resolved in buildChineseData from the user's REAL
                animal (production-safe reference content, never fabricated). Rendered
                only when present so we never show an empty card. */}
            {user.chinese.growthEdge ? (
              <>
                <Text style={s.sectionLabel}>Gentle Growth Edge</Text>
                <Card><Text style={s.growthText}>{user.chinese.growthEdge}</Text></Card>
              </>
            ) : null}
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
            <TapCard onPress={() => router.push({ pathname: "/insight-detail", params: { type: "hd", facet: "type" } })}>
              <Text style={s.hdType}>{safeGet(user.humanDesign.type, "")}</Text>
              <Text style={s.hdDesc}>{safeGet(user.humanDesign.typeDescription, "")}</Text>
            </TapCard>
            <Text style={s.sectionLabel}>Strategy</Text>
            <TapCard onPress={() => router.push({ pathname: "/insight-detail", params: { type: "hd", facet: "strategy" } })}><Text style={s.hdLabel}>{safeGet(user.humanDesign.strategy, "")}</Text><Text style={s.hdDesc}>{safeGet(user.humanDesign.strategyDescription, "")}</Text></TapCard>
            <Text style={s.sectionLabel}>Authority</Text>
            <TapCard onPress={() => router.push({ pathname: "/insight-detail", params: { type: "hd", facet: "authority" } })}><Text style={s.hdLabel}>{safeGet(user.humanDesign.authority, "")}</Text><Text style={s.hdDesc}>{safeGet(user.humanDesign.authorityDescription, "")}</Text></TapCard>
            <Text style={s.sectionLabel}>Profile</Text>
            <TapCard onPress={() => router.push({ pathname: "/insight-detail", params: { type: "hd", facet: "profile" } })}><Text style={s.hdLabel}>{safeGet(user.humanDesign.profile, "")}</Text><Text style={s.hdDesc}>{safeGet(user.humanDesign.profileDescription, "")}</Text></TapCard>
            <Text style={s.sectionLabel}>Signature / Not-Self</Text>
            <View style={s.sigRow}>
              <Card><Text style={s.sigLabel}>Signature</Text><Text style={[s.sigVal, { color: SolunaColors.warmGold }]}>{safeGet(user.humanDesign.signature, "")}</Text></Card>
              <Card><Text style={s.sigLabel}>Not-Self</Text><Text style={[s.sigVal, { color: SolunaColors.softPeach }]}>{safeGet(user.humanDesign.notSelf, "")}</Text></Card>
            </View>
            <Text style={s.sectionLabel}>Strengths</Text>
            {(user.humanDesign.strengths ?? []).map((sx, i) => (
              <View key={i} style={s.strengthRow}><Sparkles size={12} color={SolunaColors.warmGold} /><Text style={s.strengthText}>{sx}</Text></View>
            ))}
            {(user.humanDesign.centers ?? []).length > 0 && (
              <>
                <Text style={s.sectionLabel}>Energy Centers</Text>
                <Text style={s.hdCenterHint}>Tap a center to see what defined vs open means for you.</Text>
                <View style={s.hdCenterGrid}>
                  {(user.humanDesign.centers ?? []).map((c) => (
                    <TouchableOpacity
                      key={c.name}
                      style={[s.hdCenterChip, c.defined ? s.hdCenterDefined : s.hdCenterOpen]}
                      activeOpacity={0.7}
                      onPress={() => router.push({ pathname: "/insight-detail", params: { type: "hd", facet: "center", value: c.name } })}
                    >
                      <Text style={[s.hdCenterName, c.defined && s.hdCenterNameDefined]}>{c.name}</Text>
                      <Text style={s.hdCenterState}>{c.defined ? "Defined" : "Open"}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Vedic / sidereal (a distinct lens from the Western chart) ── */}
        {lens === "vedic" && (
          <View>
            <Text style={s.sectionLabel}>Vedic · Sidereal Chart</Text>
            <VedicChart vedic={user.vedic} />
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

// Deterministic "what your pillars say together" summary, composed only from the
// user's real BaZi values (never fabricated).
function baziSummary(bazi: BaziView): string {
  const parts: string[] = [];
  const dm = bazi.dayMaster;
  if (dm) {
    parts.push(`Your chart centres on a ${[dm.yinYang, capWord(dm.element)].filter(Boolean).join(" ")} Day Master — the "you" the four pillars revolve around.`);
  }
  if (bazi.dayMasterStrength) {
    parts.push(`It reads as ${capWord(bazi.dayMasterStrength)}, which shapes how much you naturally give out versus take in.`);
  }
  if (bazi.favorableElements?.length) {
    parts.push(`Leaning gently into ${bazi.favorableElements.map(capWord).join(" and ")} energy tends to bring you into balance.`);
  }
  if (bazi.elementBalance?.length) {
    const top = [...bazi.elementBalance].sort((a, b) => b.count - a.count)[0];
    if (top) parts.push(`${capWord(top.element)} is the most present element across your pillars.`);
  }
  parts.push("Read together, the Year, Month, Day, and Hour pillars trace your roots, your drive, your core self, and your inner world — a reflective map, not a fixed fate.");
  return parts.join(" ");
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
        <TapCard onPress={() => router.push({ pathname: "/insight-detail", params: { type: "bazi-daymaster" } })}>
          <Text style={s.baziDmLabel}>Day Master</Text>
          <Text style={s.baziDmValue}>
            {[bazi.dayMaster.yinYang, capWord(bazi.dayMaster.element)].filter(Boolean).join(" ")}
            {bazi.dayMaster.stem ? ` · ${bazi.dayMaster.stem}` : ""}
          </Text>
          {bazi.dayMasterStrength ? <Text style={s.baziMeaning}>Strength: {capWord(bazi.dayMasterStrength)}</Text> : null}
          {bazi.structure ? <Text style={s.baziMeaning}>Structure: {bazi.structure}</Text> : null}
        </TapCard>
      )}
      {bazi.pillars.map((p, i) => (
        <TapCard key={i} onPress={() => router.push({ pathname: "/insight-detail", params: { type: "bazi-pillar", value: p.label } })}>
          <View style={s.baziRow}>
            <Text style={s.baziStem}>{p.label}</Text>
            <Text style={s.baziBranch}>{p.stem}{p.branch}{p.animal ? ` · ${p.animal}` : ""}</Text>
            {p.element ? (
              <View style={[s.baziElemBadge, { backgroundColor: "rgba(255,255,255,0.05)" }]}>
                <Text style={s.baziElemText}>{capWord(p.element)}</Text>
              </View>
            ) : null}
          </View>
          {(p.lifeStage || p.nayin) ? (
            <Text style={s.baziMeaning}>
              {[p.lifeStage ? `Stage: ${p.lifeStage}` : "", p.nayin ? `Na Yin: ${p.nayin}` : ""].filter(Boolean).join("  ·  ")}
            </Text>
          ) : null}
        </TapCard>
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
      {(bazi.stars?.length ?? 0) > 0 && (
        <>
          <Text style={s.sectionLabel}>Symbolic Stars</Text>
          {bazi.stars!.map((star, i) => (
            <Card key={i}>
              <Text style={s.baziStem}>{star.name}{star.pillar ? ` · ${capWord(star.pillar)}` : ""}</Text>
              {star.description ? <Text style={s.baziMeaning}>{star.description}</Text> : null}
            </Card>
          ))}
        </>
      )}
      {(bazi.voidBranches?.length ?? 0) > 0 && (
        <>
          <Text style={s.sectionLabel}>Void Branches</Text>
          <Card><Text style={s.baziMeaning}>{bazi.voidBranches!.join("  ·  ")} — life areas that ask for extra grounding (xun kong).</Text></Card>
        </>
      )}
      <Text style={s.sectionLabel}>What your pillars say together</Text>
      <Card><Text style={s.baziMeaning}>{baziSummary(bazi)}</Text></Card>
      {bazi.partial ? (
        <Text style={s.baziHint}>
          {bazi.missingInputs.includes("birth_time") ? "Partial chart — add your birth time for the Hour Pillar." : "Partial chart from the data on file."}
        </Text>
      ) : null}
      <Text style={s.baziHint}>A reflective lens for self-insight, not fixed fate.</Text>
    </View>
  );
}

// Format an ISO date (YYYY-MM-DD) as "Mon YYYY" for Dasha period boundaries.
const DASHA_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDashaDate(iso: string): string {
  const [y, m] = iso.split("-");
  const mi = Number(m) - 1;
  return mi >= 0 && mi < 12 ? `${DASHA_MONTHS[mi]} ${y}` : y;
}

// Strengths + growth edge for the Vedic lens, drawn from the Moon's nakshatra
// (the heart of a Vedic reading). Real values only; null when unavailable.
function vedicStrengths(vedic: VedicView): { nakshatra: string; strengths: string[]; growthEdge: string } | null {
  const nak = vedic.moonNakshatra;
  const info = nak ? NAKSHATRA_MEANINGS[nak] : undefined;
  if (!nak || !info) return null;
  return { nakshatra: nak, strengths: info.strengths, growthEdge: info.growthEdge };
}

// Vedic / sidereal chart — its own lens, clearly distinct from the Western chart.
// Renders honest available / partial / unavailable states; never fabricated.
function VedicChart({ vedic }: { vedic: VedicView }) {
  if (!vedic?.available) {
    const why = vedic?.missingInputs?.includes("birth_location")
      ? "Add your birth place to unlock your Vedic / sidereal chart."
      : vedic?.missingInputs?.includes("birth_time")
        ? "Add your birth time to unlock your full Vedic chart."
        : (vedic?.notes?.[0] ?? "Your Vedic chart isn't available yet.");
    return (
      <Card>
        <Text style={s.baziUnavailTitle}>Vedic chart not available yet</Text>
        <Text style={s.baziMeaning}>{why}</Text>
      </Card>
    );
  }
  return (
    <View>
      <Card><Text style={s.baziHint}>Sidereal{vedic.ayanamsha ? ` (${capWord(vedic.ayanamsha)})` : ""} — a separate tradition from your Western chart above. Its signs are intentionally shifted, and its heart is the nakshatras (lunar mansions).</Text></Card>
      {vedic.ascendant && (
        <TapCard onPress={() => router.push({ pathname: "/insight-detail", params: { type: "vedic", kind: "ascendant" } })}>
          <Text style={s.baziDmLabel}>Ascendant · Lagna</Text>
          <Text style={s.baziDmValue}>{vedic.ascendant.sign}{vedic.ascendant.degree ? ` · ${vedic.ascendant.degree}°` : ""}</Text>
          {vedic.ascendant.nakshatra ? <Text style={s.baziMeaning}>Nakshatra: {vedic.ascendant.nakshatra}</Text> : null}
        </TapCard>
      )}
      {vedic.moonNakshatra ? (
        <>
          <Text style={s.sectionLabel}>Moon Nakshatra</Text>
          <TapCard onPress={() => router.push({ pathname: "/insight-detail", params: { type: "vedic", kind: "moon" } })}>
            <Text style={s.baziMeaning}>{vedic.moonNakshatra} — the lunar mansion of your Moon, central to a Vedic reading.</Text>
          </TapCard>
        </>
      ) : null}
      {vedic.dasha?.maha ? (() => {
        const d = vedic.dasha!;
        const maha = d.maha!;
        const mInfo = DASHA_PLANET_MEANINGS[maha.planet];
        return (
          <>
            <Text style={s.sectionLabel}>Current Period · {d.system} Dasha</Text>
            <TapCard onPress={() => router.push({ pathname: "/insight-detail", params: { type: "vedic", kind: "dasha" } })}>
              <View style={s.baziRow}>
                <Text style={s.baziStem}>{maha.planet} Mahādashā</Text>
                <Text style={s.baziBranch}>until {fmtDashaDate(maha.end)}</Text>
              </View>
              {mInfo ? <Text style={s.baziMeaning}>{mInfo.theme} — {mInfo.description}</Text> : null}
              {d.antar ? (
                <Text style={[s.baziMeaning, { marginTop: 6 }]}>
                  Within it: {d.antar.planet} Antardashā (sub-period) until {fmtDashaDate(d.antar.end)}{DASHA_PLANET_MEANINGS[d.antar.planet] ? ` — ${DASHA_PLANET_MEANINGS[d.antar.planet].theme.toLowerCase()}` : ""}.
                </Text>
              ) : null}
            </TapCard>
          </>
        );
      })() : null}
      {vedicStrengths(vedic) ? (() => {
        const vs = vedicStrengths(vedic)!;
        return (
          <>
            <Text style={s.sectionLabel}>Your strengths & growth edge</Text>
            <Card>
              <Text style={s.baziMeaning}>Through your Moon's nakshatra, {vs.nakshatra}:</Text>
              {vs.strengths.map((sx, i) => (
                <View key={i} style={s.strengthRow}><Sparkles size={12} color={SolunaColors.warmGold} /><Text style={s.strengthText}>{sx}</Text></View>
              ))}
              <Text style={[s.baziMeaning, { marginTop: 8 }]}>Growth edge: {vs.growthEdge}</Text>
            </Card>
          </>
        );
      })() : null}
      {vedic.planets.length > 0 && (
        <>
          <Text style={s.sectionLabel}>Planets · Sidereal</Text>
          {vedic.planets.map((p, i) => (
            <TapCard key={i} onPress={() => router.push({ pathname: "/insight-detail", params: { type: "vedic", kind: "planet", value: p.planet } })}>
              <View style={s.baziRow}>
                <Text style={s.baziStem}>{p.planet}</Text>
                <Text style={s.baziBranch}>{p.sign}{p.house != null ? ` · House ${p.house}` : ""}{p.retrograde ? " ℞" : ""}</Text>
              </View>
              {p.nakshatra ? <Text style={s.baziMeaning}>{p.nakshatra}{p.nakshatraLord ? ` · ruled by ${p.nakshatraLord}` : ""}</Text> : null}
            </TapCard>
          ))}
        </>
      )}
      {vedic.sadeSati ? (
        <>
          <Text style={s.sectionLabel}>Sade Sati · Saturn cycle</Text>
          <Card><Text style={s.baziMeaning}>{vedic.sadeSati.note}</Text></Card>
        </>
      ) : null}
      {vedic.partial ? (
        <Text style={s.baziHint}>{vedic.missingInputs.includes("birth_time") ? "Partial — add your birth time for the Ascendant and houses." : "Partial chart from the data on file."}</Text>
      ) : null}
      <Text style={s.baziHint}>A reflective lens for self-insight, not fixed fate.</Text>
    </View>
  );
}

// A consistent, real-data "what this lens reveals about you" lead-in for each
// system. Composed ONLY from the user's actual computed values — never fabricated;
// returns null when the lens has nothing real to say yet.
function lensAboutText(lens: SystemLens, user: UserData): string | null {
  if (lens === "astrology") {
    const sun = user.chart?.sun?.sign; const moon = user.chart?.moon?.sign; const rising = user.chart?.rising;
    const parts = [sun ? `${sun} Sun` : "", rising ? `${rising} Rising` : "", moon ? `${moon} Moon` : ""].filter(Boolean);
    if (!parts.length) return null;
    return `Western astrology reads you first through your ${parts.join(", ")} — how you shine, how you meet the world, and what you need to feel safe. The placements below add the finer detail.`;
  }
  if (lens === "numerology") {
    const lp = user.numerology?.lifePath;
    if (lp == null) return null;
    const t = NUMBER_MEANINGS[lp]?.title;
    return `Numerology distills your name and birth date into core numbers. Your Life Path ${lp}${t ? ` — ${t}` : ""} is the throughline; Expression and Soul Urge add how you create and what quietly drives you.`;
  }
  if (lens === "chinese") {
    const label = user.chinese?.elementAnimalLabel || [user.chinese?.element, user.chinese?.animal].filter(Boolean).join(" ");
    if (!label) return null;
    return `Chinese astrology frames your temperament by birth year. You're the ${label} — an Eastern lens on your natural style and the company you keep best.`;
  }
  if (lens === "humanDesign") {
    const t = user.humanDesign?.type; const auth = user.humanDesign?.authority;
    if (!t) return null;
    return `Human Design is less about traits and more about HOW you're built to decide and engage. You're a ${t}${auth ? ` with ${auth} authority` : ""} — a strategy for moving through life with less resistance.`;
  }
  if (lens === "vedic") {
    if (!user.vedic?.available) return null;
    const asc = user.vedic.ascendant?.sign; const moonNak = user.vedic.moonNakshatra;
    return `Vedic (sidereal) astrology is a separate Eastern tradition — its signs differ from your Western chart on purpose. Yours${asc ? ` rises in ${asc}` : ""}${moonNak ? `, with the Moon in ${moonNak}` : ""}, read through the nakshatras (lunar mansions).`;
  }
  return null;
}

function LensAbout({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <View style={s.aboutCard}>
      <Text style={s.aboutLabel}>What this lens reveals about you</Text>
      <Text style={s.aboutText}>{text}</Text>
      <Text style={s.aboutFoot}>A reflective lens for self-insight — not fixed fate.</Text>
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
  aboutCard: { backgroundColor: "rgba(232,184,109,0.06)", borderRadius: SolunaRadius.lg, padding: 16, borderWidth: 1, borderColor: "rgba(232,184,109,0.14)", marginBottom: 16 },
  aboutLabel: { fontSize: 10, color: SolunaColors.warmGold, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 6 },
  aboutText: { fontSize: 14, color: SolunaColors.cream, lineHeight: 21, fontFamily: Fonts.body },
  aboutFoot: { fontSize: 11, color: SolunaColors.creamSubtle, fontStyle: "italic", fontFamily: Fonts.body, marginTop: 8 },
  bgWrap: { alignItems: "center", marginBottom: 10 },
  hdType: { fontSize: 22, fontFamily: Fonts.heading, color: SolunaColors.warmGold, marginBottom: 6 },
  hdDesc: { fontSize: 14, color: SolunaColors.creamMuted, lineHeight: 22, fontFamily: Fonts.body },
  hdLabel: { fontSize: 16, fontWeight: "700" as const, color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 6 },
  hdCenterHint: { fontSize: 12, color: SolunaColors.creamSubtle, fontFamily: Fonts.body, marginBottom: 8 },
  hdCenterGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  hdCenterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, minWidth: "30%" as const },
  hdCenterDefined: { backgroundColor: "rgba(232,184,109,0.1)", borderColor: "rgba(232,184,109,0.25)" },
  hdCenterOpen: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" },
  hdCenterName: { fontSize: 12, fontWeight: "700" as const, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  hdCenterNameDefined: { color: SolunaColors.warmGold },
  hdCenterState: { fontSize: 10, color: SolunaColors.creamSubtle, fontFamily: Fonts.body, marginTop: 2 },
  sigRow: { flexDirection: "row", gap: 10 },
  sigLabel: { fontSize: 11, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 1, fontWeight: "700" as const, marginBottom: 4 },
  sigVal: { fontSize: 16, fontWeight: "700" as const, fontFamily: Fonts.body },
});
