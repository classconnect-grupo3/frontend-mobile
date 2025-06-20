"use client"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import type { Assignment } from "@/app/course/[id]/CourseViewScreen"
import React from "react"

interface Props {
  assignments: Assignment[]
  onViewDetails?: () => void
}

export function GradesSummary({ assignments, onViewDetails }: Props) {
  const gradedAssignments = assignments.filter((a) => a.submission?.score !== undefined)

  if (gradedAssignments.length === 0) {
    return null
  }

  const totalScore = gradedAssignments.reduce((sum, a) => sum + (a.submission?.score || 0), 0)
  const averageScore = totalScore / gradedAssignments.length

  const getGradeColor = (score: number) => {
    if (score >= 70) return "#4CAF50"
    if (score >= 50) return "#FF9800"
    return "#F44336"
  }

  const getGradeLabel = (score: number) => {
    if (score >= 70) return "Excelente"
    if (score >= 50) return "Bueno"
    return "Necesita mejorar"
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="assessment" size={20} color="#007AFF" />
        <Text style={styles.title}>Resumen de Calificaciones</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.averageSection}>
          <Text style={styles.averageLabel}>Promedio General</Text>
          <View style={styles.averageContainer}>
            <Text style={[styles.averageScore, { color: getGradeColor(averageScore) }]}>{averageScore.toFixed(1)}</Text>
            <Text style={styles.averageOutOf}>/100</Text>
          </View>
          <Text style={[styles.averageLabel, { color: getGradeColor(averageScore) }]}>
            {getGradeLabel(averageScore)}
          </Text>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{gradedAssignments.length}</Text>
            <Text style={styles.statLabel}>Calificadas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{assignments.length - gradedAssignments.length}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{assignments.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {onViewDetails && (
          <TouchableOpacity style={styles.detailsButton} onPress={onViewDetails}>
            <Text style={styles.detailsButtonText}>Ver detalles</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  averageSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  averageLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  averageContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  averageScore: {
    fontSize: 32,
    fontWeight: "bold",
  },
  averageOutOf: {
    fontSize: 16,
    color: "#666",
    marginLeft: 4,
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e9ecef",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    marginRight: 4,
  },
})
