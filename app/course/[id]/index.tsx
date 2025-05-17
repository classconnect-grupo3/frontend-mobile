import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCourses } from '@/contexts/CoursesContext';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useState } from 'react';
import React from 'react';
import { AntDesign } from '@expo/vector-icons'; // asegúrate de tener este paquete
import { NewTaskModal } from '@/components/NewTaskModal';
import { styles as modalStyles } from '@/styles/modalStyle';
import { courseClient } from '@/lib/courseClient';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/contexts/sessionAuth';

const MOCK_TASKS = [
    { id: '1', title: 'TP1', description: 'Entrega del TP1, formato: zip con codigo', deadline: '2025-06-30' },
  ]

const alumnos = Array.from({ length: 20 }, (_, i) => `Padron: ${i + 1}`);
const docentesTitulares = ['Iñaki Llorens', 'Martín Morilla'];
const docentesAuxiliares = ['Emiliano Gómez', 'Martín Masivo', 'Fede FIUBA'];

export default function CourseViewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { courses } = useCourses();
  const [showMaterials, setShowMaterials] = useState(false);
  const [showAlumnos, setShowAlumnos] = useState(false);
  const [showForo, setShowForo] = useState(false);
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const course = courses.find((c) => c.id === id);

  const { authState } = useAuth();

  if (!course) {
    return (
      <View style={styles.container}>
        <Text>404</Text>
        <Text>Course not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDeleteCourse = async () => {
    console.log('Deleting course with ID:', id);
    
    try {
      await courseClient.delete(`/courses/${id}`, {
        headers: {
          Authorization: `Bearer ${authState.token}`, 
        },
      });

      Toast.show({ type: 'success', text1: 'Curso eliminado' });
      setShowConfirmModal(false);
      router.replace('/(tabs)/my-courses'); // redirigir
    } catch (e) {
      console.error('Error deleting course:', e);
      Toast.show({ type: 'error', text1: 'Error al eliminar el curso' });
      setShowConfirmModal(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.role}>rol: Docente</Text>
        <View style={styles.avatar} />
      </View>

      {/* Course Info */}
      <Text style={styles.courseTitle}>{course.title}</Text>
      <Text style={styles.sectionHeader}>Tareas</Text>

      <TouchableOpacity onPress={() => setShowTaskModal(true)} style={styles.addButton}>
        <Text style={styles.buttonText}>+ Agregar tarea</Text>
      </TouchableOpacity>

      {tasks.map((task) => (
        <View key={task.id} style={styles.taskCard}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text>{task.description}</Text>
          <Text style={styles.taskDeadline}>⏰ {task.deadline}</Text>
          <TouchableOpacity onPress={() => setTasks(tasks.filter(t => t.id !== task.id))}>
            <Text style={styles.taskDelete}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      ))}

      <NewTaskModal
        visible={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onCreate={(task) => setTasks((prev) => [...prev, { ...task, id: Date.now().toString(), description: task.description || '' }])}
      />

      <Text style={styles.sectionHeader}>Modulo 1: Capa de Aplicacion</Text>

      <TouchableOpacity
        style={styles.materialToggle}
        onPress={() => setShowMaterials(!showMaterials)}
      >
        <View style={styles.materialToggleRow}>
          <AntDesign
            name={showMaterials ? 'up' : 'down'}
            size={16}
            color="#333"
            style={styles.arrowIcon}
          />
          <Text style={styles.materialToggleText}>Ver material</Text>
        </View>
      </TouchableOpacity>

      {showMaterials && (
        <View style={styles.materialLinks}>
          <Text>• Introducción al curso</Text>
          <Text>• Presentación de la cátedra</Text>
          <Text>• PDF: Sistemas Distribuidos - Módulo 1</Text>
        </View>
      )}

      {/* foro */}

      <TouchableOpacity
        style={styles.materialToggle}
        onPress={() => setShowForo(!showForo)}
      >
        <View style={styles.materialToggleRow}>
          <AntDesign
            name={showForo ? 'up' : 'down'}
            size={16}
            color="#333"
            style={styles.arrowIcon}
          />
          <Text style={styles.materialToggleText}>Ver foro</Text>
        </View>
      </TouchableOpacity>

      {showForo && (
        <View style={styles.materialLinks}>
          <Text>Proximamente...</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.materialToggle}
        onPress={() => setShowAlumnos(!showAlumnos)}
      >
        <View style={styles.materialToggleRow}>
          <AntDesign
            name={showAlumnos ? 'up' : 'down'}
            size={16}
            color="#333"
            style={styles.arrowIcon}
          />
          <Text style={styles.materialToggleText}>Ver alumnos</Text>
        </View>
      </TouchableOpacity>

      {showAlumnos && (
        <View style={styles.listContainer}>
          {alumnos.map((a, i) => (
            <Text key={i} style={styles.listItem}>• {a}</Text>
          ))}
        </View>
      )}

        <Text style={styles.sectionHeader}>Docentes Titulares</Text>
        <View style={styles.listContainer}>
          {docentesTitulares.map((d, i) => (
            <Text key={i} style={styles.listItem}>• {d}</Text>
          ))}
        </View>

        <Text style={styles.sectionHeader}>Docentes auxiliares</Text>
        <View style={styles.listContainer}>
          {docentesAuxiliares.map((d, i) => (
            <Text key={i} style={styles.listItem}>• {d}</Text>
          ))}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => setShowConfirmModal(true)}
        >
          <Text style={styles.buttonText}>Eliminar curso</Text>
        </TouchableOpacity>

        <Modal visible={showConfirmModal} transparent animationType="fade">
          <View style={modalStyles.overlay}>
            <View style={modalStyles.modal}>
              <Text style={modalStyles.title}>¿Estás seguro que querés eliminar este curso?</Text>
              <View style={modalStyles.modalButtons}>
                <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={modalStyles.cancelButton}>
                  <Text style={modalStyles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteCourse} style={modalStyles.confirmDeleteButton}>
                  <Text style={modalStyles.confirmDeleteText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  back: {
    fontSize: 24,
  },
  role: {
    fontSize: 16,
    backgroundColor: '#eee',
    padding: 6,
    borderRadius: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    backgroundColor: '#ccc',
    borderRadius: 18,
  },
  section: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    fontSize: 16,
  },
    materialToggle: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  materialLinks: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    paddingLeft: 20,
  },
  actionButton: {
    backgroundColor: '#ddd',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  link: {
    color: '#007AFF',
    marginTop: 16,
  },
  materialToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowIcon: {
    marginRight: 8,
  },
  materialToggleText: {
    fontSize: 16,
    fontWeight: '500',
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },

  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  taskCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },

  taskTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },

  taskDeadline: {
    color: '#666',
    marginTop: 4,
  },

  taskDelete: {
    color: 'red',
    marginTop: 8,
  },

  newTaskForm: {
    marginTop: 12,
    marginBottom: 24,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },

  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingLeft: 12,
    marginBottom: 16,
  },

  listItem: {
    fontSize: 15,
    marginBottom: 4,
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
});

export const options = {
  headerShown: false,
};
