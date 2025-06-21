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
import { FeedbackSection } from "@/components/courses/course/FeedbackSection"
import { StudentFeedbackForm } from "@/components/courses/feedback/StudentFeedbackForm"
import type { JSX } from "react"
import { SubmissionsListModal } from "@/components/courses/course/SubmissionsListModal"
import { GradeSubmissionModal } from "@/components/courses/course/GradeSubmissionModal"
import { GradesSummary } from "@/components/courses/course/GradesSummary"
import React from "react"
import { ScreenLayout } from "@/components/layout/ScreenLayout"

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
  teacher: UserData | null
  auxTeachers: UserData[]
  students: UserData[]
}

interface Props {
  teacher: boolean
}

export default function CourseViewScreen({ teacher }: Props): JSX.Element {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { courses, reloadCourses } = useCourses()
  const [showAlumnos, setShowAlumnos] = useState(false)
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

  const fetchCourseMembers = async () => {
    try {
      setLoadingMembers(true)
      if (!authState?.token) {
        throw new Error("No auth token available")
      }

      const { data: membersIds } = await courseClient.get<CourseMembers>(`/courses/${course.id}/members`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      })

      console.log("Course members IDs:", membersIds)

      if (membersIds.students_ids === null) {
        membersIds.students_ids = []
      }
      if (membersIds.aux_teachers_ids === null) {
        membersIds.aux_teachers_ids = []
      }

      const allUserIds = [membersIds.teacher_id, ...membersIds.aux_teachers_ids, ...membersIds.students_ids].filter(
        Boolean,
      )

      if (allUserIds.length === 0) {
        console.log("No members found for this course")
        return
      }
      console.log("All user IDs to fetch:", allUserIds)

      const { data: usersResponse } = await courseClient.post(
        "/users/batch",
        {
          user_ids: allUserIds,
        },
        {
          headers: {
            Authorization: `Bearer ${authState.token}`,
          },
        },
      )

      console.log("Users data:", usersResponse)

      const usersData = usersResponse.data || []

      const teacher = usersData.find((user: UserData) => user.uid === membersIds.teacher_id) || null
      const auxTeachers = membersIds.aux_teachers_ids
        .map((id) => usersData.find((user: UserData) => user.uid === id))
        .filter(Boolean) as UserData[]
      const students = membersIds.students_ids
        .map((id) => usersData.find((user: UserData) => user.uid === id))
        .filter(Boolean) as UserData[]

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

  const handleApproveStudent = async (studentId: string, name: string, surname: string) => {
    try {
      console.log(`Aprobar estudiante: ${name} ${surname} (${studentId})`)
      Toast.show({
        type: "success",
        text1: "Estudiante aprobado",
        text2: `${name} ${surname} ha sido aprobado en el curso`,
      })
    } catch (error) {
      console.error("Error approving student:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo aprobar al estudiante",
      })
    }
  }

  const handleRejectStudent = async (studentId: string, name: string, surname: string) => {
    try {
      console.log(`Desaprobar estudiante: ${name} ${surname} (${studentId})`)
      Toast.show({
        type: "success",
        text1: "Estudiante removido",
        text2: `${name} ${surname} ha sido removido del curso`,
      })
    } catch (error) {
      console.error("Error rejecting student:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo remover al estudiante",
      })
    }
  }

  const handleRemoveAuxTeacher = async (teacherId: string, name: string, surname: string) => {
    try {
      const url = `/courses/${course.id}/aux-teacher/remove?auxTeacherId=${teacherId}&teacherId=${authState?.user?.id}`

      await courseClient.delete(url, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      })

      console.log(`Remover docente auxiliar exitoso: ${name} ${surname} (${teacherId})`)
      Toast.show({
        type: "success",
        text1: "Docente auxiliar removido",
        text2: `${name} ${surname} ya no es docente auxiliar`,
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

  const handleSendFeedbackToStudent = (student: UserData) => {
    if (!student.is_active) {
      Toast.show({
        type: "warning",
        text1: "Estudiante inactivo",
        text2: "No se puede enviar feedback a estudiantes inactivos",
      })
      return
    }

    setSelectedStudent(student)
    setShowStudentForm(true)
  }

  const handleFeedbackSuccess = () => {
    Toast.show({
      type: "success",
      text1: "Feedback enviado",
      text2: "El feedback ha sido enviado al estudiante",
    })
    setShowStudentForm(false)
    setSelectedStudent(null)
  }

  const StudentCard = ({
    student,
    isTeacher,
    onApprove,
    onReject,
  }: {
    student: UserData
    isTeacher: boolean
    onApprove: () => void
    onReject: () => void
  }) => (
    <View style={memberCardStyles.studentCard}>
      <View style={memberCardStyles.userInfo}>
        <View style={memberCardStyles.avatar}>
          <Text style={memberCardStyles.avatarText}>
            {student.name.charAt(0)}
            {student.surname.charAt(0)}
          </Text>
        </View>
        <View style={memberCardStyles.userDetails}>
          <Text style={memberCardStyles.userName}>
            {student.name} {student.surname}
          </Text>
          <Text style={memberCardStyles.userEmail}>{student.email}</Text>
          <View style={memberCardStyles.statusContainer}>
            <View
              style={[memberCardStyles.statusBadge, { backgroundColor: student.is_active ? "#e8f5e8" : "#ffeaea" }]}
            >
              <Text style={[memberCardStyles.statusText, { color: student.is_active ? "#2e7d32" : "#d32f2f" }]}>
                {student.is_active ? "Activo" : "Inactivo"}
              </Text>
            </View>
          </View>
        </View>

        {isTeacher && (
          <TouchableOpacity
            style={[memberCardStyles.feedbackButton, !student.is_active && memberCardStyles.feedbackButtonDisabled]}
            onPress={() => handleSendFeedbackToStudent(student)}
            disabled={!student.is_active}
          >
            <MaterialIcons name="feedback" size={18} color={student.is_active ? "#fff" : "#999"} />
            <Text
              style={[
                memberCardStyles.feedbackButtonText,
                !student.is_active && memberCardStyles.feedbackButtonTextDisabled,
              ]}
            >
              Feedback
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isTeacher && (
        <View style={memberCardStyles.actions}>
          <TouchableOpacity style={[memberCardStyles.actionButton, memberCardStyles.approveButton]} onPress={onApprove}>
            <AntDesign name="check" size={16} color="#fff" />
            <Text style={memberCardStyles.approveButtonText}>Aprobar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[memberCardStyles.actionButton, memberCardStyles.rejectButton]} onPress={onReject}>
            <AntDesign name="close" size={16} color="#fff" />
            <Text style={memberCardStyles.rejectButtonText}>Remover</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )

  const TeacherCard = ({
    teacher,
    isMain,
    isTeacher = false,
    onRemove,
  }: {
    teacher: UserData
    isMain: boolean
    isTeacher?: boolean
    onRemove?: () => void
  }) => (
    <View style={memberCardStyles.teacherCard}>
      <View style={memberCardStyles.userInfo}>
        <View style={[memberCardStyles.avatar, { backgroundColor: isMain ? "#e3f2fd" : "#f3e5f5" }]}>
          <Text style={[memberCardStyles.avatarText, { color: isMain ? "#1976d2" : "#7b1fa2" }]}>
            {teacher.name.charAt(0)}
            {teacher.surname.charAt(0)}
          </Text>
        </View>
        <View style={memberCardStyles.userDetails}>
          <View style={memberCardStyles.teacherHeader}>
            <Text style={memberCardStyles.userName}>
              {teacher.name} {teacher.surname}
            </Text>
            {isMain && (
              <View style={memberCardStyles.mainTeacherBadge}>
                <Text style={memberCardStyles.mainTeacherText}>Principal</Text>
              </View>
            )}
          </View>
          <Text style={memberCardStyles.userEmail}>{teacher.email}</Text>
        </View>
      </View>

      {!isMain && isTeacher && onRemove && (
        <TouchableOpacity style={[memberCardStyles.actionButton, memberCardStyles.removeButton]} onPress={onRemove}>
          <AntDesign name="delete" size={16} color="#fff" />
          <Text style={memberCardStyles.removeButtonText}>Remover</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  const mainSections = [
    ...(teacher ? [] : [{ type: "grades" }]), // Solo para estudiantes
    { type: "tasks" },
    { type: "exams" },
    { type: "modules" },
    { type: "feedback" },
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
    setShowSubmissionsModal(true) // Volver a la lista de entregas
  }

  const renderMainSection = ({ item }: { item: { type: string } }) => {
    switch (item.type) {
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
      case "feedback":
        return <FeedbackSection courseId={course.id} isTeacher={teacher} />
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
    <View style={{ padding: 16 }}>
      {/* Sección de alumnos */}
      <TouchableOpacity style={courseStyles.materialToggle} onPress={() => setShowAlumnos(!showAlumnos)}>
        <View style={courseStyles.materialToggleRow}>
          <AntDesign name={showAlumnos ? "up" : "down"} size={16} color="#333" style={courseStyles.arrowIcon} />
          <Text style={courseStyles.materialToggleText}>Ver alumnos ({membersData.students.length})</Text>
        </View>
      </TouchableOpacity>

      {showAlumnos && (
        <View style={courseStyles.listContainer}>
          {loadingMembers ? (
            <Text style={courseStyles.listItem}>Cargando alumnos...</Text>
          ) : membersData.students.length === 0 ? (
            <Text style={courseStyles.listItem}>No hay alumnos inscritos</Text>
          ) : (
            membersData.students.map((student, i) => (
              <StudentCard
                key={student.uid}
                student={student}
                isTeacher={teacher}
                onApprove={() => handleApproveStudent(student.uid, student.name, student.surname)}
                onReject={() => handleRejectStudent(student.uid, student.name, student.surname)}
              />
            ))
          )}
        </View>
      )}

      {/* Docente Titular */}
      <Text style={courseStyles.sectionHeader}>Docente Titular</Text>
      <View style={courseStyles.listContainer}>
        {loadingMembers ? (
          <Text style={courseStyles.listItem}>Cargando...</Text>
        ) : membersData.teacher ? (
          <TeacherCard teacher={membersData.teacher} isMain={true} />
        ) : (
          <Text style={courseStyles.listItem}>No se encontró información del docente</Text>
        )}
      </View>

      {/* Docentes auxiliares */}
      <Text style={courseStyles.sectionHeader}>Docentes auxiliares ({membersData.auxTeachers.length})</Text>
      <View style={courseStyles.listContainer}>
        {loadingMembers ? (
          <Text style={courseStyles.listItem}>Cargando...</Text>
        ) : membersData.auxTeachers.length === 0 ? (
          <Text style={courseStyles.listItem}>No hay docentes auxiliares asignados</Text>
        ) : (
          membersData.auxTeachers.map((auxTeacher, i) => (
            <TeacherCard
              key={auxTeacher.uid}
              teacher={auxTeacher}
              isMain={false}
              isTeacher={teacher}
              onRemove={() => handleRemoveAuxTeacher(auxTeacher.uid, auxTeacher.name, auxTeacher.surname)}
            />
          ))
        )}
      </View>

      {/* Botón eliminar curso */}
      {teacher && (
        <TouchableOpacity style={courseStyles.deleteButton} onPress={() => setShowConfirmModal(true)}>
          <Text style={courseStyles.buttonText}>Eliminar curso</Text>
        </TouchableOpacity>
      )}

      {/* Espacio final */}
      <View style={{ height: 40 }} />
    </View>
  )

  return (
    <ScreenLayout padded={false}>
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
            onSuccess={handleFeedbackSuccess}
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

const memberCardStyles = StyleSheet.create({
  studentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  teacherCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976d2",
  },
  userDetails: {
    flex: 1,
  },
  teacherHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    marginBottom: 8,
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
  mainTeacherBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mainTeacherText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  feedbackButtonDisabled: {
    backgroundColor: "#ccc",
    elevation: 0,
    shadowOpacity: 0,
  },
  feedbackButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  feedbackButtonTextDisabled: {
    color: "#999",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  approveButton: {
    backgroundColor: "#4CAF50",
  },
  approveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  rejectButton: {
    backgroundColor: "#f44336",
  },
  rejectButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  removeButton: {
    backgroundColor: "#ff9800",
    paddingHorizontal: 16,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
})

