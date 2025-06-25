"use client"

import { useEffect, useState } from "react"
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native"
import { statisticsClient, type CourseStatistics } from "@/lib/statisticsClient"
import { useAuth } from "@/contexts/sessionAuth"
import { CustomBarChart, CustomPieChart, ProgressCircle, GaugeChart } from "./StatisticsCharts"
import { StudentStatisticsModal } from "./StudentStatisticsModal"
import { AntDesign } from "@expo/vector-icons"
import Toast from "react-native-toast-message"
import React from "react"

interface Props {
  courseId: string
  membersData: {
    teacher: any
    auxTeachers: any[]
    students: any[]
  }
}

export const CourseStatisticsSection = ({ courseId, membersData }: Props) => {
  const [statistics, setStatistics] = useState<CourseStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [showStudentModal, setShowStudentModal] = useState(false)

  const auth = useAuth()
  const authState = auth?.authState

  useEffect(() => {
    if (courseId && authState?.token && authState?.user?.id) {
      fetchStatistics()
    }
  }, [courseId, authState?.token, authState?.user?.id])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const data = await statisticsClient.getCourseStatistics(courseId, authState!.token!, authState!.user!.id)
      setStatistics(data)
    } catch (error) {
      console.error("Error fetching course statistics:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudieron cargar las estadísticas",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStudentPress = (student: any) => {
    setSelectedStudent(student)
    setShowStudentModal(true)
  }

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
        <TouchableOpacity style={styles.retryButton} onPress={fetchStatistics}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Prepare chart data
  const completionData = [
    {
      name: "Tareas",
      population: statistics.assignment_completion_rate,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: "Exámenes",
      population: statistics.exam_completion_rate,
      color: "#2196F3",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
  ]

  const assignmentDistribution = [
    {
      name: "Tareas",
      population: statistics.total_amount_of_homeworks,
      color: "#FF9800",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: "Exámenes",
      population: statistics.total_amount_of_exams,
      color: "#9C27B0",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
  ]

  const forumData = {
    labels: ["Participación"],
    datasets: [
      {
        data: [statistics.forum_participation_rate],
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
      },
    ],
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con información general */}
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas del Curso</Text>
        <Text style={styles.subtitle}>{statistics.course_name}</Text>
        <Text style={styles.period}>
          Período: {new Date(statistics.period_from).toLocaleDateString()} -{" "}
          {new Date(statistics.period_to).toLocaleDateString()}
        </Text>
      </View>

      {/* Métricas principales */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{statistics.total_students}</Text>
          <Text style={styles.metricLabel}>Estudiantes</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{statistics.total_assignments}</Text>
          <Text style={styles.metricLabel}>Asignaciones</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{statistics.forum_unique_participants}</Text>
          <Text style={styles.metricLabel}>Participantes Foro</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{statistics.average_score.toFixed(1)}</Text>
          <Text style={styles.metricLabel}>Promedio General</Text>
        </View>
      </View>

      {/* Gráficos */}
      <GaugeChart title="Promedio General del Curso" value={statistics.average_score} maxValue={100} color="#4CAF50" />

      <ProgressCircle title="Porcentaje de Finalización" data={completionData} />

      <CustomPieChart title="Distribución de Asignaciones" data={assignmentDistribution} />

      <CustomBarChart title="Participación en Foro" data={forumData} />

      {/* Lista de estudiantes */}
      <View style={styles.studentsSection}>
        <Text style={styles.sectionTitle}>Estudiantes ({membersData.students.length})</Text>
        <Text style={styles.sectionSubtitle}>Toca un estudiante para ver sus estadísticas individuales</Text>

        {membersData.students.map((student) => (
          <TouchableOpacity key={student.uid} style={styles.studentCard} onPress={() => handleStudentPress(student)}>
            <View style={styles.studentAvatar}>
              <Text style={styles.studentAvatarText}>{student.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.studentEmail}>{student.email}</Text>
            </View>
            <AntDesign name="right" size={16} color="#666" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal de estadísticas del estudiante */}
      <StudentStatisticsModal
        visible={showStudentModal}
        student={selectedStudent}
        courseId={courseId}
        onClose={() => {
          setShowStudentModal(false)
          setSelectedStudent(null)
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
  },
  period: {
    fontSize: 14,
    color: "#999",
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
  studentsSection: {
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  studentAvatarText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 14,
    color: "#666",
  },
})
