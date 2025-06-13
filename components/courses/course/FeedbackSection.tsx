"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { FeedbackForm } from "../feedback/FeedbackForm"
import { FeedbackList } from "../feedback/FeedbackList"
import { FeedbackSummary } from "../feedback/FeedbackSummary"
import React from "react"

interface FeedbackSectionProps {
  courseId: string
  isTeacher: boolean
}

export function FeedbackSection({ courseId, isTeacher }: FeedbackSectionProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [showFeedbackSummary, setShowFeedbackSummary] = useState(false)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="feedback" size={24} color="#333" />
          <Text style={styles.title}>Feedback del curso</Text>
        </View>

        <View style={styles.actions}>
            <TouchableOpacity style={styles.summaryButton} onPress={() => setShowFeedbackSummary(true)}>
              <MaterialIcons name="auto-awesome" size={20} color="#fff" />
              <Text style={styles.summaryButtonText}>Ver resumen IA</Text>
            </TouchableOpacity>


          {!isTeacher && (
            <TouchableOpacity style={styles.addButton} onPress={() => setShowFeedbackForm(true)}>
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Dar feedback</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FeedbackList courseId={courseId} />

      <FeedbackForm visible={showFeedbackForm} onClose={() => setShowFeedbackForm(false)} courseId={courseId} />

      <FeedbackSummary
        visible={showFeedbackSummary}
        onClose={() => setShowFeedbackSummary(false)}
        courseId={courseId}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  actions: {
    flexDirection: "row",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  summaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  summaryButtonText: {
    color: "#333",
    fontWeight: "500",
    marginLeft: 4,
  },
})
