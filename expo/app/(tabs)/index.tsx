import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated as RNAnimated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useEffect } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import {
  getReadingForDate,
  ZODIAC_SYMBOLS,
  ZODIAC,
  Fonts,
} from "@/constants/mockData";
import {
  Sun,
  Moon,
  Sparkles,
  Share2,
  MessageCircle,
  Star,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Mood Dial ────────────────────────────────────────────────────
function MoodDial({ level, caption }: { level: number; caption: string }) {
  const anim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(anim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const rotation = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${(level / 5) * 180 - 90}deg`],
  });
  return (
    <View style={dialStyles.wrap}>
      <View style={dialStyles.dial}>
        <View style={dialStyles.dialTrack} />
        <RNAnimated.View
          style={[dialStyles.dialNeedle, { transform: [{ rotate: rotation }] }]}
        >
          <View style={dialStyles.needleHead} />
        </RNAnimated.View>
        <Text style={dialStyles.levelText}>{level}/5</Text>
      </View>
      <Text style={dialStyles.caption}>{caption}</Text>
    </View>
  );
}

const dialStyles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 12 },
  dial: {
    width: 100,
    height: 60,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
  },
  dialTrack: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.08)",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    transform: [{ rotate: "45deg" }],
  },
  dialNeedle: {
    position: "absolute",
    bottom: 0,
    width: 2,
    height: 30,
    backgroundColor: SolunaColors.warmGold,
    transformOrigin: "bottom center",
  },
  needleHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SolunaColors.warmGold,
    position: "absolute",
    top: -4,
    left: -3,
  },
  levelText: {
    position: "absolute",
    bottom: 4,
    fontSize: 14,
    fontWeight: "700",
    color: SolunaColors.warmGold,
    fontFamily: Fonts.body,
  },
  caption: {
    fontSize: 13,
    color: SolunaColors.creamMuted,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 200,
  },
});

// ─── Card Wrapper ─────────────────────────────────────────────────
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
    borderRadius: SolunaRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
  },
});

// ─── Today Screen ─────────────────────────────────────────────────
export default function TodayScreen() {
  const { user } = useAppState();
  const reading = getReadingForDate("2026-06-24");
  const fadeIn = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  if (!user) return null;

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
        <RNAnimated.View style={{ opacity: fadeIn }}>
          {/* Header */}
          <View style={screenStyles.header}>
            <View>
              <Text style={screenStyles.greeting}>
                Good morning, {user.name}
              </Text>
              <Text style={screenStyles.date}>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <View style={screenStyles.headerRight}>
              <View style={screenStyles.sunBadge}>
                <Sun size={14} color={SolunaColors.warmGold} />
                <Text style={screenStyles.sunBadgeText}>
                  {ZODIAC_SYMBOLS[user.chart.sun.sign]} {user.chart.sun.sign}
                </Text>
              </View>
            </View>
          </View>

          {/* Hero Reading Card */}
          <Card style={screenStyles.heroCard}>
            <View style={screenStyles.heroGlow}>
              <Sparkles
                size={20}
                color={SolunaColors.warmGold}
                style={{ opacity: 0.6 }}
              />
            </View>
            <Text style={screenStyles.heroText}>{reading.reading}</Text>
          </Card>

          {/* Cosmic Weather Strip */}
          <Text style={screenStyles.sectionTitle}>Cosmic Weather</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={screenStyles.weatherStrip}
            contentContainerStyle={screenStyles.weatherStripContent}
          >
            {/* Moon Phase */}
            <View style={screenStyles.weatherCard}>
              <Text style={screenStyles.weatherEmoji}>
                {reading.moonPhaseEmoji}
              </Text>
              <Text style={screenStyles.weatherLabel}>{reading.moonPhase}</Text>
              <Text style={screenStyles.weatherSub}>
                The moon grows toward fullness — a time for building and
                becoming.
              </Text>
            </View>

            {/* Moon Sign */}
            <View style={screenStyles.weatherCard}>
              <Moon size={24} color={SolunaColors.gentleLavender} />
              <Text style={screenStyles.weatherLabel}>
                Moon in {reading.moonSign}
              </Text>
              <Text style={screenStyles.weatherSub}>
                Emotions run warm and nurturing today — let yourself be soft.
              </Text>
            </View>

            {/* Transit 1 */}
            <TouchableOpacity
              style={screenStyles.weatherCard}
              onPress={() =>
                router.push({
                  pathname: "/transit-detail",
                  params: { id: "venus-gemini" },
                })
              }
            >
              <Text style={screenStyles.weatherEmojiSmall}>
                {ZODIAC_SYMBOLS[reading.transit1.sign]}
              </Text>
              <Text style={screenStyles.weatherLabel}>
                {reading.transit1.planet} in {reading.transit1.sign}
              </Text>
              <Text style={screenStyles.weatherSub}>
                {reading.transit1.blurb}
              </Text>
            </TouchableOpacity>

            {/* Transit 2 */}
            <TouchableOpacity
              style={screenStyles.weatherCard}
              onPress={() =>
                router.push({
                  pathname: "/transit-detail",
                  params: { id: "mars-virgo" },
                })
              }
            >
              <Text style={screenStyles.weatherEmojiSmall}>
                {ZODIAC_SYMBOLS[reading.transit2.sign]}
              </Text>
              <Text style={screenStyles.weatherLabel}>
                {reading.transit2.planet} in {reading.transit2.sign}
              </Text>
              <Text style={screenStyles.weatherSub}>
                {reading.transit2.blurb}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Energy + Affirmation Row */}
          <View style={screenStyles.rowWrap}>
            <Card style={screenStyles.halfCard}>
              <Text style={screenStyles.cardLabel}>Your Energy Today</Text>
              <MoodDial
                level={reading.energyLevel}
                caption={reading.energyCaption}
              />
            </Card>

            <Card style={screenStyles.halfCard}>
              <Text style={screenStyles.cardLabel}>Today's Affirmation</Text>
              <Text style={screenStyles.affirmationText}>
                "{reading.affirmation}"
              </Text>
              <TouchableOpacity style={screenStyles.shareBtn}>
                <Share2 size={16} color={SolunaColors.creamMuted} />
                <Text style={screenStyles.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </Card>
          </View>

          {/* Do / Embrace / Ease Up */}
          <Card style={screenStyles.guidanceCard}>
            <View style={screenStyles.guidanceRow}>
              <View style={screenStyles.guidanceIconWrap}>
                <Star
                  size={16}
                  color={SolunaColors.warmGold}
                  fill={SolunaColors.warmGold}
                />
              </View>
              <View style={screenStyles.guidanceTextWrap}>
                <Text style={screenStyles.guidanceLabel}>Do</Text>
                <Text style={screenStyles.guidanceValue}>{reading.do}</Text>
              </View>
            </View>
            <View style={screenStyles.guidanceDivider} />
            <View style={screenStyles.guidanceRow}>
              <View style={screenStyles.guidanceIconWrap}>
                <Sparkles size={16} color={SolunaColors.gentleLavender} />
              </View>
              <View style={screenStyles.guidanceTextWrap}>
                <Text style={screenStyles.guidanceLabel}>Embrace</Text>
                <Text style={screenStyles.guidanceValue}>
                  {reading.embrace}
                </Text>
              </View>
            </View>
            <View style={screenStyles.guidanceDivider} />
            <View style={screenStyles.guidanceRow}>
              <View style={screenStyles.guidanceIconWrap}>
                <Moon size={16} color={SolunaColors.softPeach} />
              </View>
              <View style={screenStyles.guidanceTextWrap}>
                <Text style={screenStyles.guidanceLabel}>Ease up on</Text>
                <Text style={screenStyles.guidanceValue}>
                  {reading.easeUp}
                </Text>
              </View>
            </View>
          </Card>

          {/* Ask Soluna CTA */}
          <TouchableOpacity
            style={screenStyles.askCta}
            onPress={() =>
              router.push("/(tabs)/ask")
            }
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["rgba(232, 184, 109, 0.15)", "rgba(242, 168, 141, 0.08)"]}
              style={screenStyles.askCtaInner}
            >
              <MessageCircle size={20} color={SolunaColors.warmGold} />
              <Text style={screenStyles.askCtaText}>
                Ask Soluna about today
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={screenStyles.bottomSpacer} />
        </RNAnimated.View>
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const screenStyles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SolunaSpacing.md,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  sunBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(232, 184, 109, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(232, 184, 109, 0.2)",
  },
  sunBadgeText: {
    fontSize: 12,
    color: SolunaColors.warmGold,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },
  heroCard: {
    marginBottom: 24,
    position: "relative",
  },
  heroGlow: {
    position: "absolute",
    top: 12,
    right: 16,
    opacity: 0.6,
  },
  heroText: {
    fontSize: 17,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: 13,
    color: SolunaColors.creamSubtle,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontFamily: Fonts.body,
    fontWeight: "600",
    marginBottom: 12,
  },
  weatherStrip: {
    marginBottom: 24,
  },
  weatherStripContent: {
    gap: 10,
    paddingRight: SolunaSpacing.md,
  },
  weatherCard: {
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    width: 170,
    gap: 6,
  },
  weatherEmoji: { fontSize: 28 },
  weatherEmojiSmall: { fontSize: 22 },
  weatherLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  weatherSub: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    lineHeight: 17,
  },
  rowWrap: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  halfCard: {
    flex: 1,
    minHeight: 160,
  },
  cardLabel: {
    fontSize: 12,
    color: SolunaColors.creamSubtle,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "600",
    fontFamily: Fonts.body,
    marginBottom: 12,
  },
  affirmationText: {
    fontSize: 15,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    lineHeight: 22,
    marginBottom: 12,
    fontStyle: "italic",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  shareBtnText: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },
  guidanceCard: {
    marginBottom: 16,
    gap: 0,
  },
  guidanceRow: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 12,
    alignItems: "flex-start",
  },
  guidanceIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  guidanceTextWrap: { flex: 1 },
  guidanceLabel: {
    fontSize: 12,
    color: SolunaColors.creamSubtle,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: Fonts.body,
    marginBottom: 2,
  },
  guidanceValue: {
    fontSize: 14,
    color: SolunaColors.cream,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  guidanceDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  askCta: {
    borderRadius: SolunaRadius.lg,
    overflow: "hidden",
    marginBottom: 16,
  },
  askCtaInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(232, 184, 109, 0.15)",
    borderRadius: SolunaRadius.lg,
  },
  askCtaText: {
    fontSize: 15,
    color: SolunaColors.warmGold,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },
  bottomSpacer: { height: 100 },
});
