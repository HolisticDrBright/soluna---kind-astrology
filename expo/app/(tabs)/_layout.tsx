import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { Sun, Compass, Heart, User, Sparkles } from "lucide-react-native";
import SolunaColors from "@/constants/colors";
import { Fonts } from "@/constants/mockData";

function TabIcon({
  Icon,
  color,
  size = 24,
}: {
  Icon: React.ComponentType<{ color: string; size: number }>;
  color: string;
  size?: number;
}) {
  return <Icon color={color} size={size} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: SolunaColors.tabActive,
        tabBarInactiveTintColor: SolunaColors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
        // Floating glass pill: real blur on iOS, deep translucent fill on Android.
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView tint="dark" intensity={44} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(26,22,53,0.96)" }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => <TabIcon Icon={Sun} color={color} />,
        }}
      />
      <Tabs.Screen
        name="blueprint"
        options={{
          title: "Blueprint",
          tabBarIcon: ({ color }) => <TabIcon Icon={Compass} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: "Ask Soluna",
          tabBarIcon: ({ color }) => <TabIcon Icon={Sparkles} color={color} />,
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: "Connections",
          tabBarIcon: ({ color }) => <TabIcon Icon={Heart} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "You",
          tabBarIcon: ({ color }) => <TabIcon Icon={User} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    // Floating glass pill — content scrolls beneath it (screens pad their
    // bottoms), the blur shows the star-field through.
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    height: 66,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "transparent",
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    fontFamily: Fonts.body,
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
