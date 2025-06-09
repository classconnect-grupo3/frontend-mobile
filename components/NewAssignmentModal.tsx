import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, Platform, TextInput, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { z } from 'zod';
import { styles } from '@/styles/modalStyle';
import { Assignment } from '@/app/course/[id]/CourseViewScreen';

const assignmentSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  due_date: z.date({ required_error: 'La fecha es obligatoria' }),
});

export type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface AssignmentProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (assignment: AssignmentFormData, type: "task" | "exam") => void;
  type: "task" | "exam";
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
    mode: 'onChange',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const due_date = watch('due_date');

  const submit = (data: AssignmentFormData) => {
    onCreate(data, type);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Nueva Tarea</Text>
          <Text style={{ marginBottom: 12, color: '#333' }}>
            Agrega una nueva tarea para tus alumnos.
          </Text>
          {/* Título */}
          <Text style={styles.subtitle}>Titulo</Text>
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
                />
              )}
            />
          </View>

          {/* Fecha (picker) */}
          <Text style={styles.subtitle}>Fecha de Entrega</Text>
          <View style={styles.inputGroup}>
            <Text style={{ marginBottom: 6 }}>due_date</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: '#333' }}>
                {due_date ? new Date(due_date).toLocaleDateString() : 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>
            {errors.due_date && <Text style={styles.errorText}>{errors.due_date.message}</Text>}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={due_date ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  setValue('due_date', date, { shouldValidate: true });
                }
              }}
            />
          )}

          {/* Botón de enviar */}
          <TouchableOpacity
            onPress={handleSubmit(submit)}
            style={[styles.button, !isValid && { backgroundColor: '#ccc' }]}
            disabled={!isValid}
          >
            <Text style={styles.buttonText}>Agregar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
