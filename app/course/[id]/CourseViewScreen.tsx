"use client"

import { useLocalSearchParams, useRouter } from "expo-router"
import { useCourses } from "@/contexts/CoursesContext"
import { View, Text, TouchableOpacity, Modal, Alert, FlatList } from "react-native"
import { useEffect, useState } from "react"
import { AntDesign } from "@expo/vector-icons"
import { styles as modalStyles } from "@/styles/modalStyle"
import { styles as courseStyles } from "@/styles/courseStyles"
import { styles as homeScreenStyles } from "@/styles/homeScreenStyles"
import { courseClient } from "@/lib/courseClient"
import Toast from "react-native-toast-message"
import { useAuth } from "@/contexts/sessionAuth"
import { CourseTopBar } from "@/components/courses/course/CourseTopBar"
import { TasksSection } from "@/components/courses/course/TasksSection"
import { ModulesSection } from "@/components/courses/course/ModulesSection"
import { AssignmentDetailModal } from "@/components/courses/course/AssignmentDetailModal"
import { ExamTimerModal } from "@/components/courses/course/ExamTimerModal"
import { DownloadModal } from "@/components/courses/course/DownloadModal"
import React from "react"
import { KeyboardAvoidingView, SafeAreaView, ScrollView, Platform } from 'react-native';

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
  submission?: StudentSubmission
}

const alumnos = Array.from({ length: 20 }, (_, i) => `Padron: ${i + 1}`)
const docentesTitulares = ["Iñaki Llorens", "Martín Morilla"]
const docentesAuxiliares = ["Emiliano Gómez", "Martín Masivo", "Fede FIUBA"]

interface Props {
  teacher?: boolean
}

export const CourseViewScreen = ({ teacher }: Props) => {
  const { id } = useLocalSearchParams()
  console.log("Course ID:", id)
  const router = useRouter()
  const { courses, reloadCourses } = useCourses()
  const [showAlumnos, setShowAlumnos] = useState(false)
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [hasFetchedAssignments, setHasFetchedAssignments] = useState(false)

  // Nuevos estados para modales y funcionalidades mejoradas
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [activeExam, setActiveExam] = useState<Assignment | null>(null)

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
  const handleAssignmentPress = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setShowDetailModal(true)
  }

  const handleStartExam = (assignment: Assignment) => {
    if (assignment.type === "exam" && assignment.time_limit) {
      setActiveExam(assignment)
      setShowTimerModal(true)
    }
    setShowDetailModal(false)
  }

  const handleDownload = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setShowDownloadModal(true)
  }

  const handleSubmitTask = async (assignmentId: string) => {
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
          Authorization: `Bearer ${authState.token}`,
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
    submissions: StudentSubmission[]
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
        return data;
      } catch (e) {
        console.error("Error fetching submissions:", e)
      }
    }

  // Función para obtener assignments
  const fetchAssignments = async () => {
    try {
      setLoadingTasks(true)
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
      setLoadingTasks(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
        data={[]} // sin items porque solo usamos el header
        renderItem={null}
        keyExtractor={() => "dummy"}
        ListHeaderComponent={
          <View style={courseStyles.scrollContainer}>
            <CourseTopBar
                  role={teacher ? "Docente" : "Alumno"}
                  onBack={() => router.back()}
                  canEdit={teacher}
                  course={course}
                  onEditSuccess={reloadCourses}
                />

                <TasksSection
                  label="Tareas"
                  tasks={tasks}
                  setTasks={setAllAssignments}
                  loading={loadingTasks}
                  onSubmit={handleSubmitTask}
                  isTeacher={teacher}
                  onAssignmentPress={handleAssignmentPress}
                  onDownload={handleDownload}
                  onRefresh={fetchAssignments}
                />

                <TasksSection
                  label="Exámenes"
                  tasks={exams}
                  setTasks={setAllAssignments}
                  loading={loadingTasks}
                  onSubmit={handleSubmitTask}
                  isTeacher={teacher}
                  onAssignmentPress={handleAssignmentPress}
                  onDownload={handleDownload}
                  onRefresh={fetchAssignments}
                />

                <ModulesSection courseId={course.id} isTeacher={teacher} />

                {/* Resto del código existente para alumnos, docentes, etc. */}
                <TouchableOpacity style={courseStyles.materialToggle} onPress={() => setShowAlumnos(!showAlumnos)}>
                  <View style={courseStyles.materialToggleRow}>
                    <AntDesign name={showAlumnos ? "up" : "down"} size={16} color="#333" style={courseStyles.arrowIcon} />
                    <Text style={courseStyles.materialToggleText}>Ver alumnos</Text>
                  </View>
                </TouchableOpacity>

                {showAlumnos && (
                  <View style={courseStyles.listContainer}>
                    {alumnos.map((a, i) => (
                      <Text key={i} style={courseStyles.listItem}>
                        • {a}
                      </Text>
                    ))}
                  </View>
                )}

                <Text style={courseStyles.sectionHeader}>Docentes Titulares</Text>
                <View style={courseStyles.listContainer}>
                  {docentesTitulares.map((d, i) => (
                    <Text key={i} style={courseStyles.listItem}>
                      • {d}
                    </Text>
                  ))}
                </View>

                <Text style={courseStyles.sectionHeader}>Docentes auxiliares</Text>
                <View style={courseStyles.listContainer}>
                  {docentesAuxiliares.map((d, i) => (
                    <Text key={i} style={courseStyles.listItem}>
                      • {d}
                    </Text>
                  ))}
                </View>

                {teacher && (
                  <TouchableOpacity style={courseStyles.deleteButton} onPress={() => setShowConfirmModal(true)}>
                    <Text style={courseStyles.buttonText}>Eliminar curso</Text>
                  </TouchableOpacity>
                )}

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

                {/* Nuevos modales para funcionalidades mejoradas */}
                <AssignmentDetailModal
                  visible={showDetailModal}
                  assignment={selectedAssignment}
                  onClose={() => setShowDetailModal(false)}
                  onStartExam={handleStartExam}
                  onDownload={handleDownload}
                />

                <ExamTimerModal
                  visible={showTimerModal}
                  exam={activeExam}
                  onClose={() => setShowTimerModal(false)}
                  onTimeUp={() => {
                    setShowTimerModal(false)
                    Alert.alert("Tiempo agotado", "El tiempo para el examen ha terminado.")
                  }}
                />

                <DownloadModal
                  visible={showDownloadModal}
                  assignment={selectedAssignment}
                  onClose={() => setShowDownloadModal(false)}
                />
              </View>
            }
          />
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

export const options = {
  headerShown: false,
}
