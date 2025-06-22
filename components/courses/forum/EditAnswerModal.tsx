"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert } from "react-native"
import { AntDesign } from "@expo/vector-icons"
import { courseClient } from "@/lib/courseClient"
import { useAuth } from "@/contexts/sessionAuth"
import Toast from "react-native-toast-message"
import type { ForumAnswer } from "@/types/forum"
import React from "react"

interface Props {
  visible: boolean
  answer: ForumAnswer
  questionId: string
  onClose: () => void
  onSuccess: (updatedAnswer: ForumAnswer) => void
}

export const EditAnswerModal = ({ visible, answer, questionId, onClose, onSuccess }: Props) => {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  const auth = useAuth()
  const authState = auth?.authState

  useEffect(() => {
    if (visible && answer) {
      setContent(answer.content)
    }
  }, [visible, answer])

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "El contenido de la respuesta es obligatorio")
      return
    }

    try {
      setLoading(true)

      const body = {
        content: content.trim(),
      }
      
      const { data } = await courseClient.put(`/forum/questions/${questionId}/answers/${answer.id}?authorId=${authState?.user?.id}`, body, {
        headers: {
          Authorization: `Bearer ${authState?.token}`,
        },
      })

      onSuccess(data)
      Toast.show({
        type: "success",
        text1: "Respuesta actualizada",
        text2: "Los cambios se han guardado exitosamente",
      })
    } catch (error) {
      console.error("Error updating answer:", error)
      console.log("Error details:", error.response?.data || error.message)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo actualizar la respuesta",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Reset to original value
    setContent(answer.content)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <AntDesign name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Respuesta</Text>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>{loading ? "Guardando..." : "Guardar"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Tu respuesta *</Text>
          <TextInput
            style={styles.textInput}
            value={content}
            onChangeText={setContent}
            placeholder="Escribe tu respuesta aquí..."
            multiline
            textAlignVertical="top"
            maxLength={2000}
            autoFocus
          />
          <Text style={styles.charCount}>{content.length}/2000</Text>

          {answer !== null && (
            <View style={styles.lastEditedInfo}>
            <Text style={styles.lastEditedText}>
              Última edición:{" "}
              {new Date(answer.updated_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          )}
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
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 200,
    textAlignVertical: "top",
    lineHeight: 20,
    color: "#333",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
    marginBottom: 16,
  },
  lastEditedInfo: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  lastEditedText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  tips: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
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
