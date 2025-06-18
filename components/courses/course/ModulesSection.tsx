"use client"

import { useEffect, useState } from "react"
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList, StyleSheet } from "react-native"
import { courseClient } from "@/lib/courseClient"
import ModuleCard from "@/components/courses/ModuleCard"
import Toast from "react-native-toast-message"
import { useAuth } from "@/contexts/sessionAuth"
import type { ModuleData } from "@/components/courses/ModuleCard"
import * as DocumentPicker from "expo-document-picker"
import { uploadFileToModuleResource } from "@/firebaseConfig"
import { FirebaseError } from "firebase/app"
import React from "react"

interface Props {
  courseId: string
  isTeacher: boolean
}

export const ModulesSection = ({ courseId, isTeacher }: Props) => {
  const [modules, setModules] = useState<ModuleData[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")

  const auth = useAuth()
  const authState = auth?.authState

  const fetchModules = async () => {
    try {
      setLoading(true)
      const { data } = await courseClient.get(`/modules/course/${courseId}`, {
        headers: {
          Authorization: `Bearer ${authState?.token}`,
        },
      })
      setModules(data)
    } catch (e) {
      console.error("Error fetching modules:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModules()
    console.log("Modules: ", modules)
  }, [courseId])

  const handleAddModule = async () => {
    try {
      if (!authState) {
        Toast.show({ type: "error", text1: "No hay sesión de usuario" })
        return
      }
      const newModule = {
        course_id: courseId,
        title: newTitle.trim() || "Nuevo módulo",
        description: newDescription.trim(),
        resources: [],
      }
      console.log("Creating module: ", newModule)
      await courseClient.post(
        "/modules",
        {
          resources: newModule.resources,
          course_id: newModule.course_id,
          description: newModule.description,
          title: newModule.title,
        },
        {
          headers: {
            Authorization: `Bearer ${authState.token}`,
          },
        },
      )

      await fetchModules()
      console.log("Modules: ", modules)
      setNewTitle("")
      setNewDescription("")
      setModalVisible(false)
    } catch (e) {
      console.error("Error creando módulo:", e)
      Toast.show({ type: "error", text1: "No se pudo crear el módulo" })
    }
  }

  const handleUpdateModule = async (updatedModule: ModuleData) => {
    try {
      if (!authState) {
        Toast.show({ type: "error", text1: "No hay sesión de usuario" })
        return
      }

      await courseClient.put(
        `/modules/${updatedModule.id}`,
        {
          title: updatedModule.title,
          course_id: updatedModule.course_id,
          description: updatedModule.description,
          resources: updatedModule.resources,
        },
        {
          headers: {
            Authorization: `Bearer ${authState.token}`,
          },
        },
      )

      setModules((prev) => prev.map((m) => (m.id === updatedModule.id ? updatedModule : m)))
      Toast.show({ type: "success", text1: "Módulo actualizado correctamente" })
    } catch (e) {
      console.error("Error actualizando módulo:", e)
      Toast.show({ type: "error", text1: "No se pudo actualizar el módulo" })
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    try {
      if (!authState) {
        Toast.show({ type: "error", text1: "No hay sesión de usuario" })
        return
      }

      await courseClient.delete(`/modules/${moduleId}`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      })

      setModules((prev) => prev.filter((m) => m.id !== moduleId))
      Toast.show({ type: "success", text1: "Módulo eliminado correctamente" })
    } catch (e) {
      console.error("Error eliminando módulo:", e)
      Toast.show({ type: "error", text1: "No se pudo eliminar el módulo" })
    }
  }

  const handleAddResource = async (moduleId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })
      if (!result.assets || result.assets.length === 0) return

      console.log("1. Got document")

      const { uri, name } = result.assets[0]
      const teacherId = authState?.user?.id
      if (!teacherId) throw new Error("Missing teacher ID")

      const file = await uploadFileToModuleResource(uri, courseId, moduleId, teacherId)
      console.log("2. Uploaded file")
      if (!file) return
      console.log("3. File isn't null")
      const newResource = {
        id: Math.floor(Math.random() * 100000),
        name: file.fileName,
        url: file.downloadUrl,
      }

      const updatedModules = modules.map((mod) =>
        mod.id === moduleId
          ? {
              ...mod,
              resources: [...(mod.resources || []), newResource],
            }
          : mod,
      )

      const updatedModule = updatedModules.find((mod) => mod.id === moduleId)!

      console.log("3.5 Updating module: ", updatedModule.id)
      console.log({
        title: updatedModule.title,
        course_id: updatedModule.course_id,
        description: updatedModule.description,
        resources: updatedModule.resources,
      })

      await courseClient.put(
        `/modules/${updatedModule.id}`,
        {
          title: updatedModule.title,
          course_id: updatedModule.course_id,
          description: updatedModule.description,
          resources: updatedModule.resources,
        },
        {
          headers: {
            Authorization: `Bearer ${authState?.token}`,
          },
        },
      )
      console.log("4. Updated module")
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
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeader}>Módulos</Text>

      {loading ? (
        <Text style={styles.loadingText}>Cargando módulos...</Text>
      ) : modules.length === 0 ? (
        <Text style={styles.emptyText}>No hay módulos disponibles.</Text>
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
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Agregar módulo</Text>
          </TouchableOpacity>

          <Modal visible={modalVisible} animationType="slide" transparent>
            <View style={styles.modalBackground}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Nuevo módulo</Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Título del módulo"
                  placeholderTextColor="#999"
                  style={styles.input}
                />
                <TextInput
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="Descripción"
                  placeholderTextColor="#999"
                  multiline
                  style={[styles.input, { height: 80 }]}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={handleAddModule}
                    style={[styles.modalButton, { backgroundColor: "#4CAF50" }]}
                  >
                    <Text style={styles.modalButtonText}>Agregar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 20,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
})
