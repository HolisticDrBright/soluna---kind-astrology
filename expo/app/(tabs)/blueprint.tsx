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
import React, { useState, useMemo } from "react";
import Svg, { Circle, Line, Text as SvgText, G, Rect } from "react-native-svg";
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
import {
  Sun,
  Moon,
  Star,
  ChevronRight,
  Hash,
  Bird,
  Cpu,
  Sparkles,
  ArrowRight,
} from "lucide-react-native";

type SystemLens = "astrology" | "numerology" | "chinese" | "humanDesign";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

// ─── Natal Chart Wheel ────────────────────────────────────────────
function NatalChartWheel() {
  const { width: windowW } = useWindowDimensions();
  const chartSize = Math.max(windowW - 64, 100);
  const chartRadius = chartSize / 2;
  const cx = chartSize / 2;
  const cy = chartSize / 2;

  const ringOuter = chartRadius - 4;
  const ringInner = ringOuter - 40;
  const houseRing = ringInner - 2;
  const houseInner = houseRing - 32;
  const innerRing = houseInner - 6;

  const zodiacSegments = ZODIAC.map((sign, i) => {
    const startAngleDeg = i * 30 - 105;
    const endAngleDeg = startAngleDeg + 30;
    const startRad = startAngleDeg * (Math.PI / 180);
    const endRad = endAngleDeg * (Math.PI / 180);
    const mx = cx + (ringOuter - 20) * Math.cos((startRad + endRad) / 2);
    const my = cy + (ringOuter - 20) * Math.sin((startRad + endRad) / 2);
    const isActiveSign =
      sign === "Cancer" || sign === "Pisces" || sign === "Libra";
    return { sign, startRad, endRad, mx, my, isActiveSign };
  });

  const houseCusps = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const angleDeg = i * 30 - 105;
        const rad = angleDeg * (Math.PI / 180);
        return { house: i + 1, rad };
      }),
    [],
  );

  const planetPositions = [
    { label: "☉", angle: 0, dist: innerRing - 6, big: true },
    { label: "☽", angle: 60, dist: innerRing - 18, big: true },
    { label: "☿", angle: 85, dist: innerRing - 6, big: true },
    { label: "♀", angle: 135, dist: innerRing - 10, big: false },
    { label: "♂", angle: 170, dist: innerRing - 18, big: false },
    { label: "♃", angle: 220, dist: innerRing - 6, big: false },
    { label: "♄", angle: 260, dist: innerRing - 12, big: false },
    { label: "♅", angle: 290, dist: innerRing - 18, big: false },
    { label: "♆", angle: 320, dist: innerRing - 6, big: false },
    { label: "♇", angle: 350, dist: innerRing - 14, big: false },
  ];

  if (chartSize <= 100) return null;

  return (
    <Svg width={chartSize} height={chartSize}>
      <Circle
        cx={cx} cy={cy} r={ringOuter + 8}
        fill="none" stroke="rgba(232,184,109,0.08)" strokeWidth={8}
      />
      {zodiacSegments.map((seg) => (
        <G key={seg.sign}>
          <Line
            x1={cx + ringInner * Math.cos(seg.startRad)}
            y1={cy + ringInner * Math.sin(seg.startRad)}
            x2={cx + ringOuter * Math.cos(seg.startRad)}
            y2={cy + ringOuter * Math.sin(seg.startRad)}
            stroke={
              seg.isActiveSign
                ? "rgba(232,184,109,0.3)"
                : "rgba(255,255,255,0.08)"
            }
            strokeWidth={1}
          />
          <SvgText
            x={seg.mx} y={seg.my} dy={4}
            fill={
              seg.isActiveSign
                ? SolunaColors.warmGold
                : SolunaColors.creamMuted
            }
            fontSize={11}
            fontWeight={seg.isActiveSign ? "700" : "400"}
            textAnchor="middle"
          >
            {ZODIAC_SYMBOLS[seg.sign]}
          </SvgText>
        </G>
      ))}
      <Circle cx={cx} cy={cy} r={ringOuter} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
      <Circle cx={cx} cy={cy} r={ringInner} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={houseRing} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={houseInner} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
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
            dy={3}
            fill={SolunaColors.creamSubtle} fontSize={7} textAnchor="middle"
          >
            {h.house}
          </SvgText>
        </G>
      ))}
      <Circle cx={cx} cy={cy} r={innerRing} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={22} fill="rgba(232,184,109,0.08)" stroke="rgba(232,184,109,0.2)" strokeWidth={1} />
      <SvgText x={cx} y={cy} dy={4} fill={SolunaColors.warmGold} fontSize={10} textAnchor="middle" fontWeight="700">
        ☉
      </SvgText>
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
              x={x} y={y} dy={p.big ? 5 : 4}
              fill={p.big ? SolunaColors.warmGold : SolunaColors.creamMuted}
              fontSize={p.big ? 16 : 13} textAnchor="middle"
              fontWeight={p.big ? "700" : "400"}
            >
              {p.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── Bodygraph (simplified Human Design) ──────────────────────────
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
    { name: "Solar Plexus", x: BG_W / 2 + 50, y: 165, defined: true },
    { name: "Spleen", x: BG_W / 2 - 50, y: 200, defined: false },
    { name: "Root", x: BG_W / 2, y: 250, defined: true },
  ];

  return (
    <Svg width={BG_W} height={BG_H}>
      {centerPositions.map((c) => (
        <G key={c.name}>
          <Rect
            x={c.x - 18} y={c.y - 12} width={36} height={24} rx={6}
            fill={c.defined ? "rgba(232,184,109,0.12)" : "rgba(255,255,255,0.03)"}
            stroke={c.defined ? "rgba(232,184,109,0.3)" : "rgba(255,255,255,0.08)"}
            strokeWidth={1}
          />
          <SvgText
            x={c.x} y={c.y + 1} dy={3}
            fill={c.defined ? SolunaColors.warmGold : SolunaColors.creamSubtle}
            fontSize={7} textAnchor="middle"
          >
            {c.name}
          </SvgText>
        </G>
      ))}
      <Line x1={BG_W / 2} y1={54} x2={BG_W / 2} y2={113} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Line x1={BG_W / 2} y1={137} x2={BG_W / 2} y2={168} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Line x1={BG_W / 2} y1={192} x2={BG_W / 2} y2={198} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Line x1={BG_W / 2 - 32} y1={152} x2={BG_W / 2 - 18} y2={170} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      <Line x1={BG_W / 2} y1={210} x2={BG_W / 2} y2={238} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Line x1={BG_W / 2 + 32} y1={175} x2={BG_W / 2 + 20} y2={195} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
    </Svg>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────
function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <View style={[cardStyles.card, style]}>{children}</View>;
}
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    marginBottom: 10,
  },
});

