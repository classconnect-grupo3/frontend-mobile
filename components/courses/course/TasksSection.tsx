"use client"

import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native"
import React from "react"
import { useEffect, useState } from "react"
import { styles as courseStyles } from "@/styles/courseStyles"
import { NewTaskModal } from "@/components/NewTaskModal"
import { courseClient } from "@/lib/courseClient"
import Toast from "react-native-toast-message"
import { useAuth } from "@/contexts/sessionAuth"
import { AssignmentAnswerModal } from "./AssignmentAnswerModal"
import type { Assignment } from "@/app/course/[id]/CourseViewScreen"
import { MaterialIcons, FontAwesome } from "@expo/vector-icons"
import { Picker } from "@react-native-picker/picker"

// interface StudentSubmission {
//   id: string
//   assignment_id: string
//   status: "draft" | "submitted" | "late"
//   answers: {
//     content: string
//     question_id: string
//   }[]
// }

interface Props {
  label: string
  tasks: Assignment[] | null
  setTasks: React.Dispatch<React.SetStateAction<Assignment[] | null>>
  loading: boolean
  isTeacher: boolean
  onAssignmentPress?: (assignment: Assignment) => void
  onDownload?: (assignment: Assignment) => void
  onRefresh: () => void
}

type FilterStatus = "all" | "no_submission" | "draft" | "submitted" | "late"
type SortBy = "due_date" | "title" | "submission_status"
type TaskDerivedStatus = 'no_submission' | 'draft' | 'submitted' | 'late'

const ITEMS_PER_PAGE = 5

