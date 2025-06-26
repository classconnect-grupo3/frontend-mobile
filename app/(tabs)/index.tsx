"use client"

import { useEffect, useState } from "react"
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal } from "react-native"
import { router } from "expo-router"
import { useAuth } from "@/contexts/sessionAuth"
import { useCourses } from "@/contexts/CoursesContext"
import { WideCourseCard } from "@/components/courses/WideCourseCard"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Colors, Typography, Spacing, LayoutStyles } from "@/styles/shared"
import { MaterialIcons } from "@expo/vector-icons"
import Toast from "react-native-toast-message"
import React from "react"

interface Task {
  id: string
  title: string
  due_date: string
  course_name: string
  course_id: string
}

export default function HomeScreen() {
  const auth = useAuth()
  const { courses, reloadCourses, isLoadingCourses } = useCourses()
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([])
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const authState = auth?.authState
  const user = authState?.user

  useEffect(() => {
    if (authState?.authenticated) {
      reloadCourses()
      // TODO: Fetch upcoming tasks from API
      setUpcomingTasks([
        {
          id: "1",
          title: "Ensayo sobre React Native",
          due_date: "2024-01-25T23:59:00Z",
          course_name: "Desarrollo Móvil",
          course_id: "1",
        },
        {
          id: "2",
          title: "Examen de Matemáticas",
          due_date: "2024-01-20T10:00:00Z",
          course_name: "Cálculo I",
          course_id: "2",
        },
      ])
    }
  }, [authState?.authenticated])

  const handleProfilePress = () => {
    setShowProfileMenu(true)
  }

  const handleProfileMenuClose = () => {
    setShowProfileMenu(false)
  }

  const handleGoToProfile = () => {
    setShowProfileMenu(false)
    router.push("/profile")
  }

  const handleLogout = () => {
    setShowProfileMenu(false)
    Toast.show({
      type: "success",
      text1: "Sesión cerrada",
      text2: "Has cerrado sesión exitosamente",
    })
    auth?.logout()
  }

  const recentCourses = courses?.slice(0, 5) || []

  return (
    <ScreenLayout>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} />
        </View>
        <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
          <Image
            source={
              user?.profilePicUrl ? { uri: user.profilePicUrl } : require("@/assets/images/profile_placeholder.png")
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      {/* Profile Menu Modal */}
      <Modal visible={showProfileMenu} transparent={true} animationType="fade" onRequestClose={handleProfileMenuClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleProfileMenuClose}>
          <View style={styles.profileMenu}>
            <View style={styles.profileMenuHeader}>
              <Image
                source={
                  user?.profilePicUrl ? { uri: user.profilePicUrl } : require("@/assets/images/profile_placeholder.png")
                }
                style={styles.profileMenuImage}
              />
              <View style={styles.profileMenuInfo}>
                <Text style={styles.profileMenuName}>{user?.name || "Usuario"}</Text>
                <Text style={styles.profileMenuEmail}>{user?.email || ""}</Text>
              </View>
            </View>

            <View style={styles.profileMenuDivider} />

            <TouchableOpacity style={styles.profileMenuItem} onPress={handleGoToProfile}>
              <MaterialIcons name="person" size={20} color="#333" />
              <Text style={styles.profileMenuItemText}>Ver perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileMenuItem} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color="#dc3545" />
              <Text style={[styles.profileMenuItemText, styles.logoutText]}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Welcome Section */}
      <View style={[LayoutStyles.section, styles.welcomeSection]}>
        <Text style={styles.welcomeText}>¡Hola, {user?.name || "Usuario"}! 👋</Text>
        <Text style={styles.subtitleText}>Continúa con tu aprendizaje</Text>
      </View>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <View style={LayoutStyles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximas tareas</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Recent Courses */}
      <View style={LayoutStyles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cursos recientes</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/myCourses")}>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {isLoadingCourses ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando cursos...</Text>
          </View>
        ) : recentCourses.length > 0 ? (
          <View>
            {recentCourses.map((course, idx) => (
              <WideCourseCard
                key={idx}
                course={course}
                onPress={() =>
                  router.push(course.role === "teacher" ? `/course/${course.id}` : `/course/${course.id}/student`)
                }
                showFavoriteButton={course.role === "student"}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="school" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No tienes cursos aún</Text>
            <Text style={styles.emptySubtext}>Explora y únete a cursos interesantes</Text>
          </View>
        )}
      </View>

      <Toast />
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  header: {
    ...LayoutStyles.spaceBetween,
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: "contain",
  },
  profileButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 16,
  },
  profileMenu: {
    backgroundColor: "#fff",
    borderRadius: 12,
    minWidth: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  profileMenuHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  profileMenuImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    marginRight: 12,
  },
  profileMenuInfo: {
    flex: 1,
  },
  profileMenuName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  profileMenuEmail: {
    fontSize: 14,
    color: "#666",
  },
  profileMenuDivider: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginHorizontal: 16,
  },
  profileMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  profileMenuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  logoutText: {
    color: "#dc3545",
  },
  welcomeSection: {
    marginBottom: Spacing.xl,
  },
  welcomeText: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  subtitleText: {
    ...Typography.body1,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    ...LayoutStyles.spaceBetween,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h5,
  },
  seeAllText: {
    ...Typography.body2,
    color: Colors.primary,
    fontWeight: "600",
  },
  horizontalList: {
    paddingLeft: 0,
  },
  loadingContainer: {
    ...LayoutStyles.center,
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    ...LayoutStyles.center,
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    ...Typography.h6,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    ...Typography.body2,
    color: Colors.textMuted,
    textAlign: "center",
  },
})
