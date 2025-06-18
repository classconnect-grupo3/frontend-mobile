"use client"
import { styles } from "@/styles/homeScreenStyles"
import { useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TextInput,
  Dimensions,
} from "react-native"
import { router } from "expo-router"
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { useCourses } from "@/contexts/CoursesContext"
import Header from "@/components/Header"
import { CreateCourseModal } from "@/components/courses/CreateCourseModal"
import { WideCourseCard } from "@/components/courses/WideCourseCard"
import type { Course } from "@/contexts/CoursesContext"
import { styles as courseStyles } from "@/styles/courseStyles"
import React from "react"

const ITEMS_PER_PAGE = 5
const { width } = Dimensions.get("window")

export default function MyCoursesScreen() {
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false)
  const { courses, reloadCourses, isLoadingCourses } = useCourses()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"teaching" | "active" | "finished">("teaching")
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])

  // Determinar si un curso está activo o finalizado
  const isActiveCourse = (course: Course) => {
    const now = new Date()
    const endDate = new Date(course.end_date)
    return endDate >= now
  }

  // Filtrar cursos según la pestaña activa y la búsqueda
  useEffect(() => {
    let filtered: Course[] = []

    // Filtrar por rol y estado (activo/finalizado)
    if (activeTab === "teaching") {
      filtered = courses.filter((c) => c.role === "teacher")
    } else if (activeTab === "active") {
      filtered = courses.filter((c) => c.role === "student" && isActiveCourse(c))
    } else {
      filtered = courses.filter((c) => c.role === "student" && !isActiveCourse(c))
    }

    // Aplicar búsqueda si existe
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          course.teacher_name.toLowerCase().includes(query),
      )
    }

    setFilteredCourses(filtered)
    setCurrentPage(1) // Resetear a la primera página cuando cambia el filtro
  }, [courses, activeTab, searchQuery])

  // Obtener cursos para la página actual
  const getPaginatedCourses = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredCourses.slice(startIndex, endIndex)
  }

  // Calcular total de páginas
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE))

  useEffect(() => {
    reloadCourses()
  }, [])

  // Renderizar componente de paginación
  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <View style={courseStyles.paginationContainer}>
        <TouchableOpacity
          style={currentPage === 1 ? courseStyles.paginationButtonDisabled : courseStyles.paginationButton}
          onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <Text style={courseStyles.paginationText}>Anterior</Text>
        </TouchableOpacity>

        <Text style={courseStyles.paginationInfo}>
          Página {currentPage} de {totalPages}
        </Text>

        <TouchableOpacity
          style={currentPage === totalPages ? courseStyles.paginationButtonDisabled : courseStyles.paginationButton}
          onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          <Text style={courseStyles.paginationText}>Siguiente</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Renderizar mensaje cuando no hay cursos
  const renderEmptyState = () => (
    <View style={localStyles.emptyContainer}>
      <MaterialIcons name="school" size={64} color="#ccc" style={localStyles.emptyIcon} />
      <Text style={localStyles.emptyText}>
        {activeTab === "teaching"
          ? "No estás enseñando ningún curso."
          : activeTab === "active"
            ? "No estás inscrito en ningún curso activo."
            : "No tienes cursos finalizados."}
      </Text>
      {activeTab === "teaching" && (
        <TouchableOpacity style={courseStyles.addButton} onPress={() => setShowCreateCourseModal(true)}>
          <Text style={courseStyles.buttonText}>Crear un curso</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      <Header />

      <View style={localStyles.content}>
        <Text style={localStyles.title}>Mis Cursos</Text>

        {/* Barra de búsqueda */}
        <View style={courseStyles.filterContainer}>
          <MaterialIcons name="search" size={24} color="#666" style={courseStyles.filterIcon} />
          <TextInput
            style={courseStyles.filterInput}
            placeholder="Buscar cursos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Pestañas de navegación */}
        <View style={localStyles.tabsContainer}>
          <TouchableOpacity
            style={[localStyles.tab, activeTab === "teaching" && localStyles.activeTab]}
            onPress={() => setActiveTab("teaching")}
          >
            <MaterialIcons
              name="school"
              size={20}
              color={activeTab === "teaching" ? "#007AFF" : "#666"}
              style={localStyles.tabIcon}
            />
            <Text style={[localStyles.tabText, activeTab === "teaching" && localStyles.activeTabText]}>Enseñando</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[localStyles.tab, activeTab === "active" && localStyles.activeTab]}
            onPress={() => setActiveTab("active")}
          >
            <MaterialIcons
              name="play-circle-filled"
              size={20}
              color={activeTab === "active" ? "#4CAF50" : "#666"}
              style={localStyles.tabIcon}
            />
            <Text style={[localStyles.tabText, activeTab === "active" && localStyles.activeTabText]}>Activos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[localStyles.tab, activeTab === "finished" && localStyles.activeTab]}
            onPress={() => setActiveTab("finished")}
          >
            <MaterialIcons
              name="check-circle"
              size={20}
              color={activeTab === "finished" ? "#FF9800" : "#666"}
              style={localStyles.tabIcon}
            />
            <Text style={[localStyles.tabText, activeTab === "finished" && localStyles.activeTabText]}>
              Finalizados
            </Text>
          </TouchableOpacity>
        </View>

        {isLoadingCourses ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : filteredCourses.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <Text style={localStyles.subtitle}>
              {filteredCourses.length} {filteredCourses.length === 1 ? "curso encontrado" : "cursos encontrados"}
            </Text>

            <FlatList
              data={getPaginatedCourses()}
              renderItem={({ item }) => (
                <WideCourseCard
                  course={item}
                  onPress={() => router.push(item.role === "teacher" ? `/course/${item.id}` : `/course/${item.id}/student`)}
                  showFavoriteButton={item.role === "student"}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={localStyles.listContainer}
              ListFooterComponent={renderPagination}
            />
          </>
        )}
      </View>

      <View style={localStyles.addButtonWrapper}>
        <TouchableOpacity onPress={() => setShowCreateCourseModal(true)} style={localStyles.createCourseButton}>
          <MaterialCommunityIcons name="book-plus-multiple" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <CreateCourseModal visible={showCreateCourseModal} onClose={() => setShowCreateCourseModal(false)} />
    </View>
  )
}

const localStyles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginVertical: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    flexDirection: "row",
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  tabIcon: {
    marginRight: 6,
  },
  listContainer: {
    paddingBottom: 80, // Espacio para el botón flotante
  },
  addButtonWrapper: {
    position: "absolute",
    bottom: 24,
    right: 24,
    zIndex: 10,
  },
  createCourseButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  emptyIcon: {
    marginBottom: 10,
  },
})
