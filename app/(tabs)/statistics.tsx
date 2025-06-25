"use client"

import { useEffect, useState } from "react"
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native"
import { statisticsClient, type TeacherCoursesStatistics } from "@/lib/statisticsClient"
import { useAuth } from "@/contexts/sessionAuth"
import { CustomBarChart, CustomLineChart } from "@/components/statistics/StatisticsCharts"
import { DateRangePicker } from "@/components/statistics/DateRangePicker"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { AntDesign } from "@expo/vector-icons"
import Toast from "react-native-toast-message"
import React from "react"

export default function StatisticsScreen() {
  const [statistics, setStatistics] = useState<TeacherCoursesStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date("2025-05-17"),
    to: new Date("2025-12-17"),
  })

  const auth = useAuth()
  const authState = auth?.authState

  useEffect(() => {
    if (authState?.token && authState?.user?.id) {
      fetchStatistics()
    }
  }, [authState?.token, authState?.user?.id, dateRange])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      
      const data = await statisticsClient.getTeacherCoursesStatistics(
        authState!.user!.id,
        authState!.token!,
        dateRange,
      )
      setStatistics(data)
    } catch (error) {
      console.error("Error fetching teacher statistics:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudieron cargar las estadísticas",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (newRange: { from: Date; to: Date }) => {
    setDateRange(newRange)
  }

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </ScreenLayout>
    )
  }

  if (!statistics || statistics.courses.length === 0) {
    return (
      <ScreenLayout>
        <View style={styles.errorContainer}>
          <AntDesign name="barchart" size={64} color="#ccc" />
          <Text style={styles.errorTitle}>No hay estadísticas disponibles</Text>
          <Text style={styles.errorText}>Aún no tienes cursos con datos suficientes para mostrar estadísticas</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStatistics}>
            <Text style={styles.retryButtonText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    )
  }

  // Prepare chart data
  const courseNames = statistics.courses.map((course) =>
    course.course_name.length > 15 ? course.course_name.substring(0, 15) + "..." : course.course_name,
  )

  const averageScoresData = {
    labels: courseNames,
    datasets: [
      {
        data: statistics.courses.map((course) => course.average_score),
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      },
    ],
  }

  const completionRatesData = {
    labels: courseNames,
    datasets: [
      {
        data: statistics.courses.map((course) => course.assignment_completion_rate),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: statistics.courses.map((course) => course.exam_completion_rate),
        color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  }

  const forumParticipationData = {
    labels: courseNames,
    datasets: [
      {
        data: statistics.courses.map((course) => course.forum_participation_rate),
        color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
      },
    ],
  }

  const totalStudents = statistics.courses.reduce((sum, course) => sum + course.total_students, 0)
  const totalAssignments = statistics.courses.reduce((sum, course) => sum + course.total_assignments, 0)
  const averageScore =
    statistics.courses.reduce((sum, course) => sum + course.average_score, 0) / statistics.courses.length

  return (
    <ScreenLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mis Estadísticas</Text>
          <Text style={styles.subtitle}>Vista general de todos tus cursos</Text>
        </View>

        {/* Date Range Picker */}
        <DateRangePicker dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />

        {/* Métricas generales */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{statistics.courses.length}</Text>
            <Text style={styles.metricLabel}>Cursos Activos</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalStudents}</Text>
            <Text style={styles.metricLabel}>Total Estudiantes</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalAssignments}</Text>
            <Text style={styles.metricLabel}>Total Asignaciones</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{averageScore.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>Promedio General</Text>
          </View>
        </View>

        {/* Gráficos */}
        <CustomBarChart title="Rendimiento Promedio por Curso" data={averageScoresData} />

        <CustomLineChart title="Porcentaje de Finalización por Curso" data={completionRatesData} />

        <CustomBarChart title="Participación en Foros" data={forumParticipationData} />

        {/* Lista detallada de cursos */}
        <View style={styles.coursesSection}>
          <Text style={styles.sectionTitle}>Detalle por Curso</Text>
          {statistics.courses.map((course) => (
            <View key={course.course_id} style={styles.courseCard}>
              <Text style={styles.courseName}>{course.course_name}</Text>
              <View style={styles.courseStats}>
                <View style={styles.courseStat}>
                  <Text style={styles.courseStatValue}>{course.total_students}</Text>
                  <Text style={styles.courseStatLabel}>Estudiantes</Text>
                </View>
                <View style={styles.courseStat}>
                  <Text style={styles.courseStatValue}>{course.average_score.toFixed(1)}</Text>
                  <Text style={styles.courseStatLabel}>Promedio</Text>
                </View>
                <View style={styles.courseStat}>
                  <Text style={styles.courseStatValue}>{course.assignment_completion_rate.toFixed(1)}%</Text>
                  <Text style={styles.courseStatLabel}>Completado</Text>
                </View>
                <View style={styles.courseStat}>
                  <Text style={styles.courseStatValue}>{course.forum_participation_rate.toFixed(1)}%</Text>
                  <Text style={styles.courseStatLabel}>Foro</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  header: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    margin: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
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
    fontSize: 28,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  coursesSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  courseCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  courseStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  courseStat: {
    alignItems: "center",
  },
  courseStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 2,
  },
  courseStatLabel: {
    fontSize: 11,
    color: "#666",
  },
})
