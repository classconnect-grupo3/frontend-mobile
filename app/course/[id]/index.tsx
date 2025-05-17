import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCourses } from '@/contexts/CoursesContext';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useState } from 'react';
import React from 'react';
import { AntDesign } from '@expo/vector-icons'; // asegúrate de tener este paquete
import { NewTaskModal } from '@/components/NewTaskModal';
import { styles as modalStyles } from '@/styles/modalStyle';
import { styles as courseStyles } from '@/styles/courseStyles';
import { styles as homeScreenStyles } from '@/styles/homeScreenStyles';
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
      <View style={homeScreenStyles.container}>
        <Text>404</Text>
        <Text>Course not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={courseStyles.link}>← Back</Text>
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
    <ScrollView contentContainerStyle={homeScreenStyles.container}>
      {/* Top bar */}
      <View style={homeScreenStyles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={courseStyles.back}>←</Text>
        </TouchableOpacity>
        <Text style={courseStyles.role}>rol: Docente</Text>
        <View style={homeScreenStyles.profileIcon} />
      </View>

      {/* Course Info */}
      <Text style={homeScreenStyles.title}>{course.title}</Text>
      <Text style={courseStyles.sectionHeader}>Tareas</Text>

      <TouchableOpacity onPress={() => setShowTaskModal(true)} style={courseStyles.addButton}>
        <Text style={courseStyles.buttonText}>+ Agregar tarea</Text>
      </TouchableOpacity>

      {tasks.map((task) => (
        <View key={task.id} style={courseStyles.taskCard}>
          <Text style={courseStyles.taskTitle}>{task.title}</Text>
          <Text>{task.description}</Text>
          <Text style={courseStyles.taskDeadline}>⏰ {task.deadline}</Text>
          <TouchableOpacity onPress={() => setTasks(tasks.filter(t => t.id !== task.id))}>
            <Text style={courseStyles.taskDelete}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      ))}

      <NewTaskModal
        visible={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onCreate={(task) => setTasks((prev) => [...prev, { ...task, id: Date.now().toString(), description: task.description || '' }])}
      />

      <Text style={courseStyles.sectionHeader}>Modulo 1: Capa de Aplicacion</Text>

      <TouchableOpacity
        style={courseStyles.materialToggle}
        onPress={() => setShowMaterials(!showMaterials)}
      >
        <View style={courseStyles.materialToggleRow}>
          <AntDesign
            name={showMaterials ? 'up' : 'down'}
            size={16}
            color="#333"
            style={courseStyles.arrowIcon}
          />
          <Text style={courseStyles.materialToggleText}>Ver material</Text>
        </View>
      </TouchableOpacity>

      {showMaterials && (
        <View style={courseStyles.materialLinks}>
          <Text>• Introducción al curso</Text>
          <Text>• Presentación de la cátedra</Text>
          <Text>• PDF: Sistemas Distribuidos - Módulo 1</Text>
        </View>
      )}

      {/* foro */}

      <TouchableOpacity
        style={courseStyles.materialToggle}
        onPress={() => setShowForo(!showForo)}
      >
        <View style={courseStyles.materialToggleRow}>
          <AntDesign
            name={showForo ? 'up' : 'down'}
            size={16}
            color="#333"
            style={courseStyles.arrowIcon}
          />
          <Text style={courseStyles.materialToggleText}>Ver foro</Text>
        </View>
      </TouchableOpacity>

      {showForo && (
        <View style={courseStyles.materialLinks}>
          <Text>Proximamente...</Text>
        </View>
      )}

      <TouchableOpacity
        style={courseStyles.materialToggle}
        onPress={() => setShowAlumnos(!showAlumnos)}
      >
        <View style={courseStyles.materialToggleRow}>
          <AntDesign
            name={showAlumnos ? 'up' : 'down'}
            size={16}
            color="#333"
            style={courseStyles.arrowIcon}
          />
          <Text style={courseStyles.materialToggleText}>Ver alumnos</Text>
        </View>
      </TouchableOpacity>

      {showAlumnos && (
        <View style={courseStyles.listContainer}>
          {alumnos.map((a, i) => (
            <Text key={i} style={courseStyles.listItem}>• {a}</Text>
          ))}
        </View>
      )}

        <Text style={courseStyles.sectionHeader}>Docentes Titulares</Text>
        <View style={courseStyles.listContainer}>
          {docentesTitulares.map((d, i) => (
            <Text key={i} style={courseStyles.listItem}>• {d}</Text>
          ))}
        </View>

        <Text style={courseStyles.sectionHeader}>Docentes auxiliares</Text>
        <View style={courseStyles.listContainer}>
          {docentesAuxiliares.map((d, i) => (
            <Text key={i} style={courseStyles.listItem}>• {d}</Text>
          ))}
        </View>

        <TouchableOpacity
          style={courseStyles.deleteButton}
          onPress={() => setShowConfirmModal(true)}
        >
          <Text style={courseStyles.buttonText}>Eliminar curso</Text>
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

export const options = {
  headerShown: false,
};
