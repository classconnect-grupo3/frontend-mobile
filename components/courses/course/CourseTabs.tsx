import React from "react"
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native"
import { AntDesign } from "@expo/vector-icons"

interface Tab {
  id: string
  label: string
  icon: string
}

interface Props {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  renderContent: () => React.ReactNode
}

export const CourseTabs = ({ tabs, activeTab, onTabChange, renderContent }: Props) => {
  return (
    <View style={styles.container}>
      {/* Tabs Header */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => onTabChange(tab.id)}
          >
            <AntDesign
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.id ? "#007AFF" : "#666"}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  tabsContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    height: 80,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    minWidth: 80,
  },
  activeTab: {
    backgroundColor: "#e3f2fd",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
})
