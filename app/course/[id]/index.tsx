import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCourses } from '@/contexts/CoursesContext';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Image, FlatList, TextInput } from 'react-native';
import { useState } from 'react';
import React from 'react';
import { AntDesign } from '@expo/vector-icons';
import { NewTaskModal } from '@/components/NewTaskModal';
import { styles as modalStyles } from '@/styles/modalStyle';
import { styles as courseStyles } from '@/styles/courseStyles';
import { styles as homeScreenStyles } from '@/styles/homeScreenStyles';
import { courseClient } from '@/lib/courseClient';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/contexts/sessionAuth';
import { EditCourseModal } from '@/components/courses/EditCourseModal';
import { MaterialIcons } from '@expo/vector-icons';
import ModuleCard from '@/components/courses/ModuleCard';
import type { ModuleData } from '@/components/courses/ModuleCard';
import { CourseTopBar } from '../../components/course/CourseTopBar';
import { TaskList } from '../../components/course/TaskList';
import { ExpandableSection } from '../../components/course/ExpandableSection';

const MOCK_TASKS = [
    { id: '1', title: 'TP1', description: 'Entrega del TP1, formato: zip con codigo', deadline: '2025-06-30' },
  ]
const MOCK_EXAMS = [
    { id: '1', title: 'Examen Parcial', description: 'Examen parcial de la materia', date: '2025-07-15' },
  ];
const MOCK_MODULES = [
  {
    id: '1',
    title: 'Introduction to Algebra',
    description: 'Learn about variables, equations, and basic algebraic structures.',
    resources: [
      { id: 'r1', name: 'Lecture Slides'},
      { id: 'r2', name: 'Practice Problems'},
    ],
  },
  {
    id: '2',
    title: 'Linear Equations',
    description: 'Explore linear equations and their graphs.',
    resources: [
      { id: 'r3', name: 'Video Explanation'},
    ],
  },
];

const alumnos = Array.from({ length: 20 }, (_, i) => `Padron: ${i + 1}`);
const docentesTitulares = ['Iñaki Llorens', 'Martín Morilla'];
const docentesAuxiliares = ['Emiliano Gómez', 'Martín Masivo', 'Fede FIUBA'];

export default function CourseViewScreen() {
  const { id } = useLocalSearchParams();
  console.log('Course ID:', id);
  const router = useRouter();
  const { courses, reloadCourses } = useCourses();
  const [showAlumnos, setShowAlumnos] = useState(false);
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [exams, setExams] = useState(MOCK_EXAMS);
  const [modules, setModules] = useState(MOCK_MODULES);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const course = courses.find((c) => c.id === id);

  const auth = useAuth();
  if (!auth) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  const { authState } = auth;

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
      router.replace({ pathname: '/(tabs)/myCourses' }); // redirigir
    } catch (e) {
      console.error('Error deleting course:', e);
      Toast.show({ type: 'error', text1: 'Error al eliminar el curso' });
      setShowConfirmModal(false);
    }
  };

  const handleAddModule = () => {
    const newModule: ModuleData = {
      id: Date.now().toString(),
      title: newTitle.trim() || 'Nuevo módulo',
      description: newDescription.trim(),
      resources: [],
    };
    setModules([...modules, newModule]);
    setNewTitle('');
    setNewDescription('');
    setModalVisible(false);
  };

  const handleUpdateModule = (updatedModule: ModuleData) => {
    setModules((prev) =>
      prev.map((mod) => (mod.id === updatedModule.id ? updatedModule : mod))
    );
  };

  const handleDeleteModule = (moduleId: string) => {
    setModules((prevModules) => prevModules.filter((mod) => mod.id !== moduleId));
  };

  const handleAddResource = (moduleId: string) => {
    setModules((prev) =>
      prev.map((mod) =>
        mod.id === moduleId
          ? {
              ...mod,
              resources: [
                ...mod.resources,
                {
                  id: `r${Date.now()}`,
                  name: 'New Resource',
                },
              ],
            }
          : mod
      )
    );
  };

  return (
    <ScrollView>
      <CourseTopBar title={course.title} role="Teacher" onBack={() => router.back()} />
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
