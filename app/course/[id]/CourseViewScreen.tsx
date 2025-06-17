"use client"

import { useLocalSearchParams, useRouter } from "expo-router"
import { useCourses } from "@/contexts/CoursesContext"
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from "react-native"
import { useEffect, useState } from "react"
import { AntDesign, MaterialIcons } from "@expo/vector-icons"
import { styles as modalStyles } from "@/styles/modalStyle"
import { styles as courseStyles } from "@/styles/courseStyles"
import { styles as homeScreenStyles } from "@/styles/homeScreenStyles"
import { courseClient } from "@/lib/courseClient"
import Toast from "react-native-toast-message"
import { useAuth } from "@/contexts/sessionAuth"
import { CourseTopBar } from "@/components/courses/course/CourseTopBar"
import { AssignmentsSection } from "@/components/courses/course/AssignmentsSection"
import { ModulesSection } from "@/components/courses/course/ModulesSection"
import { DownloadModal } from "@/components/courses/course/DownloadModal"
import { KeyboardAvoidingView, SafeAreaView, Platform } from "react-native"
import { AddQuestionsModal } from "@/components/courses/course/AddQuestionsModal"
import { ViewQuestionsModal } from "@/components/courses/course/ViewQuestionsModal"
import React from "react"

interface Question {
  id: string
  text: string
  type: "text" | "multiple_choice" | "file"
  options?: string[]
  correct_answers?: string[]
  order: number
  points: number
}

export interface StudentSubmission {
  assignment_id: string
  id: string
  status: "draft" | "submitted" | "late"
  submitted_at?: string
  content: string
  answers?: {
    id: string
    content: string
    question_id: string
    type: string
  }[]
}

export interface Assignment {
  id: string
  title: string
  description: string
  instructions: string
  due_date: string
  type: "homework" | "exam"
  course_id: string
  course_name?: string
  time_limit?: number // en minutos para exámenes
  questions: Question[]
  passing_score?: number,
  submission?: StudentSubmission
}

const alumnos = Array.from({ length: 20 }, (_, i) => `Padron: ${i + 1}`)
const docentesTitulares = ["Iñaki Llorens", "Martín Morilla"]
const docentesAuxiliares = ["Emiliano Gómez", "Martín Masivo", "Fede FIUBA"]

interface Props {
  teacher: boolean
}