export const TasksSection = ({ label, tasks, setTasks, loading, isTeacher, onAssignmentPress, onDownload, onRefresh }: Props) => {
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  // const [studentSubmissions, setStudentSubmissions] = useState<StudentSubmission[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Filtros y ordenamiento
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all")
  const [sortBy, setSortBy] = useState<SortBy>("due_date")
  const [filteredTasks, setFilteredTasks] = useState<Assignment[]>([])

  const auth = useAuth()
  const authState = auth?.authState

  // Función para determinar el estado de una tarea basado en submission y fecha
  const getDerivedStatus = (assignment: Assignment): TaskDerivedStatus => {
    if (!assignment.submission) return 'no_submission'
    return assignment.submission.status
  }

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    if (!tasks) {
      setFilteredTasks([])
      return
    }

    let filtered = [...tasks]

    // Filtro por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => {
        if (statusFilter === "no_submission") {
          return !task.submission
        }
        return task.submission?.status === statusFilter
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

    setFilteredTasks(filtered)
    setCurrentPage(1)
  }, [tasks, statusFilter, sortBy])

  const getPaginatedTasks = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredTasks.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    return Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)
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
    console.log("Assignment:", assignment)
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

  const handleAddTask = (task: Omit<Assignment, "id">) => {
    setTasks((prev) => [...(prev ?? []), { ...task, id: Date.now().toString() }])
  }

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => (prev ?? []).filter((task) => task.id !== id))
  }

  const handleSubmitFinal = async (assignmentId: string, submissionId: string) => {
    try {
      const data = await courseClient.post(
        `/assignments/${assignmentId}/submissions/${submissionId}/submit`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authState.token}`,
            "X-Student-UUID": authState.user?.id,
          },
        },
      )
      console.log("Entrega enviada:", data)
      Toast.show({ type: "success", text1: "Entrega enviada exitosamente" })
      // await fetchSubmissions()
    } catch (error) {
      console.error("Error al enviar la entrega:", error)
      Toast.show({ type: "error", text1: "Error al enviar la entrega" })
    }
  }

  // useEffect(() => {
  //   fetchSubmissions()
  // }, [authState?.user?.id, authState?.token])

  // Componente para renderizar una tarea individual
  const renderTaskCard = ({ item: task }: { item: Assignment }) => {
    // const submission = studentSubmissions.find((sub) => sub.assignment_id === task.id)
    // const taskStatus = getDerivedStatus(task)
    const status = getDerivedStatus(task)
    const isReadOnly = status === 'submitted' || status === 'late'
    const isOverdue = status === "late"
    const isSubmitted = task.submission?.status === "submitted"
    const isLate = task.submission?.status === "late"

    return (
      <TouchableOpacity style={styles.taskCard} onPress={() => onAssignmentPress?.(task)}>
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleRow}>
            <MaterialIcons
              name={task.type === "exam" ? "quiz" : "assignment"}
              size={20}
              color="#333"
              style={styles.taskIcon}
            />
            <Text style={styles.taskTitle} numberOfLines={2}>
              {task.title}
            </Text>
          </View>

          {onDownload && (
            <TouchableOpacity style={styles.downloadButton} onPress={() => onDownload(task)}>
              <MaterialIcons name="download" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.taskDescription} numberOfLines={2}>
          {task.description}
        </Text>

        <View style={styles.taskInfo}>
          <View style={styles.dateContainer}>
            <FontAwesome name="clock-o" size={14} color="#666" />
            <Text style={[styles.taskDeadline, isOverdue && styles.overdue]}>{formatDate(task.due_date)}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task) }]}>
            <Text style={styles.statusText}>{getStatusText(task)}</Text>
          </View>
        </View>

        {task.type === "exam" && task.time_limit && (
          <View style={styles.examInfo}>
            <MaterialIcons name="timer" size={16} color="#FF9800" />
            <Text style={styles.timeLimit}>Tiempo límite: {task.time_limit} minutos</Text>
          </View>
        )}

        <Text style={styles.taskMeta}>
          📚 Tipo: {task.type === "exam" ? "Examen" : "Tarea"} • 📄 Preguntas: {task.questions.length}
        </Text>

        {isTeacher && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteTask(task.id)}>
            <Text style={styles.taskDelete}>Eliminar</Text>
          </TouchableOpacity>
        )}

        {!isTeacher && (
          <View style={styles.studentActions}>
            <TouchableOpacity
              style={[styles.actionButton, isReadOnly && styles.disabledButton]}
              onPress={() => {
                if (!isReadOnly) setSelectedAssignment(task)
              }}
              disabled={isReadOnly}
            >
              <Text style={styles.actionButtonText}>Responder preguntas</Text>
            </TouchableOpacity>

            {task.submission && (
              <View style={styles.submissionInfo}>
                <Text style={styles.submissionStatus}>
                  📥 {isSubmitted ? "✔ Entregada" : isLate ? "⏳ Entrega tardía" : "📝 Borrador"}
                </Text>

                {!isReadOnly && task.submission && (
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() => handleSubmitFinal(task.id, task.submission.id)}
                  >
                    <Text style={styles.submitButtonText}>Enviar entrega</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
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
    <>
      <Text style={courseStyles.sectionHeader}>{label}</Text>
      <Text style={styles.subtitle}>
        {filteredTasks.length} de {tasks?.length || 0} {label.toLowerCase()}
      </Text>

      {renderFilters()}

      {isTeacher && (
        <TouchableOpacity onPress={() => setShowTaskModal(true)} style={courseStyles.addButton}>
          <Text style={courseStyles.buttonText}>+ Agregar {label.slice(0, -1).toLowerCase()}</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <Text style={courseStyles.taskDescription}>Cargando {label.toLowerCase()}...</Text>
      ) : !filteredTasks || filteredTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="assignment" size={48} color="#ccc" />
          <Text style={courseStyles.taskDescription}>
            No hay {label.toLowerCase()} {statusFilter !== "all" ? `con el filtro seleccionado` : "disponibles"}
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={getPaginatedTasks()}
            keyExtractor={(item) => item.id}
            renderItem={renderTaskCard}
            showsVerticalScrollIndicator={false}
          />
          {renderPagination()}
        </>
      )}

      <NewTaskModal visible={showTaskModal} onClose={() => setShowTaskModal(false)} onCreate={handleAddTask} />

      {selectedAssignment && (
        <AssignmentAnswerModal
          visible={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          assignment={selectedAssignment}
          onRefresh={onRefresh}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  filtersContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
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
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: 8,
  },
  taskIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  downloadButton: {
    padding: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  taskInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskDeadline: {
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
  taskMeta: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  deleteButton: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  taskDelete: {
    color: "#F44336",
    fontSize: 14,
    fontWeight: "500",
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
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
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
})
