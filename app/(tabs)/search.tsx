"use client"

import { View, TextInput, StyleSheet, TouchableOpacity, Text, FlatList, Modal } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { styles as homeStyles } from "@/styles/homeScreenStyles"
import { useRouter } from "expo-router"
import { useState, useEffect } from "react"
import { courseClient as client } from "@/lib/courseClient"
import Header from "@/components/Header"
import { useAuth } from "@/contexts/sessionAuth"
import { WideCourseCard } from "@/components/courses/WideCourseCard"
import { EnrollModal } from "@/components/courses/EnrollModal"
import { useCourses } from "@/contexts/CoursesContext"
import Toast from "react-native-toast-message"
import React from "react"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Colors } from "@/styles/shared"

interface User {
  uid: string
  name: string
  surname: string
  email: string
}

interface UserActionsModalProps {
  visible: boolean
  user: User | null
  onClose: () => void
  teacherCourses: any[]
}

function UserActionsModal({ visible, user, onClose, teacherCourses }: UserActionsModalProps) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [isPromoting, setIsPromoting] = useState(false)
  const auth = useAuth()

  const handlePromoteToAuxTeacher = async () => {
    if (!selectedCourse || !user || !auth?.authState.token) return

    try {
      setIsPromoting(true)
      const data = await client.post(
        `/courses/${selectedCourse}/aux-teacher/add`,
        {
          aux_teacher_id: user.uid,
          teacher_id: auth.authState.user?.id,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.authState.token}`,
          },
        },
      )

      console.log("User promoted successfully:", data)
      Toast.show({
        type: "success",
        text1: "Usuario promovido",
        text2: `${user.name} ${user.surname} ahora es docente auxiliar`,
      })

      onClose()
    } catch (error) {
      console.error("Error promoting user:", error)
      console.log("Error details:", error.response?.data || error.message)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo promover al usuario",
      })
    } finally {
      setIsPromoting(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Acciones para {user?.name} {user?.surname}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.userInfo}>
              <MaterialIcons name="person" size={24} color="#007AFF" />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {user?.name} {user?.surname}
                </Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Promover a docente auxiliar</Text>
            <Text style={styles.sectionDescription}>
              Selecciona un curso donde quieras agregar a este usuario como docente auxiliar:
            </Text>

            {teacherCourses.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="school" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No tienes cursos donde puedas agregar docentes auxiliares</Text>
              </View>
            ) : (
              <FlatList
                data={teacherCourses}
                keyExtractor={(item) => item.id}
                style={styles.coursesList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.courseOption, selectedCourse === item.id && styles.selectedCourseOption]}
                    onPress={() => setSelectedCourse(item.id)}
                  >
                    <View style={styles.courseOptionContent}>
                      <MaterialIcons name="school" size={20} color={selectedCourse === item.id ? "#007AFF" : "#666"} />
                      <View style={styles.courseOptionText}>
                        <Text
                          style={[
                            styles.courseOptionTitle,
                            selectedCourse === item.id && styles.selectedCourseOptionTitle,
                          ]}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.courseOptionDescription}>{item.description}</Text>
                      </View>
                      {selectedCourse === item.id && <MaterialIcons name="check-circle" size={20} color="#007AFF" />}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.promoteButton,
                (!selectedCourse || isPromoting) && styles.disabledButton,
              ]}
              onPress={handlePromoteToAuxTeacher}
              disabled={!selectedCourse || isPromoting}
            >
              {isPromoting ? (
                <MaterialIcons name="hourglass-empty" size={16} color="#fff" />
              ) : (
                <MaterialIcons name="school" size={16} color="#fff" />
              )}
              <Text style={styles.promoteButtonText}>{isPromoting ? "Promoviendo..." : "Promover"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default function SearchScreen() {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<"users" | "courses">("users")
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserActions, setShowUserActions] = useState(false)
  const auth = useAuth()
  const { courses: allCourses } = useCourses()

  // Filtrar solo los cursos donde el usuario es teacher
  const teacherCourses = allCourses.filter((course) => course.role === "teacher")

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search.trim()) {
        if (selectedTab === "users") {
          fetchUsers()
        } else {
          fetchCourses()
        }
      } else {
        setUsers([])
        setCourses([])
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [search, selectedTab])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data } = await client.get(`/users/search?query=${search}`, {
        headers: {
          Authorization: `Bearer ${auth?.authState.token}`,
        },
      })
      setUsers(data.data)
    } catch (e) {
      console.error("Error searching users:", e)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const { data } = await client.get(`/courses/title/${search}`, {
        headers: {
          Authorization: `Bearer ${auth?.authState.token}`,
        },
      })
      setCourses(data)
    } catch (e) {
      console.error("Error searching courses:", e)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleUserPress = (user: User) => {
    setSelectedUser(user)
    setShowUserActions(true)
  }

  const renderUserCard = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.modernUserCard} onPress={() => handleUserPress(item)}>
      <View style={styles.userCardContent}>
        <View style={styles.userAvatar}>
          <MaterialIcons name="person" size={24} color="#007AFF" />
        </View>
        <View style={styles.userCardInfo}>
          <Text style={styles.userCardName}>
            {item.name} {item.surname}
          </Text>
          <Text style={styles.userCardEmail}>{item.email}</Text>
        </View>
        <View style={styles.userCardActions}>
          <MaterialIcons name="more-vert" size={20} color="#666" />
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <ScreenLayout>
    <View style={homeStyles.container}>
      <Header />
      <Text style={styles.title}>
        Buscar {selectedTab === "users" ? "Usuarios" : "Cursos"} 
      </Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar usuarios o cursos..."
            style={styles.searchInput}
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} style={styles.clearButton}>
              <MaterialIcons name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "users" && styles.activeTab]}
          onPress={() => setSelectedTab("users")}
        >
          <MaterialIcons name="people" size={20} color={selectedTab === "users" ? "#007AFF" : "#666"} />
          <Text style={[styles.tabText, selectedTab === "users" && styles.activeTabText]}>Usuarios</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === "courses" && styles.activeTab]}
          onPress={() => setSelectedTab("courses")}
        >
          <MaterialIcons name="school" size={20} color={selectedTab === "courses" ? "#007AFF" : "#666"} />
          <Text style={[styles.tabText, selectedTab === "courses" && styles.activeTabText]}>Cursos</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {!search.trim() ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="search" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Busca usuarios o cursos</Text>
            <Text style={styles.emptyStateDescription}>
              Escribe en el campo de búsqueda para encontrar {selectedTab === "users" ? "usuarios" : "cursos"}
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.loadingState}>
            <MaterialIcons name="hourglass-empty" size={32} color="#007AFF" />
            <Text style={styles.loadingText}>Buscando...</Text>
          </View>
        ) : selectedTab === "users" ? (
          users.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="person-off" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No se encontraron usuarios</Text>
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item.uid}
              renderItem={renderUserCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )
        ) :courses !== null && courses.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="school-off" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No se encontraron cursos</Text>
          </View>
        ) : (
          <FlatList
            data={courses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <WideCourseCard course={item} onPress={() => setSelectedCourse(item)} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
      

      {/* Modals */}
      <UserActionsModal
        visible={showUserActions}
        user={selectedUser}
        onClose={() => {
          setShowUserActions(false)
          setSelectedUser(null)
        }}
        teacherCourses={teacherCourses}
      />

      {selectedCourse && (
        <EnrollModal
          visible={true}
          onClose={() => setSelectedCourse(null)}
          courseId={selectedCourse.id}
          courseTitle={selectedCourse.title}
          studentId={auth?.authState.user?.id}
        />
      )}
    </View>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "black",
  },
  searchContainer: {
    paddingBottom: 16,
  },
  searchBar: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginLeft: 8,
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#333",
    marginTop: 16,
    textAlign: "center",
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 16,
    color: "#007AFF",
    marginTop: 12,
  },
  listContainer: {
    paddingBottom: 32,
  },
  modernUserCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  userCardInfo: {
    flex: 1,
  },
  userCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userCardEmail: {
    fontSize: 14,
    color: "#666",
  },
  userCardActions: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    flex: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  coursesList: {
    maxHeight: 200,
  },
  courseOption: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedCourseOption: {
    borderColor: "#007AFF",
    backgroundColor: "#e3f2fd",
  },
  courseOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  courseOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  courseOptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  selectedCourseOptionTitle: {
    color: "#007AFF",
  },
  courseOptionDescription: {
    fontSize: 12,
    color: "#666",
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  promoteButton: {
    backgroundColor: "#007AFF",
  },
  promoteButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
})
