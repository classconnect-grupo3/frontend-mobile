"use client"

import { useState, useEffect, useMemo } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { courseClient } from "@/lib/courseClient"
import { useAuth } from "@/contexts/sessionAuth"
import Toast from "react-native-toast-message"
import React from "react"

export interface Feedback {
  id: string
  feedback: string
  feedback_type: "POSITIVO" | "NEGATIVO" | "NEUTRO"
  score: number
  student_name: string
  created_at: string
}

interface FeedbackListProps {
  courseId: string
}

const ITEMS_PER_PAGE = 5

export function FeedbackList({ courseId }: FeedbackListProps) {
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"ALL" | "POSITIVO" | "NEGATIVO" | "NEUTRO">("ALL")
  const [filterScore, setFilterScore] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const auth = useAuth()

  // Memoized filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    let processed = [...allFeedbacks]

    // Filtrar por tipo si no es "ALL"
    if (filterType !== "ALL") {
      processed = processed.filter((feedback) => feedback.feedback_type === filterType)
    }

    // Filtrar por búsqueda si existe
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase()
      processed = processed.filter(
        (feedback) =>
          feedback.feedback.toLowerCase().includes(queryLower) ||
          feedback.student_name.toLowerCase().includes(queryLower),
      )
    }

    // Filtrar por puntuación si se especifica
    if (filterScore !== null) {
      processed = processed.filter((feedback) => feedback.score === filterScore)
    }

    return processed
  }, [allFeedbacks, filterType, searchQuery, filterScore])

  // Memoized pagination calculations
  const paginationData = useMemo(() => {
    const totalItems = filteredFeedbacks.length
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const currentPageFeedbacks = filteredFeedbacks.slice(startIndex, endIndex)

    return {
      totalItems,
      totalPages,
      currentPageFeedbacks,
      startIndex,
      endIndex,
    }
  }, [filteredFeedbacks, currentPage])

  const fetchFeedbacks = async () => {
    try {
      setLoading(true)

      const body: any = {
        end_date: "2056-01-02T15:04:05Z",
        end_score: 5,
        start_date: "2000-01-02T15:04:05Z",
        start_score: 0,
      }

      console.log("Fetching feedbacks in course:", courseId)
      console.log("Request body:", body)

      const { data } = await courseClient.put(`/courses/${courseId}/feedback`, body, {
        headers: {
          Authorization: `Bearer ${auth?.authState.token}`,
        },
      })

      console.log("Feedbacks data:", data)

      const processedFeedbacks = data || []
      setAllFeedbacks(processedFeedbacks)

      // Reset to first page when data changes
      setCurrentPage(1)
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

  useEffect(() => {
    fetchFeedbacks()
  }, [courseId])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType, filterScore])

  const handleSearch = () => {
    // The search is handled automatically by the useMemo
    setCurrentPage(1)
  }

  const handleFilter = (type: "ALL" | "POSITIVO" | "NEGATIVO" | "NEUTRO") => {
    setFilterType(type)
    setCurrentPage(1)
  }

  const handleScoreFilter = (score: number | null) => {
    setFilterScore(score)
    setCurrentPage(1)
  }

  const handleNextPage = () => {
    if (currentPage < paginationData.totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= paginationData.totalPages) {
      setCurrentPage(page)
    }
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

  const renderFeedbackItem = ({ item }: { item: Feedback }) => {
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
      <View style={styles.feedbackItem}>
        <View style={styles.feedbackHeader}>
          <View style={styles.studentInfo}>
            <MaterialIcons name="person" size={16} color="#666" />
            <Text style={styles.studentName}>{item.student_name}</Text>
          </View>
          <Text style={styles.feedbackDate}>{formattedDate}</Text>
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
      <MaterialIcons name="feedback" size={48} color="#ccc" />
      <Text style={styles.emptyStateText}>
        {allFeedbacks.length === 0
          ? "No hay feedbacks disponibles"
          : "No se encontraron feedbacks con los filtros aplicados"}
      </Text>
      {(searchQuery || filterType !== "ALL" || filterScore !== null) && (
        <TouchableOpacity
          style={styles.resetFiltersButton}
          onPress={() => {
            setSearchQuery("")
            setFilterType("ALL")
            setFilterScore(null)
            setCurrentPage(1)
          }}
        >
          <Text style={styles.resetFiltersText}>Limpiar filtros</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  const renderPaginationNumbers = () => {
    const { totalPages } = paginationData
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    const pages = []
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <View style={styles.paginationNumbers}>
        {pages.map((page) => (
          <TouchableOpacity
            key={page}
            style={[styles.pageNumber, currentPage === page && styles.pageNumberActive]}
            onPress={() => goToPage(page)}
          >
            <Text style={[styles.pageNumberText, currentPage === page && styles.pageNumberTextActive]}>{page}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feedbacks del curso</Text>
        <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(!showFilters)}>
          <MaterialIcons name="filter-list" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {filteredFeedbacks.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{filteredFeedbacks.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#4CAF50" }]}>
              {filteredFeedbacks.filter((f) => f.feedback_type === "POSITIVO").length}
            </Text>
            <Text style={styles.statLabel}>Positivos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#F44336" }]}>
              {filteredFeedbacks.filter((f) => f.feedback_type === "NEGATIVO").length}
            </Text>
            <Text style={styles.statLabel}>Negativos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#2196F3" }]}>
              {filteredFeedbacks.filter((f) => f.feedback_type === "NEUTRO").length}
            </Text>
            <Text style={styles.statLabel}>Neutros</Text>
          </View>
        </View>
      )}

      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Filtrar por tipo:</Text>
          <View style={styles.filterTypeContainer}>
            <TouchableOpacity
              style={[styles.filterTypeButton, filterType === "ALL" && styles.filterTypeButtonActive]}
              onPress={() => handleFilter("ALL")}
            >
              <Text style={[styles.filterTypeText, filterType === "ALL" && styles.filterTypeTextActive]}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTypeButton, filterType === "POSITIVO" && styles.filterTypeButtonActive]}
              onPress={() => handleFilter("POSITIVO")}
            >
              <MaterialIcons name="thumb-up" size={16} color={filterType === "POSITIVO" ? "#fff" : "#666"} />
              <Text style={[styles.filterTypeText, filterType === "POSITIVO" && styles.filterTypeTextActive]}>
                Positivos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTypeButton, filterType === "NEGATIVO" && styles.filterTypeButtonActive]}
              onPress={() => handleFilter("NEGATIVO")}
            >
              <MaterialIcons name="thumb-down" size={16} color={filterType === "NEGATIVO" ? "#fff" : "#666"} />
              <Text style={[styles.filterTypeText, filterType === "NEGATIVO" && styles.filterTypeTextActive]}>
                Negativos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTypeButton, filterType === "NEUTRO" && styles.filterTypeButtonActive]}
              onPress={() => handleFilter("NEUTRO")}
            >
              <MaterialIcons name="lightbulb" size={16} color={filterType === "NEUTRO" ? "#fff" : "#666"} />
              <Text style={[styles.filterTypeText, filterType === "NEUTRO" && styles.filterTypeTextActive]}>
                Neutros
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Filtrar por puntuación:</Text>
          <View style={styles.scoreFilterContainer}>
            {[null, 1, 2, 3, 4, 5].map((score) => (
              <TouchableOpacity
                key={score === null ? "all" : score}
                style={[styles.scoreFilterButton, filterScore === score && styles.scoreFilterButtonActive]}
                onPress={() => handleScoreFilter(score)}
              >
                <Text style={[styles.scoreFilterText, filterScore === score && styles.scoreFilterTextActive]}>
                  {score === null ? "Todos" : score}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando feedbacks...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={paginationData.currentPageFeedbacks}
            renderItem={renderFeedbackItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
          />

          {paginationData.totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <View style={styles.paginationInfo}>
                <Text style={styles.paginationInfoText}>
                  Mostrando {paginationData.startIndex + 1}-
                  {Math.min(paginationData.endIndex, paginationData.totalItems)} de {paginationData.totalItems}
                </Text>
              </View>

              <View style={styles.paginationControls}>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                  onPress={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <MaterialIcons name="chevron-left" size={20} color={currentPage === 1 ? "#ccc" : "#007AFF"} />
                </TouchableOpacity>

                {renderPaginationNumbers()}

                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    currentPage === paginationData.totalPages && styles.paginationButtonDisabled,
                  ]}
                  onPress={handleNextPage}
                  disabled={currentPage === paginationData.totalPages}
                >
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={currentPage === paginationData.totalPages ? "#ccc" : "#007AFF"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  filterToggle: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  filtersContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  filterTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  filterTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  filterTypeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterTypeText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  filterTypeTextActive: {
    color: "#fff",
  },
  scoreFilterContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  scoreFilterButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  scoreFilterButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  scoreFilterText: {
    fontSize: 14,
    color: "#666",
  },
  scoreFilterTextActive: {
    color: "#fff",
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  feedbackItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 6,
  },
  feedbackDate: {
    fontSize: 12,
    color: "#666",
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
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  paginationInfo: {
    alignItems: "center",
    marginBottom: 12,
  },
  paginationInfoText: {
    fontSize: 12,
    color: "#666",
  },
  paginationControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  paginationButton: {
    padding: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationNumbers: {
    flexDirection: "row",
    marginHorizontal: 12,
  },
  pageNumber: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: "#f8f9fa",
  },
  pageNumberActive: {
    backgroundColor: "#007AFF",
  },
  pageNumberText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  pageNumberTextActive: {
    color: "#fff",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyStateText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
  resetFiltersButton: {
    marginTop: 16,
    padding: 8,
  },
  resetFiltersText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
})
