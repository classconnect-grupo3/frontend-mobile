"use client"

import React, { useState, useEffect } from "react"
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { courseClient } from "@/lib/courseClient"
import Toast from "react-native-toast-message"
import { useAuth } from "@/contexts/sessionAuth"
import type { Assignment } from "@/app/course/[id]/CourseViewScreen"

interface SubmissionWithStudent {
  assignment_id: string
  id: string
  status: "draft" | "submitted" | "late"
  submitted_at?: string
  content: string
  score?: number
  feedback?: string
  graded_at?: string
  student_name?: string
  student_email?: string
  answers?: {
    id: string
    content: string
    question_id: string
    type: string
  }[]
}

interface Props {
  visible: boolean
  assignment: Assignment | null
  submission: SubmissionWithStudent | null
  onClose: () => void
  onGradeSuccess: () => void
}

export function GradeSubmissionModal({ visible, assignment, submission, onClose, onGradeSuccess }: Props) {
  const [score, setScore] = useState("")
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const authContext = useAuth()
  const authState = authContext?.authState

  useEffect(() => {
    if (submission) {
      setScore(submission.score?.toString() || "")
      setFeedback(submission.feedback || "")
    }
  }, [submission])

  if (!assignment || !submission) return null

  const totalPoints = assignment.questions.reduce((sum, q) => sum + (q.points || 0), 0)
  const currentScore = parseInt(score) || 0
  const isScoreValid = currentScore >= 0 && currentScore <= totalPoints

  const handleSaveGrade = async () => {
    if (!isScoreValid) {
      Alert.alert(
        "Puntuación inválida",
        `La puntuación debe estar entre 0 y ${totalPoints} puntos`,
        [{ text: "OK" }]
      )
      return
    }

    try {
      setIsSubmitting(true)

      await courseClient.put(
        `/assignments/${assignment.id}/submissions/${submission.id}/grade`,
        {
          score: currentScore,
          feedback: feedback.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${authState?.token}`,
            "X-Teacher-UUID": authState.user?.id,
          },
        }
      )

      Toast.show({
        type: "success",
        text1: "Calificación guardada",
        text2: `${submission.student_name} ha sido calificado`,
      })

      onGradeSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving grade:", error)
      console.log("Error details:", error.response?.data || error.message)
      Toast.show({
        type: "error",
        text1: "Error al guardar calificación",
        text2: "Intente nuevamente",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No entregado"
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return "radio-button-checked"
      case "file":
        return "attach-file"
      default:
        return "edit"
    }
  }

  const handleOpenFile = (url: string) => {
    if (!url) return

    Linking.openURL(url).catch((err) => {
      console.error("Error al abrir el archivo:", err)
      Toast.show({
        type: "error",
        text1: "No se pudo abrir el archivo",
        text2: "Intente nuevamente",
      })
    })
  }

  const renderAnswer = (answer: any, index: number) => {
    const question = assignment.questions.find(q => q.id === answer.question_id)
    
    return (
      <View key={`${answer.question_id}-${index}`} style={styles.answerCard}>
        <View style={styles.answerHeader}>
          <MaterialIcons
            name={getQuestionTypeIcon(question?.type || "text")}
            size={16}
            color="#007AFF"
          />
          <Text style={styles.answerQuestionNumber}>Pregunta {index + 1}</Text>
          <View style={styles.questionPointsChip}>
            <Text style={styles.questionPointsText}>{question?.points || 0} pts</Text>
          </View>
        </View>

        <Text style={styles.answerQuestionText}>{question?.text}</Text>

        <View style={styles.answerContent}>
          <Text style={styles.answerLabel}>Respuesta del estudiante:</Text>
          {answer.content ? (
            <View style={styles.answerValueContainer}>
              {question?.type === "file" && answer.content.startsWith("http") ? (
                <TouchableOpacity
                  style={styles.fileLink}
                  onPress={() => handleOpenFile(answer.content)}
                >
                  <MaterialIcons name="insert-drive-file" size={20} color="#007AFF" />
                  <Text style={styles.fileLinkText}>Ver archivo adjunto</Text>
                  <MaterialIcons name="open-in-new" size={16} color="#007AFF" />
                </TouchableOpacity>
              ) : (
                <Text style={styles.answerValue}>{answer.content}</Text>
              )}
            </View>
          ) : (
            <View style={styles.noAnswerContainer}>
              <MaterialIcons name="help-outline" size={16} color="#999" />
              <Text style={styles.noAnswerText}>Sin respuesta</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calificar Entrega</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Student Info */}
          <View style={styles.studentSection}>
            <View style={styles.studentHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {submission.student_name?.charAt(0) || "E"}
                </Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{submission.student_name || "Estudiante"}</Text>
                <Text style={styles.studentEmail}>{submission.student_email || ""}</Text>
                <Text style={styles.submissionDate}>
                  Entregado: {formatDate(submission.submitted_at)}
                </Text>
              </View>
            </View>
          </View>

          {/* Assignment Info */}
          <View style={styles.assignmentSection}>
            <Text style={styles.sectionTitle}>{assignment.title}</Text>
            <Text style={styles.assignmentMeta}>
              {assignment.questions.length} preguntas • {totalPoints} puntos totales
            </Text>
          </View>

          {/* Grading Section */}
          <View style={styles.gradingSection}>
            <Text style={styles.sectionTitle}>Calificación</Text>
            
            <View style={styles.scoreInputContainer}>
              <Text style={styles.scoreLabel}>Puntuación:</Text>
              <View style={styles.scoreInputWrapper}>
                <TextInput
                  style={[styles.scoreInput, !isScoreValid && styles.scoreInputError]}
                  value={score}
                  onChangeText={setScore}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <Text style={styles.scoreSuffix}>/ {totalPoints} puntos</Text>
              </View>
            </View>

            {!isScoreValid && score !== "" && (
              <Text style={styles.errorText}>
                La puntuación debe estar entre 0 y {totalPoints}
              </Text>
            )}

            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackLabel}>Retroalimentación:</Text>
              <TextInput
                style={styles.feedbackInput}
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Escriba comentarios para el estudiante..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Student Answers */}
          <View style={styles.answersSection}>
            <Text style={styles.sectionTitle}>Respuestas del Estudiante</Text>
            
            {submission.answers && submission.answers.length > 0 ? (
              console.log("Rendering answers:", submission.answers) || (
              submission.answers.map(renderAnswer) )
            ) : (
              <View style={styles.noAnswersContainer}>
                <MaterialIcons name="info" size={20} color="#666" />
                <Text style={styles.noAnswersText}>No hay respuestas disponibles</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, (!isScoreValid || isSubmitting) && styles.disabledButton]}
            onPress={handleSaveGrade}
            disabled={!isScoreValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="save" size={20} color="#fff" />
            )}
            <Text style={styles.saveButtonText}>
              {isSubmitting ? "Guardando..." : "Guardar Calificación"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  studentSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  studentEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  submissionDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  assignmentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  assignmentMeta: {
    fontSize: 14,
    color: "#666",
  },
  gradingSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  scoreInputContainer: {
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  scoreInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
  },
  scoreInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  scoreInputError: {
    borderColor: "#F44336",
  },
  scoreSuffix: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
  },
  errorText: {
    color: "#F44336",
    fontSize: 12,
    marginTop: 4,
  },
  feedbackContainer: {
    marginTop: 8,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  feedbackInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    fontSize: 16,
    color: "#333",
    minHeight: 100,
  },
  answersSection: {
    marginBottom: 80,
  },
  answerCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  answerQuestionNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: "#007AFF",
    marginLeft: 8,
    flex: 1,
  },
  questionPointsChip: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  questionPointsText: {
    fontSize: 10,
    color: "#1976d2",
    fontWeight: "500",
  },
  answerQuestionText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
    lineHeight: 20,
  },
  answerContent: {
    marginTop: 8,
  },
  answerLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 6,
  },
  answerValueContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  answerValue: {
    fontSize: 14,
    color: "#333",
    lineHeight: 18,
  },
  noAnswerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    padding: 8,
    borderRadius: 6,
  },
  noAnswerText: {
    fontSize: 12,
    color: "#856404",
    marginLeft: 6,
    fontStyle: "italic",
  },
  noAnswersContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  noAnswersText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  fileLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f7ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  fileLinkText: {
    color: "#007AFF",
    fontSize: 14,
    marginLeft: 8,
    marginRight: "auto",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
})
