import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, Platform, TextInput, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  deadline: z.date({ required_error: 'La fecha es obligatoria' }),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (task: { title: string; description?: string; deadline: string }) => void;
}

export function NewTaskModal({ visible, onClose, onCreate }: Props) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    mode: 'onChange',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const deadline = watch('deadline');

  const submit = (data: TaskFormData) => {
    onCreate({
      title: data.title,
      description: data.description,
      deadline: data.deadline.toISOString(),
    });
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
            <Text style={{ marginBottom: 6 }}>Deadline</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: '#333' }}>
                {deadline ? new Date(deadline).toLocaleDateString() : 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>
            {errors.deadline && <Text style={styles.errorText}>{errors.deadline.message}</Text>}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={deadline ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  setValue('deadline', date, { shouldValidate: true });
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#333',
  },
  modal: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: '#333',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    fontSize: 12,
    color: 'red',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancel: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 12,
  },
});
