"use client"

import { useState } from "react"
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import * as FileSystem from "expo-file-system"
// import * as Sharing from "expo-sharing"
import { Assignment } from '@/app/course/[id]/CourseViewScreen';
import React from "react"

interface Props {
  visible: boolean
  assignment: Assignment | null
  onClose: () => void
}

type DownloadFormat = "pdf" | "docx" | "txt"

export function DownloadModal({ visible, assignment, onClose }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat>("pdf")

  const downloadFormats = [
    { key: "pdf" as DownloadFormat, label: "PDF", icon: "picture-as-pdf", color: "#F44336" },
    { key: "docx" as DownloadFormat, label: "Word Document", icon: "description", color: "#2196F3" },
    { key: "txt" as DownloadFormat, label: "Texto plano", icon: "text-snippet", color: "#4CAF50" },
  ]

  const generateContent = (format: DownloadFormat) => {
    if (!assignment) return ""

    const content = `
TÍTULO: ${assignment.title}
CURSO: ${assignment.course_name}
TIPO: ${assignment.type === "exam" ? "Examen" : "Tarea"}
FECHA LÍMITE: ${new Date(assignment.due_date).toLocaleDateString("es-ES")}
${assignment.time_limit ? `TIEMPO LÍMITE: ${assignment.time_limit} minutos` : ""}

DESCRIPCIÓN:
${assignment.description}

INSTRUCCIONES:
${assignment.instructions}

PREGUNTAS:
${assignment.questions
  .map(
    (q, index) => `
${index + 1}. ${q.text}
${
  q.type === "multiple_choice" && q.options
    ? q.options.map((opt, i) => `   ${String.fromCharCode(97 + i)}) ${opt}`).join("\n")
    : `   Tipo: ${q.type === "text" ? "Respuesta de texto" : q.type === "file" ? "Subir archivo" : "Opción múltiple"}`
}
   Puntos: ${q.points}
`,
  )
  .join("\n")}

---
Descargado desde ClassConnect
${new Date().toLocaleDateString("es-ES")} ${new Date().toLocaleTimeString("es-ES")}
    `.trim()

    return content
  }

  const handleDownload = async () => {
    if (!assignment) return

    try {
      setDownloading(true)

      const content = generateContent(selectedFormat)
      const fileName = `${assignment.title.replace(/[^a-zA-Z0-9]/g, "_")}.${selectedFormat === "docx" ? "txt" : selectedFormat}`
      const fileUri = `${FileSystem.documentDirectory}${fileName}`

      // Escribir el archivo
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      })

    //   // Verificar si se puede compartir
    //   const canShare = await Sharing.isAvailableAsync()

    //   if (canShare) {
    //     await Sharing.shareAsync(fileUri, {
    //       mimeType: selectedFormat === "pdf" ? "application/pdf" : "text/plain",
    //       dialogTitle: `Compartir ${assignment.title}`,
    //     })
    //   } else {
    //     Alert.alert("Descarga completada", `El archivo se ha guardado en: ${fileUri}`, [{ text: "OK" }])
    //   }
      Alert.alert("Descarga completada", `El archivo se ha guardado en: ${fileUri}`, [{ text: "OK" }])

      onClose()
    } catch (error) {
      console.error("Error downloading file:", error)
      Alert.alert("Error de descarga", "No se pudo descargar el archivo. Inténtalo de nuevo.", [{ text: "OK" }])
    } finally {
      setDownloading(false)
    }
  }

  if (!assignment) return null

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Descargar actividad</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.assignmentTitle}>{assignment.title}</Text>
            <Text style={styles.subtitle}>Selecciona el formato de descarga:</Text>

            <View style={styles.formatList}>
              {downloadFormats.map((format) => (
                <TouchableOpacity
                  key={format.key}
                  style={[styles.formatOption, selectedFormat === format.key && styles.selectedFormat]}
                  onPress={() => setSelectedFormat(format.key)}
                >
                  <MaterialIcons
                    name={format.icon as any}
                    size={24}
                    color={selectedFormat === format.key ? "#fff" : format.color}
                  />
                  <Text style={[styles.formatLabel, selectedFormat === format.key && styles.selectedFormatLabel]}>
                    {format.label}
                  </Text>
                  {selectedFormat === format.key && <MaterialIcons name="check" size={20} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoBox}>
              <MaterialIcons name="info" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                El archivo incluirá toda la información de la actividad: título, descripción, instrucciones, preguntas y
                detalles del curso.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.downloadButton, downloading && styles.disabledButton]}
              onPress={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="download" size={20} color="#fff" />
              )}
              <Text style={styles.downloadButtonText}>{downloading ? "Descargando..." : "Descargar"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
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
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  formatList: {
    marginBottom: 16,
  },
  formatOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 8,
  },
  selectedFormat: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  formatLabel: {
    fontSize: 14,
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  selectedFormatLabel: {
    color: "#fff",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#1976d2",
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  downloadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: "center",
    padding: 12,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
  },
})
