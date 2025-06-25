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

export const statisticsClient = {
  async getCourseStatistics(courseId: string, token: string, teacherId: string): Promise<CourseStatistics> {
    const { data } = await courseClient.get(`/statistics/courses/${courseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Teacher-UUID": teacherId,
      },
    })

    const parsed = parseCSV(data.csv)
    return parsed[0] as CourseStatistics
  },

  async getStudentStatistics(
    studentId: string,
    courseId: string,
    token: string,
    teacherId: string,
  ): Promise<StudentStatistics> {
    const { data } = await courseClient.get(`/statistics/students/${studentId}?course_id=${courseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Teacher-UUID": teacherId,
      },
    })

    const parsed = parseCSV(data.csv)
    return parsed[0] as StudentStatistics
  },

  async getTeacherCoursesStatistics(teacherId: string, token: string): Promise<TeacherCoursesStatistics> {
    const { data } = await courseClient.get(`/statistics/teachers/${teacherId}/courses`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Teacher-UUID": teacherId,
      },
    })

    const parsed = parseCSV(data.csv)
    return { courses: parsed as CourseStatistics[] }
  },
}
