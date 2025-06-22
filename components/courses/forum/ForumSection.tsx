"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { View, Text, TouchableOpacity, FlatList, StyleSheet, RefreshControl, Alert } from "react-native"
import { courseClient } from "@/lib/courseClient"
import { useAuth } from "@/contexts/sessionAuth"
import Toast from "react-native-toast-message"
import { AntDesign } from "@expo/vector-icons"
import { QuestionCard } from "./QuestionCard"
import { CreateQuestionModal } from "./CreateQuestionModal"
import { ForumSearchBar } from "./ForumSearchBar"
import { QuestionDetailView } from "./QuestionDetailView"
import type { ForumQuestion, UserRole, ForumSearchResponse } from "@/types/forum"
import { EditQuestionModal } from "./EditQuestionModal"
import React from "react"

interface Props {
  courseId: string
  isTeacher: boolean
  membersData: {
    teacher: any
    auxTeachers: any[]
    students: any[]
  }
}

export const ForumSection = ({ courseId, isTeacher, membersData }: Props) => {
  const [allQuestions, setAllQuestions] = useState<ForumQuestion[]>([]) // All questions from API
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<"open" | "resolved" | undefined>(undefined)
  const [userRoles, setUserRoles] = useState<Map<string, UserRole>>(new Map())
  const [selectedQuestion, setSelectedQuestion] = useState<ForumQuestion | null>(null)
  const [showQuestionDetail, setShowQuestionDetail] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<ForumQuestion | null>(null)
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false)

  const auth = useAuth()
  const authState = auth?.authState
  const currentUserId = authState?.user?.id

  const QUESTIONS_PER_PAGE = 5

  // Build user roles map
  useEffect(() => {
    if (membersData) {
      buildUserRolesMap()
    }
  }, [membersData])

  // Fetch questions when dependencies change (except pagination)
  useEffect(() => {
    if (courseId && authState?.token) {
      fetchQuestions()
    }
  }, [courseId, authState?.token, searchQuery, selectedTags, selectedStatus])

  // Reset to first page when search criteria changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedTags, selectedStatus])

  const buildUserRolesMap = () => {
    const rolesMap = new Map<string, UserRole>()

    // Add teacher
    if (membersData.teacher) {
      rolesMap.set(membersData.teacher.uid, {
        uid: membersData.teacher.uid,
        name: membersData.teacher.name,
        surname: membersData.teacher.surname,
        role: "teacher",
      })
    }

    // Add aux teachers
    membersData.auxTeachers.forEach((teacher) => {
      rolesMap.set(teacher.uid, {
        uid: teacher.uid,
        name: teacher.name,
        surname: teacher.surname,
        role: "aux_teacher",
      })
    })

    // Add students
    membersData.students.forEach((student) => {
      rolesMap.set(student.uid, {
        uid: student.uid,
        name: student.name,
        surname: student.surname,
        role: "student",
      })
    })

    setUserRoles(rolesMap)
  }

  const fetchQuestions = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        let endpoint = `/forum/courses/${courseId}/questions`
        let isUsingSearch = false

        // Check if we need to use search endpoint
        const hasSearchCriteria = searchQuery.trim() || selectedTags.length > 0 || selectedStatus !== undefined

        if (hasSearchCriteria) {
          const params = new URLSearchParams()

          if (searchQuery.trim()) {
            params.append("query", searchQuery.trim())
          }

          if (selectedTags.length > 0) {
            selectedTags.forEach((tag) => params.append("tags", tag))
          }

          if (selectedStatus) {
            params.append("status", selectedStatus)
          }

          // Don't send pagination params to API - we'll handle it in frontend
          endpoint = `/forum/courses/${courseId}/search?${params.toString()}`
          isUsingSearch = true
        } else {
          // Regular endpoint without pagination params
          endpoint = `/forum/courses/${courseId}/questions`
        }

        const { data } = await courseClient.get(endpoint, {
          headers: {
            Authorization: `Bearer ${authState?.token}`,
          },
        })

        if (isUsingSearch) {
          const searchResponse = data as ForumSearchResponse
          setAllQuestions(searchResponse.questions || [])
        } else {
          // For regular endpoint, assume it returns array of questions or { questions: [], total: number }
          if (Array.isArray(data)) {
            setAllQuestions(data)
          } else if (data.questions && Array.isArray(data.questions)) {
            setAllQuestions(data.questions)
          } else {
            setAllQuestions([])
          }
        }
      } catch (error) {
        console.error("Error fetching questions:", error)
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No se pudieron cargar las preguntas",
        })
        setAllQuestions([])
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [courseId, authState?.token, searchQuery, selectedTags, selectedStatus],
  )

  // Calculate paginated questions and totals
  const { paginatedQuestions, totalQuestions, totalPages } = useMemo(() => {
    const total = allQuestions.length
    const pages = Math.ceil(total / QUESTIONS_PER_PAGE)
    const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE
    const endIndex = startIndex + QUESTIONS_PER_PAGE
    const paginated = allQuestions.slice(startIndex, endIndex)

    return {
      paginatedQuestions: paginated,
      totalQuestions: total,
      totalPages: pages,
    }
  }, [allQuestions, currentPage, QUESTIONS_PER_PAGE])

  const isSearching = searchQuery.trim() || selectedTags.length > 0 || selectedStatus !== undefined

  const handleSearch = (query: string, tags: string[], status?: "open" | "resolved") => {
    setSearchQuery(query)
    setSelectedTags(tags)
    setSelectedStatus(status)
    // currentPage will be reset by useEffect
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const handleQuestionCreated = () => {
    setShowCreateModal(false)
    setCurrentPage(1)
    // Clear search to show all questions including the new one
    setSearchQuery("")
    setSelectedTags([])
    setSelectedStatus(undefined)
    Toast.show({
      type: "success",
      text1: "Pregunta creada",
      text2: "Tu pregunta ha sido publicada exitosamente",
    })
  }

  const handleEditQuestion = (question: ForumQuestion) => {
    setEditingQuestion(question)
    setShowEditQuestionModal(true)
  }

  const handleQuestionUpdated = (updatedQuestion: ForumQuestion) => {
    setShowEditQuestionModal(false)
    setEditingQuestion(null)

    // Update the question in the list
    setAllQuestions((prev) => prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)))

    Toast.show({
      type: "success",
      text1: "Pregunta actualizada",
      text2: "Los cambios se han guardado exitosamente",
    })
  }

  const handleDeleteQuestion = async (question: ForumQuestion) => {
    Alert.alert(
      "Eliminar pregunta",
      "¿Estás seguro de que quieres eliminar esta pregunta? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await courseClient.delete(`/forum/questions/${question.id}?authorId=${currentUserId}`, {
                headers: {
                  Authorization: `Bearer ${authState?.token}`,
                },
              })

              // Remove the question from the list
              setAllQuestions((prev) => prev.filter((q) => q.id !== question.id))

              // Adjust current page if necessary
              const newTotal = allQuestions.length - 1
              const newTotalPages = Math.ceil(newTotal / QUESTIONS_PER_PAGE)
              if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages)
              }

              Toast.show({
                type: "success",
                text1: "Pregunta eliminada",
                text2: "La pregunta ha sido eliminada exitosamente",
              })
            } catch (error) {
              console.error("Error deleting question:", error)
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "No se pudo eliminar la pregunta",
              })
            }
          },
        },
      ],
    )
  }

  const handleQuestionPress = (question: ForumQuestion) => {
    setSelectedQuestion(question)
    setShowQuestionDetail(true)
  }

  const handleBackToList = () => {
    setShowQuestionDetail(false)
    setSelectedQuestion(null)
    // Refresh questions when coming back from detail
    fetchQuestions()
  }

  const handleVote = async (questionId: string, voteType: 1 | -1) => {
    try {
      await courseClient.post(
        `/forum/questions/${questionId}/vote`,
        {
          user_id: authState?.user?.id,
          vote_type: voteType,
        },
        {
          headers: {
            Authorization: `Bearer ${authState?.token}`,
          },
        },
      )

      // Update local state
      setAllQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, vote_count: q.vote_count + voteType } : q)),
      )

      Toast.show({
        type: "success",
        text1: voteType > 0 ? "Voto positivo" : "Voto negativo",
        text2: "Tu voto ha sido registrado",
      })
    } catch (error) {
      console.error("Error voting:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo registrar tu voto",
      })
    }
  }

  const renderQuestion = ({ item }: { item: ForumQuestion }) => (
    <QuestionCard
      question={item}
      userRole={userRoles.get(item.author_id)}
      onPress={() => handleQuestionPress(item)}
      onVote={(voteType) => handleVote(item.id, voteType)}
      onEdit={() => handleEditQuestion(item)}
      onDelete={() => handleDeleteQuestion(item)}
      currentUserId={authState?.user?.id}
    />
  )

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.sectionTitle}>Foro de Preguntas</Text>
      <ForumSearchBar
        onSearch={handleSearch}
        placeholder="Buscar preguntas..."
        initialQuery={searchQuery}
        initialTags={selectedTags}
        initialStatus={selectedStatus}
      />

      {/* Search Results Info */}
      {isSearching && (
        <View style={styles.searchResultsInfo}>
          <AntDesign name="search1" size={14} color="#666" />
          <Text style={styles.searchResultsText}>
            {totalQuestions} resultado{totalQuestions !== 1 ? "s" : ""} encontrado{totalQuestions !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Pagination Info */}
      {totalQuestions > 0 && (
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationInfoText}>
            Mostrando {(currentPage - 1) * QUESTIONS_PER_PAGE + 1}-
            {Math.min(currentPage * QUESTIONS_PER_PAGE, totalQuestions)} de {totalQuestions} preguntas
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
        <AntDesign name="plus" size={16} color="#fff" />
        <Text style={styles.createButtonText}>Nueva Pregunta</Text>
      </TouchableOpacity>
    </View>
  )

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <AntDesign name={isSearching ? "search1" : "questioncircleo"} size={48} color="#ccc" />
      <Text style={styles.emptyTitle}>{isSearching ? "No se encontraron resultados" : "No hay preguntas"}</Text>
      <Text style={styles.emptySubtitle}>
        {isSearching
          ? "Intenta ajustar los filtros de búsqueda o usar términos diferentes"
          : "Sé el primero en hacer una pregunta en este curso"}
      </Text>
    </View>
  )

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const startPage = Math.max(1, currentPage - 2)
    const endPage = Math.min(totalPages, startPage + 4)
    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

    return (
      <View style={styles.paginationContainer}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <AntDesign name="left" size={16} color={currentPage === 1 ? "#ccc" : "#007AFF"} />
        </TouchableOpacity>

        {/* Page Numbers */}
        <View style={styles.pageNumbersContainer}>
          {startPage > 1 && (
            <>
              <TouchableOpacity style={styles.pageButton} onPress={() => handlePageChange(1)}>
                <Text style={styles.pageButtonText}>1</Text>
              </TouchableOpacity>
              {startPage > 2 && <Text style={styles.ellipsis}>...</Text>}
            </>
          )}

          {pages.map((page) => (
            <TouchableOpacity
              key={page}
              style={[styles.pageButton, currentPage === page && styles.currentPageButton]}
              onPress={() => handlePageChange(page)}
            >
              <Text style={[styles.pageButtonText, currentPage === page && styles.currentPageButtonText]}>{page}</Text>
            </TouchableOpacity>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <Text style={styles.ellipsis}>...</Text>}
              <TouchableOpacity style={styles.pageButton} onPress={() => handlePageChange(totalPages)}>
                <Text style={styles.pageButtonText}>{totalPages}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <AntDesign name="right" size={16} color={currentPage === totalPages ? "#ccc" : "#007AFF"} />
        </TouchableOpacity>
      </View>
    )
  }

  const renderLoadingOverlay = () => {
    if (!loading) return null

    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContainer}>
          <AntDesign name="loading1" size={24} color="#007AFF" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    )
  }

  // Show question detail view
  if (showQuestionDetail && selectedQuestion) {
    return (
      <QuestionDetailView
        question={selectedQuestion}
        userRoles={userRoles}
        currentUserId={authState?.user?.id}
        isTeacher={isTeacher}
        onBack={handleBackToList}
      />
    )
  }

  // Show questions list
  return (
    <View style={styles.container}>
      <FlatList
        data={paginatedQuestions}
        keyExtractor={(item) => item.id}
        renderItem={renderQuestion}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderPagination}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchQuestions(true)} colors={["#007AFF"]} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={paginatedQuestions.length === 0 ? styles.emptyList : undefined}
      />

      {renderLoadingOverlay()}

      <CreateQuestionModal
        visible={showCreateModal}
        courseId={courseId}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleQuestionCreated}
      />
      <EditQuestionModal
        visible={showEditQuestionModal}
        question={editingQuestion!}
        onClose={() => {
          setShowEditQuestionModal(false)
          setEditingQuestion(null)
        }}
        onSuccess={handleQuestionUpdated}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  searchResultsInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
    gap: 6,
  },
  searchResultsText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  paginationInfo: {
    marginTop: 4,
    marginBottom: 8,
  },
  paginationInfoText: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    gap: 8,
  },
  paginationButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    minWidth: 36,
    alignItems: "center",
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  pageNumbersContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    minWidth: 36,
    alignItems: "center",
  },
  currentPageButton: {
    backgroundColor: "#007AFF",
  },
  pageButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  currentPageButtonText: {
    color: "#fff",
  },
  ellipsis: {
    fontSize: 14,
    color: "#999",
    paddingHorizontal: 4,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
})
