import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCourses } from '@/contexts/CoursesContext';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Image } from 'react-native';
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
import { EditCourseModal } from '@/components/courses/EditCourseModal';
import { MaterialIcons } from '@expo/vector-icons';

const MOCK_TASKS = [
    { id: '1', title: 'TP1', description: 'Entrega del TP1, formato: zip con codigo', deadline: '2025-06-30' },
  ]
const alumnos = Array.from({ length: 20 }, (_, i) => `Padron: ${i + 1}`);
const docentesAuxiliares = ['Iñaki Llorens', 'Martín Morilla', 'Emiliano Gómez', 'Martín Masivo', 'Fede FIUBA'];

export default function CourseViewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { courses, reloadCourses } = useCourses();
  const [showMaterials, setShowMaterials] = useState(false);
  const [showAlumnos, setShowAlumnos] = useState(false);
  const [showForo, setShowForo] = useState(false);
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const course = {
        "id": "68190388fed5b74a2ad9c0b5",
        "title": "Algoritmos y Programacion 1", 
        "description": "En este curso se dictan los basicos de la programacion en el lenguaje Python",
        "teacher_name": "Diego Essaya",
        "start_date": "0001-01-01T00:00:00Z", 
        "end_date": "0001-01-01T00:00:00Z", 
        "capacity": 60, 
      }

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

  return (
    <ScrollView contentContainerStyle={courseStyles.scrollContainer}>
      {/* Top bar */}
      <View style={homeScreenStyles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={courseStyles.back}>←</Text>
        </TouchableOpacity>
        <Text style={homeScreenStyles.title}>{course.title}</Text>
        <Text style={courseStyles.role}>rol: Alumno</Text>
        <Image 
            source={require('@/assets/images/profile-placeholder.jpeg')}
            style={homeScreenStyles.profileIcon}
        />
      </View>

      <View style={homeScreenStyles.topBar}>
        <Text style={courseStyles.taskTitle}>Teacher: </Text>
        <Text style={courseStyles.taskDescription}>{course.teacher_name}</Text>
      </View>

      <View style={homeScreenStyles.topBar}>
        <Text style={courseStyles.taskDescription}>{course.description}</Text>
      </View>

      <View style={homeScreenStyles.topBar}>
        <Text style={courseStyles.taskTitle}>Capacity</Text>
        <Text style={courseStyles.taskDescription}>{course.capacity} students</Text>
      </View>

      {/* Course Info */}
      
      <Text style={courseStyles.sectionHeader}>Tareas</Text>

      {tasks.map((task) => (
        <View key={task.id} style={courseStyles.taskCard}>
          <Text style={courseStyles.taskTitle}>{task.title}</Text>
          <Text style={courseStyles.taskDescription}>{task.description}</Text>
          <Text style={courseStyles.taskDeadline}>⏰ {task.deadline}</Text>
        </View>
      ))}

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
          <Text style={courseStyles.materialLink}>• Introducción al curso</Text>
          <Text style={courseStyles.materialLink}>• Presentación de la cátedra</Text>
          <Text style={courseStyles.materialLink}>• PDF: Sistemas Distribuidos - Módulo 1</Text>
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
          <Text style={courseStyles.materialToggleText}>Foro</Text>
        </View>
      </TouchableOpacity>

      {showForo && (
        <View style={courseStyles.materialLinks}>
          <Text style={courseStyles.materialLink}>Proximamente...</Text>
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

        <Text style={courseStyles.sectionHeader}>Docente Titular</Text>
        <View style={courseStyles.listContainer}>
            <Text style={courseStyles.listItem}>• {course.teacher_name}</Text>
        </View>

        <Text style={courseStyles.sectionHeader}>Docentes auxiliares</Text>
        <View style={courseStyles.listContainer}>
          {docentesAuxiliares.map((d, i) => (
            <Text key={i} style={courseStyles.listItem}>• {d}</Text>
          ))}
        </View>

    </ScrollView>
  );
}

export const options = {
  headerShown: false,
};
