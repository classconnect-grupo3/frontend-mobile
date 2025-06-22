"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView, Alert } from "react-native"
import { AntDesign } from "@expo/vector-icons"
import { courseClient } from "@/lib/courseClient"
import { useAuth } from "@/contexts/sessionAuth"
import Toast from "react-native-toast-message"
import React from "react"

interface Props {
  visible: boolean
  courseId: string
  onClose: () => void
  onSuccess: () => void
}

// general, teoria, practica, necesito-ayuda, informacion, ejercitacion, otro
// posibles mas: "tarea", "examen", "duda", "proyecto", 
const AVAILABLE_TAGS = ["general", "teoria", "practica", "necesito-ayuda", "informacion", "ejercitacion", "otro"]

export const CreateQuestionModal = ({ visible, courseId, onClose, onSuccess }: Props) => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const auth = useAuth()
  const authState = auth?.authState

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "El título es obligatorio")
      return
    }

    if (!description.trim()) {
      Alert.alert("Error", "La descripción es obligatoria")
      return
    }

    if (selectedTags.length === 0) {
      Alert.alert("Error", "Selecciona al menos una etiqueta")
      return
    }

    try {
      setLoading(true)

      const body = {
        title: title.trim(),
        description: description.trim(),
        course_id: courseId,
        author_id: authState?.user?.id,
        tags: selectedTags,
      }

      const data = await courseClient.post("/forum/questions", body, {
        headers: {
          Authorization: `Bearer ${authState?.token}`,
        },
      })

      console.log("Pregunta creada con éxito:", data.data)
      Toast.show({
        type: "success",
        text1: "Pregunta creada",
        text2: "Tu pregunta ha sido publicada exitosamente",
      })

      // Reset form
      setTitle("")
      setDescription("")
      setSelectedTags([])

      onSuccess()
    } catch (error) {
      console.error("Error creating question:", error)
      console.log("Error details:", error.response?.data || error.message)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo crear la pregunta",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleClose = () => {
    setTitle("")
    setDescription("")
    setSelectedTags([])
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <AntDesign name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva Pregunta</Text>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>{loading ? "Creando..." : "Publicar"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Escribe un título claro y descriptivo"
              multiline
              maxLength={200}
            />
            <Text style={styles.charCount}>{title.length}/200</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe tu pregunta con el mayor detalle posible..."
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.charCount}>{description.length}/1000</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Etiquetas *</Text>
            <Text style={styles.subtitle}>Selecciona las etiquetas que mejor describan tu pregunta</Text>
            <View style={styles.tagsContainer}>
              {AVAILABLE_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, selectedTags.includes(tag) && styles.selectedTag]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagText, selectedTags.includes(tag) && styles.selectedTagText]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: "top",
    color: "#333",
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: "top",
    color: "#333",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedTag: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  tagText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  selectedTagText: {
    color: "#fff",
  },
  tips: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  tip: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
    lineHeight: 18,
  },
})
