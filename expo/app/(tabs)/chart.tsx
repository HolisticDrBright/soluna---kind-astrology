import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import Svg, { Circle, Line, Text as SvgText, G } from "react-native-svg";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import {
  MOCK_CHART,
  ZODIAC,
  ZODIAC_SYMBOLS,
  PLANET_SYMBOLS,
  HOUSE_NAMES,
  Fonts,
  type Planet,
  type ZodiacSign,
} from "@/constants/mockData";
import { Sun, Moon, Star, ChevronRight } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_SIZE = SCREEN_WIDTH - 64;
const CHART_RADIUS = CHART_SIZE / 2;
const CX = CHART_SIZE / 2;
const CY = CHART_SIZE / 2;

// ─── Natal Chart Wheel ────────────────────────────────────────────
function NatalChartWheel() {
  const chart = MOCK_CHART;
  const ringOuter = CHART_RADIUS - 4;
  const ringInner = ringOuter - 40;
  const houseRing = ringInner - 2;
  const houseInner = houseRing - 32;
  const innerRing = houseInner - 6;

  // Zodiac ring: 12 equal divisions
  const zodiacSegments = ZODIAC.map((sign, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180); // Start at top (Aries offset??)
    // Actually let's start with Aries at ASC (left) for proper orientation
    // Simplified: just divide the circle
    const startAngleDeg = i * 30 - 105; // offset so 0=top
    const endAngleDeg = startAngleDeg + 30;
    const startRad = startAngleDeg * (Math.PI / 180);
    const endRad = endAngleDeg * (Math.PI / 180);
    const x1 = CX + ringOuter * Math.cos(startRad);
    const y1 = CY + ringOuter * Math.sin(startRad);
    const x2 = CX + ringOuter * Math.cos(endRad);
    const y2 = CY + ringOuter * Math.sin(endRad);
    const mx = CX + (ringOuter - 20) * Math.cos((startRad + endRad) / 2);
    const my = CY + (ringOuter - 20) * Math.sin((startRad + endRad) / 2);

    const isActiveSign = chart.sun.sign === sign || chart.moon.sign === sign || chart.rising === sign;
    return { sign, x1, y1, x2, y2, mx, my, startRad, endRad, isActiveSign };
  });

  // House cusps (arbitrary simplified positions)
  const houseCusps = Array.from({ length: 12 }, (_, i) => {
    const angleDeg = i * 30 - 105;
    const rad = angleDeg * (Math.PI / 180);
    return { house: i + 1, angleDeg, rad, cx: CX + houseRing * Math.cos(rad), cy: CY + houseRing * Math.sin(rad) };
  });

  // Planet positions (simplified to just scatter around)
  const planetPositions = chart.placements.map((p, i) => {
    const angleDeg = (i * 36 + 15 - 90) * (Math.PI / 180);
    const dist = innerRing - 10 + (i % 3) * 14;
    const x = CX + dist * Math.cos(angleDeg);
    const y = CY + dist * Math.sin(angleDeg);
    const isBigThree =
      (p.planet === "Sun" && p.sign === chart.sun.sign) ||
      (p.planet === "Moon" && p.sign === chart.moon.sign) ||
      p.planet === "Mercury"; // Mercury in chart is prominent
    return { ...p, x, y, isBigThree };
  });

  return (
    <Svg width={CHART_SIZE} height={CHART_SIZE}>
      {/* Outer glow */}
      <Circle
        cx={CX}
        cy={CY}
        r={ringOuter + 8}
        fill="none"
        stroke="rgba(232,184,109,0.08)"
        strokeWidth={8}
      />

      {/* Zodiac ring segments */}
      {zodiacSegments.map((seg) => (
        <G key={seg.sign}>
          <Line
            x1={CX + ringInner * Math.cos(seg.startRad)}
            y1={CY + ringInner * Math.sin(seg.startRad)}
            x2={seg.x1}
            y2={seg.y1}
            stroke={seg.isActiveSign ? "rgba(232,184,109,0.3)" : "rgba(255,255,255,0.08)"}
            strokeWidth={1}
          />
          <SvgText
            x={seg.mx}
            y={seg.my}
            fill={seg.isActiveSign ? SolunaColors.warmGold : SolunaColors.creamMuted}
            fontSize={11}
            fontWeight={seg.isActiveSign ? "700" : "400"}
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {ZODIAC_SYMBOLS[seg.sign]}
          </SvgText>
        </G>
      ))}

      {/* Outer and inner rings */}
      <Circle cx={CX} cy={CY} r={ringOuter} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
      <Circle cx={CX} cy={CY} r={ringInner} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

      {/* House ring */}
      <Circle cx={CX} cy={CY} r={houseRing} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      <Circle cx={CX} cy={CY} r={houseInner} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      {houseCusps.map((h) => (
        <G key={`h${h.house}`}>
          <Line
            x1={CX + houseInner * Math.cos(h.rad)}
            y1={CY + houseInner * Math.sin(h.rad)}
            x2={CX + houseRing * Math.cos(h.rad)}
            y2={CY + houseRing * Math.sin(h.rad)}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={0.5}
          />
          <SvgText
            x={CX + (houseInner + 14) * Math.cos(h.rad)}
            y={CY + (houseInner + 14) * Math.sin(h.rad)}
            fill={SolunaColors.creamSubtle}
            fontSize={7}
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {h.house}
          </SvgText>
        </G>
      ))}

      {/* Inner ring */}
      <Circle cx={CX} cy={CY} r={innerRing} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />

      {/* Center circle */}
      <Circle cx={CX} cy={CY} r={22} fill="rgba(232,184,109,0.08)" stroke="rgba(232,184,109,0.2)" strokeWidth={1} />
      <SvgText x={CX} y={CY} fill={SolunaColors.warmGold} fontSize={10} textAnchor="middle" alignmentBaseline="middle" fontWeight="700">
        ☉
      </SvgText>

      {/* Planet glyphs */}
      {planetPositions.map((p) => (
        <G key={p.planet}>
          {p.isBigThree && (
            <Circle cx={p.x} cy={p.y} r={14} fill="rgba(232,184,109,0.08)" stroke="rgba(232,184,109,0.25)" strokeWidth={1} />
          )}
          <SvgText
            x={p.x}
            y={p.y}
            fill={p.isBigThree ? SolunaColors.warmGold : SolunaColors.creamMuted}
            fontSize={p.isBigThree ? 16 : 13}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontWeight={p.isBigThree ? "700" : "400"}
          >
            {PLANET_SYMBOLS[p.planet]}
          </SvgText>
        </G>
      ))}
    </Svg>
  );
}

