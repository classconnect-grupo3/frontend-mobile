import type { Course } from "@/contexts/CoursesContext"
import { styles } from "@/styles/courseStyles"
import { BaseCourseCard } from "./BaseCourseCard"
import { TouchableOpacity, View } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useCourses } from "@/contexts/CoursesContext"
import React from "react"

interface Props {
  course: Course
  onPress?: () => void
  showFavoriteButton?: boolean
}

export function WideCourseCard({ course, onPress, showFavoriteButton = true }: Props) {
  const { toggleFavorite, isLoadingFavorites } = useCourses()

  const handleToggleFavorite = async (e: any) => {
    e.stopPropagation()
    if (!isLoadingFavorites) {
      await toggleFavorite(course.id)
    }
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
    </View>
  )
}
