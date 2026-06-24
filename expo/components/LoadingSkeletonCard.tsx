import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { useEffect, useRef } from "react";
import SolunaColors from "@/constants/colors";

interface LoadingSkeletonCardProps {
  lines?: number;
  height?: number;
}

export default function LoadingSkeletonCard({ lines = 3, height = 160 }: LoadingSkeletonCardProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View style={[s.card, { height, opacity }]}>
      <View style={s.topLine} />
      {Array.from({ length: lines }).map((_, i) => (
        <View
          key={i}
          style={[
            s.line,
            { width: i === lines - 1 ? "40%" : `${85 - i * 10}%` },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: SolunaColors.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    marginBottom: 12,
    justifyContent: "center",
  },
  topLine: {
    height: 14, width: "50%", borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.06)", marginBottom: 16,
  },
  line: {
    height: 10, borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.04)", marginBottom: 10,
  },
});
