"use client"

import { View, Text, TouchableOpacity } from "react-native"
import React from "react"
import { useState } from "react"
import { styles as courseStyles } from "@/styles/courseStyles"
import { NewAssignmentModal as NewTaskModal } from "@/components/NewAssignmentModal" // reuse this for now
import type { Assignment } from "@/app/course/[id]/CourseViewScreen"

interface Props {
  exams: Assignment[] | null
  setExams: React.Dispatch<React.SetStateAction<Assignment[] | null>>
  loading: boolean
  onSubmit: (examId: string) => void
  onAddQuestions: (examId: string) => void
  onViewQuestions: (examId: string) => void
  isTeacher: boolean
}

export const ExamsSection = ({
  exams,
  setExams,
  loading,
  onSubmit,
  onAddQuestions,
  onViewQuestions,
  isTeacher,
}: Props) => {
  const [showExamModal, setShowExamModal] = useState(false)

  const handleAddExam = (exam: Omit<Assignment, "id">) => {
    setExams((prev) => [...(prev ?? []), { ...exam, id: Date.now().toString() }])
  }

  const handleDeleteExam = (id: string) => {
    setExams((prev) => (prev ?? []).filter((e) => e.id !== id))
  }

  return (
    <>
      <Text style={courseStyles.sectionHeader}>Exámenes</Text>

      {isTeacher && (
        <TouchableOpacity onPress={() => setShowExamModal(true)} style={courseStyles.addButton}>
          <Text style={courseStyles.buttonText}>+ Agregar examen</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <Text style={courseStyles.taskDescription}>Cargando exámenes...</Text>
      ) : !exams || exams.length === 0 ? (
        <Text style={courseStyles.taskDescription}>No hay exámenes disponibles.</Text>
      ) : (
        exams.map((exam) => (
          <View key={exam.id} style={courseStyles.taskCard}>
            <Text style={courseStyles.taskTitle}>{exam.title}</Text>
            <Text style={courseStyles.taskDescription}>{exam.description}</Text>
            <Text style={courseStyles.taskDeadline}>📅 {exam.due_date}</Text>

            {isTeacher && (
              <>
                <TouchableOpacity style={examButtonStyles.viewQuestionsButton} onPress={() => onViewQuestions(exam.id)}>
                  <Text style={examButtonStyles.viewQuestionsButtonText}>View Questions ({exam.questions.length})</Text>
                </TouchableOpacity>

                <TouchableOpacity style={examButtonStyles.addQuestionsButton} onPress={() => onAddQuestions(exam.id)}>
                  <Text style={examButtonStyles.addQuestionsButtonText}>Add Questions</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteExam(exam.id)}>
                  <Text style={courseStyles.taskDelete}>Eliminar</Text>
                </TouchableOpacity>
              </>
            )}

            {!isTeacher && (
              <TouchableOpacity style={courseStyles.addButton} onPress={() => onSubmit(exam.id)}>
                <Text style={courseStyles.buttonText}>Entregar</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <NewTaskModal visible={showExamModal} onClose={() => setShowExamModal(false)} onCreate={handleAddExam} />
    </>
  )
}


const examButtonStyles = {
  viewQuestionsButton: {
    backgroundColor: "#E8F4FD",
    borderWidth: 1,
    borderColor: "#1976D2",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  viewQuestionsButtonText: {
    color: "#1976D2",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  addQuestionsButton: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#2196F3",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  addQuestionsButtonText: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "600" as const,
  },
}