export default function CourseViewScreen({ teacher }: Props): JSX.Element {
  const { id } = useLocalSearchParams()
  console.log("Course ID:", id)
  const router = useRouter()
  const { courses, reloadCourses } = useCourses()
  const [showAlumnos, setShowAlumnos] = useState(false)
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [hasFetchedAssignments, setHasFetchedAssignments] = useState(false)

  // Nuevos estados para modales y funcionalidades mejoradas
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [selectedAssignmentForQuestions, setSelectedAssignmentForQuestions] = useState<Assignment | null>(null)
  const [showAddQuestionsModal, setShowAddQuestionsModal] = useState(false)
  const [showViewQuestionsModal, setShowViewQuestionsModal] = useState(false)

  const course = courses.find((c) => c.id === id)
  const auth = useAuth()
  const authState = auth?.authState

  useEffect(() => {
    if (course?.id && authState?.token && !hasFetchedAssignments) {
      fetchAssignments()
      setHasFetchedAssignments(true)
    }
  }, [course?.id, authState?.token, hasFetchedAssignments])

  if (!course) {
    return (
      <View style={homeScreenStyles.container}>
        <Text>404</Text>
        <Text>Course not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={courseStyles.link}>← Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const tasks = allAssignments.filter((a) => a.type === "homework")
  const exams = allAssignments.filter((a) => a.type === "exam")

  // Nuevas funciones para manejar los modales
  const handleDownload = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setShowDownloadModal(true)
  }

  const handleSubmitAssignment = async (assignmentId: string) => {
    try {
      if (!authState) {
        Toast.show({ type: "error", text1: "No hay sesión de usuario" })
        return
      }
      await courseClient.post(
        `/assignments/${assignmentId}/submissions`,
        {
          student_id: authState.user?.id,
          content: "Entrega realizada desde la app",
        },
        {
          headers: {
            Authorization: `Bearer ${authState.token}`,
          },
        },
      )

      Toast.show({ type: "success", text1: "Tarea entregada" })
      // Recargar assignments después de la entrega
      fetchAssignments()
    } catch (e) {
      console.error("Error entregando tarea:", e)
      Toast.show({ type: "error", text1: "No se pudo entregar la tarea" })
    }
  }

  const handleDeleteCourse = async () => {
    console.log("Deleting course with ID:", id)

    try {
      await courseClient.delete(`/courses/${id}`, {
        headers: {
          Authorization: `Bearer ${authState?.token}`,
        },
      })

      Toast.show({ type: "success", text1: "Curso eliminado" })
      setShowConfirmModal(false)
      router.replace({ pathname: "/(tabs)/myCourses" })
    } catch (e) {
      console.error("Error deleting course:", e)
      Toast.show({ type: "error", text1: "Error al eliminar el curso" })
      setShowConfirmModal(false)
    }
  }

  const enrichAssignmentsWithSubmissions = (
    assignments: Assignment[],
    submissions: StudentSubmission[],
  ): Assignment[] => {
    return assignments.map((assignment) => {
      const matchingSubmission = submissions.find((s) => s.assignment_id === assignment.id)
      return {
        ...assignment,
        submission: matchingSubmission ?? undefined,
      }
    })
  }

  const fetchSubmissions = async () => {
    if (!authState?.user?.id || !authState?.token) return
    try {
      const { data } = await courseClient.get(`/students/${authState.user.id}/submissions`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
          "X-Student-UUID": authState.user?.id,
        },
      })
      return data
    } catch (e) {
      console.error("Error fetching submissions:", e)
    }
  }

  // Función para obtener assignments
  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true)
      if (!authState?.token) {
        throw new Error("No auth token available")
      }
      const { data } = await courseClient.get(`/assignments/course/${course.id}`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      })
      if (data !== null) {
        // Enriquecer assignments con información del curso
        const enrichedAssignments = data.map((assignment: any) => ({
          ...assignment,
          course_name: course.title,
        }))

        const submissions = await fetchSubmissions()
        if (submissions) {
          // Enriquecer assignments con las entregas del estudiante
          const assignmentsWithSubmissions = enrichAssignmentsWithSubmissions(enrichedAssignments, submissions)
          setAllAssignments(assignmentsWithSubmissions)
          console.log("Assignments with submissions:", assignmentsWithSubmissions)
        } else {
          console.log("No submissions found, setting assignments without submissions")
          setAllAssignments(enrichedAssignments)
          console.log("All assignments:", enrichedAssignments)
        }
      }
    } catch (e) {
      console.error("Error fetching assignments:", e)
      Toast.show({ type: "error", text1: "No se pudieron cargar las tareas" })
    } finally {
      setLoadingAssignments(false)
    }
  }

  // Datos para el FlatList principal
  const mainSections = [{ type: "tasks" }, { type: "exams" }, { type: "modules" }]

  const handleAddQuestions = (assignmentId: string) => {
    const assignment = allAssignments.find((a) => a.id === assignmentId)
    if (assignment) {
      setSelectedAssignmentForQuestions(assignment)
      setShowAddQuestionsModal(true)
    }
  }

  const handleViewQuestions = (assignmentId: string) => {
    const assignment = allAssignments.find((a) => a.id === assignmentId)
    if (assignment) {
      setSelectedAssignmentForQuestions(assignment)
      setShowViewQuestionsModal(true)
    }
  }

  const handlePassingScoreUpdate = (assignmentId: string, newPassingScore: number | null) => {
    setAllAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === assignmentId ? { ...assignment, passing_score: newPassingScore ?? undefined } : assignment,
      ),
    )
  }

  const renderMainSection = ({ item }: { item: { type: string } }) => {
    switch (item.type) {
      case "tasks":
        return (
          <AssignmentsSection
            course_id={course.id}
            label="Tareas"
            assignments={tasks}
            type="task"
            setAssignments={setAllAssignments}
            loading={loadingAssignments}
            onSubmit={handleSubmitAssignment}
            isTeacher={teacher}
            onDownload={handleDownload}
            onRefresh={fetchAssignments}
            onAddQuestions={handleAddQuestions}
            onViewQuestions={handleViewQuestions}
          />
        )
      case "exams":
        return (
          <AssignmentsSection
            course_id={course.id}
            label="Exámenes"
            assignments={exams}
            type="exam"
            setAssignments={setAllAssignments}
            loading={loadingAssignments}
            onSubmit={handleSubmitAssignment}
            isTeacher={teacher}
            onDownload={handleDownload}
            onRefresh={fetchAssignments}
            onAddQuestions={handleAddQuestions}
            onViewQuestions={handleViewQuestions}
          />
        )
      case "modules":
        return <ModulesSection courseId={course.id} isTeacher={teacher} />
      default:
        return null
    }
  }

  const renderHeader = () => (
    <View>
      <CourseTopBar
        role={teacher ? "Docente" : "Alumno"}
        onBack={() => router.back()}
        canEdit={teacher}
        course={course}
        onEditSuccess={reloadCourses}
      />
    </View>
  )

  const renderFooter = () => (
    <View>
      {/* Sección de alumnos */}
      <View style={styles.footerSection}>
        <TouchableOpacity style={styles.sectionToggle} onPress={() => setShowAlumnos(!showAlumnos)}>
          <View style={styles.toggleRow}>
            <AntDesign name={showAlumnos ? "up" : "down"} size={16} color="#333" style={styles.arrowIcon} />
            <Text style={styles.toggleText}>Ver alumnos</Text>
          </View>
        </TouchableOpacity>

        {showAlumnos && (
          <View style={styles.listContainer}>
            {alumnos.map((a, i) => (
              <Text key={i} style={styles.listItem}>
                • {a}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Docentes Titulares */}
      <View style={styles.footerSection}>
        <Text style={styles.sectionHeader}>Docentes Titulares</Text>
        <View style={styles.listContainer}>
          {docentesTitulares.map((d, i) => (
            <Text key={i} style={styles.listItem}>
              • {d}
            </Text>
          ))}
        </View>
      </View>

      {/* Docentes auxiliares */}
      <View style={styles.footerSection}>
        <Text style={styles.sectionHeader}>Docentes auxiliares</Text>
        <View style={styles.listContainer}>
          {docentesAuxiliares.map((d, i) => (
            <Text key={i} style={styles.listItem}>
              • {d}
            </Text>
          ))}
        </View>
      </View>

      {/* Botón eliminar curso */}
      {teacher && (
        <View style={styles.footerSection}>
          <TouchableOpacity style={styles.deleteButton} onPress={() => setShowConfirmModal(true)}>
            <MaterialIcons name="delete" size={20} color="#dc3545" />
            <Text style={styles.deleteButtonText}>Eliminar curso</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Espacio final */}
      <View style={{ height: 40 }} />
    </View>
  )

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <FlatList
          data={mainSections}
          keyExtractor={(item) => item.type}
          renderItem={renderMainSection}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <Modal visible={showConfirmModal} transparent animationType="fade">
          <View style={modalStyles.overlay}>
            <View style={modalStyles.modal}>
              <Text style={modalStyles.title}>¿Estás seguro que querés eliminar este curso?</Text>
              <View style={modalStyles.modalButtons}>
                <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={modalStyles.cancelButton}>
                  <Text style={modalStyles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteCourse} style={modalStyles.confirmDeleteButton}>
                  <Text style={modalStyles.confirmDeleteText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <DownloadModal
          visible={showDownloadModal}
          assignment={selectedAssignment}
          onClose={() => setShowDownloadModal(false)}
        />
        <AddQuestionsModal
          visible={showAddQuestionsModal}
          assignment={selectedAssignmentForQuestions}
          onClose={() => {
            setShowAddQuestionsModal(false)
            setSelectedAssignmentForQuestions(null)
          }}
          onSuccess={() => {
            fetchAssignments() // Refresh assignments after adding questions
          }}
        />
        <ViewQuestionsModal
          visible={showViewQuestionsModal}
          assignment={selectedAssignmentForQuestions}
          onClose={() => {
            setShowViewQuestionsModal(false)
            setSelectedAssignmentForQuestions(null)
          }}
          onAddQuestions={() => {
            setShowViewQuestionsModal(false)
            setShowAddQuestionsModal(true)
            // selectedAssignmentForQuestions is already set
          }}
          onPassingScoreUpdate={handlePassingScoreUpdate}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  footerSection: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  sectionToggle: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
  },
  arrowIcon: {
    marginRight: 8,
  },
  listContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  listItem: {
    fontSize: 14,
    marginBottom: 4,
    color: "#333",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffebee",
    borderWidth: 1,
    borderColor: "#dc3545",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: "#dc3545",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
})

export const options = {
  headerShown: false,
}
