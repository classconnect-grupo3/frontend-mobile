import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';
import { courseClient } from '@/lib/courseClient';
import { useState } from 'react';
import React from 'react';
import { styles } from '@/styles/createCourseStyles';
import { useAuth } from '@/contexts/sessionAuth';

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  capacity: z.string().refine((val) => /^\d+$/.test(val), { message: 'Capacity must be a number' }),
});

type FormData = z.infer<typeof schema>;

export function EditCourseModal({ visible, onClose, course, onSuccess }: {
  visible: boolean;
  onClose: () => void;
  course: any;
  onSuccess: () => void;
}) {
  const { control, handleSubmit, setValue, watch, formState: { errors, isValid, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      title: course.title,
      description: course.description,
      startDate: new Date(course.start_date),
      endDate: new Date(course.end_date),
      capacity: course.capacity.toString(),
    },
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const startDate = watch('startDate');
  const endDate = watch('endDate');
    const authContext = useAuth();
    if (!authContext) {
        return null;
    }
    const { authState } = authContext;

  const onSubmit = async (data: FormData) => {
    try {
    //   await courseClient.put(`/courses/${course.id}`, {
    //     title: data.title,
    //     description: data.description,
    //     start_date: data.startDate.toISOString(),
    //     end_date: data.endDate.toISOString(),
    //     capacity: parseInt(data.capacity),
    //   });

        const body = {
            title: data.title,
            description: data.description,
            start_date: data.startDate.toISOString(),
            end_date: data.endDate.toISOString(),
            capacity: parseInt(data.capacity),
        };
        console.log('Creating course with data:', body);

        await courseClient.put(`/courses/${course.id}`, body, {
            headers: {
                Authorization: `Bearer ${authState.token}`,
            },
        });

        Toast.show({ type: 'success', text1: 'Curso actualizado' });
        onClose();
        onSuccess();
    } catch (e) {
      console.error('Error updating course:', e);
      Toast.show({ type: 'error', text1: 'Error al actualizar el curso' });
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Editar curso</Text>

            {/* Nombre */}
            <Text style={styles.subtitle}>Nombre del curso</Text>
            <View style={styles.inputGroup}>
                <Controller
                control={control}
                name="title"
                render={({ field }) => (
                    <>
                    <TextInput
                        style={[styles.input, errors.title && styles.inputError]}
                        placeholder="Course name"
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
                    placeholder="Description"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                    multiline
                    />
                )}
                />
            </View>

            {/* Fecha de inicio */}
            <Text style={styles.subtitle}>Fecha de inicio</Text>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Start date</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowStartPicker(true)}>
                <Text style={{ color: '#000' }}>
                    {startDate ? new Date(startDate).toLocaleDateString() : 'Select start date'}
                </Text>
                </TouchableOpacity>
                {showStartPicker && (
                <DateTimePicker
                    value={startDate ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(e, date) => {
                    setShowStartPicker(false);
                    if (date) setValue('startDate', date, { shouldValidate: true, shouldDirty: true  });
                    }}
                />
                )}
                {errors.startDate && <Text style={styles.errorText}>{errors.startDate.message}</Text>}
            </View>

            {/* Fecha de fin */}
            <Text style={styles.subtitle}>Fecha de fin</Text>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>End date</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowEndPicker(true)}>
                <Text style={{ color: '#000' }}>
                    {endDate ? new Date(endDate).toLocaleDateString() : 'Select end date'}
                </Text>
                </TouchableOpacity>
                {showEndPicker && (
                <DateTimePicker
                    value={endDate ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(e, date) => {
                    setShowEndPicker(false);
                    if (date) setValue('endDate', date, { shouldValidate: true, shouldDirty: true });
                    }}
                />
                )}
                {errors.endDate && <Text style={styles.errorText}>{errors.endDate.message}</Text>}
            </View>

            {/* Cupo */}
            <Text style={styles.subtitle}>Cupo</Text>
            <View style={styles.inputGroup}>
                <Controller
                control={control}
                name="capacity"
                render={({ field }) => (
                    <>
                    <TextInput
                        style={[styles.input, errors.capacity && styles.inputError]}
                        placeholder="Capacity"
                        keyboardType="numeric"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={field.onChange}
                    />
                    {errors.capacity && <Text style={styles.errorText}>{errors.capacity.message}</Text>}
                    </>
                )}
                />
            </View>

            {/* Botones */}
            <TouchableOpacity
                style={[
                    localStyles.button, 
                    (!isValid || !isDirty ) && styles.disabled
                ]}
                onPress={handleSubmit(onSubmit)}
                disabled={!isValid || !isDirty}
            >
                <Text style={localStyles.buttonText}>Guardar cambios</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose}>
                <Text style={localStyles.cancel}>Cancelar</Text>
            </TouchableOpacity>
            </ScrollView>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabled: {
    backgroundColor: '#ccc',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  cancel: { color: '#007AFF', textAlign: 'center', marginTop: 12 },
});
