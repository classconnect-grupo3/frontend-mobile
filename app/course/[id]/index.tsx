import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCourses } from '@/contexts/CoursesContext';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Image, FlatList, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import React from 'react';
import { AntDesign } from '@expo/vector-icons';
import { NewTaskModal } from '@/components/NewTaskModal';
import { styles as modalStyles } from '@/styles/modalStyle';
import { styles as courseStyles } from '@/styles/courseStyles';
import { styles as homeScreenStyles } from '@/styles/homeScreenStyles';
import { courseClient } from '@/lib/courseClient';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/contexts/sessionAuth';
import { CourseTopBar } from '@/components/courses/course/CourseTopBar';
import { TasksSection } from '@/components/courses/course/TasksSection';
import { ModulesSection } from '@/components/courses/course/ModulesSection';
import { Assignment } from './student';

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
}

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
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const tasks = allAssignments.filter(a => a.type === 'homework');
  const exams = allAssignments.filter(a => a.type === 'exam');

  const course = courses.find((c) => c.id === id);

  const teacher = true;

  const auth = useAuth();
  if (!auth) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  const { authState } = auth;

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
      router.replace({ pathname: '/(tabs)/myCourses' }); // redirigir
    } catch (e) {
      console.error('Error deleting course:', e);
      Toast.show({ type: 'error', text1: 'Error al eliminar el curso' });
      setShowConfirmModal(false);
    }
  };
  
  const handleSubmitTask = async (assignmentId: string) => {
      try {
        if (!authState) {
          Toast.show({ type: 'error', text1: 'No hay sesión de usuario' });
          return;
        }
        await courseClient.post(`/assignments/${assignmentId}/submissions`, {
          student_id: authState.user?.id,
          content: 'Entrega realizada desde la app',
        }, {
          headers: {
            Authorization: `Bearer ${authState.token}`,
          },
        });
  
        Toast.show({ type: 'success', text1: 'Tarea entregada' });
      } catch (e) {
        console.error('Error entregando tarea:', e);
        Toast.show({ type: 'error', text1: 'No se pudo entregar la tarea' });
      }
    };

  const handleSubmitExam = async (assignmentId: string) => {
      try {
        if (!authState) {
          Toast.show({ type: 'error', text1: 'No hay sesión de usuario' });
          return;
        }
        await courseClient.post(`/assignments/${assignmentId}/submissions`, {
          student_id: authState.user?.id,
          content: 'Entrega realizada desde la app',
        }, {
          headers: {
            Authorization: `Bearer ${authState.token}`,
          },
        });
  
        Toast.show({ type: 'success', text1: 'Tarea entregada' });
      } catch (e) {
        console.error('Error entregando tarea:', e);
        Toast.show({ type: 'error', text1: 'No se pudo entregar la tarea' });
      }
    };

  useEffect(() => {
      const fetchAssignments = async () => {
        try {
          setLoadingTasks(true);
          if (!authState?.token) {
            throw new Error('No auth token available');
          }
          const { data } = await courseClient.get(`/assignments/course/${course.id}`, {
            headers: {
              Authorization: `Bearer ${authState.token}`,
            },
          });
          console.log('Assignments fetched:', data);
          console.log('questions data[0]: ', data[0]?.questions);
          setAllAssignments(data);
          console.log('All assignments:', allAssignments);
        } catch (e) {
          console.error('Error fetching assignments:', e);
          Toast.show({ type: 'error', text1: 'No se pudieron cargar las tareas' });
        } finally {
          setLoadingTasks(false);
        }
      };
  
      if (course.id && authState?.token) fetchAssignments();
    }, []);

  return (
    <ScrollView contentContainerStyle={courseStyles.scrollContainer}>

      <CourseTopBar
        role="Docente"
        onBack={() => router.back()}
        canEdit={teacher}
        course={course}
        onEditSuccess={reloadCourses}
      />
      
      {/* Course Info */}
      
      {/* <CourseTasksSection isTeacher={teacher}/> */}

      <TasksSection
              label="Tareas"
              tasks={tasks}
              setTasks={setAllAssignments}
              loading={loadingTasks}
              onSubmit={handleSubmitTask}
              isTeacher={teacher}
            />
      
            <TasksSection
              label="Exámenes"
              tasks={exams}
              setTasks={setAllAssignments}
              loading={loadingTasks}
              onSubmit={handleSubmitTask}
              isTeacher={teacher}
            />

    <ModulesSection courseId={course.id} isTeacher={teacher} />

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
