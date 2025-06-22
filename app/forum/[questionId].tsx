"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { AntDesign } from "@expo/vector-icons"
import { courseClient } from "@/lib/courseClient"
import { useAuth } from "@/contexts/sessionAuth"
import Toast from "react-native-toast-message"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import type { ForumQuestion, UserRole, CreateAnswerRequest } from "@/types/forum"
import React from "react"

export default function QuestionDetailScreen() {
  const { questionId, courseId } = useLocalSearchParams()
  const router = useRouter()
  const auth = useAuth()
  const authState = auth?.authState

  const [question, setQuestion] = useState<ForumQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAnswerModal, setShowAnswerModal] = useState(false)
  const [answerText, setAnswerText] = useState("")
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const [userRoles, setUserRoles] = useState<Map<string, UserRole>>(new Map())
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null)
  const [editAnswerText, setEditAnswerText] = useState("")

  useEffect(() => {
    if (questionId && authState?.token) {
      fetchQuestion()
      // In a real app, you'd fetch course members here too
      // For now, we'll use mock data or fetch from course context
    }
  }, [questionId, authState?.token])

  const fetchQuestion = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const { data } = await courseClient.get(`/forum/questions/${questionId}`, {
        headers: {
          Authorization: `Bearer ${authState?.token}`,
        },
      })

      setQuestion(data)
    } catch (error) {
      console.error("Error fetching question:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo cargar la pregunta",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleVoteQuestion = async (voteType: 1 | -1) => {
    if (!question || question.author_id === authState?.user?.id) return

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

      setQuestion((prev) =>
        prev
          ? {
              ...prev,
              vote_count: prev.vote_count + voteType,
            }
          : null,
      )

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
    const answer = question?.answers?.find((a) => a.id === answerId)
    if (!answer || answer.author_id === authState?.user?.id) return

    try {
      await courseClient.post(
        `/forum/questions/${questionId}/answers/${answerId}/vote`,
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

      setQuestion((prev) =>
        prev
          ? {
              ...prev,
              answers: prev.answers?.map((a) =>
                a.id === answerId ? { ...a, vote_count: a.vote_count + voteType } : a,
              ),
            }
          : null,
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

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "La respuesta no puede estar vacía",
      })
      return
    }

    try {
      setSubmittingAnswer(true)

      const requestBody: CreateAnswerRequest = {
        content: answerText.trim(),
        author_id: authState?.user?.id || "",
      }

      const { data } = await courseClient.post(`/forum/questions/${questionId}/answers`, requestBody, {
        headers: {
          Authorization: `Bearer ${authState?.token}`,
        },
      })

      setQuestion((prev) =>
        prev
          ? {
              ...prev,
              answers: [...(prev.answers || []), data],
              answer_count: prev.answer_count + 1,
            }
          : null,
      )

      setAnswerText("")
      setShowAnswerModal(false)

      Toast.show({
        type: "success",
        text1: "Respuesta publicada",
        text2: "Tu respuesta ha sido agregada exitosamente",
      })
    } catch (error) {
      console.error("Error submitting answer:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo publicar la respuesta",
      })
    } finally {
      setSubmittingAnswer(false)
    }
  }

  const handleAcceptAnswer = async (answerId: string) => {
    if (question?.author_id !== authState?.user?.id) return

    try {
      await courseClient.post(
        `/forum/questions/${questionId}/answers/${answerId}/accept?authorId=${authState.user?.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authState?.token}`,
          },
        },
      )

      setQuestion((prev) =>
        prev
          ? {
              ...prev,
              accepted_answer_id: answerId,
              answers: prev.answers?.map((a) => ({
                ...a,
                is_accepted: a.id === answerId,
              })),
            }
          : null,
      )

      Toast.show({
        type: "success",
        text1: "Respuesta aceptada",
        text2: "Has marcado esta respuesta como la solución",
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

  const handleDeleteAnswer = (answerId: string) => {
    Alert.alert("Eliminar respuesta", "¿Estás seguro de que quieres eliminar esta respuesta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => confirmDeleteAnswer(answerId),
      },
    ])
  }

  const confirmDeleteAnswer = async (answerId: string) => {
    try {
      await courseClient.delete(`/forum/questions/${questionId}/answers/${answerId}?authorId=${authState?.user?.id}`, {
        headers: {
          Authorization: `Bearer ${authState?.token}`,
        },
      })

      setQuestion((prev) =>
        prev
          ? {
              ...prev,
              answers: prev.answers?.filter((a) => a.id !== answerId),
              answer_count: prev.answer_count - 1,
            }
          : null,
      )

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
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "teacher":
        return "Docente Titular"
      case "aux_teacher":
        return "Docente Auxiliar"
      case "student":
        return "Estudiante"
      default:
        return "Usuario"
    }
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "teacher":
        return "#4CAF50"
      case "aux_teacher":
        return "#FF9800"
      case "student":
        return "#2196F3"
      default:
        return "#666"
    }
  }

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.loadingContainer}>
          <Text>Cargando pregunta...</Text>
        </View>
      </ScreenLayout>
    )
  }

  if (!question) {
    return (
      <ScreenLayout>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se pudo cargar la pregunta</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    )
  }

  const isQuestionAuthor = question.author_id === authState?.user?.id
  const userRole = userRoles.get(question.author_id)

  return (
    <ScreenLayout padded={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pregunta</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchQuestion(true)} colors={["#007AFF"]} />
        }
      >
        {/* Question Card */}
        <View style={styles.questionCard}>
          {/* Question Header */}
          <View style={styles.questionHeader}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: getRoleColor(userRole?.role) + "20" }]}>
                <Text style={[styles.avatarText, { color: getRoleColor(userRole?.role) }]}>
                  {userRole?.name?.charAt(0) || "?"}
                  {userRole?.surname?.charAt(0) || ""}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {userRole ? `${userRole.name} ${userRole.surname}` : "Usuario desconocido"}
                </Text>
                <View style={styles.roleContainer}>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(userRole?.role) }]}>
                    <Text style={styles.roleText}>{getRoleLabel(userRole?.role)}</Text>
                  </View>
                  {isQuestionAuthor && (
                    <View style={styles.ownBadge}>
                      <Text style={styles.ownText}>Tu pregunta</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <Text style={styles.dateText}>{formatDate(question.created_at)}</Text>
          </View>

          {/* Question Content */}
          <Text style={styles.questionTitle}>{question.title}</Text>
          <Text style={styles.questionDescription}>{question.description}</Text>

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {question.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Question Actions */}
          <View style={styles.questionActions}>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <AntDesign name="message1" size={16} color="#666" />
                <Text style={styles.statText}>{question.answer_count} respuestas</Text>
              </View>
              <View style={styles.statItem}>
                <AntDesign name="like2" size={16} color="#666" />
                <Text style={styles.statText}>{question.vote_count} votos</Text>
              </View>
            </View>

            <View style={styles.voteButtons}>
              <TouchableOpacity
                style={styles.voteButton}
                onPress={() => handleVoteQuestion(1)}
                disabled={isQuestionAuthor}
              >
                <AntDesign name="like2" size={20} color={isQuestionAuthor ? "#ccc" : "#4CAF50"} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.voteButton}
                onPress={() => handleVoteQuestion(-1)}
                disabled={isQuestionAuthor}
              >
                <AntDesign name="dislike2" size={20} color={isQuestionAuthor ? "#ccc" : "#f44336"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Answers Section */}
        <View style={styles.answersSection}>
          <View style={styles.answersSectionHeader}>
            <Text style={styles.answersTitle}>Respuestas ({question.answers?.length || 0})</Text>
            <TouchableOpacity style={styles.addAnswerButton} onPress={() => setShowAnswerModal(true)}>
              <AntDesign name="plus" size={16} color="#007AFF" />
              <Text style={styles.addAnswerText}>Responder</Text>
            </TouchableOpacity>
          </View>

          {question.answers && question.answers.length > 0 ? (
            question.answers
              .sort((a, b) => {
                // Accepted answer first
                if (a.is_accepted && !b.is_accepted) return -1
                if (!a.is_accepted && b.is_accepted) return 1
                // Then by vote count
                return b.vote_count - a.vote_count
              })
              .map((answer) => {
                const answerUserRole = userRoles.get(answer.author_id)
                const isAnswerAuthor = answer.author_id === authState?.user?.id

                return (
                  <View key={answer.id} style={[styles.answerCard, answer.is_accepted && styles.acceptedAnswerCard]}>
                    {/* Answer Header */}
                    <View style={styles.answerHeader}>
                      <View style={styles.userInfo}>
                        <View style={[styles.avatar, { backgroundColor: getRoleColor(answerUserRole?.role) + "20" }]}>
                          <Text style={[styles.avatarText, { color: getRoleColor(answerUserRole?.role) }]}>
                            {answerUserRole?.name?.charAt(0) || "?"}
                            {answerUserRole?.surname?.charAt(0) || ""}
                          </Text>
                        </View>
                        <View style={styles.userDetails}>
                          <Text style={styles.userName}>
                            {answerUserRole
                              ? `${answerUserRole.name} ${answerUserRole.surname}`
                              : "Usuario desconocido"}
                          </Text>
                          <View style={styles.roleContainer}>
                            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(answerUserRole?.role) }]}>
                              <Text style={styles.roleText}>{getRoleLabel(answerUserRole?.role)}</Text>
                            </View>
                            {isAnswerAuthor && (
                              <View style={styles.ownBadge}>
                                <Text style={styles.ownText}>Tu respuesta</Text>
                              </View>
                            )}
                            {answer.is_accepted && (
                              <View style={styles.acceptedBadge}>
                                <AntDesign name="checkcircle" size={12} color="#4CAF50" />
                                <Text style={styles.acceptedText}>Aceptada</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                      <Text style={styles.dateText}>{formatDate(answer.created_at)}</Text>
                    </View>

                    {/* Answer Content */}
                    <Text style={styles.answerContent}>{answer.content}</Text>

                    {/* Answer Actions */}
                    <View style={styles.answerActions}>
                      <View style={styles.answerStats}>
                        <View style={styles.statItem}>
                          <AntDesign name="like2" size={14} color="#666" />
                          <Text style={styles.statText}>{answer.vote_count} votos</Text>
                        </View>
                      </View>

                      <View style={styles.answerButtons}>
                        {/* Vote buttons */}
                        <TouchableOpacity
                          style={styles.voteButton}
                          onPress={() => handleVoteAnswer(answer.id, 1)}
                          disabled={isAnswerAuthor}
                        >
                          <AntDesign name="like2" size={16} color={isAnswerAuthor ? "#ccc" : "#4CAF50"} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.voteButton}
                          onPress={() => handleVoteAnswer(answer.id, -1)}
                          disabled={isAnswerAuthor}
                        >
                          <AntDesign name="dislike2" size={16} color={isAnswerAuthor ? "#ccc" : "#f44336"} />
                        </TouchableOpacity>

                        {/* Accept button (only for question author) */}
                        {isQuestionAuthor && !answer.is_accepted && (
                          <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptAnswer(answer.id)}>
                            <AntDesign name="checkcircle" size={16} color="#4CAF50" />
                            <Text style={styles.acceptButtonText}>Aceptar</Text>
                          </TouchableOpacity>
                        )}

                        {/* Delete button (only for answer author) */}
                        {isAnswerAuthor && (
                          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteAnswer(answer.id)}>
                            <AntDesign name="delete" size={16} color="#f44336" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                )
              })
          ) : (
            <View style={styles.noAnswersContainer}>
              <AntDesign name="message1" size={48} color="#ccc" />
              <Text style={styles.noAnswersTitle}>No hay respuestas aún</Text>
              <Text style={styles.noAnswersSubtitle}>Sé el primero en responder a esta pregunta</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Answer Modal */}
      <Modal
        visible={showAnswerModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAnswerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.answerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escribir Respuesta</Text>
              <TouchableOpacity onPress={() => setShowAnswerModal(false)} style={styles.modalCloseButton}>
                <AntDesign name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.answerInput}
              value={answerText}
              onChangeText={setAnswerText}
              placeholder="Escribe tu respuesta aquí..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.charCount}>{answerText.length}/2000</Text>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAnswerModal(false)}
                disabled={submittingAnswer}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitButton, submittingAnswer && styles.modalSubmitButtonDisabled]}
                onPress={handleSubmitAnswer}
                disabled={submittingAnswer || !answerText.trim()}
              >
                <Text style={styles.modalSubmitText}>{submittingAnswer ? "Publicando..." : "Publicar Respuesta"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerRight: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 20,
    textAlign: "center",
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  questionCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
  },
  ownBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ownText: {
    color: "#1976d2",
    fontSize: 10,
    fontWeight: "500",
  },
  acceptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  acceptedText: {
    color: "#4CAF50",
    fontSize: 10,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    lineHeight: 28,
  },
  questionDescription: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
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
    borderTopColor: "#f0f0f0",
  },
  stats: {
    flexDirection: "row",
    gap: 20,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  voteButtons: {
    flexDirection: "row",
    gap: 12,
  },
  voteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  answersSection: {
    margin: 16,
    marginTop: 0,
  },
  answersSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  addAnswerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addAnswerText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  answerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  acceptedAnswerCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
    backgroundColor: "#f8fff8",
  },
  answerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  answerContent: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginBottom: 12,
  },
  answerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  answerStats: {
    flexDirection: "row",
  },
  answerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  acceptButtonText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#ffeaea",
  },
  noAnswersContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  noAnswersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  noAnswersSubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  answerModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  answerInput: {
    margin: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
    height: 150,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginHorizontal: 20,
    marginTop: -10,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  modalSubmitButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  modalSubmitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
})
