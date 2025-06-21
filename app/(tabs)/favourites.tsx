"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from "react-native"
import { useCourses } from "@/contexts/CoursesContext"
import { WideCourseCard } from "@/components/courses/WideCourseCard"
import { styles as homeScreenStyles } from "@/styles/homeScreenStyles"
import { styles as courseStyles } from "@/styles/courseStyles"
import Header from "@/components/Header"
import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import React from "react"
import { ScreenLayout } from "@/components/layout/ScreenLayout"

const ITEMS_PER_PAGE = 5

export default function FavoritesScreen() {
  const { favoriteCourses, isLoadingCourses, reloadCourses } = useCourses()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredCourses, setFilteredCourses] = useState(favoriteCourses)

  // Filtrar cursos cuando cambia la búsqueda o los favoritos
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCourses(favoriteCourses)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = favoriteCourses.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          course.teacher_name.toLowerCase().includes(query),
      )
      setFilteredCourses(filtered)
    }
    setCurrentPage(1) // Resetear a la primera página cuando cambia el filtro
  }, [searchQuery, favoriteCourses])

  // Obtener cursos para la página actual
  const getPaginatedCourses = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredCourses.slice(startIndex, endIndex)
  }

  // Calcular total de páginas
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE))

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

  // Renderizar mensaje cuando no hay favoritos
  const renderEmptyState = () => (
    <View style={courseStyles.emptyFavoritesContainer}>
      <MaterialIcons name="star-border" size={64} color="#ccc" style={courseStyles.emptyFavoritesIcon} />
      <Text style={courseStyles.emptyFavoritesText}>No tienes cursos favoritos.</Text>
      <Text style={courseStyles.emptyFavoritesText}>Marca cursos como favoritos para acceder rápidamente a ellos.</Text>
      <TouchableOpacity
        style={[courseStyles.addButton, { marginTop: 20 }]}
        onPress={() => router.push("/(tabs)/myCourses")}
      >
        <Text style={courseStyles.buttonText}>Ver mis cursos</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <ScreenLayout>
    <View style={homeScreenStyles.container}>
      <Header />

      <View style={styles.content}>
        <Text style={styles.title}>Cursos Favoritos</Text>

        {/* Barra de búsqueda */}
        <View style={courseStyles.searchContainer}>
          <View style={courseStyles.searchBar}>
            <MaterialIcons name="search" size={20} color="#666" style={courseStyles.searchIcon} />
            <TextInput
              style={courseStyles.searchInput}
              placeholderTextColor="#999"
              placeholder="Buscar favoritos..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={courseStyles.clearButton}>
                <MaterialIcons name="clear" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {isLoadingCourses ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : favoriteCourses.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <Text style={styles.subtitle}>
              {filteredCourses.length} {filteredCourses.length === 1 ? "curso" : "cursos"} favoritos
            </Text>

            <FlatList
              data={getPaginatedCourses()}
              renderItem={({ item }) => (
                <WideCourseCard course={item} onPress={() => router.push(`/course/${item.id}/student`)} />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              ListFooterComponent={renderPagination}
            />
          </>
        )}
      </View>
    </View>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
})
