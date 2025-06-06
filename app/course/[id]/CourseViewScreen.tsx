import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCourses } from '@/contexts/CoursesContext';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Image } from 'react-native';
import { useEffect, useState } from 'react';
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
import { CourseTopBar } from '@/components/courses/course/CourseTopBar';
import { TasksSection } from '@/components/courses/course/TasksSection';
import { ModulesSection } from '@/components/courses/course/ModulesSection';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'file';
  options?: string[];
  correct_answers?: string[];
  order: number;
  points: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  type: 'homework' | 'exam';
  status: string;
  questions: Question[];
  submission?: {
    id: string;
    content: string;
    submitted: boolean;
  };
}

const alumnos = Array.from({ length: 20 }, (_, i) => `Padron: ${i + 1}`);
const docentesTitulares = ['Iñaki Llorens', 'Martín Morilla'];
const docentesAuxiliares = ['Emiliano Gómez', 'Martín Masivo', 'Fede FIUBA'];

interface Props {
  teacher?: boolean;
}

export const CourseViewScreen = ({teacher}: Props) => {
  const { id } = useLocalSearchParams();
  console.log('Course ID:', id);
  const router = useRouter();
  const { courses, reloadCourses } = useCourses();
  const [showAlumnos, setShowAlumnos] = useState(false);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const course = courses.find(c => c.id === id);

  const auth = useAuth();
  const authState = auth?.authState;

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

  const tasks = allAssignments.filter(a => a.type === 'homework');
  const exams = allAssignments.filter(a => a.type === 'exam');

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
        if (data !== null) {
            setAllAssignments(data);
            console.log('All assignments:', allAssignments);
        }
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
              role="Alumno"
              onBack={() => router.back()}
              canEdit={teacher}
              course={course}
              onEditSuccess={reloadCourses}
            />

      {/* Course Info */}
      
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
  
          { teacher && (
            <TouchableOpacity
            style={courseStyles.deleteButton}
            onPress={() => setShowConfirmModal(true)}
          >
            <Text style={courseStyles.buttonText}>Eliminar curso</Text>
          </TouchableOpacity>
          )}
  
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
