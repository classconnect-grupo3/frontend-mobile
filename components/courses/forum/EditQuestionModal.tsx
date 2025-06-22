"use client"

import { useState } from "react"
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
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
import type { Question } from "@/types/forum"
import React from "react"

interface Props {
  visible: boolean
  onClose: () => void
  question: Question
  onQuestionUpdated: (question: Question) => void
}

const AVAILABLE_TAGS = ["general", "tarea", "examen", "material", "duda", "proyecto", "otro"]

export function EditQuestionModal({ visible, onClose, question, onQuestionUpdated }: Props) {
  const [title, setTitle] = useState(question.title)
  const [description, setDescription] = useState(question.description)
  const [selectedTags, setSelectedTags] = useState<string[]>(question.tags)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({})

  const auth = useAuth()
  const authState = auth?.authState

  const handleClose = () => {
    if (!loading) {
      // Reset to original values
      setTitle(question.title)
      setDescription(question.description)
      setSelectedTags(question.tags)
      setErrors({})
      onClose()
    }
  }

  const validateForm = () => {
    const newErrors: { title?: string; description?: string } = {}

    if (!title.trim()) {
      newErrors.title = "El título es obligatorio"
    } else if (title.trim().length < 10) {
      newErrors.title = "El título debe tener al menos 10 caracteres"
    }

    if (!description.trim()) {
      newErrors.description = "La descripción es obligatoria"
    } else if (description.trim().length < 20) {
      newErrors.description = "La descripción debe tener al menos 20 caracteres"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !authState?.token) return

    try {
      setLoading(true)

      const updates = {
        title: title.trim(),
        description: description.trim(),
        tags: selectedTags.length > 0 ? selectedTags : ["general"],
      }

      const updatedQuestion = await forumClient.updateQuestion(question.id, updates, authState.token)
      onQuestionUpdated(updatedQuestion)
      Toast.show({
        type: "success",
        text1: "Pregunta actualizada",
      })
    } catch (error) {
      console.error("Error updating question:", error)
      Toast.show({
        type: "error",
        text1: "Error al actualizar pregunta",
        text2: "Intenta nuevamente",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} disabled={loading}>
            <AntDesign name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.title}>Editar Pregunta</Text>

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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>
              Título <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="¿Cuál es tu pregunta? Sé específico..."
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              multiline
              editable={!loading}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            <Text style={styles.helperText}>{title.length}/200 caracteres</Text>
          </View>

          {/* Description Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>
              Descripción <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              placeholder="Proporciona más detalles sobre tu pregunta..."
              value={description}
              onChangeText={setDescription}
              maxLength={1000}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!loading}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            <Text style={styles.helperText}>{description.length}/1000 caracteres</Text>
          </View>

          {/* Tags Selection */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Etiquetas</Text>
            <View style={styles.tagsContainer}>
              {AVAILABLE_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]}
                  onPress={() => toggleTag(tag)}
                  disabled={loading}
                >
                  <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
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
  inputSection: {
    marginBottom: Spacing.xl,
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
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    minHeight: 50,
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
    minHeight: 120,
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
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  tagSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tagTextSelected: {
    color: Colors.white,
    fontWeight: "600",
  },
})
