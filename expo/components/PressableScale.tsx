import React, { useRef } from "react";
import { Animated, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { tapLight } from "@/lib/haptics";

/**
 * A card/button wrapper that springs down slightly on press — the tactile
 * feedback that makes a UI feel alive. Uses the core Animated API (native
 * driver) so it costs nothing and needs no extra config.
 */
export default function PressableScale({
  children,
  onPress,
  style,
  disabled,
  haptic = true,
  scaleTo = 0.97,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: boolean;
  scaleTo?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const springTo = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Pressable
      onPressIn={() => springTo(scaleTo)}
      onPressOut={() => springTo(1)}
      onPress={() => {
        if (haptic) tapLight();
        onPress?.();
      }}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
