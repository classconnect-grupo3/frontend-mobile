"use client"

import { useState } from "react"
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { AntDesign } from "@expo/vector-icons"
import { Colors, Spacing, BorderRadius } from "@/styles/shared"
import { forumClient } from "@/lib/forumClient"
import { useAuth } from "@/contexts/sessionAuth"
import Toast from "react-native-toast-message"
import type { Answer } from "@/types/forum"
import React from "react"

interface Props {
  visible: boolean
  onClose: () => void
  answer: Answer
  questionId: string
  onAnswerUpdated: (answer: Answer) => void
}

export function EditAnswerModal({ visible, onClose, answer, questionId, onAnswerUpdated }: Props) {
  const [content, setContent] = useState(answer.content)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const auth = useAuth()
  const authState = auth?.authState

  const handleClose = () => {
    if (!loading) {
      setContent(answer.content)
      setError("")
      onClose()
    }
  }

  const validateForm = () => {
    if (!content.trim()) {
      setError("La respuesta no puede estar vacía")
      return false
    }

    if (content.trim().length < 10) {
      setError("La respuesta debe tener al menos 10 caracteres")
      return false
    }

    setError("")
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm() || !authState?.token) return

    try {
      setLoading(true)

      const updatedAnswer = await forumClient.updateAnswer(questionId, answer.id, content.trim(), authState.token)

      onAnswerUpdated(updatedAnswer)
      Toast.show({
        type: "success",
        text1: "Respuesta actualizada",
      })
    } catch (error) {
      console.error("Error updating answer:", error)
      Toast.show({
        type: "error",
        text1: "Error al actualizar respuesta",
        text2: "Intenta nuevamente",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} disabled={loading}>
            <AntDesign name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.title}>Editar Respuesta</Text>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.label}>
            Tu respuesta <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.textArea, error && styles.inputError]}
            placeholder="Escribe tu respuesta aquí..."
            value={content}
            onChangeText={setContent}
            maxLength={2000}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            editable={!loading}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Text style={styles.helperText}>{content.length}/2000 caracteres</Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  required: {
    color: Colors.danger,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    minHeight: 150,
  },
  inputError: {
    borderColor: Colors.danger,
    borderWidth: 2,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
})
