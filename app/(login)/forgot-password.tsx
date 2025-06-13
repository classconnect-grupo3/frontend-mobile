"use client"

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Toast from "react-native-toast-message"
import { styles } from "@/styles/loginStyle"
import { Link, router } from "expo-router"
import { useState } from "react"
import { MaterialIcons } from "@expo/vector-icons"
import { client } from "@/lib/http"
import React from "react"

const schema = z.object({
  email: z.string().email("Ingresa un email válido"),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      await client.post("/users/forgot-password", { email: data.email })
      setSuccess(true)
      Toast.show({
        type: "success",
        text1: "Solicitud enviada",
        text2: "Revisa tu correo para restablecer tu contraseña",
      })
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: e?.response?.data?.detail ?? e?.message ?? "No se pudo procesar la solicitud",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={localStyles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Image source={require("@/assets/images/logo.png")} style={styles.image} />

        {success ? (
          <View style={localStyles.successContainer}>
            <View style={localStyles.successIconContainer}>
              <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={localStyles.successTitle}>¡Solicitud enviada!</Text>
            <Text style={localStyles.successMessage}>
              Hemos enviado un correo con instrucciones para restablecer tu contraseña. Por favor, revisa tu bandeja de
              entrada.
            </Text>
            <TouchableOpacity style={localStyles.returnButton} onPress={() => router.replace("/(login)")}>
              <Text style={localStyles.returnButtonText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={localStyles.title}>Recuperar contraseña</Text>
            <Text style={localStyles.subtitle}>
              Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
            </Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <View style={localStyles.inputContainer}>
                    <MaterialIcons name="email" size={20} color="#999" style={localStyles.inputIcon} />
                    <TextInput
                      style={[styles.input, localStyles.input, errors.email ? styles.inputError : {}]}
                      placeholder="Correo electrónico"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholderTextColor="#999"
                    />
                  </View>
                  {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                </>
              )}
            />

            <TouchableOpacity
              style={[styles.button, localStyles.button, (!isValid || isSubmitting) && localStyles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Enviar instrucciones</Text>
              )}
            </TouchableOpacity>

            <Link style={localStyles.link} href="/(login)">
              ¿Recordaste tu contraseña? Iniciar sesión
            </Link>
          </View>
        )}

        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const localStyles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingVertical: 12,
  },
  button: {
    backgroundColor: "#007AFF",
    marginTop: 8,
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  link: {
    color: "#007AFF",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  successContainer: {
    alignItems: "center",
    padding: 20,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  returnButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  returnButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
