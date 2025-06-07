"use client"

import { useState, useEffect } from "react"
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Assignment } from '@/app/course/[id]/CourseViewScreen';
import React from "react"

interface Props {
  visible: boolean
  exam: Assignment | null
  onClose: () => void
  onTimeUp: () => void
}

export function ExamTimerModal({ visible, exam, onClose, onTimeUp }: Props) {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (exam && visible) {
      setTimeRemaining((exam.time_limit || 60) * 60) // Convertir minutos a segundos
      setIsActive(true)
    }
  }, [exam, visible])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => {
          if (time <= 1) {
            setIsActive(false)
            onTimeUp()
            return 0
          }
          return time - 1
        })
      }, 1000)
    } else if (timeRemaining === 0) {
      setIsActive(false)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeRemaining, onTimeUp])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
    }
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getTimeColor = () => {
    const totalTime = (exam?.time_limit || 60) * 60
    const percentage = timeRemaining / totalTime

    if (percentage > 0.5) return "#4CAF50"
    if (percentage > 0.25) return "#FF9800"
    return "#F44336"
  }

  const getWarningLevel = () => {
    const totalTime = (exam?.time_limit || 60) * 60
    const percentage = timeRemaining / totalTime

    if (percentage <= 0.1) return "critical"
    if (percentage <= 0.25) return "warning"
    return "normal"
  }

  const handlePause = () => {
    Alert.alert("Pausar examen", "¿Estás seguro de que quieres pausar el examen? El tiempo seguirá corriendo.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Pausar", onPress: () => setIsActive(false) },
    ])
  }

  const handleResume = () => {
    setIsActive(true)
  }

  const handleFinish = () => {
    Alert.alert("Finalizar examen", "¿Estás seguro de que quieres finalizar el examen? No podrás volver a acceder.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Finalizar", onPress: onClose, style: "destructive" },
    ])
  }

  if (!exam) return null

  const warningLevel = getWarningLevel()

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="overFullScreen">
      <View style={styles.container}>
        <View style={[styles.timerContainer, warningLevel === "critical" && styles.criticalBackground]}>
          <View style={styles.header}>
            <Text style={styles.examTitle}>{exam.title}</Text>
            <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
              <MaterialIcons name="stop" size={24} color="#F44336" />
            </TouchableOpacity>
          </View>

          <View style={styles.timerDisplay}>
            <MaterialIcons name="timer" size={32} color={getTimeColor()} style={styles.timerIcon} />
            <Text style={[styles.timeText, { color: getTimeColor() }]}>{formatTime(timeRemaining)}</Text>
          </View>

          {warningLevel === "critical" && (
            <View style={styles.warningContainer}>
              <MaterialIcons name="warning" size={20} color="#F44336" />
              <Text style={styles.warningText}>
                ¡Tiempo crítico! Quedan menos de {Math.ceil(timeRemaining / 60)} minutos
              </Text>
            </View>
          )}

          {warningLevel === "warning" && (
            <View style={styles.cautionContainer}>
              <MaterialIcons name="schedule" size={20} color="#FF9800" />
              <Text style={styles.cautionText}>Quedan {Math.ceil(timeRemaining / 60)} minutos</Text>
            </View>
          )}

          <View style={styles.controls}>
            {isActive ? (
              <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
                <MaterialIcons name="pause" size={20} color="#fff" />
                <Text style={styles.buttonText}>Pausar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
                <MaterialIcons name="play-arrow" size={20} color="#fff" />
                <Text style={styles.buttonText}>Reanudar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.examContent}>
          <Text style={styles.contentPlaceholder}>Aquí iría el contenido del examen...</Text>
          {/* Aquí se integraría el componente de preguntas del examen */}
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
  timerContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#e9ecef",
  },
  criticalBackground: {
    backgroundColor: "#ffebee",
    borderBottomColor: "#f44336",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  finishButton: {
    padding: 8,
  },
  timerDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  timerIcon: {
    marginRight: 12,
  },
  timeText: {
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffcdd2",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  warningText: {
    color: "#F44336",
    fontWeight: "bold",
    marginLeft: 8,
  },
  cautionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff3e0",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  cautionText: {
    color: "#FF9800",
    fontWeight: "500",
    marginLeft: 8,
  },
  controls: {
    alignItems: "center",
  },
  pauseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF9800",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resumeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 4,
  },
  examContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  contentPlaceholder: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
})
