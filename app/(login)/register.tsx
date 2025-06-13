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
  Animated,
} from "react-native"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Toast from "react-native-toast-message"
import { useAuth } from "@/contexts/sessionAuth"
import { useRouter } from "expo-router"
import { styles } from "@/styles/loginStyle"
import { Link } from "expo-router"
import { useState, useEffect, useRef } from "react"
import { MaterialIcons } from "@expo/vector-icons"
import React from "react"

const schema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio"),
    surname: z.string().min(1, "El apellido es obligatorio"),
    email: z.string().email("Ingresa un email válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof schema>

export default function RegisterScreen() {
  const auth = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()
  }, [])

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsRegistering(true)
      if (auth) {
        await auth.register(data.name, data.surname, data.email, data.password)
        Toast.show({
          type: "success",
          text1: "Registro exitoso",
          text2: "Ahora puedes iniciar sesión",
        })
        router.replace("/(login)")
      } else {
        throw new Error("El contexto de autenticación no está disponible")
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Error al registrarse",
        text2: e?.response?.data?.detail ?? e?.message ?? "Algo salió mal",
      })
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={localStyles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
          <Image source={require("@/assets/images/logo.png")} style={[styles.image, localStyles.logo]} />
          <Text style={localStyles.welcomeText}>Crear una cuenta</Text>
        </Animated.View>

        <View style={styles.form}>
          {/* Nombre */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <View style={localStyles.inputContainer}>
                  <MaterialIcons name="person" size={20} color="#999" style={localStyles.inputIcon} />
                  <TextInput
                    style={[styles.input, localStyles.input, errors.name ? styles.inputError : {}]}
                    placeholder="Nombre"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholderTextColor="#999"
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
              </>
            )}
          />

          {/* Apellido */}
          <Controller
            control={control}
            name="surname"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <View style={localStyles.inputContainer}>
                  <MaterialIcons name="person" size={20} color="#999" style={localStyles.inputIcon} />
                  <TextInput
                    style={[styles.input, localStyles.input, errors.surname ? styles.inputError : {}]}
                    placeholder="Apellido"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholderTextColor="#999"
                  />
                </View>
                {errors.surname && <Text style={styles.errorText}>{errors.surname.message}</Text>}
              </>
            )}
          />

          {/* Email */}
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

          {/* Contraseña */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <View style={localStyles.inputContainer}>
                  <MaterialIcons name="lock" size={20} color="#999" style={localStyles.inputIcon} />
                  <TextInput
                    style={[styles.input, localStyles.input, errors.password ? styles.inputError : {}, { flex: 1 }]}
                    placeholder="Contraseña"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                    <MaterialIcons
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={20}
                      color="#999"
                      style={{ marginHorizontal: 8 }}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
              </>
            )}
          />

          {/* Confirmar Contraseña */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <View style={localStyles.inputContainer}>
                  <MaterialIcons name="lock" size={20} color="#999" style={localStyles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      localStyles.input,
                      errors.confirmPassword ? styles.inputError : {},
                      { flex: 1 },
                    ]}
                    placeholder="Confirmar contraseña"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                    <MaterialIcons
                      name={showConfirmPassword ? "visibility-off" : "visibility"}
                      size={20}
                      color="#999"
                      style={{ marginHorizontal: 8 }}
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
              </>
            )}
          />

          <TouchableOpacity
            style={[styles.button, localStyles.button, (!isValid || isRegistering) && localStyles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isRegistering}
          >
            {isRegistering ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Registrarse</Text>
            )}
          </TouchableOpacity>

          <View style={localStyles.loginContainer}>
            <Text style={localStyles.loginText}>¿Ya tienes una cuenta?</Text>
            <Link style={localStyles.loginLink} href="/(login)">
              Iniciar sesión
            </Link>
          </View>
        </View>

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
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 32,
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
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    color: "#666",
    fontSize: 16,
  },
  loginLink: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 5,
  },
})
