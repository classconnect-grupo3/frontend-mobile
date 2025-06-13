import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList } from 'react-native';
import { styles as courseStyles } from '@/styles/courseStyles';
import { courseClient } from '@/lib/courseClient';
import ModuleCard from '@/components/courses/ModuleCard';
import React from 'react';
import Toast from "react-native-toast-message";
import { useAuth } from '@/contexts/sessionAuth';
import { ModuleData } from '@/components/courses/ModuleCard';
import * as DocumentPicker from "expo-document-picker"
import { uploadFileToModuleResource } from "@/firebaseConfig"
import { FirebaseError } from 'firebase/app';

interface Props {
  courseId: string;
  isTeacher: boolean;
}

export const ModulesSection = ({ courseId, isTeacher }: Props) => {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const auth = useAuth()
  const authState = auth?.authState

 useEffect(() => {
   const fetchModules = async () => {
     try {
       setLoading(true);
       const { data } = await courseClient.get(`/modules/course/${courseId}`, {
        headers: {
          Authorization: `Bearer ${authState?.token}`,
        },
       });
       setModules(data);
     } catch (e) {
       console.error("Error fetching modules:", e);
     } finally {
       setLoading(false);
     }
   };

   fetchModules();
 }, [courseId]);

  const handleAddModule = async () => {
    try {
      if (!authState) {
        Toast.show({ type: "error", text1: "No hay sesión de usuario" })
        return
      }
      const newModule: ModuleData = {
        id: Date.now().toString(), 
        course_id: courseId,
        title: newTitle.trim() || 'Nuevo módulo',
        description: newDescription.trim(),
        resources: [],
      };
      console.log("Creating module: ", newModule)
      await courseClient.post(
        '/modules', 
        {
          resources: newModule.resources,
          course_id: newModule.course_id,
          description: newModule.description,
          title: newModule.title
        }, 
        {
          headers: {
            Authorization: `Bearer ${authState.token}`,
          },
        },
      )

      setModules((prev) => [...prev, newModule]);
      setNewTitle('');
      setNewDescription('');
      setModalVisible(false);
    } catch (e) {
      console.error("Error creando módulo:", e)
      Toast.show({ type: "error", text1: "No se pudo crear el módulo" })
    }
  };

  const handleUpdateModule = async (updatedModule: ModuleData) => {
    try {
      if (!authState) {
        Toast.show({ type: "error", text1: "No hay sesión de usuario" });
        return;
      }
  
      await courseClient.put(
        `/modules/${updatedModule.id}`,
        {
          title: updatedModule.title,
          description: updatedModule.description,
          resources: updatedModule.resources,
        },
        {
          headers: {
            Authorization: `Bearer ${authState.token}`,
          },
        }
      );
  
      setModules((prev) =>
        prev.map((m) => (m.id === updatedModule.id ? updatedModule : m))
      );
      Toast.show({ type: "success", text1: "Módulo actualizado correctamente" });
    } catch (e) {
      console.error("Error actualizando módulo:", e);
      Toast.show({ type: "error", text1: "No se pudo actualizar el módulo" });
    }
  };
  

  const handleDeleteModule = async (moduleId: string) => {
    try {
      if (!authState) {
        Toast.show({ type: "error", text1: "No hay sesión de usuario" });
        return;
      }
  
      await courseClient.delete(`/modules/${moduleId}`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      });
  
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
      Toast.show({ type: "success", text1: "Módulo eliminado correctamente" });
    } catch (e) {
      console.error("Error eliminando módulo:", e);
      Toast.show({ type: "error", text1: "No se pudo eliminar el módulo" });
    }
  };
  

  const handleAddResource = async (moduleId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })
      if (!result.assets || result.assets.length === 0) return
  
      const { uri, name } = result.assets[0]
      const teacherId = authState?.user?.id
      if (!teacherId) throw new Error("Missing teacher ID")
  
      const file = await uploadFileToModuleResource(uri, courseId, moduleId, teacherId)
      if (!file) return
  
      const newResource = {
        id: `res_${Date.now()}`,
        name: file.fileName,
        url: file.downloadUrl,
        size: file.fileSize,
        type: file.contentType,
      }
  
      const updatedModules = modules.map((mod) =>
        mod.id === moduleId
          ? {
              ...mod,
              resources: [...(mod.resources || []), newResource],
            }
          : mod
      )
  
      const updatedModule = updatedModules.find((mod) => mod.id === moduleId)!
  
      await courseClient.put(
        `/modules/${updatedModule.id}`,
        {
          resources: updatedModule.resources,
        },
        {
          headers: {
            Authorization: `Bearer ${authState?.token}`,
          },
        }
      )
  
      setModules(updatedModules)
  
      Toast.show({
        type: "success",
        text1: "Recurso agregado correctamente",
        text2: newResource.name,
      })
    } catch (error) {
      console.error("Error al agregar recurso:", error)
      if (error instanceof FirebaseError) {
        console.log("FirebaseError code:", error.code)
        console.log("FirebaseError message:", error.message)
        console.log("FirebaseError customData:", error.customData)
      }
      Toast.show({
        type: "error",
        text1: "Error al agregar recurso",
        text2: error instanceof Error ? error.message : "Intente nuevamente",
      })
    }
  }
  

  return (
    <>
      <Text style={courseStyles.sectionHeader}>Módulos</Text>

      {loading ? (
        <Text style={courseStyles.assignmentDescription}>Cargando módulos...</Text>
      ) : modules.length === 0 ? (
        <Text style={courseStyles.assignmentDescription}>No hay módulos disponibles.</Text>
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
                    <Text style={courseStyles.modalButtonText}>Agregar</Text>
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
