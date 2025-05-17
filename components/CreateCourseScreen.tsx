import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCourses } from '../contexts/CoursesContext';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import React, { useEffect, useState } from 'react';
import { fetchUserData } from '@/services/userProfile';
import { useAuth } from '@/contexts/sessionAuth';
import { courseClient } from '@/lib/courseClient';
import { reload } from 'expo-router/build/global-state/routing';

const schema = z.object({
  name: z.string().min(1, 'Course name is required'),
  description: z.string().optional(),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  capacity: z.string().refine((val) => /^\d+$/.test(val), { message: 'Capacity must be a number' }),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
}

export default function CreateCourseScreen( { onClose }: Props) {
  const router = useRouter();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const { reloadCourses } = useCourses();

  const { authState } = useAuth();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const onSubmit = async (data: FormData) => {
    try {
      const user = authState.user;
      if (!user) throw new Error('User data not loaded');

      const body = {
        title: data.name,
        description: data.description,
        start_date: data.startDate.toISOString(),
        end_date: data.endDate.toISOString(),
        capacity: parseInt(data.capacity),
        teacher_id: user.id,
        teacher_name: `${user.name} ${user.surname}`,
      };

      console.log('Creating course with data:', body);

      await courseClient.post('/courses', body, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      });

      Toast.show({ type: 'success', text1: 'Course created!' });
      reloadCourses();
      onClose();
    } catch (e: any) {
      console.error('Error creating course:', {
        message: e.message,
        status: e?.response?.status,
        url: e?.config?.url,
        data: e?.response?.data,
      });

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: e?.response?.data?.message ?? e.message ?? 'Could not create course',
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create a new course</Text>

      {/* Nombre */}
      <Text style={styles.subtitle}>Nombre del curso</Text>
      <View style={styles.inputGroup}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Course name"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
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
          <Text style={{ color: '#000' }}>{startDate ? new Date(startDate).toLocaleDateString() : 'Select start date'}</Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, date) => {
              setShowStartPicker(false);
              if (date) setValue('startDate', date, { shouldValidate: true });
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
          <Text style={{ color: '#000' }}>{endDate ? new Date(endDate).toLocaleDateString() : 'Select end date'}</Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endDate ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, date) => {
              setShowEndPicker(false);
              if (date) setValue('endDate', date, { shouldValidate: true });
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

      <TouchableOpacity
        style={[styles.createButton, !isValid && styles.disabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={!isValid}
      >
        <Text style={styles.createText}>Create</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
    backgroundColor: '#fff',
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
    marginBottom: 15,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: '#000',
    backgroundColor: '#fff',
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#007bff',
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
  },
  disabled: {
    backgroundColor: '#aaa',
  },
  createText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
