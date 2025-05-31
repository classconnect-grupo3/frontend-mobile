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
import { CourseTopBar } from '../../components/course/CourseTopBar';
import { TaskList } from '../../components/course/TaskList';
import { ExpandableSection } from '../../components/course/ExpandableSection';

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

  const course = courses.find((c) => c.id === id);

  if (!course) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>404</Text>
        <Text>Course not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView>
      <CourseTopBar title={course.title} role="Alumno" onBack={() => router.back()} />
      <View style={{ padding: 10 }}>
        <Text>Teacher: {course.teacher_name}</Text>
        <Text>{course.description}</Text>
        <Text>Capacity: {course.capacity} students</Text>
      </View>
      <Text style={{ fontWeight: 'bold', padding: 10 }}>Tareas</Text>
      <TaskList tasks={tasks} />
      <Text style={{ fontWeight: 'bold', padding: 10 }}>Modulo 1: Capa de Aplicacion</Text>
      <ExpandableSection title="Ver material">
        <Text>• Introducción al curso</Text>
        <Text>• Presentación de la cátedra</Text>
        <Text>• PDF: Sistemas Distribuidos - Módulo 1</Text>
      </ExpandableSection>
      <ExpandableSection title="Foro">
        <Text>Proximamente...</Text>
      </ExpandableSection>
      <ExpandableSection title="Ver alumnos">
        {alumnos.map((a, i) => (
          <Text key={i}>• {a}</Text>
        ))}
      </ExpandableSection>
      <Text style={{ fontWeight: 'bold', padding: 10 }}>Docente Titular</Text>
      <Text>• {course.teacher_name}</Text>
      <Text style={{ fontWeight: 'bold', padding: 10 }}>Docentes auxiliares</Text>
      {docentesAuxiliares.map((d, i) => (
        <Text key={i}>• {d}</Text>
      ))}
    </ScrollView>
  );
}

export const options = {
  headerShown: false,
};
