"use client"

import { useLocalSearchParams, useRouter } from "expo-router"
import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import { MaterialIcons, FontAwesome } from "@expo/vector-icons"
import { courseClient } from "@/lib/courseClient"
import { useAuth } from "@/contexts/sessionAuth"
import { SafeAreaView } from "react-native"
import Toast from "react-native-toast-message"
import type { Assignment } from "@/app/course/[id]/CourseViewScreen"
import React from "react"

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const auth = useAuth()
  const authState = auth?.authState

  useEffect(() => {
    fetchAssignment()
  }, [id])

  const fetchAssignment = async () => {
    try {
      setLoading(true)
      if (!authState?.token) {
        throw new Error("No auth token available")
      }
      const { data } = await courseClient.get(`/assignments/${id}`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      })
      setAssignment(data)
    } catch (e) {
      console.error("Error fetching assignment:", e)
      Toast.show({ type: "error", text1: "No se pudo cargar la tarea" })
    } finally {
      setLoading(false)
    }
  }

  const handleStartExam = () => {
    if (assignment?.type === "exam" && assignment.time_limit) {
      router.push(`/exam/${assignment.id}`)
    } else {
      router.push(`/task/${assignment.id}`)
    }
  }

  const handleDownload = () => {
    // Implementar descarga
    Toast.show({ type: "success", text1: "Descargando..." })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const canStartActivity = () => {
    return !assignment?.submission || assignment.submission.status === "draft"
  }

  const getActionButtonText = () => {
    if (!assignment?.submission) {
      return assignment?.type === "exam" ? "Iniciar examen" : "Iniciar tarea"
    }
    if (assignment.submission.status === "draft") {
      return assignment.type === "exam" ? "Continuar examen" : "Continuar tarea"
    }
    return "Ver respuestas"
  }

  const getSubmissionStatusColor = (status: "draft" | "submitted" | "late") => {
    switch (status) {
      case "submitted":
        return "#4CAF50"
      case "late":
        return "#F44336"
      case "draft":
        return "#FF9800"
      default:
        return "#666"
    }
  }

  const getSubmissionStatusText = (status: "draft" | "submitted" | "late") => {
    switch (status) {
      case "submitted":
        return "Entregado exitosamente"
      case "late":
        return "Entrega tardía"
      case "draft":
        return "Borrador guardado"
      default:
        return "Sin entrega"
    }
  }

  const renderSubmissionAnswers = () => {
      if (!assignment.submission?.answers || assignment.submission.answers.length === 0) {
        return (
          <View style={styles.submissionAnswersSection}>
            <Text style={styles.sectionTitle}>Estado de entrega</Text>
            <View style={styles.noAnswersCard}>
              <MaterialIcons name="info" size={20} color="#666" />
              <Text style={styles.noAnswersText}>
                {assignment.submission ? "No hay respuestas guardadas aún" : "No has comenzado esta actividad"}
              </Text>
            </View>
          </View>
        )
      }
  
      return (
        <View style={styles.submissionAnswersSection}>
          <Text style={styles.sectionTitle}>Mis respuestas</Text>
  
          {/* Estado de la entrega */}
          <View
            style={[
              styles.submissionStatusCard,
              { borderLeftColor: getSubmissionStatusColor(assignment.submission.status) },
            ]}
          >
            <View style={styles.submissionStatusHeader}>
              <MaterialIcons
                name={
                  assignment.submission.status === "submitted"
                    ? "check-circle"
                    : assignment.submission.status === "late"
                      ? "schedule"
                      : "edit"
                }
                size={20}
                color={getSubmissionStatusColor(assignment.submission.status)}
              />
              <Text
                style={[styles.submissionStatusText, { color: getSubmissionStatusColor(assignment.submission.status) }]}
              >
                {getSubmissionStatusText(assignment.submission.status)}
              </Text>
            </View>
            {assignment.submission.submitted_at && (
              <Text style={styles.submissionDate}>Entregado el {formatDate(assignment.submission.submitted_at)}</Text>
            )}
          </View>
  
          {/* Respuestas */}
          <View style={styles.answersContainer}>
            {assignment.submission.answers.map((answer, index) => {
              const question = assignment.questions.find((q) => q.id === answer.question_id)
              return (
                <View key={`${answer.question_id}-${index}`} style={styles.answerCard}>
                  <View style={styles.answerHeader}>
                    <MaterialIcons
                      name={
                        question?.type === "multiple_choice"
                          ? "radio-button-checked"
                          : question?.type === "file"
                            ? "attach-file"
                            : "edit"
                      }
                      size={16}
                      color="#007AFF"
                    />
                    <Text style={styles.answerQuestionNumber}>Pregunta {index + 1}</Text>
                    <View style={styles.questionTypeChip}>
                      <Text style={styles.questionTypeText}>
                        {question?.type === "multiple_choice"
                          ? "Opción múltiple"
                          : question?.type === "file"
                            ? "Archivo"
                            : "Texto"}
                      </Text>
                    </View>
                  </View>
  
                  <Text style={styles.answerQuestionText}>{question?.text}</Text>
  
                  <View style={styles.answerContent}>
                    <Text style={styles.answerLabel}>Mi respuesta:</Text>
                    {answer.content ? (
                      <View style={styles.answerValueContainer}>
                        <Text style={styles.answerValue}>{answer.content}</Text>
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
            })}
          </View>
  
          {/* Resumen de respuestas */}
          <View style={styles.answersSummary}>
            <Text style={styles.summaryTitle}>Resumen</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{assignment.submission.answers.filter((a) => a.content).length}</Text>
                <Text style={styles.summaryLabel}>Respondidas</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{assignment.questions.length}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {Math.round(
                    (assignment.submission.answers.filter((a) => a.content).length / assignment.questions.length) * 100,
                  )}
                  %
                </Text>
                <Text style={styles.summaryLabel}>Completado</Text>
              </View>
            </View>
          </View>
        </View>
      )
    }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Cargando detalles...</Text>
      </SafeAreaView>
    )
  }

  if (!assignment) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>No se encontró la tarea</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header fijo */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles de la actividad</Text>
        <TouchableOpacity onPress={handleDownload} style={styles.downloadButton}>
          <MaterialIcons name="download" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Contenido scrolleable */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <MaterialIcons name={assignment.type === "exam" ? "quiz" : "assignment"} size={24} color="#007AFF" />
            <Text style={styles.title}>{assignment.title}</Text>
          </View>
          <Text style={styles.courseName}>{assignment.course_name}</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <FontAwesome name="clock-o" size={16} color="#666" />
            <Text style={styles.infoLabel}>Fecha límite:</Text>
            <Text style={styles.infoValue}>{formatDate(assignment.due_date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="category" size={16} color="#666" />
            <Text style={styles.infoLabel}>Tipo:</Text>
            <Text style={styles.infoValue}>{assignment.type === "exam" ? "Examen" : "Tarea"}</Text>
          </View>

          {assignment.type === "exam" && assignment.time_limit && (
            <View style={styles.infoRow}>
              <MaterialIcons name="timer" size={16} color="#666" />
              <Text style={styles.infoLabel}>Tiempo límite:</Text>
              <Text style={styles.infoValue}>{assignment.time_limit} minutos</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <MaterialIcons name="help" size={16} color="#666" />
            <Text style={styles.infoLabel}>Preguntas:</Text>
            <Text style={styles.infoValue}>{assignment.questions.length}</Text>
          </View>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{assignment.description}</Text>
        </View>

        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>Instrucciones</Text>
          <Text style={styles.instructions}>{assignment.instructions}</Text>
        </View>

        {renderSubmissionAnswers()}

        {assignment.type === "exam" && (
          <View style={styles.warningSection}>
            <MaterialIcons name="warning" size={20} color="#FF9800" />
            <Text style={styles.warningText}>
              Este es un examen con tiempo limitado. Una vez iniciado, el contador comenzará y no podrás pausarlo.
              Asegúrate de tener una conexión estable a internet.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer fijo */}
      <View style={styles.footer}>
        {canStartActivity() && (
          <TouchableOpacity
            style={[styles.actionButton, assignment.type === "exam" && styles.examButton]}
            onPress={handleStartExam}
          >
            <MaterialIcons name={assignment.type === "exam" ? "play-arrow" : "edit"} size={20} color="#fff" />
            <Text style={styles.actionButtonText}>{getActionButtonText()}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  backButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
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
  },
  downloadButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 16,
    backgroundColor: "#fff",
  },
  titleSection: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
    marginBottom: 12,
  },
  infoSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    minWidth: 100,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  instructionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  instructions: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  submissionAnswersSection: {
    marginBottom: 24,
  },
  noAnswersCard: {
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
    flex: 1,
  },
  submissionStatusCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  submissionStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  submissionStatusText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  submissionDate: {
    fontSize: 12,
    color: "#666",
    marginLeft: 28,
  },
  answersContainer: {
    marginBottom: 16,
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
  questionTypeChip: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  questionTypeText: {
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
  answersSummary: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e9ecef",
  },
  warningSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  warningText: {
    fontSize: 14,
    color: "#856404",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  examButton: {
    backgroundColor: "#FF9800",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  secondaryButton: {
    alignItems: "center",
    padding: 16,
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 16,
  },
})
