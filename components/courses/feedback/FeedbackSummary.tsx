"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Dimensions,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { courseClient } from "@/lib/courseClient"
import { useAuth } from "@/contexts/sessionAuth"
import Toast from "react-native-toast-message"
import React from "react"

const { height: screenHeight } = Dimensions.get("window")

interface FeedbackSummaryProps {
  courseId: string
  visible: boolean
  onClose: () => void
}

export function FeedbackSummary({ courseId, visible, onClose }: FeedbackSummaryProps) {
  const [summary, setSummary] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const auth = useAuth()

  useEffect(() => {
    if (visible) {
      fetchSummary()
    }
  }, [visible, courseId])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data } = await courseClient.get(`/courses/${courseId}/feedback/summary`, {
        headers: {
          Authorization: `Bearer ${auth?.authState.token}`,
        },
      })

      console.log("Feedback summary data:", data)

      const data_string = JSON.stringify(data)

      const summaryText = data_string
      console.log("Extracted summary text:", summaryText)

      if (!summaryText) {
        setError("No se pudo obtener el resumen. El formato de respuesta es inválido.")
        return
      }

      setSummary(summaryText)
    } catch (error) {
      console.error("Error fetching feedback summary:", error)
      setError("No se pudo generar el resumen. Intente nuevamente más tarde.")
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo generar el resumen",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderSummaryContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Generando resumen con IA...</Text>
          <Text style={styles.loadingSubtext}>Esto puede tomar unos momentos</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSummary}>
            <Text style={styles.retryButtonText}>Intentar nuevamente</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (!summary) {
      return (
        <View style={styles.emptyState}>
          <MaterialIcons name="feedback" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No hay suficientes feedbacks para generar un resumen</Text>
        </View>
      )
    }

    // Dividir el resumen en párrafos para mejor legibilidad
    const paragraphs = summary.split("\n").filter((p) => p.trim().length > 0)

    return (
      <View style={styles.summaryContentContainer}>
        <View style={styles.summaryHeader}>
          <MaterialIcons name="auto-awesome" size={24} color="#007AFF" />
          <Text style={styles.summaryTitle}>Resumen generado por IA</Text>
        </View>

        <ScrollView style={styles.paragraphsContainer} contentContainerStyle={styles.paragraphsContent}>
          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.summaryParagraph}>
              {paragraph}
            </Text>
          ))}
        </ScrollView>
      </View>
    )
  }

  // Modificar la estructura del modal para que se adapte mejor al contenido
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Resumen de Feedbacks</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>{renderSummaryContent()}</View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// Reemplazar los estilos para solucionar el problema de tamaño del modal
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: screenHeight * 0.8,
    // Eliminar cualquier altura fija para permitir que el contenido determine el tamaño
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
  content: {
    // Eliminar flex: 1 para que el contenido determine la altura
    maxHeight: screenHeight * 0.6,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200, // Altura mínima para que el modal no sea demasiado pequeño durante la carga
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200, // Altura mínima para el estado de error
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200, // Altura mínima para el estado vacío
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  summaryContentContainer: {
    padding: 16,
    // Eliminar flex: 1 para que el contenido determine la altura
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  paragraphsContainer: {
    maxHeight: screenHeight * 0.4, // Limitar la altura máxima del ScrollView
  },
  paragraphsContent: {
    paddingBottom: 16,
  },
  summaryParagraph: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginBottom: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
})
