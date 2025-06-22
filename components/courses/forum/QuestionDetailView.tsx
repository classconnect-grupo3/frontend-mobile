"use client"

import { useEffect, useState } from "react"
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native"
import { AntDesign, MaterialIcons } from "@expo/vector-icons"
import { courseClient } from "@/lib/courseClient"
import { useAuth } from "@/contexts/sessionAuth"
import Toast from "react-native-toast-message"
import type { ForumQuestion, ForumAnswer, UserRole } from "@/types/forum"
import { AnswerCard } from "./AnswerCard"
import { CreateAnswerModal } from "./CreateAnswerModal"
import React from "react"

interface Props {
  question: ForumQuestion
  userRoles: Map<string, UserRole>
  currentUserId?: string
  isTeacher: boolean
  onBack: () => void
}

export const QuestionDetailView = ({ question, userRoles, currentUserId, isTeacher, onBack }: Props) => {
  const [questionData, setQuestionData] = useState<ForumQuestion>(question)
  const [answers, setAnswers] = useState<ForumAnswer[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateAnswer, setShowCreateAnswer] = useState(false)

  const auth = useAuth()
  const authState = auth?.authState

  useEffect(() => {
    fetchQuestionDetail()
  }, [question.id])

  const fetchQuestionDetail = async () => {
    try {
      setLoading(true)
      const { data } = await courseClient.get(`/forum/questions/${question.id}`, {
        headers: {
          Authorization: `Bearer ${authState?.token}`,
        },
      })

      setQuestionData(data)
      setAnswers(data.answers || [])
    } catch (error) {
      console.error("Error fetching question detail:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo cargar el detalle de la pregunta",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVoteQuestion = async (voteType: 1 | -1) => {
    try {
      await courseClient.post(
        `/forum/questions/${question.id}/vote`,
        {
          user_id: currentUserId,
          vote_type: voteType,
        },
        {
          headers: {
            Authorization: `Bearer ${authState?.token}`,
          },
        },
      )

      setQuestionData((prev) => ({
        ...prev,
        vote_count: prev.vote_count + voteType,
      }))

      Toast.show({
        type: "success",
        text1: voteType > 0 ? "Voto positivo" : "Voto negativo",
        text2: "Tu voto ha sido registrado",
      })
    } catch (error) {
      console.error("Error voting question:", error)
      console.log("Error details:", error.response?.data || error.message)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo registrar tu voto",
      })
    }
  }

  const handleVoteAnswer = async (answerId: string, voteType: 1 | -1) => {
    try {
      await courseClient.post(
        `/forum/questions/${question.id}/answers/${answerId}/vote`,
        {
          user_id: currentUserId,
          vote_type: voteType,
        },
        {
          headers: {
            Authorization: `Bearer ${authState?.token}`,
          },
        },
      )

      setAnswers((prev) =>
        prev.map((answer) =>
          answer.id === answerId ? { ...answer, vote_count: answer.vote_count + voteType } : answer,
        ),
      )

      Toast.show({
        type: "success",
        text1: voteType > 0 ? "Voto positivo" : "Voto negativo",
        text2: "Tu voto ha sido registrado",
      })
    } catch (error) {
      console.error("Error voting answer:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo registrar tu voto",
      })
    }
  }

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await courseClient.post(
        `/forum/questions/${question.id}/answers/${answerId}/accept?authorId=${currentUserId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authState?.token}`,
          },
        },
      )

      // Update local state
      setQuestionData((prev) => ({
        ...prev,
        accepted_answer_id: answerId,
      }))

      setAnswers((prev) =>
        prev.map((answer) => ({
          ...answer,
          is_accepted: answer.id === answerId,
        })),
      )

      Toast.show({
        type: "success",
        text1: "Respuesta aceptada",
        text2: "La respuesta ha sido marcada como solución",
      })
    } catch (error) {
      console.error("Error accepting answer:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo aceptar la respuesta",
      })
    }
  }

  const handleDeleteAnswer = async (answerId: string) => {
    Alert.alert("Eliminar respuesta", "¿Estás seguro de que quieres eliminar esta respuesta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await courseClient.delete(`/forum/questions/${question.id}/answers/${answerId}?authorId=${currentUserId}`, {
              headers: {
                Authorization: `Bearer ${authState?.token}`,
              },
            })

            setAnswers((prev) => prev.filter((answer) => answer.id !== answerId))

            Toast.show({
              type: "success",
              text1: "Respuesta eliminada",
              text2: "La respuesta ha sido eliminada exitosamente",
            })
          } catch (error) {
            console.error("Error deleting answer:", error)
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "No se pudo eliminar la respuesta",
            })
          }
        },
      },
    ])
  }

  const handleAnswerCreated = () => {
    setShowCreateAnswer(false)
    fetchQuestionDetail()
    Toast.show({
      type: "success",
      text1: "Respuesta publicada",
      text2: "Tu respuesta ha sido publicada exitosamente",
    })
  }

  const getRoleBadge = (role: "teacher" | "aux_teacher" | "student") => {
    switch (role) {
      case "teacher":
        return { text: "Docente", color: "#4CAF50", bgColor: "#e8f5e8" }
      case "aux_teacher":
        return { text: "Aux. Docente", color: "#FF9800", bgColor: "#fff3e0" }
      case "student":
        return { text: "Estudiante", color: "#2196F3", bgColor: "#e3f2fd" }
    }
  }

  const questionAuthor = userRoles.get(questionData.author_id)
  const isQuestionAuthor = currentUserId === questionData.author_id
  const canAcceptAnswers = isQuestionAuthor

  const renderQuestionHeader = () => {
    const roleBadge = questionAuthor ? getRoleBadge(questionAuthor.role) : null

    return (
      <View style={styles.questionContainer}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <AntDesign name="arrowleft" size={20} color="#007AFF" />
          <Text style={styles.backText}>Volver al foro</Text>
        </TouchableOpacity>

        {/* Question content */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionTitle}>{questionData.title}</Text>
            <View style={styles.questionMeta}>
              <View style={styles.authorInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {questionAuthor ? `${questionAuthor.name.charAt(0)}${questionAuthor.surname.charAt(0)}` : "?"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.authorName}>
                    {questionAuthor ? `${questionAuthor.name} ${questionAuthor.surname}` : "Usuario desconocido"}
                  </Text>
                  {roleBadge && (
                    <View style={[styles.roleBadge, { backgroundColor: roleBadge.bgColor }]}>
                      <Text style={[styles.roleBadgeText, { color: roleBadge.color }]}>{roleBadge.text}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.questionDate}>
                {new Date(questionData.created_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>

          <Text style={styles.questionDescription}>{questionData.description}</Text>

          {/* Tags */}
          {questionData.tags && questionData.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {questionData.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Question actions */}
          <View style={styles.questionActions}>
            <View style={styles.voteContainer}>
              <TouchableOpacity
                style={styles.voteButton}
                onPress={() => handleVoteQuestion(1)}
                disabled={!currentUserId}
              >
                <AntDesign name="up" size={20} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.voteCount}>{questionData.vote_count}</Text>
              <TouchableOpacity
                style={styles.voteButton}
                onPress={() => handleVoteQuestion(-1)}
                disabled={!currentUserId}
              >
                <AntDesign name="down" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <MaterialIcons name="question-answer" size={16} color="#666" />
                <Text style={styles.statText}>{answers.length} respuestas</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: questionData.status === "open" ? "#e8f5e8" : "#ffeaea" },
                ]}
              >
                <Text style={[styles.statusText, { color: questionData.status === "open" ? "#2e7d32" : "#d32f2f" }]}>
                  {questionData.status === "open" ? "Abierta" : "Cerrada"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    )
  }

  const renderAnswer = ({ item }: { item: ForumAnswer }) => (
    <AnswerCard
      answer={item}
      userRole={userRoles.get(item.author_id)}
      onVote={(voteType) => handleVoteAnswer(item.id, voteType)}
      onAccept={() => handleAcceptAnswer(item.id)}
      onDelete={() => handleDeleteAnswer(item.id)}
      canAccept={canAcceptAnswers && !questionData.accepted_answer_id}
      canDelete={currentUserId === item.author_id || isTeacher}
      currentUserId={currentUserId}
      isAccepted={item.is_accepted}
    />
  )

  const renderAnswersHeader = () => (
    <View style={styles.answersHeader}>
      <Text style={styles.answersTitle}>
        {answers.length} {answers.length === 1 ? "Respuesta" : "Respuestas"}
      </Text>
      <TouchableOpacity style={styles.addAnswerButton} onPress={() => setShowCreateAnswer(true)}>
        <AntDesign name="plus" size={16} color="#fff" />
        <Text style={styles.addAnswerText}>Responder</Text>
      </TouchableOpacity>
    </View>
  )

  const renderEmpty = () => (
    <View style={styles.emptyAnswers}>
      <MaterialIcons name="question-answer" size={48} color="#ccc" />
      <Text style={styles.emptyAnswersTitle}>No hay respuestas aún</Text>
      <Text style={styles.emptyAnswersSubtitle}>Sé el primero en responder esta pregunta</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={answers}
        keyExtractor={(item) => item.id}
        renderItem={renderAnswer}
        ListHeaderComponent={
          <View>
            {renderQuestionHeader()}
            {renderAnswersHeader()}
          </View>
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={answers.length === 0 ? styles.emptyList : undefined}
      />

      <CreateAnswerModal
        visible={showCreateAnswer}
        questionId={questionData.id}
        onClose={() => setShowCreateAnswer(false)}
        onSuccess={handleAnswerCreated}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  questionContainer: {
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  questionCard: {
    padding: 16,
  },
  questionHeader: {
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    lineHeight: 26,
  },
  questionMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1976d2",
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  questionDate: {
    fontSize: 12,
    color: "#666",
    marginLeft: 12,
  },
  questionDescription: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  questionActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  voteContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  voteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
  },
  voteCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  answersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  addAnswerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addAnswerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  emptyAnswers: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  emptyAnswersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyAnswersSubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  emptyList: {
    flexGrow: 1,
  },
})
