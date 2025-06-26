"use client"

import { useLocalSearchParams, useRouter } from "expo-router"
import { useCourses } from "@/contexts/CoursesContext"
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native"
import { useEffect, useState } from "react"
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
import { SafeAreaView } from "react-native"
import { AddQuestionsModal } from "@/components/courses/course/AddQuestionsModal"
import { ViewQuestionsModal } from "@/components/courses/course/ViewQuestionsModal"
import { FeedbackSection } from "@/components/courses/course/FeedbackSection"
import { StudentFeedbackForm } from "@/components/courses/feedback/StudentFeedbackForm"
import type { JSX } from "react"
import { SubmissionsListModal } from "@/components/courses/course/SubmissionsListModal"
import { GradeSubmissionModal } from "@/components/courses/course/GradeSubmissionModal"
import { GradesSummary } from "@/components/courses/course/GradesSummary"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { CourseTabs } from "@/components/courses/course/CourseTabs"
import { ForumSection } from "@/components/courses/forum/ForumSection"
import { CourseMembersFooter } from "@/components/courses/course/CourseMembersFooter"
import { CourseStatisticsSection } from "@/components/statistics/CourseStatisticsSection"
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
  student_uuid: string
  status: "draft" | "submitted" | "late"
  submitted_at?: string
  content: string
  score?: number
  feedback?: string
  ai_score?: number
  ai_feedback?: string
  graded_at?: string
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
  time_limit?: number
  questions: Question[]
  passing_score?: number
  submission?: StudentSubmission
}

interface CourseMembers {
  aux_teachers_ids: string[]
  students_ids: string[]
  teacher_id: string
}

interface UserData {
  uid: string
  name: string
  surname: string
  email: string
  phone: string
  latitude: number
  longitude: number
  is_active: boolean
  is_blocked: boolean
  is_admin: boolean
}

interface Enrollment {
  completed_date: string | null
  course_id: string
  enrolled_at: string
  favourite: boolean
  feedback: any[]
  id: string
  reason_for_unenrollment: string | null
  status: "active" | "completed" | "dropped"
  student_id: string
  updated_at: string
}

interface UserDataGet {
  uid: string
  name: string
  email: string
  enrollment?: Enrollment
}

interface Student {
  uid: string
  name: string
  surname: string
  email: string
  phone: string
  latitude: number
  longitude: number
  is_active: boolean
  is_blocked: boolean
  is_admin: boolean
}

interface CourseMembersData {
  teacher: UserDataGet | null
  auxTeachers: UserDataGet[]
  students: UserDataGet[]
}

interface Props {
  teacher: boolean
}

