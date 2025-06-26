import { courseClient } from "./courseClient"

export interface CourseStatistics {
  course_id: string
  course_name: string
  period_from: string
  period_to: string
  average_score: number
  assignment_completion_rate: number
  exam_completion_rate: number
  homework_completion_rate: number
  exam_average: number
  homework_average: number
  total_students: number
  total_assignments: number
  total_amount_of_exams: number
  total_amount_of_homeworks: number
  forum_participation_rate: number
  forum_unique_participants: number
}

export interface StudentStatistics {
  student_id: string
  course_id: string
  course_name: string
  period_from: string
  period_to: string
  average_score: number
  completion_rate: number
  participation_rate: number
  completed_assignments: number
  exam_score: number
  exam_completed: number
  homework_score: number
  homework_completed: number
  forum_posts: number
  forum_participated: boolean
  forum_questions: number
  forum_answers: number
}

export interface TeacherCoursesStatistics {
  courses: CourseStatistics[]
}

export interface DateRange {
  from: Date
  to: Date
}

// Utility function to parse CSV data
const parseCSV = (csvString: string): any[] => {
  const lines = csvString.trim().split("\n")
  if (lines.length < 2) return []

  const headers = lines[0].split(";")
  const data = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(";")
    const row: any = {}

    headers.forEach((header, index) => {
      const value = values[index]

      // Convert numeric values
      if (!isNaN(Number(value)) && value !== "") {
        row[header] = Number(value)
      }
      // Convert boolean values
      else if (value === "true" || value === "false") {
        row[header] = value === "true"
      }
      // Keep as string
      else {
        row[header] = value
      }
    })

    data.push(row)
  }

  return data
}

// Helper function to format date for API
const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split("T")[0]
}

export const statisticsClient = {
  async getCourseStatistics(
    courseId: string,
    token: string,
    teacherId: string,
    dateRange?: DateRange,
  ): Promise<CourseStatistics> {
    try {
      const fromDate = formatDateForAPI(dateRange?.from) || "2025-05-17"
      const toDate = formatDateForAPI(dateRange?.to) || "2025-12-17"

      const { data } = await courseClient.get(`/statistics/courses/${courseId}?from=${fromDate}&to=${toDate}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Teacher-UUID": teacherId,
        },
      })
      console.log("Course statistics data:", data)

      const parsed = parseCSV(data.csv)
      return parsed[0] as CourseStatistics
    } catch (error) {
      console.error("Error fetching course statistics:", error)
      console.log("more details:", error.response?.data || error.message)
      throw error
    }
  },

  async getStudentStatistics(
    studentId: string,
    courseId: string,
    token: string,
    teacherId: string,
    dateRange?: DateRange,
  ): Promise<StudentStatistics> {
    try {
      const fromDate = formatDateForAPI(dateRange?.from) || "2025-05-17"
      const toDate = formatDateForAPI(dateRange?.to) || "2025-12-17"

      const { data } = await courseClient.get(
        `/statistics/students/${studentId}?course_id=${courseId}&from=${fromDate}&to=${toDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Teacher-UUID": teacherId,
          },
        },
      )

      const parsed = parseCSV(data.csv)
      return parsed[0] as StudentStatistics
    } catch (error) {
      console.error("Error fetching student statistics:", error)
      console.log("more details:", error.response?.data || error.message)
      throw error
    }
  },

  async getTeacherCoursesStatistics(
    teacherId: string,
    token: string,
    dateRange?: DateRange,
  ): Promise<TeacherCoursesStatistics> {
    try {
      const fromDate = formatDateForAPI(dateRange?.from) || "2025-05-17"
      const toDate = formatDateForAPI(dateRange?.to) || "2025-12-17"

      const { data } = await courseClient.get(
        `/statistics/teachers/${teacherId}/courses?from=${fromDate}&to=${toDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Teacher-UUID": teacherId,
          },
        },
      )

      const parsed = parseCSV(data.csv)
      return { courses: parsed as CourseStatistics[] }
    } catch (error) {
      console.error("Error fetching teacher statistics:", error)
      console.log("more details:", error.response?.data || error.message)
      throw error
    }
  },
}
