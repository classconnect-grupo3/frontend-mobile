"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal } from "react-native"
import { AntDesign } from "@expo/vector-icons"
import Toast from "react-native-toast-message"
import { courseClient } from "@/lib/courseClient"
import React from "react"
import { useAuth } from "@/contexts/sessionAuth"

interface UserDataGet {
  uid: string
  name: string
  email: string
}

interface CourseMembersData {
  teacher: UserDataGet | null
  auxTeachers: UserDataGet[]
  students: UserDataGet[]
}

interface Props {
  membersData: CourseMembersData
  loading: boolean
  isTeacher: boolean
  onRemoveAuxTeacher: (teacherId: string, name: string) => void
  onDeleteCourse: () => void
  courseId: string // Add this new prop
  onMembersUpdate: () => void // Add this new prop
}

export const CourseMembersFooter = ({
  membersData,
  loading,
  isTeacher,
  onRemoveAuxTeacher,
  onDeleteCourse,
  courseId,
  onMembersUpdate,
}: Props) => {
  const [expanded, setExpanded] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showDisapproveModal, setShowDisapproveModal] = useState(false)
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<UserDataGet | null>(null)
  const [disapprovalReason, setDisapprovalReason] = useState("")
  const [loadingAction, setLoadingAction] = useState(false)
  const { authState } = useAuth()

  const totalMembers = 1 + membersData.auxTeachers.length + membersData.students.length

  const MemberAvatar = ({ name, role }: { name: string; role: "teacher" | "aux_teacher" | "student" }) => {
    const getInitials = (fullName: string) => {
      const names = fullName.split(" ")
      return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0][0]
    }

    const getAvatarColor = () => {
      switch (role) {
        case "teacher":
          return { backgroundColor: "#4CAF50", color: "#fff" }
        case "aux_teacher":
          return { backgroundColor: "#FF9800", color: "#fff" }
        case "student":
          return { backgroundColor: "#2196F3", color: "#fff" }
      }
    }

    return (
      <View style={[styles.memberAvatar, getAvatarColor()]}>
        <Text style={[styles.memberAvatarText, { color: getAvatarColor().color }]}>
          {getInitials(name).toUpperCase()}
        </Text>
      </View>
    )
  }

  const MemberCard = ({
    member,
    role,
    showActions = false,
  }: {
    member: UserDataGet
    role: "teacher" | "aux_teacher" | "student"
    showActions?: boolean
  }) => (
    <View style={styles.memberCard}>
      <MemberAvatar name={member.name} role={role} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberEmail}>{member.email}</Text>
        {role === "teacher" && <Text style={styles.roleLabel}>Docente Principal</Text>}
        {role === "aux_teacher" && <Text style={styles.roleLabel}>Docente Auxiliar</Text>}
      </View>
      {showActions && role === "aux_teacher" && (
        <TouchableOpacity style={styles.removeButton} onPress={() => onRemoveAuxTeacher(member.uid, member.name)}>
          <AntDesign name="close" size={16} color="#f44336" />
        </TouchableOpacity>
      )}
      {showActions && role === "student" && isTeacher && (
        <View style={styles.studentActions}>
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => {
              setSelectedStudentForAction(member)
              setShowApproveModal(true)
            }}
          >
            <AntDesign name="check" size={14} color="#fff" />
            <Text style={styles.approveButtonText}>Aprobar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.disapproveButton}
            onPress={() => {
              setSelectedStudentForAction(member)
              setShowDisapproveModal(true)
            }}
          >
            <AntDesign name="close" size={14} color="#fff" />
            <Text style={styles.disapproveButtonText}>Desaprobar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )

  const handleApproveStudent = async () => {
    if (!selectedStudentForAction) return

    try {
      setLoadingAction(true)
      const response = await courseClient.put(
        `/courses/${courseId}/students/${selectedStudentForAction.uid}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authState.token}`,
            "X-Teacher-UUID": authState.user?.id,
          },
        },
      )

      console.log("Approve response:", response.data)

      Toast.show({
        type: "success",
        text1: "Estudiante aprobado",
        text2: `${selectedStudentForAction.name} ha sido aprobado exitosamente`,
      })

      setShowApproveModal(false)
      setSelectedStudentForAction(null)
      onMembersUpdate()
    } catch (error) {
      console.error("Error approving student:", error)
      console.log("Error details:", error.response?.data || error.message)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo aprobar al estudiante",
      })
    } finally {
      setLoadingAction(false)
    }
  }

  const handleDisapproveStudent = async () => {
    if (!selectedStudentForAction || !disapprovalReason.trim()) return

    try {
      setLoadingAction(true)
      const response = await courseClient.put(
        `/courses/${courseId}/students/${selectedStudentForAction.uid}/disapprove`,
        {
          reason: disapprovalReason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${authState.token}`,
            "X-Teacher-UUID": authState.user?.id,
          },
        },
      )

      Toast.show({
        type: "success",
        text1: "Estudiante desaprobado",
        text2: `${selectedStudentForAction.name} ha sido desaprobado`,
      })

      setShowDisapproveModal(false)
      setSelectedStudentForAction(null)
      setDisapprovalReason("")
      onMembersUpdate()
    } catch (error) {
      console.error("Error disapproving student:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo desaprobar al estudiante",
      })
    } finally {
      setLoadingAction(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.loadingText}>Cargando miembros...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header compacto */}
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.headerLeft}>
          <View style={styles.membersPreview}>
            {/* Mostrar avatares de los primeros miembros */}
            {membersData.teacher && <MemberAvatar name={membersData.teacher.name} role="teacher" />}
            {membersData.auxTeachers.slice(0, 2).map((teacher) => (
              <MemberAvatar key={teacher.uid} name={teacher.name} role="aux_teacher" />
            ))}
            {membersData.students.slice(0, 3).map((student) => (
              <MemberAvatar key={student.uid} name={student.name} role="student" />
            ))}
            {totalMembers > 6 && (
              <View style={[styles.memberAvatar, styles.moreAvatar]}>
                <Text style={styles.moreAvatarText}>+{totalMembers - 6}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Miembros del curso</Text>
            <Text style={styles.headerSubtitle}>
              {membersData.students.length} estudiantes • {1 + membersData.auxTeachers.length} docentes
            </Text>
          </View>
        </View>
        <AntDesign name={expanded ? "up" : "down"} size={20} color="#666" />
      </TouchableOpacity>

      {/* Contenido expandido */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Docente Principal */}
          {membersData.teacher && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Docente Principal</Text>
              <MemberCard member={membersData.teacher} role="teacher" />
            </View>
          )}

          {/* Docentes Auxiliares */}
          {membersData.auxTeachers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Docentes Auxiliares ({membersData.auxTeachers.length})</Text>
              {membersData.auxTeachers.map((teacher) => (
                <MemberCard key={teacher.uid} member={teacher} role="aux_teacher" showActions={isTeacher} />
              ))}
            </View>
          )}

          {/* Estudiantes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estudiantes ({membersData.students.length})</Text>
            {membersData.students.length === 0 ? (
              <Text style={styles.emptyText}>No hay estudiantes inscritos</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.studentsScroll}>
                {membersData.students.map((student) => (
                  <MemberCard key={student.uid} member={student} role="student" showActions={isTeacher} />
                ))}
              </ScrollView>
            )}
          </View>

          {/* Acciones del docente */}
          {isTeacher && (
            <View style={styles.teacherActions}>
              <TouchableOpacity style={styles.deleteButton} onPress={onDeleteCourse}>
                <AntDesign name="delete" size={16} color="#fff" />
                <Text style={styles.deleteButtonText}>Eliminar Curso</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      {/* Approval Modal */}
      <Modal visible={showApproveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <AntDesign name="checkcircle" size={24} color="#4CAF50" />
              <Text style={styles.modalTitle}>Aprobar Estudiante</Text>
            </View>
            <Text style={styles.modalMessage}>
              ¿Estás seguro que deseas aprobar a{" "}
              <Text style={styles.studentNameHighlight}>{selectedStudentForAction?.name}</Text>?
            </Text>
            <Text style={styles.modalSubMessage}>
              Esta acción cambiará el estado de inscripción del estudiante a "completado".
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowApproveModal(false)
                  setSelectedStudentForAction(null)
                }}
                disabled={loadingAction}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalApproveButton, loadingAction && styles.buttonDisabled]}
                onPress={handleApproveStudent}
                disabled={loadingAction}
              >
                {loadingAction ? (
                  <Text style={styles.modalApproveText}>Aprobando...</Text>
                ) : (
                  <>
                    <AntDesign name="check" size={16} color="#fff" />
                    <Text style={styles.modalApproveText}>Aprobar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Disapproval Modal */}
      <Modal visible={showDisapproveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <AntDesign name="closecircle" size={24} color="#f44336" />
              <Text style={styles.modalTitle}>Desaprobar Estudiante</Text>
            </View>
            <Text style={styles.modalMessage}>
              ¿Estás seguro que deseas desaprobar a{" "}
              <Text style={styles.studentNameHighlight}>{selectedStudentForAction?.name}</Text>?
            </Text>
            <Text style={styles.modalSubMessage}>Proporciona una razón para la desaprobación:</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Escribe la razón aquí..."
              value={disapprovalReason}
              onChangeText={setDisapprovalReason}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{disapprovalReason.length}/500</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowDisapproveModal(false)
                  setSelectedStudentForAction(null)
                  setDisapprovalReason("")
                }}
                disabled={loadingAction}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalDisapproveButton,
                  (!disapprovalReason.trim() || loadingAction) && styles.buttonDisabled,
                ]}
                onPress={handleDisapproveStudent}
                disabled={!disapprovalReason.trim() || loadingAction}
              >
                {loadingAction ? (
                  <Text style={styles.modalDisapproveText}>Desaprobando...</Text>
                ) : (
                  <>
                    <AntDesign name="close" size={16} color="#fff" />
                    <Text style={styles.modalDisapproveText}>Desaprobar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  membersPreview: {
    flexDirection: "row",
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: -8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  memberAvatarText: {
    fontSize: 12,
    fontWeight: "600",
  },
  moreAvatar: {
    backgroundColor: "#f0f0f0",
  },
  moreAvatarText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "600",
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fafafa",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  roleLabel: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "500",
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#ffeaea",
  },
  studentsScroll: {
    marginTop: 8,
  },
  studentCard: {
    alignItems: "center",
    marginRight: 16,
    width: 60,
  },
  studentName: {
    fontSize: 11,
    color: "#333",
    textAlign: "center",
    marginTop: 6,
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  teacherActions: {
    padding: 16,
    alignItems: "center",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f44336",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  studentActions: {
    flexDirection: "row",
    gap: 8,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  approveButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  disapproveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f44336",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  disapproveButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  modalMessage: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    lineHeight: 22,
  },
  modalSubMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  studentNameHighlight: {
    fontWeight: "600",
    color: "#007AFF",
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
    marginBottom: 8,
    minHeight: 80,
    color: "#333",
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  modalApproveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    gap: 8,
  },
  modalApproveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalDisapproveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#f44336",
    gap: 8,
  },
  modalDisapproveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
})
