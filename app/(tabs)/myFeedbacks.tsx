"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { courseClient } from "@/lib/courseClient"
import { useAuth } from "@/contexts/sessionAuth"
import Toast from "react-native-toast-message"
import Header from "@/components/Header"
import { styles as homeScreenStyles } from "@/styles/homeScreenStyles"
import React from "react"

interface StudentFeedback {
  id: string
  feedback: string
  feedback_type: "POSITIVO" | "NEGATIVO" | "NEUTRO"
  score: number
  course_name: string
  course_id: string
  teacher_name: string
  created_at: string
}

const ITEMS_PER_PAGE = 10

export default function MyFeedbacksScreen() {
  const [feedbacks, setFeedbacks] = useState<StudentFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"ALL" | "POSITIVO" | "NEGATIVO" | "NEUTRO">("ALL")
  const [filterCourse, setFilterCourse] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summary, setSummary] = useState("")
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([])

  const auth = useAuth()

  useEffect(() => {
    if (auth?.authState.user?.id) {
      fetchFeedbacks()
    }
  }, [auth?.authState.user?.id])

  const fetchFeedbacks = async (page = 1, query = searchQuery, type = filterType, courseId = filterCourse) => {
    try {
      setLoading(true)
      if (!auth?.authState.user?.id) return

      const body: any = {
        course_id: courseId || "",
        end_date: "2056-01-02T15:04:05Z",
        end_score: 5,
        start_date: "2000-01-02T15:04:05Z",
        start_score: 0,
      }

      if (type !== "ALL") {
        body.feedback_type = type
    }

      const { data } = await courseClient.put(`/feedback/student/${auth.authState.user.id}`, body, {
        headers: {
          Authorization: `Bearer ${auth.authState.token}`,
        },
      })

      console.log("Feedbacks data:", data)

      let processedFeedbacks = data || []

      // Filtrar por tipo si no es "ALL"
      if (type !== "ALL") {
        processedFeedbacks = processedFeedbacks.filter((feedback: StudentFeedback) => feedback.feedback_type === type)
      }

      // Filtrar por búsqueda si existe
      if (query.trim()) {
        const queryLower = query.toLowerCase()
        processedFeedbacks = processedFeedbacks.filter(
          (feedback: StudentFeedback) =>
            feedback.feedback.toLowerCase().includes(queryLower) ||
            feedback.course_name.toLowerCase().includes(queryLower) ||
            feedback.teacher_name.toLowerCase().includes(queryLower),
        )
      }

      // Extraer cursos únicos para el filtro
      const uniqueCourses = Array.from(
        new Map(processedFeedbacks.map((f: StudentFeedback) => [f.course_id, f.course_name])).entries(),
      ).map(([id, name]) => ({ id, name }))
      setCourses(uniqueCourses)

      // Paginación manual
      const startIndex = (page - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const paginatedFeedbacks = processedFeedbacks.slice(startIndex, endIndex)

      setFeedbacks(paginatedFeedbacks)
      setTotalPages(Math.max(1, Math.ceil(processedFeedbacks.length / ITEMS_PER_PAGE)))
      setCurrentPage(page)
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudieron cargar los feedbacks",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      setLoadingSummary(true)
      if (!auth?.authState.user?.id) return

      const { data } = await courseClient.get(`/feedback/student/${auth.authState.user.id}/summary`, {
        headers: {
          Authorization: `Bearer ${auth.authState.token}`,
        },
      })

      console.log("Summary data:", data)

      // Mejorar el procesamiento del resumen
      let summaryText = ""
      if (typeof data === "string") {
        summaryText = data
      } else if (data && typeof data === "object") {
        // Si es un objeto, intentar extraer el texto del resumen
        summaryText = data.summary || data.text || JSON.stringify(data, null, 2)
      } else {
        summaryText = "No se pudo generar un resumen en este momento."
      }

      setSummary(summaryText)
      setShowSummary(true)
    } catch (error) {
      console.error("Error fetching summary:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo generar el resumen",
      })
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleSearch = () => {
    fetchFeedbacks(1, searchQuery, filterType, filterCourse)
  }

  const handleFilter = (type: "ALL" | "POSITIVO" | "NEGATIVO" | "NEUTRO") => {
    setFilterType(type)
    fetchFeedbacks(1, searchQuery, type, filterCourse)
  }

  const handleCourseFilter = (courseId: string) => {
    setFilterCourse(courseId)
    fetchFeedbacks(1, searchQuery, filterType, courseId)
  }

  const renderStars = (score: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialIcons
            key={star}
            name={score >= star ? "star" : "star-border"}
            size={16}
            color={score >= star ? "#FFD700" : "#ccc"}
          />
        ))}
      </View>
    )
  }

  const renderFeedbackItem = ({ item }: { item: StudentFeedback }) => {
    const feedbackTypeColor =
      item.feedback_type === "POSITIVO" ? "#4CAF50" : item.feedback_type === "NEGATIVO" ? "#F44336" : "#2196F3"

    const feedbackTypeIcon =
      item.feedback_type === "POSITIVO" ? "thumb-up" : item.feedback_type === "NEGATIVO" ? "thumb-down" : "lightbulb"

    const formattedDate = new Date(item.created_at).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

    return (
      <View style={styles.feedbackCard}>
        <View style={styles.feedbackHeader}>
          <View style={styles.courseInfo}>
            <MaterialIcons name="school" size={16} color="#666" />
            <Text style={styles.courseName}>{item.course_name}</Text>
          </View>
          <Text style={styles.feedbackDate}>{formattedDate}</Text>
        </View>

        <View style={styles.teacherInfo}>
          <MaterialIcons name="person" size={16} color="#666" />
          <Text style={styles.teacherName}>Docente: {item.teacher_name}</Text>
        </View>

        <View style={styles.feedbackContent}>
          <View style={[styles.feedbackTypeBadge, { backgroundColor: feedbackTypeColor }]}>
            <MaterialIcons name={feedbackTypeIcon} size={14} color="#fff" />
            <Text style={styles.feedbackTypeText}>
              {item.feedback_type === "POSITIVO"
                ? "Positivo"
                : item.feedback_type === "NEGATIVO"
                  ? "Negativo"
                  : "Neutro"}
            </Text>
          </View>
          {renderStars(item.score)}
        </View>

        <Text style={styles.feedbackText}>{item.feedback}</Text>
      </View>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="feedback" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>No tienes feedbacks aún</Text>
      <Text style={styles.emptyStateSubtext}>Los feedbacks de tus docentes aparecerán aquí</Text>
    </View>
  )

  return (
    <View style={homeScreenStyles.container}>
      <Header />

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Mis Feedbacks</Text>
          <TouchableOpacity
            style={[styles.summaryButton, (loadingSummary || feedbacks.length === 0) && styles.summaryButtonDisabled]}
            onPress={fetchSummary}
            disabled={loadingSummary || feedbacks.length === 0}
          >
            {loadingSummary ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="auto-awesome" size={20} color="#fff" />
                <Text style={styles.summaryButtonText}>{feedbacks.length === 0 ? "Sin feedbacks" : "Resumen IA"}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.actionsContainer}>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar feedbacks..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>

          <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(!showFilters)}>
            <MaterialIcons name="filter-list" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filterLabel}>Tipo de feedback:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {["ALL", "POSITIVO", "NEGATIVO", "NEUTRO"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterButton, filterType === type && styles.filterButtonActive]}
                  onPress={() => handleFilter(type as any)}
                >
                  <Text style={[styles.filterButtonText, filterType === type && styles.filterButtonTextActive]}>
                    {type === "ALL"
                      ? "Todos"
                      : type === "POSITIVO"
                        ? "Positivos"
                        : type === "NEGATIVO"
                          ? "Negativos"
                          : "Neutros"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.filterLabel}>Curso:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.filterButton, filterCourse === "" && styles.filterButtonActive]}
                onPress={() => handleCourseFilter("")}
              >
                <Text style={[styles.filterButtonText, filterCourse === "" && styles.filterButtonTextActive]}>
                  Todos los cursos
                </Text>
              </TouchableOpacity>
              {courses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={[styles.filterButton, filterCourse === course.id && styles.filterButtonActive]}
                  onPress={() => handleCourseFilter(course.id)}
                >
                  <Text style={[styles.filterButtonText, filterCourse === course.id && styles.filterButtonTextActive]}>
                    {course.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando feedbacks...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {feedbacks.length} {feedbacks.length === 1 ? "feedback encontrado" : "feedbacks encontrados"}
            </Text>

            <FlatList
              data={feedbacks}
              renderItem={renderFeedbackItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={renderEmptyState}
            />

            {feedbacks.length > 0 && totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                  onPress={() => fetchFeedbacks(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <Text style={styles.paginationText}>Anterior</Text>
                </TouchableOpacity>

                <Text style={styles.paginationInfo}>
                  Página {currentPage} de {totalPages}
                </Text>

                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                  onPress={() => fetchFeedbacks(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <Text style={styles.paginationText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Modal de Resumen IA */}
      <Modal visible={showSummary} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resumen de tus Feedbacks</Text>
              <TouchableOpacity onPress={() => setShowSummary(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.summaryHeader}>
                <MaterialIcons name="auto-awesome" size={24} color="#007AFF" />
                <Text style={styles.summaryTitle}>Análisis generado por IA</Text>
              </View>
              <Text style={styles.summaryText}>{summary}</Text>
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowSummary(false)}>
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  summaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  summaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  filterToggle: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  resultsCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  feedbackCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  courseInfo: {
    flexDirection: "row",
    alignItems: "center",
    color: "#666",
  },
  courseName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 6,
  },
  feedbackDate: {
    fontSize: 12,
    color: "#666",
  },
  teacherInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  teacherName: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  feedbackContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  feedbackTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  feedbackTypeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  starsContainer: {
    flexDirection: "row",
  },
  feedbackText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 16,
  },
  paginationButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: "#ccc",
  },
  paginationText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  paginationInfo: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderRadius: 12,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalContent: {
    padding: 16,
    maxHeight: 400,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  summaryText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  modalCloseButton: {
    backgroundColor: "#007AFF",
    margin: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  summaryButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
})
