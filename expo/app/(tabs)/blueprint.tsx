import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useMemo, Component } from "react";
import Svg, { Circle, Line, Text as SvgText, G } from "react-native-svg";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import {
  ZODIAC,
  ZODIAC_SYMBOLS,
  PLANET_SYMBOLS,
  CHINESE_ANIMAL_EMOJI,
  CHINESE_ELEMENT_EMOJI,
  Fonts,
} from "@/constants/mockData";
import type { ZodiacSign } from "@/constants/mockData";
import {
  Sun,
  Moon,
  Star,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from "lucide-react-native";

type SystemLens = "astrology" | "numerology" | "chinese" | "humanDesign";

// ─── Error Boundary (shows actual error) ──────────────────────────
class CrashBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error?.message ?? String(error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={errS.wrap}>
          <Text style={errS.title}>Blueprint Error</Text>
          <Text style={errS.msg}>{this.state.errorMsg}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
const errS = StyleSheet.create({
  wrap: {
    flex: 1, backgroundColor: SolunaColors.deepIndigo,
    alignItems: "center", justifyContent: "center", padding: 32,
  },
  title: { fontSize: 20, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 12 },
  msg: { fontSize: 14, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 22 },
});

// ─── Safe ordinal ─────────────────────────────────────────────────
function ordinal(n: number): string {
  if (!Number.isFinite(n)) return "th";
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  const d = n % 10;
  if (d === 1) return "st";
  if (d === 2) return "nd";
  if (d === 3) return "rd";
  return "th";
}

// ─── Natal Chart Wheel ────────────────────────────────────────────
function NatalChartWheel() {
  const { width: windowW } = useWindowDimensions();
  const chartSize = Math.max(windowW - 64, 100);
  const chartRadius = chartSize / 2;
  const cx = Math.round(chartSize / 2);
  const cy = Math.round(chartSize / 2);

  const ringOuter = Math.max(chartRadius - 4, 2);
  const ringInner = Math.max(ringOuter - 40, 2);
  const houseRing = Math.max(ringInner - 2, 2);
  const houseInner = Math.max(houseRing - 32, 2);
  const innerRing = Math.max(houseInner - 6, 2);

  const zodiacSegments = useMemo(
    () =>
      ZODIAC.map((sign, i) => {
        const startAngleDeg = i * 30 - 105;
        const midRad = (startAngleDeg + 15) * (Math.PI / 180);
        const mx = cx + (ringOuter - 20) * Math.cos(midRad);
        const my = cy + (ringOuter - 20) * Math.sin(midRad);
        const isActiveSign =
          sign === "Cancer" || sign === "Pisces" || sign === "Libra";
        const startRad = startAngleDeg * (Math.PI / 180);
        const endRad = (startAngleDeg + 30) * (Math.PI / 180);
        return { sign, startRad, endRad, mx, my, isActiveSign };
      }),
    [cx, cy, ringOuter],
  );

  const houseCusps = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const rad = (i * 30 - 105) * (Math.PI / 180);
        return { house: i + 1, rad };
      }),
    [],
  );

  const planetPositions = [
    { label: "\u2609", angle: 0, dist: Math.max(innerRing - 6, 2), big: true },
    { label: "\u263D", angle: 60, dist: Math.max(innerRing - 18, 2), big: true },
    { label: "\u263F", angle: 85, dist: Math.max(innerRing - 6, 2), big: true },
    { label: "\u2640", angle: 135, dist: Math.max(innerRing - 10, 2), big: false },
    { label: "\u2642", angle: 170, dist: Math.max(innerRing - 18, 2), big: false },
    { label: "\u2643", angle: 220, dist: Math.max(innerRing - 6, 2), big: false },
    { label: "\u2644", angle: 260, dist: Math.max(innerRing - 12, 2), big: false },
    { label: "\u2645", angle: 290, dist: Math.max(innerRing - 18, 2), big: false },
    { label: "\u2646", angle: 320, dist: Math.max(innerRing - 6, 2), big: false },
    { label: "\u2647", angle: 350, dist: Math.max(innerRing - 14, 2), big: false },
  ];

  if (chartSize <= 0 || chartRadius <= 0) return null;

  return (
    <Svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
      {/* Outer glow ring */}
      <Circle cx={cx} cy={cy} r={ringOuter + 8} fill="none" stroke="rgba(232,184,109,0.08)" strokeWidth={8} />
      {/* Zodiac segments */}
      {zodiacSegments.map((seg) => (
        <G key={seg.sign}>
          <Line
            x1={cx + ringInner * Math.cos(seg.startRad)}
            y1={cy + ringInner * Math.sin(seg.startRad)}
            x2={cx + ringOuter * Math.cos(seg.startRad)}
            y2={cy + ringOuter * Math.sin(seg.startRad)}
            stroke={seg.isActiveSign ? "rgba(232,184,109,0.3)" : "rgba(255,255,255,0.08)"}
            strokeWidth={1}
          />
          <SvgText
            x={seg.mx}
            y={seg.my}
            fill={seg.isActiveSign ? SolunaColors.warmGold : SolunaColors.creamMuted}
            fontSize={11}
            fontWeight={seg.isActiveSign ? "bold" : "normal"}
            textAnchor="middle"
          >
            {ZODIAC_SYMBOLS[seg.sign as ZodiacSign]}
          </SvgText>
        </G>
      ))}
      {/* Concentric rings */}
      <Circle cx={cx} cy={cy} r={ringOuter} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
      <Circle cx={cx} cy={cy} r={ringInner} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={houseRing} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={houseInner} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      {/* House cusps */}
      {houseCusps.map((h) => (
        <G key={`h${h.house}`}>
          <Line
            x1={cx + houseInner * Math.cos(h.rad)}
            y1={cy + houseInner * Math.sin(h.rad)}
            x2={cx + houseRing * Math.cos(h.rad)}
            y2={cy + houseRing * Math.sin(h.rad)}
            stroke="rgba(255,255,255,0.1)" strokeWidth={0.5}
          />
          <SvgText
            x={cx + (houseInner + 14) * Math.cos(h.rad)}
            y={cy + (houseInner + 14) * Math.sin(h.rad)}
            fill={SolunaColors.creamSubtle} fontSize={7} textAnchor="middle"
          >
            {h.house}
          </SvgText>
        </G>
      ))}
      {/* Inner ring + center sun */}
      <Circle cx={cx} cy={cy} r={innerRing} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={22} fill="rgba(232,184,109,0.08)" stroke="rgba(232,184,109,0.2)" strokeWidth={1} />
      <SvgText x={cx} y={cy} fill={SolunaColors.warmGold} fontSize={10} textAnchor="middle" fontWeight="bold">
        {"\u2609"}
      </SvgText>
      {/* Planet glyphs */}
      {planetPositions.map((p, i) => {
        const rad = (p.angle - 90) * (Math.PI / 180);
        const x = cx + p.dist * Math.cos(rad);
        const y = cy + p.dist * Math.sin(rad);
        return (
          <G key={i}>
            {p.big && (
              <Circle cx={x} cy={y} r={14} fill="rgba(232,184,109,0.08)" stroke="rgba(232,184,109,0.25)" strokeWidth={1} />
            )}
            <SvgText
              x={x} y={y}
              fill={p.big ? SolunaColors.warmGold : SolunaColors.creamMuted}
              fontSize={p.big ? 16 : 13}
              textAnchor="middle"
              fontWeight={p.big ? "bold" : "normal"}
            >
              {p.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── Bodygraph ────────────────────────────────────────────────────
const BG_W = 280;
const BG_H = 280;

function BodyGraph() {
  const centerPositions = [
    { name: "Head", x: BG_W / 2, y: 30, defined: false },
    { name: "Ajna", x: BG_W / 2, y: 75, defined: false },
    { name: "Throat", x: BG_W / 2, y: 125, defined: true },
    { name: "G", x: BG_W / 2, y: 180, defined: true },
    { name: "Heart", x: BG_W / 2 - 50, y: 145, defined: false },
    { name: "Sacral", x: BG_W / 2, y: 210, defined: true },
    { name: "Solar Plex", x: BG_W / 2 + 50, y: 165, defined: true },
    { name: "Spleen", x: BG_W / 2 - 50, y: 200, defined: false },
    { name: "Root", x: BG_W / 2, y: 250, defined: true },
  ];

  return (
    <Svg width={BG_W} height={BG_H} viewBox={`0 0 ${BG_W} ${BG_H}`}>
      {centerPositions.map((c) => (
        <G key={c.name}>
          <Circle
            cx={c.x} cy={c.y} r={16}
            fill={c.defined ? "rgba(232,184,109,0.12)" : "rgba(255,255,255,0.03)"}
            stroke={c.defined ? "rgba(232,184,109,0.3)" : "rgba(255,255,255,0.08)"}
            strokeWidth={1}
          />
          <SvgText
            x={c.x} y={c.y}
            fill={c.defined ? SolunaColors.warmGold : SolunaColors.creamSubtle}
            fontSize={7} textAnchor="middle"
          >
            {c.name}
          </SvgText>
        </G>
      ))}
      {/* Channels */}
      <Line x1={BG_W / 2} y1={46} x2={BG_W / 2} y2={109} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Line x1={BG_W / 2} y1={141} x2={BG_W / 2} y2={164} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Line x1={BG_W / 2} y1={196} x2={BG_W / 2} y2={194} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Line x1={BG_W / 2 - 34} y1={155} x2={BG_W / 2 - 16} y2={175} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      <Line x1={BG_W / 2} y1={210} x2={BG_W / 2} y2={234} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Line x1={BG_W / 2 + 34} y1={175} x2={BG_W / 2 + 16} y2={195} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
    </Svg>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return <View style={cardS.card}>{children}</View>;
}
const cardS = StyleSheet.create({
  card: {
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    marginBottom: 10,
  },
});

// ─── Lens icon helpers ────────────────────────────────────────────
function HashIcon({ color, size }: { color: string; size: number }) {
  return <Text style={{ color, fontSize: size, fontWeight: "600" }}>#</Text>;
}
function BirdIcon({ color, size }: { color: string; size: number }) {
  return <Text style={{ color, fontSize: size }}>{"\uD83D\uDC26"}</Text>;
}
function CpuIcon({ color, size }: { color: string; size: number }) {
  return <Text style={{ color, fontSize: size }}>{"\u2699"}</Text>;
}

// ─── Blueprint Content ────────────────────────────────────────────
function BlueprintContent() {
  const { user } = useAppState();
  const [lens, setLens] = useState<SystemLens>("astrology");

  if (!user) return null;

  const safeGet = <T,>(val: T | undefined | null, fallback: T): T =>
    val != null ? val : fallback;

  return (
    <LinearGradient
      colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
      style={s.gradient}
    >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Your Blueprint</Text>
        <Text style={s.sub}>
          {safeGet(user.preferredName, "You")}'s cosmic design across four lenses
        </Text>

        {/* "Where it all connects" button */}
        <TouchableOpacity
          style={s.synthesisBtn}
          onPress={() =>
            router.push({
              pathname: "/synthesis-detail",
              params: { id: "self" },
            })
          }
          activeOpacity={0.8}
        >
          <View style={s.synthesisInner}>
            <Sparkles size={16} color={SolunaColors.warmGold} />
            <Text style={s.synthesisText}>Where it all connects</Text>
            <ArrowRight size={14} color={SolunaColors.warmGold} />
          </View>
        </TouchableOpacity>

        {/* Lens switcher */}
        <View style={s.lensWrap}>
          {(
            [
              { key: "astrology" as const, label: "Astrology", icon: Star },
              { key: "numerology" as const, label: "Numerology", iconKind: "hash" as const },
              { key: "chinese" as const, label: "Chinese", iconKind: "bird" as const },
              { key: "humanDesign" as const, label: "Human Design", iconKind: "cpu" as const },
            ] as const
          ).map((item) => {
            const isActive = lens === item.key;
            const iconColor = isActive ? SolunaColors.warmGold : SolunaColors.creamMuted;

            let iconEl: React.ReactNode;
            if ("icon" in item && item.icon) {
              const IconComp = item.icon;
              iconEl = <IconComp size={14} color={iconColor} />;
            } else if ("iconKind" in item && item.iconKind === "hash") {
              iconEl = <HashIcon color={iconColor} size={14} />;
            } else if ("iconKind" in item && item.iconKind === "bird") {
              iconEl = <BirdIcon color={iconColor} size={14} />;
            } else {
              iconEl = <CpuIcon color={iconColor} size={14} />;
            }

            return (
              <TouchableOpacity
                key={item.key}
                style={[s.lensTab, isActive && s.lensTabActive]}
                onPress={() => setLens(item.key)}
              >
                {iconEl}
                <Text style={[s.lensText, isActive && s.lensTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Astrology lens ── */}
        {lens === "astrology" && user.chart && (
          <View>
            <View style={s.chartWrap}>
              <NatalChartWheel />
            </View>
            <Text style={s.sectionLabel}>Big Three</Text>
            {(
              [
                {
                  planet: "Sun",
                  sign: user.chart.sun?.sign ?? "Unknown",
                  house: user.chart.sun?.house,
                  icon: Sun,
                  color: SolunaColors.warmGold,
                },
                {
                  planet: "Moon",
                  sign: user.chart.moon?.sign ?? "Unknown",
                  house: user.chart.moon?.house,
                  icon: Moon,
                  color: SolunaColors.gentleLavender,
                },
                {
                  planet: "Rising",
                  sign: user.chart.rising ?? "Unknown",
                  icon: Star,
                  color: SolunaColors.softPeach,
                },
              ] as const
            ).map((item) => {
              const signKey = item.sign as ZodiacSign;
              const symbol = ZODIAC_SYMBOLS[signKey] ?? "";
              const hasHouse = "house" in item && item.house != null;
              return (
                <TouchableOpacity
                  key={item.planet}
                  style={s.bigThreeRow}
                  onPress={() =>
                    router.push({
                      pathname: "/insight-detail",
                      params: { type: "placement", planet: item.planet },
                    })
                  }
                >
                  <View style={[s.bigThreeIcon, { backgroundColor: `${item.color}15` }]}>
                    <item.icon size={18} color={item.color} />
                  </View>
                  <View style={s.bigThreeInfo}>
                    <Text style={s.bigThreeLabel}>{item.planet}</Text>
                    <Text style={s.bigThreeVal}>
                      {symbol} {item.sign}
                      {hasHouse ? ` \u00B7 ${item.house}${ordinal(item.house!)} House` : ""}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={SolunaColors.creamSubtle} />
                </TouchableOpacity>
              );
            })}
            <Text style={s.sectionLabel}>All Placements</Text>
            {(user.chart.placements ?? []).map((p) => {
              const signKey = p.sign as ZodiacSign;
              const symbol = ZODIAC_SYMBOLS[signKey] ?? "";
              const glyph = PLANET_SYMBOLS[p.planet] ?? "";
              return (
                <TouchableOpacity
                  key={p.planet}
                  style={s.placementRow}
                  onPress={() =>
                    router.push({
                      pathname: "/insight-detail",
                      params: { type: "placement", planet: p.planet },
                    })
                  }
                >
                  <Text style={s.glyphText}>{glyph}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.placementName}>{p.planet}</Text>
                    <Text style={s.placementDetail}>
                      {symbol} {p.sign} \u00B7 {p.degree}\u00B0 \u00B7 House {p.house}
                    </Text>
                  </View>
                  <ChevronRight size={14} color={SolunaColors.creamSubtle} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Numerology lens ── */}
        {lens === "numerology" && user.numerology && (
          <View>
            <Text style={s.sectionLabel}>Core Numbers</Text>
            {[
              { label: "Life Path", value: user.numerology.lifePath, desc: safeGet(user.numerology.lifePathMeaning, ""), color: SolunaColors.warmGold },
              { label: "Expression", value: user.numerology.expression, desc: safeGet(user.numerology.expressionMeaning, ""), color: SolunaColors.gentleLavender },
              { label: "Soul Urge", value: user.numerology.soulUrge, desc: safeGet(user.numerology.soulUrgeMeaning, ""), color: SolunaColors.softPeach },
            ].map((num) => (
              <TouchableOpacity
                key={num.label}
                style={s.numCard}
                onPress={() =>
                  router.push({
                    pathname: "/insight-detail",
                    params: { type: "number", number: String(num.value) },
                  })
                }
              >
                <View style={[s.numBadge, { backgroundColor: `${num.color}15`, borderColor: `${num.color}30` }]}>
                  <Text style={[s.numBadgeText, { color: num.color }]}>{num.value}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.numLabel}>{num.label}</Text>
                  <Text style={s.numDesc} numberOfLines={2}>{num.desc}</Text>
                </View>
                <ChevronRight size={16} color={SolunaColors.creamSubtle} />
              </TouchableOpacity>
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

        {/* ── Chinese lens ── */}
        {lens === "chinese" && user.chinese && (
          <View>
            <Card>
              <View style={s.chineseHeader}>
                <Text style={s.chineseEmoji}>
                  {safeGet(CHINESE_ANIMAL_EMOJI[user.chinese.animal], "")}
                </Text>
                <View>
                  <Text style={s.chineseTitle}>{safeGet(user.chinese.elementAnimalLabel, "")}</Text>
                  <Text style={s.chineseElement}>
                    {safeGet(CHINESE_ELEMENT_EMOJI[user.chinese.element], "")}{" "}
                    {safeGet(user.chinese.element, "")} element
                  </Text>
                </View>
              </View>
              <Text style={s.chineseDesc}>{safeGet(user.chinese.description, "")}</Text>
            </Card>
            <Text style={s.sectionLabel}>Strengths</Text>
            {(user.chinese.strengths ?? []).map((sx, i) => (
              <View key={i} style={s.strengthRow}>
                <Sparkles size={12} color={SolunaColors.warmGold} />
                <Text style={s.strengthText}>{sx}</Text>
              </View>
            ))}
            <Text style={s.sectionLabel}>Gentle Growth Edge</Text>
            <Card>
              <Text style={s.growthText}>{safeGet(user.chinese.growthEdge, "")}</Text>
            </Card>
            <Text style={s.sectionLabel}>BaZi Four Pillars (preview)</Text>
            {(user.chinese.bazi ?? []).map((pillar, i) => (
              <Card key={i}>
                <View style={s.baziRow}>
                  <Text style={s.baziStem}>{safeGet(pillar.heavenlyStem, "")}</Text>
                  <Text style={s.baziBranch}>
                    {safeGet(CHINESE_ANIMAL_EMOJI[pillar.earthlyBranch], "")}{" "}
                    {safeGet(pillar.earthlyBranch, "")}
                  </Text>
                  <View style={[s.baziElemBadge, { backgroundColor: "rgba(255,255,255,0.05)" }]}>
                    <Text style={s.baziElemText}>
                      {safeGet(CHINESE_ELEMENT_EMOJI[pillar.element], "")}
                    </Text>
                  </View>
                </View>
                <Text style={s.baziMeaning}>{safeGet(pillar.meaning, "")}</Text>
              </Card>
            ))}
          </View>
        )}

        {/* ── Human Design lens ── */}
        {lens === "humanDesign" && user.humanDesign && (
          <View>
            <View style={s.bgWrap}>
              <BodyGraph />
            </View>
            <Card>
              <Text style={s.hdType}>{safeGet(user.humanDesign.type, "")}</Text>
              <Text style={s.hdDesc}>{safeGet(user.humanDesign.typeDescription, "")}</Text>
            </Card>
            <Text style={s.sectionLabel}>Strategy</Text>
            <Card>
              <Text style={s.hdLabel}>{safeGet(user.humanDesign.strategy, "")}</Text>
              <Text style={s.hdDesc}>{safeGet(user.humanDesign.strategyDescription, "")}</Text>
            </Card>
            <Text style={s.sectionLabel}>Authority</Text>
            <Card>
              <Text style={s.hdLabel}>{safeGet(user.humanDesign.authority, "")}</Text>
              <Text style={s.hdDesc}>{safeGet(user.humanDesign.authorityDescription, "")}</Text>
            </Card>
            <Text style={s.sectionLabel}>Profile</Text>
            <Card>
              <Text style={s.hdLabel}>{safeGet(user.humanDesign.profile, "")}</Text>
              <Text style={s.hdDesc}>{safeGet(user.humanDesign.profileDescription, "")}</Text>
            </Card>
            <Text style={s.sectionLabel}>Signature / Not-Self</Text>
            <View style={s.sigRow}>
              <Card>
                <Text style={s.sigLabel}>Signature</Text>
                <Text style={[s.sigVal, { color: SolunaColors.warmGold }]}>{safeGet(user.humanDesign.signature, "")}</Text>
              </Card>
              <Card>
                <Text style={s.sigLabel}>Not-Self</Text>
                <Text style={[s.sigVal, { color: SolunaColors.softPeach }]}>{safeGet(user.humanDesign.notSelf, "")}</Text>
              </Card>
            </View>
            <Text style={s.sectionLabel}>Strengths</Text>
            {(user.humanDesign.strengths ?? []).map((sx, i) => (
              <View key={i} style={s.strengthRow}>
                <Sparkles size={12} color={SolunaColors.warmGold} />
                <Text style={s.strengthText}>{sx}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

export default function BlueprintScreen() {
  return (
    <CrashBoundary>
      <BlueprintContent />
    </CrashBoundary>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  title: { fontSize: 28, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  sub: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body, marginBottom: 16 },
  synthesisBtn: { marginBottom: 16 },
  synthesisInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "rgba(232,184,109,0.08)", borderRadius: SolunaRadius.md,
    paddingVertical: 14, borderWidth: 1, borderColor: "rgba(232,184,109,0.15)",
  },
  synthesisText: { fontSize: 14, fontWeight: "600" as const, color: SolunaColors.warmGold, fontFamily: Fonts.body },
  lensWrap: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: SolunaRadius.md, padding: 4, marginBottom: 20 },
  lensTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, borderRadius: SolunaRadius.sm, borderWidth: 1, borderColor: "transparent" },
  lensTabActive: { backgroundColor: "rgba(232,184,109,0.1)", borderColor: "rgba(232,184,109,0.2)" },
  lensText: { fontSize: 11, fontWeight: "600" as const, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
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
  numCard: { flexDirection: "row", alignItems: "center", backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, gap: 14, marginBottom: 8 },
  numBadge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  numBadgeText: { fontSize: 22, fontWeight: "700" as const, fontFamily: Fonts.heading },
  numLabel: { fontSize: 14, fontWeight: "600" as const, color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 2 },
  numDesc: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body, lineHeight: 17 },
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
  bgWrap: { alignItems: "center", marginBottom: 16 },
  hdType: { fontSize: 22, fontFamily: Fonts.heading, color: SolunaColors.warmGold, marginBottom: 6 },
  hdDesc: { fontSize: 14, color: SolunaColors.creamMuted, lineHeight: 22, fontFamily: Fonts.body },
  hdLabel: { fontSize: 16, fontWeight: "700" as const, color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 6 },
  sigRow: { flexDirection: "row", gap: 10 },
  sigLabel: { fontSize: 11, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 1, fontWeight: "700" as const, marginBottom: 4 },
  sigVal: { fontSize: 16, fontWeight: "700" as const, fontFamily: Fonts.body },
});
