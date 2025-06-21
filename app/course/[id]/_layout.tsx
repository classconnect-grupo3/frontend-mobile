import { Stack } from "expo-router"
import React from "react"

export default function CourseLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="student" options={{ headerShown: false }} />
      <Stack.Screen name="CourseViewScreen" options={{ headerShown: false }} />
    </Stack>
  )
}