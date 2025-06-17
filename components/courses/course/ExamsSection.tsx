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
  isTeacher: boolean
}

export const ExamsSection = ({ exams, setExams, loading, onSubmit, onAddQuestions, isTeacher }: Props) => {
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
                <TouchableOpacity
                  style={[courseStyles.addButton, { backgroundColor: "#4CAF50", marginBottom: 8 }]}
                  onPress={() => onAddQuestions(exam.id)}
                >
                  <Text style={courseStyles.buttonText}>Add Questions  ({exam.questions.length})</Text>
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
