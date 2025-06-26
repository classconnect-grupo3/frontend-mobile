"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./sessionAuth"
import { courseClient } from "@/lib/courseClient"
import Toast from "react-native-toast-message"

export interface Course {
  id: string
  title: string
  description: string
  teacher_name: string
  start_date: string
  end_date: string
  capacity: number
  role: "teacher" | "student"
  is_favorite?: boolean
}

interface CoursesContextType {
  courses: Course[]
  favoriteCourses: Course[]
  addCourse: (course: Course) => void
  reloadCourses: () => void
  isLoadingCourses: boolean
  toggleFavorite: (courseId: string, skipConfirmation?: boolean) => Promise<void>
  isLoadingFavorites: boolean
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined)

export const useCourses = () => {
  const context = useContext(CoursesContext)
  if (!context) {
    throw new Error("useCourses must be used within a CoursesProvider")
  }
  return context
}

export const CoursesProvider = ({ children }: { children: React.ReactNode }) => {
  const [courses, setCourses] = useState<Course[]>([])
  const [favoriteCourses, setFavoriteCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false)
  const auth = useAuth()
  if (!auth) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  const { authState } = auth

  const fetchFavoriteCourses = async (userId: string, token: string): Promise<string[]> => {
    try {
      const { data } = await courseClient.get(`/courses/student/${userId}/favourite`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Devolvemos solo los IDs para fácil comparación
    return data.map((course: any) => course.id);
    } catch (error) {
      console.error("Error fetching favorite courses:", error);
      return [];
    }
  };

  const reloadCourses = async () => {
    const userId = authState.user?.id;
    if (!userId) {
      console.warn("❌ No user ID available to reload courses");
      return;
    }

    try {
      setIsLoadingCourses(true);

      const [allData, favoriteIds] = await Promise.all([
        courseClient.get(`/courses/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${authState.token}`,
          },
        }),
        fetchFavoriteCourses(userId, authState.token ? authState.token : ""),
      ]);

      const isFavorite = (id: string) => favoriteIds.includes(id);
      console.log("courses fetched: ", allData.data)

      // how can i extend to add the ones from data.aux_teacher?
      const teacherCourses = (allData.data.teacher ?? []).map((c: any) => ({
        ...c,
        role: "teacher",
        is_favorite: isFavorite(c.id),
      }));

      const auxTeacherCourses = (allData.data.aux_teacher ?? []).map((c: any) => ({
        ...c,
        role: "teacher",
        is_favorite: isFavorite(c.id),
      }));

      const studentCourses = (allData.data.student ?? []).map((c: any) => ({
        ...c,
        role: "student",
        is_favorite: isFavorite(c.id),
      }));

      const allCourses = [...teacherCourses,...auxTeacherCourses, ...studentCourses];
      setCourses(allCourses);

      const favorites = allCourses.filter((c) => c.is_favorite);
      setFavoriteCourses(favorites);
    } catch (e) {
      console.error("Error reloading courses:", e);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const toggleFavorite = async (courseId: string, skipConfirmation = false) => {
    try {
      const userId = authState.user?.id
      setIsLoadingFavorites(true)
      const course = courses.find((c) => c.id === courseId)

      if (!course) {
        throw new Error("Course not found")
      }

      if (course.is_favorite) {
        await courseClient.delete(
          `/courses/${courseId}/favourite`,
          {
            data: { student_id: userId },
            headers: {
              Authorization: `Bearer ${authState.token}`,
            },
          },
        )

        Toast.show({
          type: "success",
          text1: "Curso eliminado de favoritos",
        })
      } else {
        console.log("Enviando solicitud para marcar curso como favorito: ", courseId)
        console.log("User ID:", userId)
        const data = await courseClient.post(
          `/courses/${courseId}/favourite`,
          {
            student_id: userId,
          },
          {
            headers: {
              Authorization: `Bearer ${authState.token}`,
            },
          },
        )

        console.log("Respuesta de marcar favorito:", data)

        Toast.show({
          type: "success",
          text1: "Curso marcado como favorito",
        })
      }

      await reloadCourses()
    } catch (e) {
      console.error("Error toggling favorite:", e)
      console.error("more error details:", (e as any).response?.data || (e as any).message)
      Toast.show({
        type: "error",
        text1: "Error al actualizar favoritos",
        text2: "Intente nuevamente",
      })
    } finally {
      setIsLoadingFavorites(false)
    }
  }


  const addCourse = (course: Course) => {
    setCourses((prev) => [...prev, course])
  }

  useEffect(() => {
    if (!authState.authenticated) {
      console.log("⏳ Auth not ready yet")
      return
    }

    reloadCourses()
  }, [authState.user?.id, authState.token])

  return (
    <CoursesContext.Provider
      value={{
        courses,
        favoriteCourses,
        addCourse,
        reloadCourses,
        isLoadingCourses,
        toggleFavorite,
        isLoadingFavorites,
      }}
    >
      {children}
    </CoursesContext.Provider>
  )
}
