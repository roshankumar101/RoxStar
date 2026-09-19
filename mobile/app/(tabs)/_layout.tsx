import { Tabs } from "expo-router";
import React from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { HapticTab } from "@/components/haptic-tab";
import { RoxStarHeader } from "@/components/roxstar-ui";
import { Palette } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Palette.accent,
        tabBarInactiveTintColor: Palette.muted,
        tabBarStyle: {
          height: 82,
          paddingTop: 8,
          borderTopColor: Palette.border,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        header: () => <RoxStarHeader safeTop />,
        headerShown: true,
        tabBarButton: (props) => <HapticTab {...(props as any)} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Drafts",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="mic-none" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: "Rooms",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="groups" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
