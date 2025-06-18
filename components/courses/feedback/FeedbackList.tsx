"use client"

import { useState, useEffect } from "react"
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

export function FeedbackList({ courseId }: FeedbackListProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"ALL" | "POSITIVO" | "NEGATIVO" | "NEUTRO">("ALL")
  const [filterScore, setFilterScore] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([])
  const auth = useAuth()

  const fetchFeedbacks = async (page = 1, query = searchQuery, type = filterType, score = filterScore) => {
    try {
      setLoading(true)
      let url = `/courses/${courseId}/feedback`

    //   if (query) {
    //     url += `&search=${encodeURIComponent(query)}`
    //   }

    //   if (type !== "ALL") {
    //     url += `&type=${type}`
    //   }

    //   if (score !== null) {
    //     url += `&score=${score}`
    //   }
    //   this goes in the body as filters
    //     {
    //     "end_date": "string",
    //     "end_score": 0,
    //     "feedback_type": "POSITIVO",
    //     "start_date": "string",
    //     "start_score": 0
    //     }
        const body = {
          end_date: "2056-01-02T15:04:05Z",
          end_score: score ?? 5,
          feedback_type: type,
          start_date: "2000-01-02T15:04:05Z",
          start_score: score ?? 0,
        }

      const { data } = await courseClient.put(url, {}, {
        headers: {
          Authorization: `Bearer ${auth?.authState.token}`,
        },
      })

      console.log("Feedbacks data:", data)

      setFeedbacks(data.data || [])
      setTotalPages(data.total_pages || 1)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
      console.log("Error details:", error.response?.data || error.message)
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
    fetchFeedbacks(1, "", "ALL", 5)
  }, [courseId])

  const handleSearch = () => {
    fetchFeedbacks(1, searchQuery, filterType, filterScore)
  }

  const handleFilter = (type: "ALL" | "POSITIVO" | "NEGATIVO" | "NEUTRO") => {
    setFilterType(type)
    fetchFeedbacks(1, searchQuery, type, filterScore)
  }

  const handleScoreFilter = (score: number | null) => {
    setFilterScore(score)
    fetchFeedbacks(1, searchQuery, filterType, score)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchFeedbacks(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchFeedbacks(currentPage - 1)
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
      <Text style={styles.emptyStateText}>No hay feedbacks disponibles</Text>
      {(searchQuery || filterType !== "ALL" || filterScore !== null) && (
        <TouchableOpacity
          style={styles.resetFiltersButton}
          onPress={() => {
            setSearchQuery("")
            setFilterType("ALL")
            setFilterScore(null)
            fetchFeedbacks(1, "", "ALL", null)
          }}
        >
          <Text style={styles.resetFiltersText}>Limpiar filtros</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feedbacks del curso</Text>
        <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(!showFilters)}>
          <MaterialIcons name="filter-list" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar en feedbacks..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <MaterialIcons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

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
            data={feedbacks}
            renderItem={renderFeedbackItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
          />

          {feedbacks.length > 0 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={handlePrevPage}
                disabled={currentPage === 1}
              >
                <MaterialIcons name="chevron-left" size={20} color={currentPage === 1 ? "#ccc" : "#007AFF"} />
              </TouchableOpacity>
              <Text style={styles.paginationText}>
                Página {currentPage} de {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <MaterialIcons name="chevron-right" size={20} color={currentPage === totalPages ? "#ccc" : "#007AFF"} />
              </TouchableOpacity>
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  paginationButton: {
    padding: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 12,
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
