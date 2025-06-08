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
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Top bar */}
      <View style={homeScreenStyles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={courseStyles.back}>←</Text>
        </TouchableOpacity>
        <Text style={homeScreenStyles.title}>{course.title}</Text>
        <Text style={courseStyles.role}>rol: Docente</Text>
        <Image 
            source={require('@/assets/images/profile-placeholder.jpeg')}
            style={homeScreenStyles.profileIcon}
        />
      </View>

      <View style={homeScreenStyles.topBar}>
        <Text style={courseStyles.taskTitle}>Description</Text>
        <Text style={courseStyles.taskDescription}>{course.description}</Text>
      </View>

      <View style={homeScreenStyles.topBar}>
        <Text style={courseStyles.taskTitle}>Capacity</Text>
        <Text style={courseStyles.taskDescription}>{course.capacity} students</Text>
      </View>

      

      <TouchableOpacity
        style={courseStyles.editButton}
        onPress={() => setShowEditModal(true)}
      >
        <MaterialIcons name="edit" size={18} color="#333" />
        <Text style={courseStyles.editButtonText}>Editar curso</Text>
      </TouchableOpacity>
      <EditCourseModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        course={course}
        onSuccess={reloadCourses}
      />

      {/* Course Info */}
      
      <Text style={courseStyles.sectionHeader}>Tareas</Text>

      <TouchableOpacity onPress={() => setShowTaskModal(true)} style={courseStyles.addButton}>
        <Text style={courseStyles.buttonText}>+ Agregar tarea</Text>
      </TouchableOpacity>

      {tasks.map((task) => (
        <View key={task.id} style={courseStyles.taskCard}>
          <Text style={courseStyles.taskTitle}>{task.title}</Text>
          <Text style={courseStyles.taskDescription}>{task.description}</Text>
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

      <Text style={courseStyles.sectionHeader}>Exámenes</Text>

      <TouchableOpacity onPress={() => setShowExamModal(true)} style={courseStyles.addButton}>
        <Text style={courseStyles.buttonText}>+ Agregar examen</Text>
      </TouchableOpacity>

      {exams.map((exam) => (
        <View key={exam.id} style={courseStyles.taskCard}>
          <Text style={courseStyles.taskTitle}>{exam.title}</Text>
          <Text style={courseStyles.taskDescription}>{exam.description}</Text>
          <Text style={courseStyles.taskDeadline}>📅 {exam.date}</Text>
          <TouchableOpacity onPress={() => setExams(exams.filter(e => e.id !== exam.id))}>
            <Text style={courseStyles.taskDelete}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      ))}

      <NewTaskModal
        visible={showExamModal}
        onClose={() => setShowExamModal(false)}
        onCreate={(exam) =>
          setExams((prev) => [
            ...prev,
            {
              ...exam,
              id: Date.now().toString(),
              description: exam.description || '',
              date: exam.deadline || '',
            },
          ])
        }
      />

      <Text style={courseStyles.sectionHeader}>Módulos</Text>
      <FlatList
        data={modules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ModuleCard
            key={item.id}
            moduleData={item}
            onUpdateModule={handleUpdateModule}
            onAddResource={handleAddResource}
            onDeleteModule={handleDeleteModule}
          />
        )}
        contentContainerStyle={{ padding: 4 }}
      />

      <TouchableOpacity onPress={() => setModalVisible(true)} style={courseStyles.addButton}>
        <Text style={courseStyles.buttonText}>+ Agregar módulo</Text>
      </TouchableOpacity>
      
      {/* Modal de creación de módulo */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={courseStyles.modalBackground}>
          <View style={courseStyles.modalContent}>
            <Text style={courseStyles.modalTitle}>Nuevo módulo</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Título del módulo"
              placeholderTextColor={'#999'}
              style={courseStyles.input}
            />
            <TextInput
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="Descripción"
              placeholderTextColor={'#999'}
              multiline
              style={[courseStyles.input, { height: 80 }]}
            />

            <View style={courseStyles.modalButtons}>
              <TouchableOpacity
                onPress={handleAddModule}
                style={[courseStyles.modalButton, { backgroundColor: '#4CAF50' }]}
              >
                <Text style={courseStyles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[courseStyles.modalButton, { backgroundColor: '#ccc' }]}
              >
                <Text style={courseStyles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
};

export const options = {
  headerShown: false,
};

