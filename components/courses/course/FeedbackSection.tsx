"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { FeedbackForm } from "../feedback/FeedbackForm"
import { FeedbackList } from "../feedback/FeedbackList"
import { FeedbackSummary } from "../feedback/FeedbackSummary"
import { StudentFeedbackForm } from "../feedback/StudentFeedbackForm"
import { courseClient } from "@/lib/courseClient"
import { useAuth } from "@/contexts/sessionAuth"
import Toast from "react-native-toast-message"
import React from "react"
import { Colors } from "@/styles/shared"

export interface Student {
  uid: string
  name: string
  surname: string
  email: string
  is_active: boolean
}

interface FeedbackSectionProps {
  courseId: string
  isTeacher: boolean
}

export function FeedbackSection({ courseId, isTeacher }: FeedbackSectionProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [showFeedbackSummary, setShowFeedbackSummary] = useState(false)
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [showStudentsList, setShowStudentsList] = useState(false)
  const auth = useAuth()

  // Cargar estudiantes automáticamente si es docente
  useEffect(() => {
    if (isTeacher) {
      fetchStudents()
    }
  }, [isTeacher, courseId])

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true)

      // Obtener los IDs de los estudiantes del curso
      const { data: membersData } = await courseClient.get(`/courses/${courseId}/members`, {
        headers: {
          Authorization: `Bearer ${auth?.authState.token}`,
        },
      })

      if (!membersData.students_ids || membersData.students_ids.length === 0) {
        setStudents([])
        return
      }

      // Obtener la información completa de los estudiantes
      const { data: studentsResponse } = await courseClient.post(
        "/users/batch",
        {
          user_ids: membersData.students_ids,
        },
        {
          headers: {
            Authorization: `Bearer ${auth?.authState.token}`,
          },
        },
      )

      setStudents(studentsResponse.data || [])
    } catch (error) {
      console.error("Error fetching students:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudieron cargar los estudiantes",
      })
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleSendFeedbackToStudent = (student: Student) => {
    setSelectedStudent(student)
    setShowStudentForm(true)
  }

  // const renderStudentItem = ({ item }: { item: Student }) => (
  //   <View style={styles.studentCard}>
  //     <View style={styles.studentInfo}>
  //       <View style={styles.studentAvatar}>
  //         <Text style={styles.studentAvatarText}>
  //           {item.name.charAt(0)}
  //           {item.surname.charAt(0)}
  //         </Text>
  //       </View>
  //       <View style={styles.studentDetails}>
  //         <Text style={styles.studentName}>
  //           {item.name} {item.surname}
  //         </Text>
  //         <Text style={styles.studentEmail}>{item.email}</Text>
  //         <View style={styles.statusContainer}>
  //           <View style={[styles.statusBadge, { backgroundColor: item.is_active ? "#e8f5e8" : "#ffeaea" }]}>
  //             {/* <Text style={[styles.statusText, { color: item.is_active ? "#2e7d32" : "#d32f2f" }]}>
  //               {item.is_active ? "Activo" : "Inactivo"}
  //             </Text> */}
  //           </View>
  //         </View>
  //       </View>
  //     </View>
      
  //   </View>
  // )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feedback</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.summaryButton} onPress={() => setShowFeedbackSummary(true)}>
            <MaterialIcons name="auto-awesome" size={20} color={Colors.secondaryButtonText} />
            <Text style={styles.summaryButtonText}>Ver resumen IA</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de feedbacks del curso */}
      <FeedbackList courseId={courseId} />

      {!isTeacher && (
        <TouchableOpacity style={styles.addButton} onPress={() => setShowFeedbackForm(true)}>
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Dar feedback</Text>
        </TouchableOpacity>
      )}

      {/* Lista de estudiantes para feedback individual (solo para docentes) */}
      {/* {isTeacher && (
        <View style={styles.studentsSection}>
          <TouchableOpacity style={styles.sectionToggle} onPress={() => setShowStudentsList(!showStudentsList)}>
            <Text style={styles.sectionTitle}>Enviar feedback individual ({students.length} estudiantes)</Text>
            <MaterialIcons name={showStudentsList ? "expand-less" : "expand-more"} size={24} color="#333" />
          </TouchableOpacity>

          {showStudentsList && (
            <>
              {loadingStudents ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Cargando estudiantes...</Text>
                </View>
              ) : students.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="school" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No hay estudiantes inscritos en este curso</Text>
                </View>
              ) : (
                <FlatList
                  data={students}
                  renderItem={renderStudentItem}
                  keyExtractor={(item) => item.uid}
                  style={styles.studentsList}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              )}
            </>
          )}
        </View>
      )} */}

      {/* Modales */}
      <FeedbackForm visible={showFeedbackForm} onClose={() => setShowFeedbackForm(false)} courseId={courseId} />

      <FeedbackSummary
        visible={showFeedbackSummary}
        onClose={() => setShowFeedbackSummary(false)}
        courseId={courseId}
      />

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    marginBottom: 16,
  },
  header: {
    gap: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  addButton: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  summaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondaryButtonBackground,
    borderWidth: 2,
    borderColor: Colors.secondaryButtonBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  summaryButtonText: {
    color: Colors.secondaryButtonText,
    fontWeight: "500",
    marginLeft: 4,
  },
  studentsSection: {
    marginTop: 24,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
  },
  sectionToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  studentsList: {
    maxHeight: 400,
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  studentAvatarText: {
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
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
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
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  loadingText: {
    marginLeft: 8,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginTop: 12,
    fontSize: 16,
  },
})
