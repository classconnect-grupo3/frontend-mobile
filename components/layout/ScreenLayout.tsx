import React from "react"
import { View, ScrollView, StyleSheet, type ViewStyle } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Colors, Spacing } from "@/styles/shared"

interface ScreenLayoutProps {
  children: React.ReactNode
  scrollable?: boolean
  backgroundColor?: string
  padded?: boolean
  contentStyle?: ViewStyle
  showsVerticalScrollIndicator?: boolean
}

export function ScreenLayout({
  children,
  scrollable = true,
  backgroundColor = Colors.light,
  contentStyle,
  padded = true,
  showsVerticalScrollIndicator = false,
}: ScreenLayoutProps) {
  const containerStyle = [styles.container, { backgroundColor }]

  const contentContainerStyle = [styles.content, contentStyle]

  if (scrollable) {
    return (
      <SafeAreaView style={containerStyle}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[contentContainerStyle, padded && { paddingHorizontal: Spacing.lg }]}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={containerStyle}>
      <View style={[contentContainerStyle, padded && { paddingHorizontal: Spacing.lg }]}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
})
