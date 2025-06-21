"use client"

import { useState, useEffect } from "react"
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Switch } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import type { Assignment } from "@/app/course/[id]/CourseViewScreen"
import { courseClient } from "@/lib/courseClient"
import { useAuth } from "@/contexts/sessionAuth"
import Toast from "react-native-toast-message"
import React from "react"

interface Props {
  visible: boolean
  assignment: Assignment | null
  onClose: () => void
  onAddQuestions: () => void
  onPassingScoreUpdate?: (assignmentId: string, newPassingScore: number | null) => void
}

export function ViewQuestionsModal({ visible, assignment, onClose, onAddQuestions, onPassingScoreUpdate }: Props) {
  const [passingScore, setPassingScore] = useState<string>("")
  const [hasPassingScore, setHasPassingScore] = useState<boolean>(false)
  const [isEditingScore, setIsEditingScore] = useState(false)
  const [originalPassingScore, setOriginalPassingScore] = useState<number | null>(null)
  const [originalHasPassingScore, setOriginalHasPassingScore] = useState<boolean>(false)

  const auth = useAuth()
  const authState = auth?.authState

  useEffect(() => {
    if (assignment) {
      const score = assignment.passing_score
      const hasScore = score !== null && score !== undefined
      setHasPassingScore(hasScore)
      setPassingScore(hasScore ? score.toString() : "")
      setOriginalPassingScore(score || null)
      setOriginalHasPassingScore(hasScore)
    }
  }, [assignment])

  if (!assignment) return null

  const totalPoints = assignment.questions.reduce((sum, q) => sum + (q.points || 0), 0)
  const currentPassingPoints = Number.parseInt(passingScore) || 0
  const isPassingScoreHigherThanPossible = hasPassingScore && currentPassingPoints > totalPoints && totalPoints > 0

  const handleSavePassingScore = async () => {
    try {
      let newScore: number | null = null

      if (hasPassingScore) {
        const scoreValue = Number.parseInt(passingScore)
        if (isNaN(scoreValue) || scoreValue < 0) {
          Toast.show({
            type: "error",
            text1: "Puntuación inválida",
            text2: "Ingresa un número válido mayor o igual a 0",
          })
          return
        }

        if (isPassingScoreHigherThanPossible) {
          Alert.alert(
            "Puntuación inalcanzable",
            `La puntuación mínima requiere ${currentPassingPoints} puntos, pero el examen solo tiene ${totalPoints} puntos disponibles. ¿Deseas continuar de todas formas?`,
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Continuar", onPress: () => saveScore(scoreValue) },
            ],
          )
          return
        }

        newScore = scoreValue
      }

      await saveScore(newScore)
    } catch (error) {
      console.error("Error saving passing score:", error)
      Toast.show({
        type: "error",
        text1: "Error al guardar",
        text2: "No se pudo actualizar la puntuación mínima",
      })
    }
  }

  const saveScore = async (score: number | null) => {
    try {
      await courseClient.put(
        `/assignments/${assignment.id}`,
        { passing_score: score },
        {
          headers: {
            Authorization: `Bearer ${authState?.token}`,
          },
        },
      )

      setOriginalPassingScore(score)
      setOriginalHasPassingScore(score !== null)
      setIsEditingScore(false)

      // Notify parent component about the update
      if (onPassingScoreUpdate) {
        onPassingScoreUpdate(assignment.id, score)
      }

      Toast.show({
        type: "success",
        text1: "Puntuación actualizada",
        text2: score !== null ? `Puntuación mínima establecida en ${score} puntos` : "Puntuación mínima eliminada",
      })
    } catch (error) {
      throw error
    }
  }

  const handleCancelEdit = () => {
    setHasPassingScore(originalHasPassingScore)
    setPassingScore(originalPassingScore?.toString() || "")
    setIsEditingScore(false)
  }

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return "radio-button-checked"
      case "file":
        return "attach-file"
      default:
        return "edit"
    }
  }

  const getQuestionTypeText = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return "Opción múltiple"
      case "file":
        return "Archivo"
      default:
        return "Texto libre"
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preguntas del Examen</Text>
          <TouchableOpacity onPress={onAddQuestions} style={styles.addButton}>
            <MaterialIcons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Assignment Info */}
          <View style={styles.assignmentInfo}>
            <Text style={styles.assignmentTitle}>{assignment.title}</Text>
            <Text style={styles.assignmentMeta}>
              {assignment.questions.length} preguntas • {totalPoints} puntos totales
            </Text>
          </View>

          {/* Passing Score Section */}
          <View style={styles.passingScoreSection}>
            <View style={styles.passingScoreHeader}>
              <MaterialIcons name="grade" size={20} color="#007AFF" />
              <Text style={styles.passingScoreTitle}>Puntuación Mínima</Text>
              {!isEditingScore && (
                <TouchableOpacity onPress={() => setIsEditingScore(true)} style={styles.editScoreButton}>
                  <MaterialIcons name="edit" size={16} color="#007AFF" />
                </TouchableOpacity>
              )}
            </View>

            {isEditingScore ? (
              <View style={styles.editScoreContainer}>
                {/* Toggle for having passing score */}
                <View style={styles.switchContainer}>
                  <Switch
                    value={hasPassingScore}
                    onValueChange={(value) => {
                      setHasPassingScore(value)
                      if (!value) {
                        setPassingScore("")
                      } else if (totalPoints > 0) {
                        // Set default to 60% of total points
                        const defaultScore = Math.ceil(totalPoints * 0.6)
                        setPassingScore(defaultScore.toString())
                      }
                    }}
                    trackColor={{ false: "#767577", true: "#007AFF" }}
                    thumbColor={hasPassingScore ? "#fff" : "#f4f3f4"}
                  />
                  <Text style={styles.switchLabel}>
                    {hasPassingScore ? "Requiere puntuación mínima" : "Sin puntuación mínima"}
                  </Text>
                </View>

                {hasPassingScore && (
                  <>
                    <View style={styles.scoreInputContainer}>
                      <TextInput
                        style={[styles.scoreInput, isPassingScoreHigherThanPossible && styles.scoreInputError]}
                        value={passingScore}
                        onChangeText={setPassingScore}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                      <Text style={styles.pointsLabel}>puntos</Text>
                    </View>

                    {totalPoints > 0 && (
                      <Text style={styles.percentageHelper}>
                        {currentPassingPoints > 0
                          ? `${Math.round((currentPassingPoints / totalPoints) * 100)}% del total`
                          : "0% del total"}
                      </Text>
                    )}
                  </>
                )}

                <View style={styles.scoreActions}>
                  <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSavePassingScore} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  </TouchableOpacity>
                </View>

                {/* Warnings */}
                {isPassingScoreHigherThanPossible && (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error" size={16} color="#F44336" />
                    <Text style={styles.errorText}>
                      Esta puntuación requiere {currentPassingPoints} puntos, pero solo hay {totalPoints} disponibles
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.scoreDisplayContainer}>
                {originalHasPassingScore && originalPassingScore !== null ? (
                  <>
                    <Text style={styles.scoreDisplay}>
                      {originalPassingScore} puntos{" "}
                      {totalPoints > 0 && `(${Math.round((originalPassingScore / totalPoints) * 100)}% del total)`}
                    </Text>
                    <Text style={styles.scoreDescription}>
                      Los estudiantes necesitan obtener al menos esta puntuación para aprobar
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.scoreDisplay}>Sin puntuación mínima</Text>
                    <Text style={styles.scoreDescription}>Los estudiantes no necesitan una puntuación mínima</Text>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Questions List */}
          <View style={styles.questionsSection}>
            <Text style={styles.sectionTitle}>Preguntas ({assignment.questions.length})</Text>

            {assignment.questions.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="quiz" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No hay preguntas agregadas</Text>
                <Text style={styles.emptyStateSubtext}>
                  Agrega preguntas para que los estudiantes puedan realizar el examen
                </Text>
              </View>
            ) : (
              assignment.questions
                .sort((a, b) => a.order - b.order)
                .map((question, index) => (
                  <View key={index} style={styles.questionCard}>
                    <View style={styles.questionHeader}>
                      <View style={styles.questionNumber}>
                        <Text style={styles.questionNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.questionInfo}>
                        <View style={styles.questionTypeContainer}>
                          <MaterialIcons name={getQuestionTypeIcon(question.type)} size={16} color="#666" />
                          <Text style={styles.questionType}>{getQuestionTypeText(question.type)}</Text>
                        </View>
                        <Text style={styles.questionPoints}>{question.points || 0} puntos</Text>
                      </View>
                    </View>

                    <Text style={styles.questionText}>{question.text}</Text>

                    {question.type === "multiple_choice" && question.options && (
                      <View style={styles.optionsContainer}>
                        {question.options.map((option) => (
                          <View key={`${question.id}-${option}`} style={styles.optionItem}>
                            <View
                              style={[
                                styles.optionBullet,
                                question.correct_answers?.includes(option) && styles.correctOptionBullet,
                              ]}
                            />
                            <Text
                              style={[
                                styles.optionText,
                                question.correct_answers?.includes(option) && styles.correctOptionText,
                              ]}
                            >
                              {option}
                            </Text>
                            {question.correct_answers?.includes(option) && (
                              <MaterialIcons name="check" size={16} color="#4CAF50" />
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={onAddQuestions} style={styles.addQuestionsButton}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.addQuestionsButtonText}>Agregar Preguntas</Text>
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
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  assignmentInfo: {
    marginBottom: 24,
  },
  assignmentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  assignmentMeta: {
    fontSize: 14,
    color: "#666",
  },
  passingScoreSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  passingScoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  passingScoreTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  editScoreButton: {
    padding: 4,
  },
  editScoreContainer: {
    gap: 12,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  switchLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  scoreInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
  },
  scoreInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  scoreInputError: {
    borderColor: "#F44336",
  },
  pointsLabel: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
  },
  percentageHelper: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  scoreActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8d7da",
    padding: 8,
    borderRadius: 6,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#721c24",
    flex: 1,
    lineHeight: 16,
  },
  scoreDisplayContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
  },
  scoreDisplay: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 12,
    color: "#666",
  },
  questionsSection: {
    marginBottom: 80,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  questionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  questionNumberText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  questionInfo: {
    flex: 1,
  },
  questionTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  questionType: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  questionPoints: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  questionText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  optionBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
    marginRight: 12,
  },
  correctOptionBullet: {
    backgroundColor: "#4CAF50",
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  correctOptionText: {
    fontWeight: "500",
    color: "#4CAF50",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
  },
  addQuestionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addQuestionsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
})
