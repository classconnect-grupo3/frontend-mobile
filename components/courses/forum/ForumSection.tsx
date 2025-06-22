"use client"

import { useEffect, useState } from "react"
import { View, Text, TouchableOpacity, FlatList, StyleSheet, RefreshControl, Alert } from "react-native"
import { courseClient } from "@/lib/courseClient"
import { useAuth } from "@/contexts/sessionAuth"
import Toast from "react-native-toast-message"
import { AntDesign } from "@expo/vector-icons"
import { QuestionCard } from "./QuestionCard"
import { CreateQuestionModal } from "./CreateQuestionModal"
import { ForumSearchBar } from "./ForumSearchBar"
import { QuestionDetailView } from "./QuestionDetailView"
import type { ForumQuestion, UserRole } from "@/types/forum"
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
  const [questions, setQuestions] = useState<ForumQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [userRoles, setUserRoles] = useState<Map<string, UserRole>>(new Map())
  const [selectedQuestion, setSelectedQuestion] = useState<ForumQuestion | null>(null)
  const [showQuestionDetail, setShowQuestionDetail] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<ForumQuestion | null>(null)
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false)

  const auth = useAuth()
  const authState = auth?.authState
  const currentUserId = authState?.user?.id

  const QUESTIONS_PER_PAGE = 10

  useEffect(() => {
    if (courseId && authState?.token) {
      fetchQuestions()
      buildUserRolesMap()
    }
  }, [courseId, authState?.token, currentPage])

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

  const fetchQuestions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      let endpoint = `/forum/courses/${courseId}/questions`

      // If we have search criteria, use search endpoint
      if (searchQuery || selectedTags.length > 0) {
        const params = new URLSearchParams()
        if (searchQuery) params.append("query", searchQuery)
        if (selectedTags.length > 0) {
          selectedTags.forEach((tag) => params.append("tags", tag))
        }
        endpoint = `/forum/courses/${courseId}/search?${params.toString()}`
      }

      const { data } = await courseClient.get(endpoint, {
        headers: {
          Authorization: `Bearer ${authState?.token}`,
        },
      })

      // Handle different response formats
      if (searchQuery || selectedTags.length > 0) {
        setQuestions(data.questions || [])
        setTotalQuestions(data.total || 0)
      } else {
        setQuestions(data || [])
        setTotalQuestions(data?.length || 0)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudieron cargar las preguntas",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSearch = (query: string, tags: string[]) => {
    setSearchQuery(query)
    setSelectedTags(tags)
    setCurrentPage(1)
    fetchQuestions()
  }

  const handleQuestionCreated = () => {
    setShowCreateModal(false)
    setCurrentPage(1)
    fetchQuestions()
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
    setQuestions((prev) => prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)))

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

              setQuestions((prev) => prev.filter((q) => q.id !== question.id))
              setTotalQuestions((prev) => prev - 1)

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
    fetchQuestions() // Refresh to get updated data
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
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, vote_count: q.vote_count + voteType } : q)))

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
      <ForumSearchBar onSearch={handleSearch} placeholder="Buscar preguntas..." />
      <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
        <AntDesign name="plus" size={16} color="#fff" />
        <Text style={styles.createButtonText}>Nueva Pregunta</Text>
      </TouchableOpacity>
    </View>
  )

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <AntDesign name="questioncircleo" size={48} color="#ccc" />
      <Text style={styles.emptyTitle}>No hay preguntas</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedTags.length > 0
          ? "No se encontraron preguntas con los criterios de búsqueda"
          : "Sé el primero en hacer una pregunta en este curso"}
      </Text>
    </View>
  )

  const renderPagination = () => {
    if (totalQuestions <= QUESTIONS_PER_PAGE) return null

    const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE)

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <AntDesign name="left" size={16} color={currentPage === 1 ? "#ccc" : "#007AFF"} />
        </TouchableOpacity>

        <Text style={styles.paginationText}>
          Página {currentPage} de {totalPages}
        </Text>

        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          <AntDesign name="right" size={16} color={currentPage === totalPages ? "#ccc" : "#007AFF"} />
        </TouchableOpacity>
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
        data={questions}
        keyExtractor={(item) => item.id}
        renderItem={renderQuestion}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderPagination}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchQuestions(true)} colors={["#007AFF"]} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={questions.length === 0 ? styles.emptyList : undefined}
      />

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
    gap: 16,
    backgroundColor: "#fff",
  },
  paginationButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
})
