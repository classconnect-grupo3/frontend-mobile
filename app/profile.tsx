"use client"

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from "react-native"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/sessionAuth"
import { fetchUserData } from "@/services/userProfile"
import { client } from "@/lib/http"
import Toast from "react-native-toast-message"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import * as ImagePicker from "expo-image-picker"
import { fetchProfileImage, uploadToFirebase } from "@/firebaseConfig"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Colors } from "@/styles/shared"
import { MaterialIcons } from "@expo/vector-icons"
import React from "react"

const schema = z.object({
  name: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Last name is required"),
  email: z.string().email("Must be a valid email"),
})

type FormData = z.infer<typeof schema>

export default function ProfileScreen() {
  const [userData, setUserData] = useState<{
    name: string
    surname: string
    email: string
    location: string
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const auth = useAuth()
  const [permission, requestPermission] = ImagePicker.useCameraPermissions()
  const [files, setFiles] = useState<{ name: string }[]>([])
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)

  const handleChoosePhoto = () => {
    Alert.alert(
      "Seleccionar foto de perfil",
      "¿Cómo querés subir tu foto?",
      [
        {
          text: "Desde la galería",
          onPress: pickFromGallery,
        },
        {
          text: "Tomar foto",
          onPress: takePhoto,
        },
        { text: "Cancelar", style: "cancel" },
      ],
      { cancelable: true },
    )
  }

  const takePhoto = async () => {
    try {
      const cameraResp = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      })

      if (!cameraResp.canceled) {
        const { uri } = cameraResp.assets[0]
        const userId = auth?.authState?.user?.id
        if (!userId) throw new Error("No user ID")

        const uploadResp = await uploadToFirebase(uri, `${userId}.jpg`)
        console.log("Foto subida desde cámara:", uploadResp)
        const url = await fetchProfileImage(userId)
        setProfileImageUrl(url)
        auth.setProfilePicUrl(url)
      }
    } catch (e) {
      Alert.alert("Error tomando foto: " + e.message)
    }
  }

  const pickFromGallery = async () => {
    try {
      const pickerResp = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      })

      if (!pickerResp.canceled) {
        const { uri } = pickerResp.assets[0]
        const userId = auth?.authState?.user?.id
        if (!userId) throw new Error("No user ID")

        const uploadResp = await uploadToFirebase(uri, `${userId}.jpg`)
        console.log("Foto subida desde galería:", uploadResp)
        const url = await fetchProfileImage(userId)
        setProfileImageUrl(url)
        auth.setProfilePicUrl(url)
      }
    } catch (e) {
      Alert.alert("Error subiendo imagen: " + e.message)
    }
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      surname: "",
      email: "",
    },
  })

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (!auth?.authState.token) return
        const data = await fetchUserData(auth.authState.token)
        setUserData(data)
        reset({
          name: data.name,
          surname: data.surname,
          email: data.email,
        })
        if (auth?.authState?.user?.id) {
          const url = await fetchProfileImage(auth.authState.user.id)
          setProfileImageUrl(url)
        }
      } catch (err) {
        console.error("Failed to load user:", err)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const handleSave = async (data: FormData) => {
    if (!auth) return

    try {
      await client.patch(
        "/users/me",
        {
          ...data,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.authState.token}`,
          },
        },
      )

      setUserData((prev) => (prev ? { ...prev, ...data } : null))

      Toast.show({
        type: "success",
        text1: "Perfil actualizado",
        text2: "Los cambios se guardaron correctamente",
      })

      setEditMode(false)
    } catch (e) {
      console.error("Error updating profile", e)
      Toast.show({
        type: "error",
        text1: "Error al actualizar",
        text2: "Algo salió mal al actualizar tu perfil.",
      })
    }
  }

  const handleCancel = () => {
    if (userData) {
      reset({
        name: userData.name,
        surname: userData.surname,
        email: userData.email,
      })
    }
    setEditMode(false)
  }

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que quieres cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: () => {
            Toast.show({
              type: "success",
              text1: "Sesión cerrada",
              text2: "Has cerrado sesión exitosamente",
            })
            auth?.logout()
          },
        },
      ],
      { cancelable: true },
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    )
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error al cargar los datos del usuario.</Text>
      </View>
    )
  }

  return (
    <ScreenLayout scrollable={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {!permission || permission.status !== ImagePicker.PermissionStatus.GRANTED ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionTitle}>Permisos de cámara requeridos</Text>
            <Text style={styles.permissionText}>Necesitas permitir el acceso a la cámara para usar esta función.</Text>
            <Text style={styles.permissionStatus}>Estado: {permission?.status}</Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={async () => {
                const { status } = await requestPermission()
                if (status === ImagePicker.PermissionStatus.GRANTED) {
                  Alert.alert("Permiso concedido")
                } else {
                  Alert.alert("Permiso denegado")
                }
              }}
            >
              <Text style={styles.permissionButtonText}>Conceder Permiso</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Mi Perfil</Text>
            </View>

            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={
                    profileImageUrl ? { uri: profileImageUrl } : require("@/assets/images/profile_placeholder.png")
                  }
                  style={styles.profileImage}
                />
                <TouchableOpacity onPress={handleChoosePhoto} style={styles.editPhotoButton}>
                  <Text style={styles.editPhotoIcon}>📷</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.profileName}>
                {userData.name} {userData.surname}
              </Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                {(["name", "surname", "email"] as const).map((field) => (
                  <View style={styles.fieldContainer} key={field}>
                    <Text style={styles.fieldLabel}>
                      {field === "name" ? "Nombre" : field === "surname" ? "Apellido" : "Correo electrónico"}
                    </Text>

                    {editMode ? (
                      <Controller
                        control={control}
                        name={field}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <>
                            <TextInput
                              style={[styles.input, errors[field] && styles.inputError]}
                              placeholder={`Ingresa tu ${field === "name" ? "nombre" : field === "surname" ? "apellido" : "correo"}`}
                              value={value}
                              onBlur={onBlur}
                              onChangeText={onChange}
                              autoCapitalize={field === "email" ? "none" : "words"}
                              keyboardType={field === "email" ? "email-address" : "default"}
                            />
                            {errors[field] && <Text style={styles.errorText}>{errors[field]?.message}</Text>}
                          </>
                        )}
                      />
                    ) : (
                      <Text style={styles.fieldValue}>
                        {field === "name" ? userData.name : field === "surname" ? userData.surname : userData.email}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.buttonSection}>
              {editMode ? (
                <View style={styles.editButtonsContainer}>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, (!isValid || isSubmitting) && styles.disabledButton]}
                    onPress={handleSubmit(handleSave)}
                    disabled={!isValid || isSubmitting}
                  >
                    <Text style={styles.saveButtonText}>{isSubmitting ? "Guardando..." : "Guardar Cambios"}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(true)}>
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Logout Section */}
            <View style={styles.logoutSection}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <MaterialIcons name="logout" size={20} color="#fff" style={styles.logoutIcon} />
                <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>

            <Toast />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 24,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  permissionStatus: {
    fontSize: 14,
    color: "#999",
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#007BFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  profileSection: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 16,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#e9ecef",
  },
  editPhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.secondaryButtonBackground,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.secondaryButtonBorder,
  },
  editPhotoIcon: {
    fontSize: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    color: "#333",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  input: {
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#dc3545",
  },
  errorText: {
    fontSize: 12,
    color: "#dc3545",
    marginTop: 4,
  },
  buttonSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  editButton: {
    backgroundColor: "#007BFF",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    textAlignVertical: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  editButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#6c757d",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#28a745",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#adb5bd",
  },
  logoutSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    marginTop: 16,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
