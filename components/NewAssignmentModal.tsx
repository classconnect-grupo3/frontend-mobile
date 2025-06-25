"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Modal, Platform, TextInput, TouchableOpacity, View, Text, StyleSheet, Switch, ScrollView } from "react-native"
import { z } from "zod"
import { styles } from "@/styles/modalStyle"
import { MaterialIcons } from "@expo/vector-icons"
import React from "react"

const assignmentSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  due_date: z.date({ required_error: "La fecha es obligatoria" }),
  passing_score: z.number().min(0, "La puntuación mínima debe ser mayor a 0").optional(),
  time_limit: z.number().min(1, "El tiempo límite debe ser mayor a 0").optional(),
  has_passing_score: z.boolean().optional(),
})

export type AssignmentFormData = z.infer<typeof assignmentSchema>

interface AssignmentProps {
  visible: boolean
  onClose: () => void
  onCreate: (assignment: AssignmentFormData, type: "task" | "exam") => void
  type: "task" | "exam"
}

export function NewAssignmentModal({ visible, onClose, onCreate, type }: AssignmentProps) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    mode: "onChange",
    defaultValues: {
      passing_score: type === "exam" ? 60 : undefined, // Default points, will be calculated as 60% of total when questions are added
      time_limit: type === "exam" ? 60 : undefined,
      has_passing_score: type === "exam" ? true : false,
    },
  })

  const [showDatePicker, setShowDatePicker] = useState(false)

  const due_date = watch("due_date")
  const passing_score = watch("passing_score")
  const has_passing_score = watch("has_passing_score")

  const submit = (data: AssignmentFormData) => {
    onCreate(data, type)
    reset()
    onClose()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.overlay}>
        <ScrollView style={styles.scrollableContent} showsVerticalScrollIndicator={false}>
          <View style={modalStyles.header}>
            <Text style={styles.title}>{type === "exam" ? "Nuevo Examen" : "Nueva Tarea"}</Text>
            <TouchableOpacity onPress={handleClose} style={modalStyles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={modalStyles.subtitle}>
            {type === "exam"
              ? "Crea un nuevo examen con tiempo límite y puntuación mínima."
              : "Agrega una nueva tarea para tus alumnos."}
          </Text>

          {/* Título */}
          <Text style={styles.subtitle}>Título</Text>
          <View style={styles.inputGroup}>
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <>
                  <TextInput
                    style={[styles.input, errors.title && styles.inputError]}
                    placeholder="Título"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                  />
                  {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
                </>
              )}
            />
          </View>

          {/* Descripción */}
          <Text style={styles.subtitle}>Descripción</Text>
          <View style={styles.inputGroup}>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Descripción"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  multiline
                  numberOfLines={3}
                />
              )}
            />
          </View>

          {/* Fecha (picker) */}
          <Text style={styles.subtitle}>Fecha de Entrega</Text>
          <View style={styles.inputGroup}>
            <TouchableOpacity style={[styles.input, modalStyles.dateButton]} onPress={() => setShowDatePicker(true)}>
              <MaterialIcons name="event" size={20} color="#666" />
              <Text style={modalStyles.dateButtonText}>
                {due_date ? new Date(due_date).toLocaleDateString() : "Seleccionar fecha"}
              </Text>
            </TouchableOpacity>
            {errors.due_date && <Text style={styles.errorText}>{errors.due_date.message}</Text>}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={due_date ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) => {
                setShowDatePicker(false)
                if (date) {
                  setValue("due_date", date, { shouldValidate: true })
                }
              }}
            />
          )}

          {/* Campos específicos para exámenes */}
          {type === "exam" && (
            <>
              {/* Tiempo límite */}
              <Text style={styles.subtitle}>Tiempo Límite (minutos)</Text>
              <View style={styles.inputGroup}>
                <Controller
                  control={control}
                  name="time_limit"
                  render={({ field }) => (
                    <>
                      <View style={modalStyles.inputWithIcon}>
                        <MaterialIcons name="timer" size={20} color="#666" />
                        <TextInput
                          style={[styles.input, modalStyles.inputWithIconText, errors.time_limit && styles.inputError]}
                          placeholder="60"
                          value={field.value?.toString()}
                          onBlur={field.onBlur}
                          onChangeText={(text) => {
                            const num = Number.parseInt(text) || 0
                            field.onChange(num)
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                      {errors.time_limit && <Text style={styles.errorText}>{errors.time_limit.message}</Text>}
                    </>
                  )}
                />
              </View>

              {/* Puntuación mínima toggle */}
              <View style={modalStyles.switchContainer}>
                <Text style={styles.subtitle}>¿Requiere puntuación mínima para aprobar?</Text>
                <Controller
                  control={control}
                  name="has_passing_score"
                  render={({ field }) => (
                    <View style={modalStyles.switchRow}>
                      <Switch
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          if (!value) {
                            setValue("passing_score", undefined)
                          } else {
                            setValue("passing_score", 60) // Default points
                          }
                        }}
                        trackColor={{ false: "#767577", true: "#007AFF" }}
                        thumbColor={field.value ? "#fff" : "#f4f3f4"}
                      />
                      <Text style={modalStyles.switchLabel}>
                        {field.value ? "Sí, establecer puntuación mínima" : "No, sin puntuación mínima"}
                      </Text>
                    </View>
                  )}
                />
              </View>

              {/* Puntuación mínima en puntos */}
              {has_passing_score && (
                <>
                  <Text style={styles.subtitle}>Puntuación Mínima (puntos)</Text>
                  <View style={styles.inputGroup}>
                    <Controller
                      control={control}
                      name="passing_score"
                      render={({ field }) => (
                        <>
                          <View style={modalStyles.inputWithIcon}>
                            <MaterialIcons name="grade" size={20} color="#666" />
                            <TextInput
                              style={[
                                styles.input,
                                modalStyles.inputWithIconText,
                                errors.passing_score && styles.inputError,
                              ]}
                              placeholder="60"
                              value={field.value?.toString()}
                              onBlur={field.onBlur}
                              onChangeText={(text) => {
                                const num = Number.parseInt(text) || 0
                                field.onChange(num)
                              }}
                              keyboardType="numeric"
                            />
                          </View>
                          {errors.passing_score && <Text style={styles.errorText}>{errors.passing_score.message}</Text>}

                          {/* Información sobre puntuación */}
                          <View style={modalStyles.infoContainer}>
                            <MaterialIcons name="info" size={16} color="#007AFF" />
                            <Text style={modalStyles.infoText}>
                              Los estudiantes necesitarán obtener al menos {passing_score || 60} puntos para aprobar.
                              Podrás ajustar este valor después de agregar preguntas según el total de puntos
                              disponibles.
                            </Text>
                          </View>
                        </>
                      )}
                    />
                  </View>
                </>
              )}
            </>
          )}

          {/* Botón de enviar */}
          <TouchableOpacity
            onPress={handleSubmit(submit)}
            style={[styles.button, !isValid && { backgroundColor: "#ccc" }]}
            disabled={!isValid}
          >
            <Text style={styles.buttonText}>{type === "exam" ? "Crear Examen" : "Agregar Tarea"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  )
}

const modalStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    marginBottom: 12,
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  dateButtonText: {
    marginLeft: 8,
    color: "#333",
    fontSize: 16,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  inputWithIconText: {
    flex: 1,
    marginLeft: 8,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  switchContainer: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  switchLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: "#1976d2",
    lineHeight: 16,
  },
})
