"use client"

import { useState } from "react"
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native"
import { MaterialIcons, FontAwesome } from "@expo/vector-icons"
import { courseClient } from "@/lib/courseClient"
import Toast from "react-native-toast-message"
import { useAuth } from "@/contexts/sessionAuth"
import type { Assignment } from "@/app/course/[id]/CourseViewScreen"
import * as DocumentPicker from "expo-document-picker"
import { uploadFileToSubmission } from "@/firebaseConfig"
import React from "react"

interface Question {
  id: string
  text: string
  type: string
  options?: string[]
}

interface Props {
  visible: boolean
  onClose: () => void
  assignment: Assignment
  onRefresh: () => void
}

export const AssignmentAnswerModal = ({ visible, onClose, assignment, onRefresh }: Props) => {
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const { authState } = useAuth()
  const [fileUploads, setFileUploads] = useState<
    Record<
      string,
      {
        name: string
        url: string
        loading: boolean
        error?: string
      }
    >
  >({})

  console.log("Assignment: ", assignment)
  console.log("Assignment Questions: ", assignment.questions)

  const handleChange = (questionId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      const answers = assignment.questions.map((q) => ({
        content: responses[q.id] ?? "",
        feedback: "",
        question_id: q.id,
        score: 0,
        type: q.type,
      }))

      const data = await courseClient.post(
        `/assignments/${assignment.id}/submissions`,
        {
          answers,
        },
        {
          headers: {
            Authorization: `Bearer ${authState.token}`,
            "X-Student-UUID": authState.user?.id,
          },
        },
      )
      console.log("Entrega realizada", data.data)

      Toast.show({ type: "success", text1: "Entrega realizada con éxito" })
      onRefresh()
      onClose()
    } catch (e) {
      console.error("Error al entregar", e)
      Toast.show({ type: "error", text1: "Error al enviar respuestas" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    handleSubmit()
  }

  const handleUploadFile = async (questionId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })

      if (!result.assets || result.assets.length === 0) {
        return
      }

      const { uri, name, mimeType } = result.assets[0]
      const studentId = authState.user?.id
      const courseId = assignment.course_id
      const assignmentId = assignment.id

      if (!studentId) throw new Error("Missing user ID")

      // Actualizar estado para mostrar carga
      setFileUploads((prev) => ({
        ...prev,
        [questionId]: {
          name,
          url: "",
          loading: true,
        },
      }))

      const uploadResp = await uploadFileToSubmission(uri, courseId, assignmentId, studentId, questionId)

      // Actualizar estado con la URL del archivo subido
      setFileUploads((prev) => ({
        ...prev,
        [questionId]: {
          name,
          url: uploadResp.downloadUrl,
          loading: false,
        },
      }))

      // Guardar la URL en las respuestas
      handleChange(questionId, uploadResp.downloadUrl)

      Toast.show({
        type: "success",
        text1: "Archivo subido correctamente",
        text2: name,
      })
    } catch (err) {
      console.error("Error al subir archivo:", err)

      // Actualizar estado con el error
      setFileUploads((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          loading: false,
          error: "Error al subir el archivo",
        },
      }))

      Toast.show({
        type: "error",
        text1: "Error al subir archivo",
        text2: err instanceof Error ? err.message : "Intente nuevamente",
      })
    }
  }

  const getCompletedQuestions = () => {
    return assignment.questions.filter((q) => responses[q.id]?.trim()).length
  }

  const canSubmit = () => {
    return assignment.questions.every((q) => responses[q.id]?.trim())
  }

  const currentQuestion = assignment.questions[currentQuestionIndex]
  const totalQuestions = assignment.questions.length

  const renderQuestionNavigation = () => (
    <View style={styles.questionNav}>
      <Text style={styles.questionCounter}>
        Pregunta {currentQuestionIndex + 1} de {totalQuestions}
      </Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {getCompletedQuestions()}/{totalQuestions} completadas
        </Text>
      </View>
    </View>
  )

  const renderQuestion = (question: Question) => (
    <View style={styles.questionContainer}>
      <View style={styles.questionHeader}>
        <MaterialIcons
          name={question.type === "multiple_choice" ? "radio-button-checked" : "edit"}
          size={20}
          color="#007AFF"
        />
        <Text style={styles.questionNumber}>Pregunta {currentQuestionIndex + 1}</Text>
      </View>

      <Text style={styles.questionText}>{question.text}</Text>

      {question.type === "text" && (
        <TextInput
          style={styles.textInput}
          placeholder="Escribí tu respuesta aquí..."
          value={responses[question.id] || ""}
          onChangeText={(text) => handleChange(question.id, text)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      )}

      {question.type === "multiple_choice" && (
        <View style={styles.optionsContainer}>
          {question.options?.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.option, responses[question.id] === option && styles.selectedOption]}
              onPress={() => handleChange(question.id, option)}
            >
              <View style={styles.optionContent}>
                <View style={[styles.radioButton, responses[question.id] === option && styles.radioButtonSelected]}>
                  {responses[question.id] === option && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={[styles.optionText, responses[question.id] === option && styles.selectedOptionText]}>
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {question.type === "file" && (
        <View style={styles.fileUploadContainer}>
          {fileUploads[question.id]?.loading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.uploadingText}>Subiendo archivo...</Text>
            </View>
          ) : fileUploads[question.id]?.url ? (
            <View style={styles.fileSelectedContainer}>
              <View style={styles.fileInfoContainer}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.fileNameText} numberOfLines={1}>
                  {fileUploads[question.id].name}
                </Text>
              </View>
              <TouchableOpacity style={styles.changeFileButton} onPress={() => handleUploadFile(question.id)}>
                <Text style={styles.changeFileText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          ) : responses[question.id] ? (
            <View style={styles.fileSelectedContainer}>
              <View style={styles.fileInfoContainer}>
                <MaterialIcons name="insert-drive-file" size={20} color="#007AFF" />
                <Text style={styles.fileNameText} numberOfLines={1}>
                  Archivo subido previamente
                </Text>
              </View>
              <TouchableOpacity style={styles.changeFileButton} onPress={() => handleUploadFile(question.id)}>
                <Text style={styles.changeFileText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={() => handleUploadFile(question.id)}>
              <MaterialIcons name="cloud-upload" size={24} color="#007AFF" />
              <Text style={styles.uploadButtonText}>Subir archivo</Text>
            </TouchableOpacity>
          )}

          {fileUploads[question.id]?.error && <Text style={styles.errorText}>{fileUploads[question.id].error}</Text>}
        </View>
      )}
    </View>
  )

  const renderNavigationButtons = () => (
    <View style={styles.navigationButtons}>
      <TouchableOpacity
        style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
        onPress={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
        disabled={currentQuestionIndex === 0}
      >
        <FontAwesome name="chevron-left" size={16} color={currentQuestionIndex === 0 ? "#ccc" : "#007AFF"} />
        <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.disabledText]}>Anterior</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navButton, currentQuestionIndex === totalQuestions - 1 && styles.disabledButton]}
        onPress={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
        disabled={currentQuestionIndex === totalQuestions - 1}
      >
        <Text style={[styles.navButtonText, currentQuestionIndex === totalQuestions - 1 && styles.disabledText]}>
          Siguiente
        </Text>
        <FontAwesome
          name="chevron-right"
          size={16}
          color={currentQuestionIndex === totalQuestions - 1 ? "#ccc" : "#007AFF"}
        />
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>{assignment.title}</Text>
          <View style={styles.headerRight}>
            <MaterialIcons name={assignment.type === "exam" ? "quiz" : "assignment"} size={24} color="#007AFF" />
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderQuestionNavigation()}
          {currentQuestion && renderQuestion(currentQuestion)}
        </ScrollView>

        {/* Navigation */}
        {totalQuestions > 1 && renderNavigationButtons()}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <MaterialIcons name="save" size={20} color="#666" />
            )}
            <Text style={styles.draftButtonText}>Guardar borrador</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, !canSubmit() && styles.disabledSubmitButton]}
            onPress={handleSubmit}
            disabled={!canSubmit() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="send" size={20} color="#fff" />
            )}
            <Text style={styles.submitButtonText}>
              {assignment.type === "exam" ? "Entregar examen" : "Entregar tarea"}
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
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionNav: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  questionCounter: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  progressContainer: {
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
  },
  questionContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
    marginLeft: 8,
  },
  questionText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f8f9fa",
    minHeight: 120,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  selectedOption: {
    borderColor: "#007AFF",
    backgroundColor: "#e3f2fd",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: "#007AFF",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  selectedOptionText: {
    color: "#007AFF",
    fontWeight: "500",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 24,
    backgroundColor: "#f8f9fa",
  },
  uploadButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
    marginLeft: 8,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
    marginHorizontal: 8,
  },
  disabledText: {
    color: "#ccc",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
    gap: 12,
  },
  draftButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  draftButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  disabledSubmitButton: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  fileUploadContainer: {
    marginTop: 8,
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  uploadingText: {
    marginLeft: 8,
    color: "#0284c7",
    fontSize: 14,
    fontWeight: "500",
  },
  fileSelectedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  fileInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  fileNameText: {
    marginLeft: 8,
    color: "#0284c7",
    fontSize: 14,
    flex: 1,
  },
  changeFileButton: {
    backgroundColor: "#0284c7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  changeFileText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
})