export default function CourseViewScreen({ teacher }: Props): JSX.Element {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { courses, reloadCourses } = useCourses()
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [hasFetchedAssignments, setHasFetchedAssignments] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [selectedAssignmentForQuestions, setSelectedAssignmentForQuestions] = useState<Assignment | null>(null)
  const [showAddQuestionsModal, setShowAddQuestionsModal] = useState(false)
  const [showViewQuestionsModal, setShowViewQuestionsModal] = useState(false)
  const [membersData, setMembersData] = useState<CourseMembersData>({
    teacher: null,
    auxTeachers: [],
    students: [],
  })
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [hasFetchedMembers, setHasFetchedMembers] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<UserData | null>(null)
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false)
  const [selectedAssignmentForSubmissions, setSelectedAssignmentForSubmissions] = useState<Assignment | null>(null)
  const [showGradeModal, setShowGradeModal] = useState(false)
  const [selectedSubmissionForGrading, setSelectedSubmissionForGrading] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>("tasks")

  const auth = useAuth()
  const authState = auth?.authState
  const course = courses.find((c) => c.id === id)

  useEffect(() => {
    if (course?.id && authState?.token && !hasFetchedAssignments) {
      fetchAssignments()
      setHasFetchedAssignments(true)
    }
    if (course?.id && authState?.token && !hasFetchedMembers) {
      fetchCourseMembers()
      setHasFetchedMembers(true)
    }
  }, [course?.id, authState?.token, hasFetchedAssignments, hasFetchedMembers])

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
      console.log("Submissions data:", data)
      return data
    } catch (e) {
      console.error("Error fetching submissions:", e)
    }
  }

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
      console.log("Assignments data:", data)
      if (data !== null) {
        const enrichedAssignments = data.map((assignment: any) => ({
          ...assignment,
          course_name: course.title,
        }))

        const submissions = await fetchSubmissions()
        if (submissions) {
          const assignmentsWithSubmissions = enrichAssignmentsWithSubmissions(enrichedAssignments, submissions)
          setAllAssignments(assignmentsWithSubmissions)
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

  const fetchCourseEnrollments = async (): Promise<Enrollment[]> => {
    try {
      if (!authState?.token) {
        throw new Error("No auth token available")
      }

      const { data: enrollments } = await courseClient.get(`/courses/${course.id}/enrollments`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      })

      console.log("Course enrollments:", enrollments)
      return enrollments || []
    } catch (e) {
      console.error("Error fetching course enrollments:", e)
      return []
    }
  }

  const fetchCourseMembers = async () => {
    try {
      setLoadingMembers(true)

      if (!authState?.token) {
        throw new Error("No auth token available")
      }

      const [membersResponse, enrollments] = await Promise.all([
        courseClient.get(`/courses/${course.id}/members`, {
          headers: {
            Authorization: `Bearer ${authState.token}`,
          },
        }),
        fetchCourseEnrollments(),
      ])

      const members = membersResponse.data
      console.log("Course members:", members)

      const { teacher_id, aux_teachers_ids = [], students_ids = [], user_info = [] } = members

      // Create enrollment map for quick lookup
      const enrollmentMap: Record<string, Enrollment> = {}
      for (const enrollment of enrollments) {
        enrollmentMap[enrollment.student_id] = enrollment
      }

      // Create user map for quick lookup
      const userMap: Record<string, UserDataGet> = {}
      for (const user of user_info) {
        userMap[user.uid] = {
          uid: user.uid,
          name: user.name,
          email: user.email,
          enrollment: enrollmentMap[user.uid], // Add enrollment info
        }
      }

      const teacher = teacher_id ? (userMap[teacher_id] ?? null) : null

      const auxTeachers = aux_teachers_ids.map((id: string) => userMap[id]).filter(Boolean) as UserDataGet[]

      const students = students_ids.map((id: string) => userMap[id]).filter(Boolean) as UserDataGet[]

      setMembersData({
        teacher,
        auxTeachers,
        students,
      })
    } catch (e) {
      console.error("Error fetching course members:", e)
      Toast.show({
        type: "error",
        text1: "Error al cargar miembros",
        text2: "No se pudieron cargar los miembros del curso",
      })
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleRemoveAuxTeacher = async (teacherId: string, name: string) => {
    try {
      const url = `/courses/${course.id}/aux-teacher/remove?auxTeacherId=${teacherId}&teacherId=${authState?.user?.id}`

      await courseClient.delete(url, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      })

      console.log(`Remover docente auxiliar exitoso: ${name} (${teacherId})`)
      Toast.show({
        type: "success",
        text1: "Docente auxiliar removido",
        text2: `${name} ya no es docente auxiliar`,
      })
      fetchCourseMembers()
    } catch (error) {
      console.error("Error removing aux teacher:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo remover al docente auxiliar",
      })
    }
  }

  // Tabs sin la sección "General"
  const tabs = [
    ...(teacher ? [] : [{ id: "grades", label: "Notas", icon: "barschart" }]),
    { id: "tasks", label: "Tareas", icon: "filetext1" },
    { id: "exams", label: "Exámenes", icon: "solution1" },
    { id: "modules", label: "Módulos", icon: "book" },
    { id: "forum", label: "Foro", icon: "message1" },
    { id: "feedback", label: "Feedback", icon: "star" },
    { id: "statistics", label: "Estadísticas", icon: "barschart" },
  ]

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

  const handleViewSubmissions = (assignmentId: string) => {
    const assignment = allAssignments.find((a) => a.id === assignmentId)
    if (assignment) {
      setSelectedAssignmentForSubmissions(assignment)
      setShowSubmissionsModal(true)
    }
  }

  const handleGradeSubmission = (submission: any) => {
    setSelectedSubmissionForGrading(submission)
    setShowGradeModal(true)
    setShowSubmissionsModal(false)
  }

  const handleGradeSuccess = () => {
    setShowGradeModal(false)
    setSelectedSubmissionForGrading(null)
    setShowSubmissionsModal(true)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "grades":
        return <GradesSummary assignments={allAssignments} />
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
            onViewSubmissions={handleViewSubmissions}
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
            onViewSubmissions={handleViewSubmissions}
          />
        )
      case "modules":
        return <ModulesSection courseId={course.id} isTeacher={teacher} />
      case "forum":
        return <ForumSection courseId={course.id} isTeacher={teacher} membersData={membersData} />
      case "feedback":
        return <FeedbackSection courseId={course.id} isTeacher={teacher} />
      case "statistics":
        return <CourseStatisticsSection courseId={course.id} membersData={membersData} />
      default:
        return null
    }
  }

  return (
    <ScreenLayout padded={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Header fijo */}
        <CourseTopBar
          role={teacher ? "Docente" : "Alumno"}
          onBack={() => router.back()}
          canEdit={teacher}
          course={course}
          onEditSuccess={reloadCourses}
        />

        {/* Tabs y contenido */}
        <View style={styles.contentContainer}>
          <CourseTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} renderContent={renderTabContent} />

          {/* Footer de miembros siempre visible */}
          <CourseMembersFooter
            membersData={membersData}
            loading={loadingMembers}
            isTeacher={teacher}
            onRemoveAuxTeacher={handleRemoveAuxTeacher}
            onDeleteCourse={() => setShowConfirmModal(true)}
            courseId={course.id}
            onMembersUpdate={fetchCourseMembers}
          />
        </View>

        {/* Modales */}
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
            fetchAssignments()
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
          }}
          onPassingScoreUpdate={handlePassingScoreUpdate}
        />
        {selectedStudent && (
          <StudentFeedbackForm
            visible={showStudentForm}
            onClose={() => {
              setShowStudentForm(false)
              setSelectedStudent(null)
            }}
            courseId={course.id}
            studentId={selectedStudent.uid}
            studentName={`${selectedStudent.name} ${selectedStudent.surname}`}
            onSuccess={() => {
              Toast.show({
                type: "success",
                text1: "Feedback enviado",
                text2: "El feedback ha sido enviado al estudiante",
              })
              setShowStudentForm(false)
              setSelectedStudent(null)
            }}
          />
        )}
        <SubmissionsListModal
          visible={showSubmissionsModal}
          assignment={selectedAssignmentForSubmissions}
          onClose={() => {
            setShowSubmissionsModal(false)
            setSelectedAssignmentForSubmissions(null)
          }}
          onGradeSubmission={handleGradeSubmission}
        />

        <GradeSubmissionModal
          visible={showGradeModal}
          assignment={selectedAssignmentForSubmissions}
          submission={selectedSubmissionForGrading}
          onClose={() => {
            setShowGradeModal(false)
            setSelectedSubmissionForGrading(null)
          }}
          onGradeSuccess={handleGradeSuccess}
        />
      </SafeAreaView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
})