// ─── Chart Screen ─────────────────────────────────────────────────
export default function ChartScreen() {
  const { user } = useAppState();
  const [selectedView, setSelectedView] = useState<"chart" | "placements" | "houses">("chart");

  if (!user) return null;

  const chart = user.chart;

  return (
    <LinearGradient
      colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
      style={screenStyles.gradient}
    >
      <ScrollView
        style={screenStyles.scroll}
        contentContainerStyle={screenStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={screenStyles.title}>Your Chart</Text>
        <Text style={screenStyles.subtitle}>
          {user.name}'s natal blueprint
        </Text>

        {/* View Toggle */}
        <View style={screenStyles.toggleWrap}>
          {(["chart", "placements", "houses"] as const).map((view) => (
            <TouchableOpacity
              key={view}
              style={[
                screenStyles.toggleBtn,
                selectedView === view && screenStyles.toggleBtnActive,
              ]}
              onPress={() => setSelectedView(view)}
            >
              <Text
                style={[
                  screenStyles.toggleText,
                  selectedView === view && screenStyles.toggleTextActive,
                ]}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart Wheel */}
        {selectedView === "chart" && (
          <View style={screenStyles.chartWrap}>
            <NatalChartWheel />
          </View>
        )}

        {/* Big Three Cards */}
        {selectedView === "chart" && (
          <View style={screenStyles.bigThreeWrap}>
            <TouchableOpacity
              style={screenStyles.bigThreeCard}
              onPress={() =>
                router.push({
                  pathname: "/placement-detail",
                  params: { planet: "Sun" },
                })
              }
            >
              <View
                style={[
                  screenStyles.bigThreeIcon,
                  { backgroundColor: "rgba(232,184,109,0.1)" },
                ]}
              >
                <Sun size={20} color={SolunaColors.warmGold} />
              </View>
              <View style={screenStyles.bigThreeInfo}>
                <Text style={screenStyles.bigThreeLabel}>Sun</Text>
                <Text style={screenStyles.bigThreeSign}>
                  {ZODIAC_SYMBOLS[chart.sun.sign]} {chart.sun.sign},{" "}
                  {chart.sun.house}
                  {["th", "st", "nd", "rd"][
                    chart.sun.house % 10 > 3 ? 0 : chart.sun.house % 10
                  ] || "th"}{" "}
                  House
                </Text>
              </View>
              <ChevronRight size={18} color={SolunaColors.creamSubtle} />
            </TouchableOpacity>

            <TouchableOpacity
              style={screenStyles.bigThreeCard}
              onPress={() =>
                router.push({
                  pathname: "/placement-detail",
                  params: { planet: "Moon" },
                })
              }
            >
              <View
                style={[
                  screenStyles.bigThreeIcon,
                  { backgroundColor: "rgba(185,163,227,0.1)" },
                ]}
              >
                <Moon size={20} color={SolunaColors.gentleLavender} />
              </View>
              <View style={screenStyles.bigThreeInfo}>
                <Text style={screenStyles.bigThreeLabel}>Moon</Text>
                <Text style={screenStyles.bigThreeSign}>
                  {ZODIAC_SYMBOLS[chart.moon.sign]} {chart.moon.sign},{" "}
                  {chart.moon.house}
                  {["th", "st", "nd", "rd"][
                    chart.moon.house % 10 > 3 ? 0 : chart.moon.house % 10
                  ] || "th"}{" "}
                  House
                </Text>
              </View>
              <ChevronRight size={18} color={SolunaColors.creamSubtle} />
            </TouchableOpacity>

            <TouchableOpacity
              style={screenStyles.bigThreeCard}
              onPress={() =>
                router.push({
                  pathname: "/placement-detail",
                  params: { planet: "Rising" },
                })
              }
            >
              <View
                style={[
                  screenStyles.bigThreeIcon,
                  { backgroundColor: "rgba(242,168,141,0.1)" },
                ]}
              >
                <Star size={20} color={SolunaColors.softPeach} />
              </View>
              <View style={screenStyles.bigThreeInfo}>
                <Text style={screenStyles.bigThreeLabel}>Rising</Text>
                <Text style={screenStyles.bigThreeSign}>
                  {ZODIAC_SYMBOLS[chart.rising]} {chart.rising}
                </Text>
              </View>
              <ChevronRight size={18} color={SolunaColors.creamSubtle} />
            </TouchableOpacity>
          </View>
        )}

        {/* All Placements List */}
        {selectedView === "placements" && (
          <View style={screenStyles.placementsWrap}>
            {chart.placements.map((p) => (
              <TouchableOpacity
                key={p.planet}
                style={screenStyles.placementRow}
                onPress={() =>
                  router.push({
                    pathname: "/placement-detail",
                    params: { planet: p.planet },
                  })
                }
              >
                <View style={screenStyles.placementGlyph}>
                  <Text style={screenStyles.glyphText}>
                    {PLANET_SYMBOLS[p.planet]}
                  </Text>
                </View>
                <View style={screenStyles.placementInfo}>
                  <Text style={screenStyles.placementName}>{p.planet}</Text>
                  <Text style={screenStyles.placementDetail}>
                    {ZODIAC_SYMBOLS[p.sign]} {p.sign} · {p.degree}° ·{" "}
                    {p.house}
                    {["th", "st", "nd", "rd"][p.house % 10 > 3 ? 0 : p.house % 10] || "th"} House
                  </Text>
                </View>
                <ChevronRight size={16} color={SolunaColors.creamSubtle} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Houses View */}
        {selectedView === "houses" && (
          <View style={screenStyles.housesWrap}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((house) => {
              const placement = chart.placements.find((p) => p.house === house);
              return (
                <View key={house} style={screenStyles.houseRow}>
                  <View style={screenStyles.houseNumWrap}>
                    <Text style={screenStyles.houseNum}>{house}</Text>
                  </View>
                  <View style={screenStyles.houseInfo}>
                    <Text style={screenStyles.houseName}>
                      {HOUSE_NAMES[house]}
                    </Text>
                    {placement ? (
                      <Text style={screenStyles.housePlanet}>
                        {PLANET_SYMBOLS[placement.planet]} {placement.planet}{" "}
                        in {ZODIAC_SYMBOLS[placement.sign]} {placement.sign}
                      </Text>
                    ) : (
                      <Text style={screenStyles.houseEmpty}>
                        No planets in this house
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={screenStyles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const screenStyles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  title: {
    fontSize: 28,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    marginBottom: 20,
  },
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: SolunaRadius.md,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: SolunaRadius.sm,
  },
  toggleBtnActive: {
    backgroundColor: "rgba(232,184,109,0.15)",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  toggleTextActive: {
    color: SolunaColors.warmGold,
  },
  chartWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  bigThreeWrap: {
    gap: 10,
    marginBottom: 24,
  },
  bigThreeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    gap: 14,
    paddingRight: 8,
  },
  bigThreeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  bigThreeInfo: {
    flex: 1,
  },
  bigThreeLabel: {
    fontSize: 11,
    color: SolunaColors.creamSubtle,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "700",
    fontFamily: Fonts.body,
    marginBottom: 2,
  },
  bigThreeSign: {
    fontSize: 15,
    color: SolunaColors.cream,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },
  placementsWrap: {
    gap: 8,
  },
  placementRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    gap: 14,
  },
  placementGlyph: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  glyphText: {
    fontSize: 20,
    color: SolunaColors.warmGold,
  },
  placementInfo: {
    flex: 1,
  },
  placementName: {
    fontSize: 15,
    fontWeight: "600",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    marginBottom: 2,
  },
  placementDetail: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  housesWrap: {
    gap: 6,
  },
  houseRow: {
    flexDirection: "row",
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    gap: 14,
    alignItems: "center",
  },
  houseNumWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  houseNum: {
    fontSize: 16,
    fontWeight: "700",
    color: SolunaColors.warmGold,
    fontFamily: Fonts.body,
  },
  houseInfo: {
    flex: 1,
  },
  houseName: {
    fontSize: 14,
    fontWeight: "600",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    marginBottom: 2,
  },
  housePlanet: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  houseEmpty: {
    fontSize: 12,
    color: SolunaColors.creamSubtle,
    fontStyle: "italic",
    fontFamily: Fonts.body,
  },
  bottomSpacer: { height: 100 },
});
