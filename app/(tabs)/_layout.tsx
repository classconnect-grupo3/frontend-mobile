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
        tabBarActiveTintColor: Colors.light.tabIconSelected,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // transparent background on iOS to show the blur effect
            position: "absolute",
            height: 64,
            borderTopWidth: 0,
          },
          default: {
            backgroundColor: "#fff",
            height: 64,
            borderTopWidth: 0,
            shadowOpacity: 0.1, // no se por que pero las sombras no se ven 
            shadowColot: "#000",
            shadowOffset: { width: 0, height: -3 },
            shadowRadius: 6,
            elevation: 1,
          },
        }),
        tabBarItemStyle: {
          flex: 1,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        },
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
      <Tabs.Screen
        name="myFeedbacks"
        options={{
          title: "Mis Feedbacks",
          headerTitleAlign: "left",
          tabBarIcon: ({ color, focused }) => (
            // <TabBarIcon name={focused ? "chatbubble" : "chatbubble-outline"} color={color} />
            <MaterialIcons size={28} name="feedback" color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
