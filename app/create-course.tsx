import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCourses } from '../contexts/CoursesContext';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import React, { useState } from 'react';

const schema = z.object({
  name: z.string().min(1, 'Course name is required'),
  description: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use format YYYY-MM-DD'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use format YYYY-MM-DD'),
  capacity: z
    .string()
    .refine((val) => /^\d+$/.test(val), { message: 'Capacity must be a number' }),
});

type FormData = z.infer<typeof schema>;

export default function CreateCourseScreen() {
  const { addCourse } = useCourses();
  const router = useRouter();
  const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = (data: FormData) => {
    const newCourse = {
      id: Math.random().toString(36).substring(2, 15),
      title: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      capacity: parseInt(data.capacity),
      teacher: 'Iñaki Llorens', // Later: from auth.user
      due: `Starts ${data.startDate}`,
    };
    addCourse(newCourse);
    Toast.show({ type: 'success', text1: 'Course created!' });
    router.replace('/my-courses');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create a new course</Text>

      {(['name', 'description', 'startDate', 'endDate', 'capacity'] as const).map((field) => (
        <View style={styles.inputGroup} key={field}>
          <Controller
            control={control}
            name={field}
            render={({ field: { onChange, value, onBlur } }) => (
              <>
                <TextInput
                  style={[styles.input, errors[field] && styles.inputError]}
                  placeholder={
                    field === 'startDate' || field === 'endDate'
                      ? 'YYYY-MM-DD'
                      : field === 'capacity'
                      ? 'Capacity'
                      : field.charAt(0).toUpperCase() + field.slice(1)
                  }
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  keyboardType={field === 'capacity' ? 'numeric' : 'default'}
                />
                {errors[field] && (
                  <Text style={styles.errorText}>{errors[field]?.message}</Text>
                )}
              </>
            )}
          />
        </View>
      ))}

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
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 15,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
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
