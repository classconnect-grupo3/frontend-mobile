import { Tabs } from "expo-router"
import { Platform } from "react-native"

import { HapticTab } from "@/components/HapticTab"
import TabBarBackground from "@/components/ui/TabBarBackground"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { FontAwesome, MaterialIcons } from "@expo/vector-icons"
import React from "react"

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitleAlign: "left",
          tabBarIcon: ({ color }: { color: string }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          headerTitleAlign: "left",
          tabBarIcon: ({ color }: { color: string }) => <FontAwesome name="search" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="myCourses"
        options={{
          title: "My Courses",
          headerTitleAlign: "left",
          tabBarIcon: ({ color }: { color: string }) => <FontAwesome size={28} name="bars" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: "Favoritos",
          headerTitleAlign: "left",
          tabBarIcon: ({ color }: { color: string }) => <MaterialIcons size={28} name="star" color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  )
}
