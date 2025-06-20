"use client"

import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native"
import React from "react"
import { useEffect, useState } from "react"
import { NewAssignmentModal } from "@/components/NewAssignmentModal"
import { courseClient } from "@/lib/courseClient"
import Toast from "react-native-toast-message"
import { useAuth } from "@/contexts/sessionAuth"
import { AssignmentAnswerModal } from "./AssignmentAnswerModal"
import type { Assignment } from "@/app/course/[id]/CourseViewScreen"
import { MaterialIcons, FontAwesome } from "@expo/vector-icons"
import { Picker } from "@react-native-picker/picker"
import type { AssignmentFormData } from "@/components/NewAssignmentModal"

interface Props {
  label: string
  assignments: Assignment[]
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>
  type: "exam" | "task"
  loading: boolean
  isTeacher: boolean
  onDownload?: (assignment: Assignment) => void
  onRefresh: () => void
  onSubmit: (assignmentId: string) => Promise<void>
  course_id: string
  onAddQuestions?: (assignmentId: string) => void
  onViewQuestions?: (assignmentId: string) => void
  onViewSubmissions?: (assignmentId: string) => void
}

type FilterStatus = "all" | "no_submission" | "draft" | "submitted" | "late"
type SortBy = "due_date" | "title" | "submission_status"
type AssignmentDerivedStatus = "no_submission" | "draft" | "submitted" | "late"

const ITEMS_PER_PAGE = 5

