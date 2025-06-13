"use client"

import type { Course } from "@/contexts/CoursesContext"
import { styles } from "@/styles/courseStyles"
import { BaseCourseCard } from "./BaseCourseCard"
import { TouchableOpacity, View } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useCourses } from "@/contexts/CoursesContext"
import { FavoriteConfirmModal } from "./FavoriteConfirmModal"
import React from "react"
import { useEffect, useState } from 'react';

interface Props {
  course: Course
  onPress?: () => void
  showFavoriteButton?: boolean
}

export function WideCourseCard({ course, onPress, showFavoriteButton = true }: Props) {
  const { toggleFavorite, isLoadingFavorites } = useCourses()
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleToggleFavorite = async (e: any) => {
    e.stopPropagation()
    if (!isLoadingFavorites) {
      if (course.is_favorite) {
        // Si ya es favorito, mostrar modal de confirmación para quitar
        setShowConfirmModal(true)
      } else {
        // Si no es favorito, mostrar modal de confirmación para añadir
        setShowConfirmModal(true)
      }
    }
  }

  const handleConfirmFavorite = async () => {
    await toggleFavorite(course.id, true)
    setShowConfirmModal(false)
  }

  return (
    <View style={{ position: "relative" }}>
      <BaseCourseCard course={course} cardStyle={styles.wideCard} onPress={onPress} />

      {showFavoriteButton && course.role === "student" && (
        <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite} disabled={isLoadingFavorites}>
          <MaterialIcons
            name={course.is_favorite ? "star" : "star-border"}
            size={24}
            color={course.is_favorite ? "#FFD700" : "#666"}
          />
        </TouchableOpacity>
      )}

      <FavoriteConfirmModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmFavorite}
        courseTitle={course.title}
        isRemoving={course.is_favorite}
      />
    </View>
  )
}
