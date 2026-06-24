import { Tabs, router, useRootNavigationState } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import {
  Sun,
  Compass,
  Heart,
  User,
  Sparkles,
} from "lucide-react-native";
import SolunaColors from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { Fonts } from "@/constants/mockData";

function TabIcon({
  icon: Icon,
  color,
  size = 24,
}: {
  icon: React.ComponentType<{ color: string; size: number }>;
  color: string;
  size?: number;
}) {
  return <Icon color={color} size={size} />;
}

export default function TabLayout() {
  const { hasOnboarded } = useAppState();
  const rootNavState = useRootNavigationState();

  // Defer redirect until after the navigation container has fully mounted.
  // requestAnimationFrame runs after paint — past the commit phase where
  // the "navigate before mounting" assertion fires.
  useEffect(() => {
    if (rootNavState?.key && !hasOnboarded) {
      const raf = requestAnimationFrame(() => {
        router.replace("/onboarding");
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [rootNavState?.key, hasOnboarded]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: SolunaColors.tabActive,
        tabBarInactiveTintColor: SolunaColors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarButton: (props) => {
          const { accessibilityState, children, style, ...rest } = props as any;
          const isActive = accessibilityState?.selected;
          return (
            <TouchableOpacity
              {...rest}
              style={[
                style,
                styles.tabButton,
                isActive && styles.tabButtonActive,
              ]}
              activeOpacity={0.7}
            >
              {children}
            </TouchableOpacity>
          );
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => <TabIcon icon={Sun} color={color} />,
        }}
      />
      <Tabs.Screen
        name="blueprint"
        options={{
          title: "Blueprint",
          tabBarIcon: ({ color }) => <TabIcon icon={Compass} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: "Ask Soluna",
          tabBarIcon: ({ color }) => (
            <TabIcon icon={Sparkles} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: "Connections",
          tabBarIcon: ({ color }) => <TabIcon icon={Heart} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "You",
          tabBarIcon: ({ color }) => <TabIcon icon={User} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: SolunaColors.tabBarBg,
    borderTopColor: "rgba(255,255,255,0.06)",
    borderTopWidth: 1,
    height: 88,
    paddingBottom: 28,
    paddingTop: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: Fonts.body,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  tabButtonActive: {},
});
