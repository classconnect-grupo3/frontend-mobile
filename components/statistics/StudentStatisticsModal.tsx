"use client"

import { useEffect, useState } from "react"
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from "react-native"
import { statisticsClient, type StudentStatistics } from "@/lib/statisticsClient"
import { useAuth } from "@/contexts/sessionAuth"
import { CustomBarChart, GaugeChart } from "./StatisticsCharts"
import { AntDesign } from "@expo/vector-icons"
import Toast from "react-native-toast-message"
import React from "react"

interface Props {
  visible: boolean
  student: any
  courseId: string
  onClose: () => void
}

export const StudentStatisticsModal = ({ visible, student, courseId, onClose }: Props) => {
  const [statistics, setStatistics] = useState<StudentStatistics | null>(null)
  const [loading, setLoading] = useState(false)

  const auth = useAuth()
  const authState = auth?.authState

  useEffect(() => {
    if (visible && student && courseId && authState?.token && authState?.user?.id) {
      fetchStudentStatistics()
    }
  }, [visible, student, courseId, authState?.token, authState?.user?.id])

  const fetchStudentStatistics = async () => {
    try {
      setLoading(true)
      const data = await statisticsClient.getStudentStatistics(
        student.uid,
        courseId,
        authState!.token!,
        authState!.user!.id,
      )
      setStatistics(data)
    } catch (error) {
      console.error("Error fetching student statistics:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudieron cargar las estadísticas del estudiante",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!student) return null

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      )
    }

    if (!statistics) {
      return (
        <View style={styles.errorContainer}>
          <AntDesign name="exclamationcircleo" size={48} color="#ccc" />
          <Text style={styles.errorText}>No se pudieron cargar las estadísticas</Text>
        </View>
      )
    }

    // Prepare chart data
    const scoresData = {
      labels: ["Exámenes", "Tareas"],
      datasets: [
        {
          data: [statistics.exam_score, statistics.homework_score],
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        },
      ],
    }

    const forumData = {
      labels: ["Posts", "Preguntas", "Respuestas"],
      datasets: [
        {
          data: [statistics.forum_posts, statistics.forum_questions, statistics.forum_answers],
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        },
      ],
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header del estudiante */}
        <View style={styles.studentHeader}>
          <View style={styles.studentAvatar}>
            <Text style={styles.studentAvatarText}>{student.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentEmail}>{student.email}</Text>
            <Text style={styles.courseName}>{statistics.course_name}</Text>
          </View>
        </View>

        {/* Métricas principales */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{statistics.average_score.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>Promedio</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{statistics.completed_assignments}</Text>
            <Text style={styles.metricLabel}>Completadas</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{statistics.forum_posts}</Text>
            <Text style={styles.metricLabel}>Posts Foro</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.participationIndicator}>
              {statistics.forum_participated ? (
                <AntDesign name="checkcircle" size={24} color="#4CAF50" />
              ) : (
                <AntDesign name="closecircle" size={24} color="#f44336" />
              )}
            </View>
            <Text style={styles.metricLabel}>Participa Foro</Text>
          </View>
        </View>

        {/* Gráficos */}
        <GaugeChart title="Progreso General" value={statistics.completion_rate} maxValue={100} color="#4CAF50" />

        <CustomBarChart title="Promedios por Tipo" data={scoresData} />

        <CustomBarChart title="Participación en Foro" data={forumData} />

        {/* Detalles adicionales */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Detalles</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Exámenes completados:</Text>
            <Text style={styles.detailValue}>{statistics.exam_completed}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tareas completadas:</Text>
            <Text style={styles.detailValue}>{statistics.homework_completed}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tasa de participación:</Text>
            <Text style={styles.detailValue}>{statistics.participation_rate.toFixed(1)}%</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Período:</Text>
            <Text style={styles.detailValue}>
              {new Date(statistics.period_from).toLocaleDateString()} -{" "}
              {new Date(statistics.period_to).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header del modal */}
        <View style={styles.header}>
          <Text style={styles.title}>Estadísticas del Estudiante</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <AntDesign name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {renderContent()}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  studentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  studentAvatarText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 24,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  courseName: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  participationIndicator: {
    marginBottom: 8,
  },
  detailsSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
})
