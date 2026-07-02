import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, type DimensionValue } from "react-native";

/**
 * Pulsing skeleton placeholders that match the real card shapes — the app feels
 * fast even while the reading generates, instead of showing a text spinner.
 * Core Animated API (native driver), no dependencies.
 */
export function Skeleton({
  width = "100%",
  height = 16,
  radius = 10,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: "rgba(255,255,255,0.08)", opacity },
        style,
      ]}
    />
  );
}

/** Shaped like the Today screen: hero reading card + weather strip + accordions. */
export function TodaySkeleton() {
  return (
    <View>
      <View style={sk.card}>
        <Skeleton width="45%" height={12} />
        <Skeleton width="100%" height={16} style={sk.gap} />
        <Skeleton width="100%" height={16} style={sk.gapSm} />
        <Skeleton width="82%" height={16} style={sk.gapSm} />
        <Skeleton width="60%" height={13} style={sk.gap} />
      </View>
      <View style={sk.stripRow}>
        <Skeleton width="31%" height={72} radius={16} />
        <Skeleton width="31%" height={72} radius={16} />
        <Skeleton width="31%" height={72} radius={16} />
      </View>
      {[0, 1, 2].map((i) => (
        <View key={i} style={sk.accordion}>
          <Skeleton width={34} height={34} radius={17} />
          <View style={{ flex: 1, gap: 7 }}>
            <Skeleton width="52%" height={13} />
            <Skeleton width="78%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** A few list-row placeholders (connections, history, etc.). */
export function RowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={sk.accordion}>
          <Skeleton width={42} height={42} radius={21} />
          <View style={{ flex: 1, gap: 7 }}>
            <Skeleton width="46%" height={13} />
            <Skeleton width="68%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

const sk = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 14,
  },
  gap: { marginTop: 14 },
  gapSm: { marginTop: 8 },
  stripRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  accordion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },
});
