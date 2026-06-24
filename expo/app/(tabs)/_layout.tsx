import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
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
    fontWeight: "600" as const,
    fontFamily: Fonts.body,
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
