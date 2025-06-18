"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, ScrollView } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { z } from "zod"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { courseClient } from "@/lib/courseClient"
import Toast from "react-native-toast-message"
import { useAuth } from "@/contexts/sessionAuth"
import React from "react"

const feedbackTypes = ["POSITIVO", "NEGATIVO", "NEUTRO"] as const

const schema = z.object({
  feedback: z
    .string()
    .min(10, "El feedback debe tener al menos 10 caracteres")
    .max(500, "El feedback no puede exceder 500 caracteres"),
  feedback_type: z.enum(feedbackTypes),
  score: z.number().min(1, "La puntuación debe ser al menos 1").max(5, "La puntuación debe ser máximo 5"),
})

type FormData = z.infer<typeof schema>

interface StudentFeedbackFormProps {
  visible: boolean
  onClose: () => void
  courseId: string
  studentId: string
  studentName: string
  onSuccess?: () => void
}

export function StudentFeedbackForm({
  visible,
  onClose,
  courseId,
  studentId,
  studentName,
  onSuccess,
}: StudentFeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const auth = useAuth()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      feedback: "",
      feedback_type: "POSITIVO",
      score: 0,
    },
  })

  const onSubmit = async (data: FormData) => {
    if (!auth?.authState.user?.id) {
      Toast.show({
        type: "error de autenticación",
        text1: "Error de autenticación",
        text2: "No se pudo identificar al docente",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        course_id: courseId,
        feedback: data.feedback.trim(),
        feedback_type: data.feedback_type,
        score: data.score,
        student_uuid: studentId,
        teacher_uuid: auth.authState.user.id,
      }

      console.log("Sending feedback payload:", payload)

      await courseClient.post(`/courses/${courseId}/student-feedback`, payload, {
        headers: {
          Authorization: `Bearer ${auth.authState.token}`,
        },
      })

      setShowSuccess(true)
      reset()

      Toast.show({
        type: "success",
        text1: "Feedback enviado exitosamente",
        text2: `${studentName} ha sido notificado sobre el nuevo feedback`,
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Error al enviar feedback:", error)

      let errorMessage = "No se pudo enviar el feedback. Intente nuevamente."

      if (error.response?.status === 400) {
        errorMessage = "Datos inválidos. Verifique la información ingresada."
      } else if (error.response?.status === 403) {
        errorMessage = "No tiene permisos para enviar feedback a este estudiante."
      } else if (error.response?.status === 404) {
        errorMessage = "Estudiante o curso no encontrado."
      }

      Toast.show({
        type: "error",
        text1: "Error al enviar feedback",
        text2: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (showSuccess) {
      setShowSuccess(false)
    }
    reset()
    onClose()
  }

  const renderStars = (rating: number, onPress: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        <Text style={styles.starsLabel}>Puntuación:</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => onPress(star)} style={styles.starButton}>
              <MaterialIcons
                name={rating >= star ? "star" : "star-border"}
                size={32}
                color={rating >= star ? "#FFD700" : "#ccc"}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {showSuccess ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
              </View>
              <Text style={styles.successTitle}>¡Feedback enviado exitosamente!</Text>
              <Text style={styles.successMessage}>
                El estudiante {studentName} ha sido notificado sobre tu feedback y podrá verlo en su sección "Mis
                Feedbacks".
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Enviar Feedback</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeIcon}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.studentInfo}>
                <MaterialIcons name="person" size={20} color="#666" />
                <Text style={styles.studentName}>Para: {studentName}</Text>
              </View>

              <ScrollView style={styles.formContainer}>
                <View style={styles.formContent}>
                  <Controller
                    control={control}
                    name="score"
                    render={({ field: { onChange, value } }) => (
                      <>
                        {renderStars(value, onChange)}
                        {errors.score && <Text style={styles.errorText}>{errors.score.message}</Text>}
                      </>
                    )}
                  />

                  <Text style={styles.sectionTitle}>Tipo de feedback</Text>
                  <Controller
                    control={control}
                    name="feedback_type"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.feedbackTypeContainer}>
                        {feedbackTypes.map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.feedbackTypeButton,
                              value === type && styles.feedbackTypeButtonActive,
                              value === type &&
                                (type === "POSITIVO"
                                  ? styles.positiveButton
                                  : type === "NEGATIVO"
                                    ? styles.negativeButton
                                    : styles.neutralButton),
                            ]}
                            onPress={() => onChange(type)}
                          >
                            <MaterialIcons
                              name={type === "POSITIVO" ? "thumb-up" : type === "NEGATIVO" ? "thumb-down" : "lightbulb"}
                              size={20}
                              color={value === type ? "#fff" : "#666"}
                            />
                            <Text style={[styles.feedbackTypeText, value === type && styles.feedbackTypeTextActive]}>
                              {type === "POSITIVO" ? "Positivo" : type === "NEGATIVO" ? "Negativo" : "Neutro"}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  />

                  <Text style={styles.sectionTitle}>Comentarios *</Text>
                  <Controller
                    control={control}
                    name="feedback"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.textInputContainer}>
                        <TextInput
                          style={[styles.textInput, errors.feedback && styles.inputError]}
                          placeholder="Escribe tu feedback para el estudiante..."
                          value={value}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          multiline
                          numberOfLines={6}
                          textAlignVertical="top"
                          maxLength={500}
                        />
                        <Text style={styles.characterCount}>{value.length}/500 caracteres</Text>
                        {errors.feedback && <Text style={styles.errorText}>{errors.feedback.message}</Text>}
                      </View>
                    )}
                  />

                  <TouchableOpacity
                    style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={!isValid || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="send" size={20} color="#fff" />
                        <Text style={styles.submitButtonText}>Enviar Feedback</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeIcon: {
    padding: 4,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  studentName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
  },
  formContainer: {
    maxHeight: 500,
  },
  formContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 12,
  },
  starsContainer: {
    marginBottom: 16,
  },
  starsLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
  },
  starButton: {
    padding: 4,
  },
  feedbackTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  feedbackTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
    minWidth: 100,
  },
  feedbackTypeButtonActive: {
    borderColor: "transparent",
  },
  positiveButton: {
    backgroundColor: "#4CAF50",
  },
  negativeButton: {
    backgroundColor: "#F44336",
  },
  neutralButton: {
    backgroundColor: "#2196F3",
  },
  feedbackTypeText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  feedbackTypeTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: "#f8f9fa",
    color: "#333",
  },
  inputError: {
    borderColor: "#F44336",
  },
  errorText: {
    color: "#F44336",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  successContainer: {
    padding: 24,
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  textInputContainer: {
    marginBottom: 16,
  },
  characterCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
})
