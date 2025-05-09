import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';

const taskSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato debe ser YYYY-MM-DD'),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (task: TaskFormData) => void;
}

export function NewTaskModal({ visible, onClose, onCreate }: Props) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    mode: 'onChange',
  });

  const submit = (data: TaskFormData) => {
    onCreate(data);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Nueva Tarea</Text>

          {['title', 'description', 'deadline'].map((field) => (
            <View key={field} style={styles.inputGroup}>
              <Controller
                control={control}
                name={field as keyof TaskFormData}
                render={({ field: { value, onChange, onBlur } }) => (
                  <>
                    <TextInput
                      style={[styles.input, errors[field as keyof TaskFormData] && styles.inputError]}
                      placeholder={
                        field === 'deadline' ? 'YYYY-MM-DD' :
                        field === 'title' ? 'Título' : 'Descripción'
                      }
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                    {errors[field as keyof TaskFormData] && (
                      <Text style={styles.errorText}>{errors[field as keyof TaskFormData]?.message}</Text>
                    )}
                  </>
                )}
              />
            </View>
          ))}

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
  },
  inputGroup: {
    marginBottom: 12,
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
