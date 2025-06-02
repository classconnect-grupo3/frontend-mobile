import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList } from 'react-native';
import { styles as courseStyles } from '@/styles/courseStyles';
import { courseClient } from '@/lib/courseClient';
import ModuleCard from '@/components/courses/ModuleCard';
import React from 'react';

interface ModuleData {
  id: string;
  title: string;
  description: string;
  resources: { id: string; name: string }[];
}

interface Props {
  courseId: string;
  isTeacher: boolean;
}

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

export const ModulesSection = ({ courseId, isTeacher }: Props) => {
  const [modules, setModules] = useState<ModuleData[]>(MOCK_MODULES);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

//   useEffect(() => {
//     const fetchModules = async () => {
//       try {
//         setLoading(true);
//         const { data } = await courseClient.get(`/courses/${courseId}/modules`);
//         setModules(data); // ⚠️ Ajustar si tu backend devuelve { modules: [...] }
//       } catch (e) {
//         console.error("Error fetching modules:", e);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchModules();
//   }, [courseId]);

  const handleAddModule = () => {
    const newModule: ModuleData = {
      id: Date.now().toString(),
      title: newTitle.trim() || 'Nuevo módulo',
      description: newDescription.trim(),
      resources: [],
    };
    setModules((prev) => [...prev, newModule]);
    setNewTitle('');
    setNewDescription('');
    setModalVisible(false);
  };

  const handleUpdateModule = (updated: ModuleData) => {
    setModules((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleDeleteModule = (moduleId: string) => {
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
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
    <>
      <Text style={courseStyles.sectionHeader}>Módulos</Text>

      {loading ? (
        <Text style={courseStyles.taskDescription}>Cargando módulos...</Text>
      ) : modules.length === 0 ? (
        <Text style={courseStyles.taskDescription}>No hay módulos disponibles.</Text>
      ) : (
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
              isTeacher={isTeacher}
            />
          )}
          contentContainerStyle={{ padding: 4 }}
        />
      )}

      {isTeacher && (
        <>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={courseStyles.addButton}>
            <Text style={courseStyles.buttonText}>+ Agregar módulo</Text>
          </TouchableOpacity>

          <Modal visible={modalVisible} animationType="slide" transparent>
            <View style={courseStyles.modalBackground}>
              <View style={courseStyles.modalContent}>
                <Text style={courseStyles.modalTitle}>Nuevo módulo</Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Título del módulo"
                  placeholderTextColor="#999"
                  style={courseStyles.input}
                />
                <TextInput
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="Descripción"
                  placeholderTextColor="#999"
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
        </>
      )}
    </>
  );
};
