"use client"

import { useState } from "react"
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Picker } from "@react-native-picker/picker"
import { courseClient } from "@/lib/courseClient"
import Toast from "react-native-toast-message"
import { useAuth } from "@/contexts/sessionAuth"
import type { Assignment } from "@/app/course/[id]/CourseViewScreen"
import React from "react"

interface Question {
  id: string
  text: string
  type: "text" | "multiple_choice" | "file"
  options?: string[]
  correct_answers?: string[]
  order: number
  points: number
}

interface Props {
  visible: boolean
  assignment: Assignment | null
  onClose: () => void
  onSuccess: () => void
}

export function AddQuestionsModal({ visible, assignment, onClose, onSuccess }: Props) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const authContext = useAuth()
  const authState = authContext?.authState

  // Calcular puntos totales
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
  const remainingPoints = 100 - totalPoints
  const isPointsValid = totalPoints === 100

  const addNewQuestion = () => {
    // Calcular puntos sugeridos para la nueva pregunta
    const suggestedPoints = remainingPoints > 0 ? Math.min(remainingPoints, 10) : 10

    const newQuestion: Question = {
      id: `temp_${Date.now()}`,
      text: "",
      type: "text",
      options: [],
      correct_answers: [],
      order: questions.length,
      points: suggestedPoints,
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates }
    setQuestions(updatedQuestions)
  }

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index)
    // Update order for remaining questions
    const reorderedQuestions = updatedQuestions.map((q, i) => ({ ...q, order: i }))
    setQuestions(reorderedQuestions)
  }

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex]
    const newOptions = [...(question.options || []), ""]
    updateQuestion(questionIndex, { options: newOptions })
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex]
    const newOptions = [...(question.options || [])]
    newOptions[optionIndex] = value
    updateQuestion(questionIndex, { options: newOptions })
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex]
    const newOptions = (question.options || []).filter((_, i) => i !== optionIndex)
    // Also remove from correct answers if it was selected
    const newCorrectAnswers = (question.correct_answers || []).filter(
      (answer) => answer !== question.options?.[optionIndex],
    )
    updateQuestion(questionIndex, { options: newOptions, correct_answers: newCorrectAnswers })
  }

  const toggleCorrectAnswer = (questionIndex: number, option: string) => {
    const question = questions[questionIndex]
    const currentCorrect = question.correct_answers || []
    const isCurrentlyCorrect = currentCorrect.includes(option)

    let newCorrectAnswers: string[]
    if (isCurrentlyCorrect) {
      newCorrectAnswers = currentCorrect.filter((answer) => answer !== option)
    } else {
      newCorrectAnswers = [...currentCorrect, option]
    }

    updateQuestion(questionIndex, { correct_answers: newCorrectAnswers })
  }

  // Función para distribuir puntos automáticamente
  const distributePointsEvenly = () => {
    if (questions.length === 0) return

    const pointsPerQuestion = Math.floor(100 / questions.length)
    const remainder = 100 % questions.length

    const updatedQuestions = questions.map((q, index) => ({
      ...q,
      points: pointsPerQuestion + (index < remainder ? 1 : 0),
    }))

    setQuestions(updatedQuestions)
  }

  const validateQuestions = (): boolean => {
    if (totalPoints !== 100) {
      Alert.alert(
        "Error de puntuación",
        `Las preguntas deben sumar exactamente 100 puntos. Actualmente suman ${totalPoints} puntos.`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Distribuir automáticamente", onPress: distributePointsEvenly },
        ],
      )
      return false
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]

      if (!question.text.trim()) {
        Alert.alert("Error", `La pregunta ${i + 1} debe tener texto`)
        return false
      }

      if (question.points <= 0) {
        Alert.alert("Error", `La pregunta ${i + 1} debe tener puntos mayor a 0`)
        return false
      }

      if (question.type === "multiple_choice") {
        if (!question.options || question.options.length < 2) {
          Alert.alert("Error", `La pregunta ${i + 1} debe tener al menos 2 opciones`)
          return false
        }

        if (question.options.some((opt) => !opt.trim())) {
          Alert.alert("Error", `Todas las opciones de la pregunta ${i + 1} deben tener texto`)
          return false
        }

        if (!question.correct_answers || question.correct_answers.length === 0) {
          Alert.alert("Error", `La pregunta ${i + 1} debe tener al menos una respuesta correcta`)
          return false
        }
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (questions.length === 0) {
      Alert.alert("Error", "Debes agregar al menos una pregunta")
      return
    }

    if (!validateQuestions()) {
      return
    }

    if (!assignment || !authState?.token) {
      Alert.alert("Error", "No se pudo obtener la información del examen")
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare questions for API
      const apiQuestions = questions.map((q, index) => ({
        id: index.toString(),
        text: q.text.trim(),
        type: q.type,
        options: q.type === "multiple_choice" ? q.options : undefined,
        correct_answers: q.type === "multiple_choice" ? q.correct_answers : undefined,
        order: index,
        points: q.points,
      }))

      // Prepare the complete assignment data for update
      const updateData = {
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        due_date: assignment.due_date,
        type: assignment.type,
        status: "active",
        grace_period: 30,
        passing_score: assignment.passing_score || 60, // Mantener el passing_score existente o usar 60 por defecto
        total_points: 100, // Siempre 100 puntos
        questions: apiQuestions,
      }

      await courseClient.put(`/assignments/${assignment.id}`, updateData, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      })

      Toast.show({
        type: "success",
        text1: "Preguntas agregadas exitosamente",
        text2: `Se agregaron ${questions.length} preguntas (100 puntos total)`,
      })

      setQuestions([])
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating assignment with questions:", error)
      Toast.show({
        type: "error",
        text1: "Error al agregar preguntas",
        text2: "No se pudieron guardar las preguntas",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderPointsIndicator = () => (
    <View style={[styles.pointsIndicator, !isPointsValid && styles.pointsIndicatorError]}>
      <View style={styles.pointsHeader}>
        <MaterialIcons
          name={isPointsValid ? "check-circle" : "error"}
          size={20}
          color={isPointsValid ? "#4CAF50" : "#F44336"}
        />
        <Text style={[styles.pointsTitle, !isPointsValid && styles.pointsError]}>
          Puntuación Total: {totalPoints}/100
        </Text>
      </View>

      <View style={styles.pointsBar}>
        <View
          style={[
            styles.pointsBarFill,
            {
              width: `${Math.min(totalPoints, 100)}%`,
              backgroundColor: isPointsValid ? "#4CAF50" : totalPoints > 100 ? "#F44336" : "#FF9800",
            },
          ]}
        />
      </View>

      <View style={styles.pointsActions}>
        <Text style={styles.pointsRemaining}>
          {remainingPoints > 0
            ? `Faltan ${remainingPoints} puntos`
            : remainingPoints < 0
              ? `Excede por ${Math.abs(remainingPoints)} puntos`
              : "✓ Puntuación perfecta"}
        </Text>

        {questions.length > 0 && !isPointsValid && (
          <TouchableOpacity style={styles.distributeButton} onPress={distributePointsEvenly}>
            <MaterialIcons name="auto-fix-high" size={16} color="#007AFF" />
            <Text style={styles.distributeButtonText}>Distribuir automáticamente</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  const renderQuestion = (question: Question, index: number) => (
    <View key={index} style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>Pregunta {index + 1}</Text>
        <TouchableOpacity onPress={() => removeQuestion(index)} style={styles.removeButton}>
          <MaterialIcons name="delete" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>

      {/* Question Text */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Texto de la pregunta *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Escribe la pregunta aquí..."
          value={question.text}
          onChangeText={(text) => updateQuestion(index, { text })}
          multiline
        />
      </View>

      {/* Question Type */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tipo de pregunta</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={question.type}
            onValueChange={(type) =>
              updateQuestion(index, {
                type: type as "text" | "multiple_choice" | "file",
                options: type === "multiple_choice" ? [""] : [],
                correct_answers: type === "multiple_choice" ? [] : undefined,
              })
            }
            style={styles.picker}
          >
            <Picker.Item label="Texto" value="text" />
            <Picker.Item label="Opción múltiple" value="multiple_choice" />
            <Picker.Item label="Archivo" value="file" />
          </Picker>
        </View>
      </View>

      {/* Points */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Puntos</Text>
        <View style={styles.pointsInputContainer}>
          <TextInput
            style={[styles.numberInput, question.points > remainingPoints + question.points && styles.pointsInputError]}
            placeholder="10"
            value={question.points.toString()}
            onChangeText={(text) => {
              const points = Number.parseInt(text) || 0
              updateQuestion(index, { points })
            }}
            keyboardType="numeric"
          />
          <Text style={styles.pointsHint}>
            {question.points > remainingPoints + question.points ? "⚠️ Excede puntos disponibles" : "✓ Válido"}
          </Text>
        </View>
      </View>

      {/* Multiple Choice Options */}
      {question.type === "multiple_choice" && (
        <View style={styles.optionsSection}>
          <View style={styles.optionsHeader}>
            <Text style={styles.label}>Opciones *</Text>
            <TouchableOpacity onPress={() => addOption(index)} style={styles.addOptionButton}>
              <MaterialIcons name="add" size={16} color="#007AFF" />
              <Text style={styles.addOptionText}>Agregar opción</Text>
            </TouchableOpacity>
          </View>

          {(question.options || []).map((option, optionIndex) => (
            <View key={optionIndex} style={styles.optionRow}>
              <TouchableOpacity
                style={[
                  styles.correctCheckbox,
                  (question.correct_answers || []).includes(option) && styles.correctCheckboxSelected,
                ]}
                onPress={() => toggleCorrectAnswer(index, option)}
              >
                {(question.correct_answers || []).includes(option) && (
                  <MaterialIcons name="check" size={16} color="#fff" />
                )}
              </TouchableOpacity>

              <TextInput
                style={styles.optionInput}
                placeholder={`Opción ${optionIndex + 1}`}
                value={option}
                onChangeText={(text) => updateOption(index, optionIndex, text)}
              />

              <TouchableOpacity onPress={() => removeOption(index, optionIndex)} style={styles.removeOptionButton}>
                <MaterialIcons name="close" size={16} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.helpText}>Marca las opciones correctas haciendo clic en el círculo verde</Text>
        </View>
      )}

      {question.type === "file" && (
        <View style={styles.helpSection}>
          <MaterialIcons name="info" size={16} color="#666" />
          <Text style={styles.helpText}>Los estudiantes podrán subir un archivo como respuesta a esta pregunta</Text>
        </View>
      )}
    </View>
  )

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agregar Preguntas - {assignment?.title}</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Points Indicator */}
        {questions.length > 0 && renderPointsIndicator()}

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {questions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="quiz" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No hay preguntas aún</Text>
              <Text style={styles.emptyStateDescription}>
                Agrega preguntas que sumen exactamente 100 puntos para que los estudiantes puedan responder este examen
              </Text>
            </View>
          ) : (
            questions.map((question, index) => renderQuestion(question, index))
          )}

          <TouchableOpacity style={styles.addQuestionButton} onPress={addNewQuestion}>
            <MaterialIcons name="add" size={24} color="#007AFF" />
            <Text style={styles.addQuestionText}>Agregar nueva pregunta</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (questions.length === 0 || !isPointsValid || isSubmitting) && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={questions.length === 0 || !isPointsValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="save" size={20} color="#fff" />
            )}
            <Text style={styles.saveButtonText}>
              {isSubmitting ? "Guardando..." : `Guardar ${questions.length} preguntas (${totalPoints}/100 pts)`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  pointsIndicator: {
    backgroundColor: "#e8f5e8",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  pointsIndicatorError: {
    backgroundColor: "#ffeaea",
  },
  pointsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    marginLeft: 8,
  },
  pointsError: {
    color: "#F44336",
  },
  pointsBar: {
    height: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  pointsBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  pointsActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsRemaining: {
    fontSize: 14,
    color: "#666",
  },
  distributeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  distributeButtonText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
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
  questionCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  removeButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
    minHeight: 80,
    textAlignVertical: "top",
  },
  pointsInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
    width: 100,
    marginRight: 12,
  },
  pointsInputError: {
    borderColor: "#F44336",
    backgroundColor: "#ffeaea",
  },
  pointsHint: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
    color: "#333",
  },
  optionsSection: {
    marginTop: 8,
  },
  optionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addOptionText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  correctCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  correctCheckboxSelected: {
    backgroundColor: "#4CAF50",
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fff",
  },
  removeOptionButton: {
    padding: 8,
    marginLeft: 8,
  },
  helpSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  helpText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  addQuestionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    marginTop: 16,
  },
  addQuestionText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
})