export const AssignmentsSection = ({
  label,
  assignments,
  setAssignments,
  loading,
  isTeacher,
  onDownload,
  onRefresh,
  onSubmit,
  type,
  course_id,
  onAddQuestions,
  onViewQuestions,
  onViewSubmissions,
}: Props) => {
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [assignmentModalType, setAssignmentModalType] = useState<"task" | "exam">("task")
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null)

  // Filtros y ordenamiento
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all")
  const [sortBy, setSortBy] = useState<SortBy>("due_date")
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])

  const auth = useAuth()
  const authState = auth?.authState

  // Función para determinar el estado de una tarea basado en submission y fecha
  const getDerivedStatus = (assignment: Assignment): AssignmentDerivedStatus => {
    if (!assignment.submission) return "no_submission"
    return assignment.submission.status
  }

  // Función para manejar la apertura de archivos
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

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    if (!assignments) {
      setFilteredAssignments([])
      return
    }

    let filtered = [...assignments]

    // Filtro por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((assignment) => {
        if (statusFilter === "no_submission") {
          return !assignment.submission
        }
        return assignment.submission?.status === statusFilter
      })
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "due_date":
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "submission_status":
          const statusA = a.submission?.status || "no_submission"
          const statusB = b.submission?.status || "no_submission"
          return statusA.localeCompare(statusB)
        default:
          return 0
      }
    })

    setFilteredAssignments(filtered)
    setCurrentPage(1)
  }, [assignments, statusFilter, sortBy])

  const getPaginatedAssignments = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredAssignments.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    return Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE)
  }

  const getStatusColor = (assignment: Assignment) => {
    const status = getDerivedStatus(assignment)
    switch (status) {
      case "submitted":
        return "#4CAF50"
      case "late":
        return "#F44336"
      case "draft":
        return "#FF9800"
      default:
        return "#2196F3"
    }
  }

  const getStatusText = (assignment: Assignment) => {
    const status = getDerivedStatus(assignment)
    switch (status) {
      case "submitted":
        return "Completada"
      case "late":
        return "Atrasada"
      case "draft":
        return "En draft"
      default:
        return "Pendiente"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleAddAssignment = async (data: AssignmentFormData, type: "exam" | "task") => {
    try {
      if (!authState) {
        Toast.show({ type: "error", text1: "No hay sesión de usuario" })
        return
      }

      // Determine passing score based on has_passing_score flag
      let passingScore: number | undefined = undefined
      if (type === "exam" && data.has_passing_score && data.passing_score) {
        passingScore = data.passing_score
      } else {
        passingScore = 4
      }

      const newAssignment: Omit<Assignment, "id"> = {
        course_id: course_id,
        description: data.description ? data.description : "",
        due_date: data.due_date.toISOString(),
        instructions: "default_instructions",
        questions: [],
        title: data.title,
        type: type === "task" ? "homework" : "exam",
        time_limit: data.time_limit,
        passing_score: passingScore,
      }
      console.log("Creating new assignment: ", newAssignment)
      await courseClient.post(
        `/assignments`,
        {
          course_id: newAssignment.course_id,
          description: newAssignment.description,
          due_date: newAssignment.due_date,
          instructions: newAssignment.instructions,
          passing_score: passingScore,
          questions: newAssignment.questions,
          title: newAssignment.title,
          status: "published",
          grace_period: 30, // what is grace_period?
          total_points: 100,
          type: newAssignment.type,
        },
        {
          headers: {
            Authorization: `Bearer ${authState.token}`,
          },
        },
      )

      Toast.show({ type: "success", text1: "Assignment creado" })
      onRefresh()
    } catch (e) {
      console.error("Error creando assignment:", e)
      console.log("more info: ", e.response?.data || e.message)
      Toast.show({ type: "error", text1: "No se pudo crear el assignment" })
    }
  }

  const handleDeleteAssignment = async (id: string) => {
    try {
      if (!authState) {
        Toast.show({ type: "error", text1: "No hay sesión de usuario" })
        return
      }
      console.log("Attempting to delete assignment with id: ", id)
      await courseClient.delete(`/assignments/${id}`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      })

      Toast.show({ type: "success", text1: "Assignment eliminado" })
      setAssignments((prev) => (prev ?? []).filter((assignment) => assignment.id !== id))
    } catch (e) {
      console.error("Error eliminando assignment:", e)
      Toast.show({ type: "error", text1: "No se pudo eliminar el assignment" })
    }
  }

  const handleSubmitFinal = async (assignmentId: string, submissionId: string) => {
    try {
      const data = await courseClient.post(
        `/assignments/${assignmentId}/submissions/${submissionId}/submit`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authState?.token || ""}`,
            "X-Student-UUID": authState?.user?.id,
          },
        },
      )
      console.log("Entrega enviada:", data)
      Toast.show({ type: "success", text1: "Entrega enviada exitosamente" })
    } catch (error) {
      console.error("Error al enviar la entrega:", error)
      Toast.show({ type: "error", text1: "Error al enviar la entrega" })
    }
  }

  // Componente para renderizar los detalles expandidos de una tarea
  const renderExpandedDetails = (assignment: Assignment) => {
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

    return (
      <View style={styles.expandedDetails}>
        {/* Información detallada */}
        <View style={styles.detailsInfoSection}>
          <View style={styles.detailsInfoRow}>
            <FontAwesome name="clock-o" size={16} color="#666" />
            <Text style={styles.detailsInfoLabel}>Fecha límite:</Text>
            <Text style={styles.detailsInfoValue}>{formatDate(assignment.due_date)}</Text>
          </View>

          <View style={styles.detailsInfoRow}>
            <MaterialIcons name="category" size={16} color="#666" />
            <Text style={styles.detailsInfoLabel}>Tipo:</Text>
            <Text style={styles.detailsInfoValue}>{assignment.type === "exam" ? "Examen" : "Tarea"}</Text>
          </View>

          {assignment.type === "exam" && assignment.time_limit && (
            <View style={styles.detailsInfoRow}>
              <MaterialIcons name="timer" size={16} color="#666" />
              <Text style={styles.detailsInfoLabel}>Tiempo límite:</Text>
              <Text style={styles.detailsInfoValue}>{assignment.time_limit} minutos</Text>
            </View>
          )}

          {assignment.type === "exam" && (
            <View style={styles.detailsInfoRow}>
              <MaterialIcons name="grade" size={16} color="#666" />
              <Text style={styles.detailsInfoLabel}>Puntuación mínima:</Text>
              <Text style={styles.detailsInfoValue}>
                {assignment.passing_score !== null && assignment.passing_score !== undefined
                  ? `${assignment.passing_score} puntos`
                  : "Sin puntuación mínima"}
              </Text>
            </View>
          )}

          <View style={styles.detailsInfoRow}>
            <MaterialIcons name="help" size={16} color="#666" />
            <Text style={styles.detailsInfoLabel}>Preguntas:</Text>
            <Text style={styles.detailsInfoValue}>{assignment.questions.length}</Text>
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Descripción</Text>
          <Text style={styles.detailsText}>{assignment.description}</Text>
        </View>

        {/* Estado de entrega y respuestas */}
        {assignment.submission ? (
          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>Mi entrega</Text>

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
                  style={[
                    styles.submissionStatusText,
                    { color: getSubmissionStatusColor(assignment.submission.status) },
                  ]}
                >
                  {getSubmissionStatusText(assignment.submission.status)}
                </Text>
              </View>
              {assignment.submission.submitted_at && (
                <Text style={styles.submissionDate}>Entregado el {formatDate(assignment.submission.submitted_at)}</Text>
              )}
            </View>

            {/* Respuestas */}
            {assignment.submission.answers && assignment.submission.answers.length > 0 ? (
              <View style={styles.answersContainer}>
                <Text style={styles.answersTitle}>Mis respuestas:</Text>
                {assignment.submission.answers.slice(0, 3).map((answer, index) => {
                  const question = assignment.questions.find((q) => q.id === answer.question_id)
                  return (
                    <View key={`${answer.question_id}-${index}`} style={styles.answerPreview}>
                      <Text style={styles.answerQuestionText} numberOfLines={1}>
                        {index + 1}. {question?.text}
                      </Text>
                      {question?.type === "file" && answer.content && answer.content.startsWith("http") ? (
                        <TouchableOpacity style={styles.filePreviewLink} onPress={() => handleOpenFile(answer.content)}>
                          <MaterialIcons name="insert-drive-file" size={16} color="#007AFF" />
                          <Text style={styles.filePreviewText} numberOfLines={1}>
                            Ver archivo adjunto
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.answerValueText} numberOfLines={2}>
                          {answer.content || "Sin respuesta"}
                        </Text>
                      )}
                    </View>
                  )
                })}
                {assignment.submission.answers.length > 3 && (
                  <Text style={styles.moreAnswersText}>+{assignment.submission.answers.length - 3} respuestas más</Text>
                )}
              </View>
            ) : (
              <View style={styles.noAnswersContainer}>
                <MaterialIcons name="info" size={16} color="#666" />
                <Text style={styles.noAnswersText}>No hay respuestas guardadas aún</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>Estado</Text>
            <View style={styles.noSubmissionContainer}>
              <MaterialIcons name="assignment" size={20} color="#666" />
              <Text style={styles.noSubmissionText}>No has comenzado esta actividad</Text>
            </View>
          </View>
        )}

        {/* Advertencia para exámenes */}
        {assignment.type === "exam" && (
          <View style={styles.warningSection}>
            <MaterialIcons name="warning" size={20} color="#FF9800" />
            <Text style={styles.warningText}>
              Este es un examen con tiempo limitado. Una vez iniciado, el contador comenzará y no podrás pausarlo.
            </Text>
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.detailsActions}>
          {onDownload && (
            <TouchableOpacity style={styles.detailsSecondaryButton} onPress={() => onDownload(assignment)}>
              <MaterialIcons name="download" size={16} color="#007AFF" />
              <Text style={styles.detailsSecondaryButtonText}>Descargar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.detailsCollapseButton} onPress={() => setExpandedAssignment(null)}>
            <FontAwesome name="chevron-up" size={16} color="#666" />
            <Text style={styles.detailsCollapseButtonText}>Contraer</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Componente para renderizar una tarea individual
  const renderAssignmentCard = (assignment: Assignment) => {
    const status = getDerivedStatus(assignment)
    const isReadOnly = status === "submitted" || status === "late"
    const isOverdue = status === "late"
    const isSubmitted = assignment.submission?.status === "submitted"
    const isLate = assignment.submission?.status === "late"
    const isExpanded = expandedAssignment === assignment.id
    const totalPoints = assignment.questions.reduce((sum, q) => sum + (q.points || 0), 0)

    return (
      <View key={assignment.id} style={styles.assignmentCardContainer}>
        <TouchableOpacity
          style={[styles.assignmentCard, isExpanded && styles.assignmentCardExpanded]}
          onPress={() => setExpandedAssignment(isExpanded ? null : assignment.id)}
        >
          <View style={styles.assignmentHeader}>
            <View style={styles.assignmentTitleRow}>
              <MaterialIcons
                name={assignment.type === "exam" ? "quiz" : "assignment"}
                size={20}
                color="#333"
                style={styles.assignmentIcon}
              />
              <Text style={styles.assignmentTitle} numberOfLines={2}>
                {assignment.title}
              </Text>
              <FontAwesome
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color="#666"
                style={styles.expandIcon}
              />
            </View>

            {onDownload && (
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={(e) => {
                  e.stopPropagation()
                  onDownload(assignment)
                }}
              >
                <MaterialIcons name="download" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.assignmentDescription} numberOfLines={2}>
            {assignment.description}
          </Text>

          <View style={styles.assignmentInfo}>
            <View style={styles.dateContainer}>
              <FontAwesome name="clock-o" size={14} color="#666" />
              <Text style={[styles.assignmentDeadline, isOverdue && styles.overdue]}>
                {formatDate(assignment.due_date)}
              </Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(assignment) }]}>
              <Text style={styles.statusText}>{getStatusText(assignment)}</Text>
            </View>
          </View>

          {assignment.type === "exam" && assignment.time_limit && (
            <View style={styles.examInfo}>
              <MaterialIcons name="timer" size={16} color="#FF9800" />
              <Text style={styles.timeLimit}>Tiempo límite: {assignment.time_limit} minutos</Text>
            </View>
          )}

          {assignment.type === "exam" && (
            <View style={styles.passingScoreInfo}>
              <MaterialIcons name="grade" size={16} color="#eb9b3b" />
              <Text style={styles.passingScoreText}>
                {assignment.passing_score !== null && assignment.passing_score !== undefined
                  ? `Puntuación mínima: ${assignment.passing_score} puntos`
                  : "Sin puntuación mínima"}
                {assignment.passing_score !== null &&
                  assignment.passing_score !== undefined &&
                  totalPoints > 0 &&
                  ` (${Math.round((assignment.passing_score / totalPoints) * 100)}%)`}
              </Text>
            </View>
          )}
          <Text style={styles.assignmentMeta}>
            📚 Tipo: {assignment.type === "exam" ? "Examen" : "Tarea"} • 📄 Preguntas: {assignment.questions.length}
          </Text>

          {isTeacher && (
            <>
              {onViewQuestions && (
                <TouchableOpacity
                  style={styles.viewQuestionsButton}
                  onPress={(e) => {
                    e.stopPropagation()
                    onViewQuestions(assignment.id)
                  }}
                >
                  <Text style={styles.viewQuestionsButtonText}>View Questions ({assignment.questions.length})</Text>
                </TouchableOpacity>
              )}

              {onAddQuestions && (
                <TouchableOpacity
                  style={styles.addQuestionsButton}
                  onPress={(e) => {
                    e.stopPropagation()
                    onAddQuestions(assignment.id)
                  }}
                >
                  <Text style={styles.addQuestionsButtonText}>Add Questions</Text>
                </TouchableOpacity>
              )}

              {/* Nuevo botón para ver entregas */}
              <TouchableOpacity
                style={styles.viewSubmissionsButton}
                onPress={(e) => {
                  e.stopPropagation()
                  onViewSubmissions && onViewSubmissions(assignment.id)
                }}
              >
                <MaterialIcons name="assignment-turned-in" size={18} color="#4CAF50" />
                <Text style={styles.viewSubmissionsButtonText}>Ver Entregas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteAssignmentButton}
                onPress={(e) => {
                  e.stopPropagation()
                  handleDeleteAssignment(assignment.id)
                }}
              >
                <MaterialIcons name="delete" size={18} color="rgb(238, 69, 69)" />
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </>
          )}

          {!isTeacher && (
            <View style={styles.studentActions}>
              <TouchableOpacity
                style={[styles.actionButton, isReadOnly && styles.disabledButton]}
                onPress={(e) => {
                  e.stopPropagation()
                  if (!isReadOnly) setSelectedAssignment(assignment)
                }}
                disabled={isReadOnly}
              >
                <Text style={styles.actionButtonText}>Responder preguntas</Text>
              </TouchableOpacity>

              {assignment.submission && (
                <View style={styles.submissionInfo}>
                  <Text style={styles.submissionStatus}>
                    📥 {isSubmitted ? "✔ Entregada" : isLate ? "⏳ Entrega tardía" : "📝 Borrador"}
                  </Text>

                  {!isReadOnly && assignment.submission && (
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={(e) => {
                        e.stopPropagation()
                        assignment.submission && handleSubmitFinal(assignment.id, assignment.submission.id)
                      }}
                    >
                      <Text style={styles.submitButtonText}>Enviar entrega</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Detalles expandidos */}
        {isExpanded && renderExpandedDetails(assignment)}
      </View>
    )
  }

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(!showFilters)}>
        <FontAwesome name="filter" size={16} color="#333" />
        <Text style={styles.filterToggleText}>Filtros</Text>
        <FontAwesome name={showFilters ? "chevron-up" : "chevron-down"} size={12} color="#333" />
      </TouchableOpacity>

      {showFilters && (
        <View style={styles.filtersContent}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Estado:</Text>
            <Picker selectedValue={statusFilter} onValueChange={setStatusFilter} style={styles.picker}>
              <Picker.Item label="Todos" value="all" />
              <Picker.Item label="Sin entrega" value="no_submission" />
              <Picker.Item label="Borrador" value="draft" />
              <Picker.Item label="Entregadas" value="submitted" />
              <Picker.Item label="Entrega tardía" value="late" />
            </Picker>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Ordenar por:</Text>
            <Picker selectedValue={sortBy} onValueChange={setSortBy} style={styles.picker}>
              <Picker.Item label="Fecha límite" value="due_date" />
              <Picker.Item label="Título" value="title" />
              <Picker.Item label="Estado de entrega" value="submission_status" />
            </Picker>
          </View>
        </View>
      )}
    </View>
  )

  const renderPagination = () => {
    const totalPages = getTotalPages()
    if (totalPages <= 1) return null

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <FontAwesome name="chevron-left" size={16} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.pageInfo}>
          {currentPage} de {totalPages}
        </Text>

        <TouchableOpacity
          style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
          onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <FontAwesome name="chevron-right" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeader}>{label}</Text>
      <Text style={styles.subtitle}>
        {filteredAssignments.length} de {assignments?.length || 0} {label.toLowerCase()}
      </Text>

      {renderFilters()}

      {isTeacher && (
        <TouchableOpacity
          onPress={() => {
            setShowAssignmentModal(true)
            label === "Tareas" ? setAssignmentModalType("task") : setAssignmentModalType("exam")
          }}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ Agregar {label === "Tareas" ? "tarea" : "exámenes"}</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <Text style={styles.loadingText}>Cargando {label.toLowerCase()}...</Text>
      ) : !filteredAssignments || filteredAssignments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="assignment" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            No hay {label.toLowerCase()} {statusFilter !== "all" ? `con el filtro seleccionado` : "disponibles"}
          </Text>
        </View>
      ) : (
        <View>
          {getPaginatedAssignments().map(renderAssignmentCard)}
          {renderPagination()}
        </View>
      )}

      <NewAssignmentModal
        visible={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onCreate={handleAddAssignment}
        type={assignmentModalType}
      />

      {selectedAssignment && (
        <AssignmentAnswerModal
          visible={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          assignment={selectedAssignment}
          onRefresh={onRefresh}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 20,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  filtersContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#e9ecef",
  },
  filterToggleText: {
    marginLeft: 8,
    marginRight: "auto",
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  filtersContent: {
    padding: 12,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  picker: {
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
  },
  assignmentCard: {
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
  assignmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  assignmentTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: 8,
  },
  assignmentIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  downloadButton: {
    padding: 4,
  },
  assignmentDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  assignmentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  assignmentDeadline: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  overdue: {
    color: "#F44336",
    fontWeight: "500",
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
  examInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#FFF3E0",
    borderRadius: 6,
  },
  timeLimit: {
    fontSize: 12,
    color: "#FF9800",
    marginLeft: 6,
    fontWeight: "500",
  },
  assignmentMeta: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  passingScoreInfo: {
    height: 32,
    alignContent: "center",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff3e6",
    borderRadius: 10,
    textAlignVertical: "center",
  },
  passingScoreText: {
    fontSize: 12,
    color: "#eb9b3b",
    marginLeft: 6,
    fontWeight: "500",
    textAlignVertical: "center",
  },
  viewQuestionsButton: {
    backgroundColor: "#E8F4FD",
    borderColor: "#1976D2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 8,
    height: 44,
    borderRadius: 10,
  },
  viewQuestionsButtonText: {
    color: "#1976D2",
    fontSize: 14,
    fontWeight: "600",
  },
  addQuestionsButton: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 8,
    height: 44,
    borderRadius: 10,
  },
  addQuestionsButtonText: {
    color: "#1976D2",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteAssignmentButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "rgb(255, 231, 231)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: "rgb(238, 69, 69)",
    fontWeight: "500",
    marginLeft: 6,
  },
  studentActions: {
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  submissionInfo: {
    backgroundColor: "#e8f5e8",
    padding: 8,
    borderRadius: 6,
  },
  submissionStatus: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    marginTop: 8,
  },
  pageButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  pageInfo: {
    fontSize: 16,
    color: "#333",
    marginHorizontal: 16,
  },
  assignmentCardContainer: {
    marginBottom: 12,
  },
  assignmentCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  expandIcon: {
    marginLeft: 8,
  },
  expandedDetails: {
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  detailsInfoSection: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailsInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailsInfoLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    minWidth: 80,
  },
  detailsInfoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
  },
  submissionStatusCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  submissionStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  submissionStatusText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  submissionDate: {
    fontSize: 12,
    color: "#666",
    marginLeft: 28,
  },
  answersContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
  },
  answersTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  answerPreview: {
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: "#007AFF",
  },
  answerQuestionText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 2,
  },
  answerValueText: {
    fontSize: 13,
    color: "#333",
  },
  moreAnswersText: {
    fontSize: 12,
    color: "#007AFF",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
  noAnswersContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
  },
  noAnswersText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  noSubmissionContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
  },
  noSubmissionText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  warningSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    color: "#856404",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  detailsActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  detailsSecondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  detailsSecondaryButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  detailsCollapseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  detailsCollapseButtonText: {
    color: "#666",
    fontSize: 14,
    marginLeft: 4,
  },
  filePreviewLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f7ff",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  filePreviewText: {
    color: "#007AFF",
    fontSize: 12,
    marginLeft: 4,
  },
  viewSubmissionsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e8",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
    height: 44,
    borderRadius: 10,
  },
  viewSubmissionsButtonText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
})
