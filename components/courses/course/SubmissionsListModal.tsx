"use client"

import React, { useState, useEffect } from "react"
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { MaterialIcons, FontAwesome } from "@expo/vector-icons"
import { courseClient } from "@/lib/courseClient"
import Toast from "react-native-toast-message"
import { useAuth } from "@/contexts/sessionAuth"
import type { Assignment, StudentSubmission } from "@/app/course/[id]/CourseViewScreen"

interface Props {
  visible: boolean
  assignment: Assignment | null
  onClose: () => void
  onGradeSubmission: (submission: StudentSubmission) => void
}

interface SubmissionWithStudent extends StudentSubmission {
  student_name?: string
  student_email?: string
}

export function SubmissionsListModal({ visible, assignment, onClose, onGradeSubmission }: Props) {
  const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const authContext = useAuth()
  const authState = authContext?.authState

  useEffect(() => {
    if (visible && assignment) {
      fetchSubmissions()
    }
  }, [visible, assignment])

  const fetchSubmissions = async () => {
    if (!assignment || !authState?.token) return

    try {
      setLoading(true)

      const { data: submissions } = await courseClient.get(`/assignments/${assignment.id}/submissions`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      })

      const studentIds = Array.from(
        new Set(submissions.map((s: StudentSubmission) => s.student_uuid).filter(Boolean))
      )

      const { data: usersResponse } = await courseClient.post(
        `/users/batch`,
        { user_ids: studentIds },
        {
          headers: {
            Authorization: `Bearer ${authState.token}`,
          },
        }
      )

      const usersData = usersResponse.data || []

      const userMap = Object.fromEntries(
        usersData.map((user: any) => [user.uid, user])
      )

      const enrichedSubmissions = submissions.map((submission: StudentSubmission) => {
        const user = userMap[submission.student_uuid]
        return {
          ...submission,
          student_name: user ? `${user.name} ${user.surname}` : "Desconocido",
          student_email: user?.email || "",
        }
      })

      setSubmissions(enrichedSubmissions)
    } catch (error) {
      console.error("Error fetching submissions:", error)
      Toast.show({
        type: "error",
        text1: "Error al cargar entregas",
        text2: "No se pudieron cargar las entregas",
      })
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchSubmissions()
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "submitted":
        return "Entregado"
      case "late":
        return "Entrega tardía"
      case "draft":
        return "Borrador"
      default:
        return "Sin entrega"
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

  const renderSubmissionCard = (submission: SubmissionWithStudent) => {
    const isGraded = submission.score !== undefined && submission.score !== null
    const totalPoints = assignment?.questions.reduce((sum, q) => sum + (q.points || 0), 0) || 0

    return (
      <View key={submission.id} style={styles.submissionCard}>
        <View style={styles.submissionHeader}>
          <View style={styles.studentInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {submission.student_name?.charAt(0) || "E"}
              </Text>
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>{submission.student_name || "Estudiante"}</Text>
              <Text style={styles.studentEmail}>{submission.student_email || ""}</Text>
            </View>
          </View>

          <View style={styles.submissionStatus}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) }]}>
              <Text style={styles.statusText}>{getStatusText(submission.status)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.submissionDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="schedule" size={16} color="#666" />
            <Text style={styles.detailLabel}>Entregado:</Text>
            <Text style={styles.detailValue}>{formatDate(submission.submitted_at)}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="assignment" size={16} color="#666" />
            <Text style={styles.detailLabel}>Respuestas:</Text>
            <Text style={styles.detailValue}>
              {submission.answers?.length || 0} de {assignment?.questions.length || 0}
            </Text>
          </View>

          {isGraded && (
            <>
              <View style={styles.detailRow}>
                <MaterialIcons name="grade" size={16} color="#4CAF50" />
                <Text style={styles.detailLabel}>Calificación:</Text>
                <Text style={[styles.detailValue, styles.gradeValue]}>
                  {submission.score}/{totalPoints} puntos
                </Text>
              </View>

              {submission.feedback && (
                <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackLabel}>Retroalimentación:</Text>
                  <Text style={styles.feedbackText} numberOfLines={3}>
                    {submission.feedback}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.submissionActions}>
          <TouchableOpacity
            style={[styles.gradeButton, isGraded && styles.editGradeButton]}
            onPress={() => onGradeSubmission(submission)}
          >
            <MaterialIcons 
              name={isGraded ? "edit" : "grade"} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.gradeButtonText}>
              {isGraded ? "Editar Calificación" : "Calificar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (!assignment) return null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Entregas - {assignment.title}</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{submissions.length}</Text>
            <Text style={styles.statLabel}>Total Entregas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {submissions.filter(s => s.score !== undefined && s.score !== null).length}
            </Text>
            <Text style={styles.statLabel}>Calificadas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {submissions.filter(s => s.status === "submitted").length}
            </Text>
            <Text style={styles.statLabel}>Entregadas</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Cargando entregas...</Text>
            </View>
          ) : submissions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="assignment" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No hay entregas</Text>
              <Text style={styles.emptyStateDescription}>
                Los estudiantes aún no han entregado esta actividad
              </Text>
            </View>
          ) : (
            submissions.map(renderSubmissionCard)
          )}
        </ScrollView>
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
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e9ecef",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  submissionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  submissionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  studentEmail: {
    fontSize: 14,
    color: "#666",
  },
  submissionStatus: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  submissionDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  gradeValue: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  feedbackContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  feedbackLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 18,
  },
  submissionActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  gradeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editGradeButton: {
    backgroundColor: "#FF9800",
  },
  gradeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
})
