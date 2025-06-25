"use client"

import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { EditCourseModal } from "@/components/courses/EditCourseModal"
import { useState } from "react"
import { useAuth } from "@/contexts/sessionAuth"
import React from "react"
import { Colors } from "@/styles/shared"
import { Course } from "@/contexts/CoursesContext"

interface Props {
  role: "Docente" | "Alumno"
  onBack: () => void
  canEdit?: boolean
  course?: Course
  onEditSuccess?: () => void
  teacherName?: string
}

export function CourseTopBar({ role, onBack, canEdit = false, course, onEditSuccess, teacherName }: Props) {
  const [showEditModal, setShowEditModal] = useState(false)
  const authContext = useAuth()
  const authState = authContext?.authState
  const profileImageUrl = authState?.user?.profilePicUrl

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <>
      {/* Header principal */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.courseTitle} numberOfLines={2}>
            {course?.title}
          </Text>
          <View style={styles.roleContainer}>
            <MaterialIcons
              name={role === "Docente" ? "school" : "person"}
              size={16}
              color={role === "Docente" ? "#4CAF50" : "#2196F3"}
            />
            <Text style={[styles.roleText, { color: role === "Docente" ? "#4CAF50" : "#2196F3" }]}>{role}</Text>
          </View>
        </View>

        <Image
          source={profileImageUrl ? { uri: profileImageUrl } : require("@/assets/images/profile_placeholder.png")}
          style={styles.profileIcon}
        />
      </View>

      {/* Información del curso */}
      <View style={styles.courseInfo}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="description" size={16} color="#666" />
            <Text style={styles.infoLabel}>Descripción:</Text>
          </View>
          <Text style={styles.infoValue}>{course?.description || "Sin descripción"}</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <MaterialIcons name="event" size={16} color="#666" />
            <Text style={styles.infoItemLabel}>Inicio</Text>
            <Text style={styles.infoItemValue}>{formatDate(course?.start_date ?? "")}</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="event-available" size={16} color="#666" />
            <Text style={styles.infoItemLabel}>Fin</Text>
            <Text style={styles.infoItemValue}>{formatDate(course?.end_date ?? "")}</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="people" size={16} color="#666" />
            <Text style={styles.infoItemLabel}>Capacidad</Text>
            <Text style={styles.infoItemValue}>{course?.capacity} estudiantes</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="person" size={16} color="#666" />
            <Text style={styles.infoItemLabel}>Docente</Text>
            <Text style={styles.infoItemValue}>{teacherName}</Text>
          </View>
        </View>

        {canEdit && course && (
          <TouchableOpacity style={styles.editButton} onPress={() => setShowEditModal(true)}>
            <MaterialIcons name="edit" size={18} color={Colors.secondaryButtonText} />
            <Text style={styles.editButtonText}>Editar curso</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de edición */}
      {canEdit && course && (
        <EditCourseModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          course={course}
          onSuccess={() => {
            onEditSuccess?.()
            setShowEditModal(false)
          }}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
  },
  courseInfo: {
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    width: "48%",
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoItemLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginBottom: 2,
  },
  infoItemValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondaryButtonBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.secondaryButtonBorder,
  },
  editButtonText: {
    color: Colors.secondaryButtonText,
    fontWeight: "500",
    marginLeft: 6,
  },
})