// ─── Blueprint Screen ─────────────────────────────────────────────
export default function BlueprintScreen() {
  const { user } = useAppState();
  const [lens, setLens] = useState<SystemLens>("astrology");

  if (!user) return null;

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
          {user.preferredName}'s cosmic design across four lenses
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
              { key: "astrology", label: "Astrology", icon: Star },
              { key: "numerology", label: "Numerology", icon: Hash },
              { key: "chinese", label: "Chinese", icon: Bird },
              { key: "humanDesign", label: "Human Design", icon: Cpu },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <TouchableOpacity
              key={key}
              style={[s.lensTab, lens === key && s.lensTabActive]}
              onPress={() => setLens(key)}
            >
              <Icon
                size={14}
                color={
                  lens === key
                    ? SolunaColors.warmGold
                    : SolunaColors.creamMuted
                }
              />
              <Text
                style={[s.lensText, lens === key && s.lensTextActive]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Astrology lens */}
        {lens === "astrology" && (
          <View>
            <View style={s.chartWrap}>
              <NatalChartWheel />
            </View>
            <Text style={s.sectionLabel}>Big Three</Text>
            {(
              [
                {
                  planet: "Sun",
                  sign: user.chart.sun.sign,
                  house: user.chart.sun.house,
                  icon: Sun,
                  color: SolunaColors.warmGold,
                },
                {
                  planet: "Moon",
                  sign: user.chart.moon.sign,
                  house: user.chart.moon.house,
                  icon: Moon,
                  color: SolunaColors.gentleLavender,
                },
                {
                  planet: "Rising",
                  sign: user.chart.rising,
                  icon: Star,
                  color: SolunaColors.softPeach,
                },
              ] as const
            ).map((item) => (
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
                <View
                  style={[
                    s.bigThreeIcon,
                    { backgroundColor: `${item.color}15` },
                  ]}
                >
                  <item.icon size={18} color={item.color} />
                </View>
                <View style={s.bigThreeInfo}>
                  <Text style={s.bigThreeLabel}>{item.planet}</Text>
                  <Text style={s.bigThreeVal}>
                    {ZODIAC_SYMBOLS[item.sign]} {item.sign}
                    {"house" in item
                      ? ` · ${item.house}${ordinal(item.house)} House`
                      : ""}
                  </Text>
                </View>
                <ChevronRight size={16} color={SolunaColors.creamSubtle} />
              </TouchableOpacity>
            ))}
            <Text style={s.sectionLabel}>All Placements</Text>
            {user.chart.placements.map((p) => (
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
                <Text style={s.glyphText}>
                  {PLANET_SYMBOLS[p.planet]}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.placementName}>{p.planet}</Text>
                  <Text style={s.placementDetail}>
                    {ZODIAC_SYMBOLS[p.sign]} {p.sign} · {p.degree}° · House {p.house}
                  </Text>
                </View>
                <ChevronRight size={14} color={SolunaColors.creamSubtle} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Numerology lens */}
        {lens === "numerology" && (
          <View>
            <Text style={s.sectionLabel}>Core Numbers</Text>
            {[
              {
                label: "Life Path",
                value: user.numerology.lifePath,
                desc: user.numerology.lifePathMeaning,
                color: SolunaColors.warmGold,
              },
              {
                label: "Expression",
                value: user.numerology.expression,
                desc: user.numerology.expressionMeaning,
                color: SolunaColors.gentleLavender,
              },
              {
                label: "Soul Urge",
                value: user.numerology.soulUrge,
                desc: user.numerology.soulUrgeMeaning,
                color: SolunaColors.softPeach,
              },
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
                <View
                  style={[
                    s.numBadge,
                    {
                      backgroundColor: `${num.color}15`,
                      borderColor: `${num.color}30`,
                    },
                  ]}
                >
                  <Text style={[s.numBadgeText, { color: num.color }]}>
                    {num.value}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.numLabel}>{num.label}</Text>
                  <Text style={s.numDesc} numberOfLines={2}>
                    {num.desc}
                  </Text>
                </View>
                <ChevronRight size={16} color={SolunaColors.creamSubtle} />
              </TouchableOpacity>
            ))}
            <Text style={s.sectionLabel}>Personal Timing</Text>
            {[
              {
                label: "Personal Year",
                value: user.numerology.personalYear,
                meaning: user.numerology.personalYearMeaning,
              },
              {
                label: "Personal Month",
                value: user.numerology.personalMonth,
                meaning: user.numerology.personalMonthMeaning,
              },
              {
                label: "Personal Day",
                value: user.numerology.personalDay,
                meaning: user.numerology.personalDayMeaning,
              },
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

        {/* Chinese lens */}
        {lens === "chinese" && (
          <View>
            <Card>
              <View style={s.chineseHeader}>
                <Text style={s.chineseEmoji}>
                  {CHINESE_ANIMAL_EMOJI[user.chinese.animal]}
                </Text>
                <View>
                  <Text style={s.chineseTitle}>
                    {user.chinese.elementAnimalLabel}
                  </Text>
                  <Text style={s.chineseElement}>
                    {CHINESE_ELEMENT_EMOJI[user.chinese.element]}{" "}
                    {user.chinese.element} element
                  </Text>
                </View>
              </View>
              <Text style={s.chineseDesc}>{user.chinese.description}</Text>
            </Card>
            <Text style={s.sectionLabel}>Strengths</Text>
            {user.chinese.strengths.map((sx, i) => (
              <View key={i} style={s.strengthRow}>
                <Sparkles size={12} color={SolunaColors.warmGold} />
                <Text style={s.strengthText}>{sx}</Text>
              </View>
            ))}
            <Text style={s.sectionLabel}>Gentle Growth Edge</Text>
            <Card>
              <Text style={s.growthText}>{user.chinese.growthEdge}</Text>
            </Card>
            <Text style={s.sectionLabel}>BaZi Four Pillars (preview)</Text>
            {user.chinese.bazi.map((pillar, i) => (
              <Card key={i}>
                <View style={s.baziRow}>
                  <Text style={s.baziStem}>{pillar.heavenlyStem}</Text>
                  <Text style={s.baziBranch}>
                    {CHINESE_ANIMAL_EMOJI[pillar.earthlyBranch]}{" "}
                    {pillar.earthlyBranch}
                  </Text>
                  <View
                    style={[
                      s.baziElemBadge,
                      { backgroundColor: "rgba(255,255,255,0.05)" },
                    ]}
                  >
                    <Text style={s.baziElemText}>
                      {CHINESE_ELEMENT_EMOJI[pillar.element]}
                    </Text>
                  </View>
                </View>
                <Text style={s.baziMeaning}>{pillar.meaning}</Text>
              </Card>
            ))}
          </View>
        )}

        {/* Human Design lens */}
        {lens === "humanDesign" && (
          <View>
            <View style={s.bgWrap}>
              <BodyGraph />
            </View>
            <Card>
              <Text style={s.hdType}>{user.humanDesign.type}</Text>
              <Text style={s.hdDesc}>
                {user.humanDesign.typeDescription}
              </Text>
            </Card>
            <Text style={s.sectionLabel}>Strategy</Text>
            <Card>
              <Text style={s.hdLabel}>{user.humanDesign.strategy}</Text>
              <Text style={s.hdDesc}>
                {user.humanDesign.strategyDescription}
              </Text>
            </Card>
            <Text style={s.sectionLabel}>Authority</Text>
            <Card>
              <Text style={s.hdLabel}>{user.humanDesign.authority}</Text>
              <Text style={s.hdDesc}>
                {user.humanDesign.authorityDescription}
              </Text>
            </Card>
            <Text style={s.sectionLabel}>Profile</Text>
            <Card>
              <Text style={s.hdLabel}>{user.humanDesign.profile}</Text>
              <Text style={s.hdDesc}>
                {user.humanDesign.profileDescription}
              </Text>
            </Card>
            <Text style={s.sectionLabel}>Signature / Not-Self</Text>
            <View style={s.sigRow}>
              <Card style={{ flex: 1 }}>
                <Text style={s.sigLabel}>Signature</Text>
                <Text style={[s.sigVal, { color: SolunaColors.warmGold }]}>
                  {user.humanDesign.signature}
                </Text>
              </Card>
              <Card style={{ flex: 1 }}>
                <Text style={s.sigLabel}>Not-Self</Text>
                <Text style={[s.sigVal, { color: SolunaColors.softPeach }]}>
                  {user.humanDesign.notSelf}
                </Text>
              </Card>
            </View>
            <Text style={s.sectionLabel}>Strengths</Text>
            {user.humanDesign.strengths.map((sx, i) => (
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

// ─── Styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SolunaSpacing.md,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    marginBottom: 4,
  },
  sub: {
    fontSize: 14,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    marginBottom: 16,
  },
  synthesisBtn: { marginBottom: 16 },
  synthesisInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(232,184,109,0.08)",
    borderRadius: SolunaRadius.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(232,184,109,0.15)",
  },
  synthesisText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: SolunaColors.warmGold,
    fontFamily: Fonts.body,
  },
  lensWrap: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: SolunaRadius.md,
    padding: 4,
    marginBottom: 20,
  },
  lensTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: SolunaRadius.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  lensTabActive: {
    backgroundColor: "rgba(232,184,109,0.1)",
    borderColor: "rgba(232,184,109,0.2)",
  },
  lensText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  lensTextActive: { color: SolunaColors.warmGold },
  chartWrap: { alignItems: "center", marginBottom: 20 },
  sectionLabel: {
    fontSize: 12,
    color: SolunaColors.creamSubtle,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "700" as const,
    fontFamily: Fonts.body,
    marginBottom: 10,
    marginTop: 12,
  },
  bigThreeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    gap: 14,
    marginBottom: 8,
  },
  bigThreeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bigThreeInfo: { flex: 1 },
  bigThreeLabel: {
    fontSize: 11,
    color: SolunaColors.creamSubtle,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "700" as const,
  },
  bigThreeVal: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  placementRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    gap: 12,
    marginBottom: 6,
  },
  glyphText: {
    fontSize: 20,
    color: SolunaColors.warmGold,
    width: 36,
    textAlign: "center",
  },
  placementName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  placementDetail: {
    fontSize: 11,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  // Numerology
  numCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    gap: 14,
    marginBottom: 8,
  },
  numBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  numBadgeText: {
    fontSize: 22,
    fontWeight: "700" as const,
    fontFamily: Fonts.heading,
  },
  numLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    marginBottom: 2,
  },
  numDesc: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    lineHeight: 17,
  },
  timingRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  timingBadge: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: SolunaColors.warmGold,
    fontFamily: Fonts.heading,
    width: 48,
    textAlign: "center",
  },
  timingLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    marginBottom: 3,
  },
  timingMeaning: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    lineHeight: 17,
  },
  // Chinese
  chineseHeader: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  chineseEmoji: { fontSize: 40 },
  chineseTitle: {
    fontSize: 20,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    marginBottom: 2,
  },
  chineseElement: { fontSize: 14, color: SolunaColors.creamMuted },
  chineseDesc: {
    fontSize: 14,
    color: SolunaColors.creamMuted,
    lineHeight: 22,
    fontFamily: Fonts.body,
  },
  strengthRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  strengthText: {
    flex: 1,
    fontSize: 13,
    color: SolunaColors.cream,
    lineHeight: 19,
    fontFamily: Fonts.body,
  },
  growthText: {
    fontSize: 14,
    color: SolunaColors.softPeach,
    lineHeight: 22,
    fontFamily: Fonts.body,
    fontStyle: "italic",
  },
  baziRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  baziStem: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: SolunaColors.warmGold,
    fontFamily: Fonts.body,
  },
  baziBranch: {
    fontSize: 14,
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  baziElemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  baziElemText: { fontSize: 14 },
  baziMeaning: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
  // Human Design
  bgWrap: { alignItems: "center", marginBottom: 16 },
  hdType: {
    fontSize: 22,
    fontFamily: Fonts.heading,
    color: SolunaColors.warmGold,
    marginBottom: 6,
  },
  hdDesc: {
    fontSize: 14,
    color: SolunaColors.creamMuted,
    lineHeight: 22,
    fontFamily: Fonts.body,
  },
  hdLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    marginBottom: 6,
  },
  sigRow: { flexDirection: "row", gap: 10 },
  sigLabel: {
    fontSize: 11,
    color: SolunaColors.creamSubtle,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  sigVal: {
    fontSize: 16,
    fontWeight: "700" as const,
    fontFamily: Fonts.body,
  },
});
