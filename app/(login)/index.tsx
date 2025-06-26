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
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"

const schema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type FormData = z.infer<typeof schema>

export default function LoginScreen() {
  const auth = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  
  // Estados para el sistema de bloqueo
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTimeLeft, setBlockTimeLeft] = useState(0)
  
  const fadeAnim = useRef(new Animated.Value(0)).current
  const MAX_ATTEMPTS = 5
  const BLOCK_TIME = 30 // 30 segundos

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()
  }, [])

  // Effect para manejar el temporizador de bloqueo
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isBlocked && blockTimeLeft > 0) {
      interval = setInterval(() => {
        setBlockTimeLeft((time) => {
          if (time <= 1) {
            setIsBlocked(false)
            setFailedAttempts(0)
            return 0
          }
          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isBlocked, blockTimeLeft])

  const onSubmit = async (data: FormData) => {
    // Verificar si la cuenta está bloqueada
    if (isBlocked) {
      Toast.show({
        type: "error",
        text1: "Cuenta temporalmente bloqueada",
        text2: `Espera ${blockTimeLeft} segundos o contacta soporte`,
      })
      return
    }

    try {
      setIsLoggingIn(true)
      if (auth) {
        await auth.login(data.email, data.password)
        // Reset en caso de login exitoso
        setFailedAttempts(0)
        setIsBlocked(false)
        setBlockTimeLeft(0)
      } else {
        throw new Error("El contexto de autenticación no está disponible")
      }
    } catch (e: any) {
      // Incrementar intentos fallidos solo si el código de respuesta es 401 (Unauthorized)
      const statusCode = e?.response?.status
      if (statusCode === 401) {
        const newFailedAttempts = failedAttempts + 1
        setFailedAttempts(newFailedAttempts)

        if (newFailedAttempts >= MAX_ATTEMPTS) {
          setIsBlocked(true)
          setBlockTimeLeft(BLOCK_TIME)
          Toast.show({
            type: "error",
            text1: "Cuenta bloqueada temporalmente",
            text2: `Demasiados intentos fallidos. Espera ${BLOCK_TIME} segundos o contacta soporte`,
          })
        } else {
          const attemptsLeft = MAX_ATTEMPTS - newFailedAttempts
          Toast.show({
            type: "error",
            text1: "Error al iniciar sesión",
            text2: `${e?.response?.data?.detail ?? e?.message ?? "Algo salió mal"}. Intentos restantes: ${attemptsLeft}`,
          })
        }
      } else {
        // Mostrar error sin contar como intento fallido
        Toast.show({
          type: "error",
          text1: "Error al iniciar sesión",
          text2: e?.response?.data?.detail ?? e?.message ?? "Algo salió mal",
        })
      }
    } finally {
      setIsLoggingIn(false)
    }
  }

  const isFormDisabled = !isValid || isLoggingIn || isBlocked

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
          <Image source={require("@/assets/images/logo.png")} style={[styles.image, localStyles.logo]} />
          <Text style={localStyles.welcomeText}>¡Bienvenido de nuevo!</Text>
        </Animated.View>

        <View style={styles.form}>
          {/* Mostrar mensaje de bloqueo si está activo */}
          {isBlocked && (
            <View style={localStyles.warningContainer}>
              <MaterialIcons name="warning" size={20} color="#ff6b6b" />
              <Text style={localStyles.warningText}>
                Cuenta bloqueada por {blockTimeLeft}s
              </Text>
            </View>
          )}

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
                    editable={!isBlocked}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
              </>
            )}
          />

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
                    editable={!isBlocked}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} disabled={isBlocked}>
                    <MaterialIcons
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={20}
                      color={isBlocked ? "#ccc" : "#999"}
                      style={{ marginHorizontal: 8 }}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
              </>
            )}
          />

          <Link style={[localStyles.forgotPassword, isBlocked && localStyles.linkDisabled]} href="/(login)/forgot-password">
            ¿Olvidaste tu contraseña?
          </Link>

          <TouchableOpacity
            style={[styles.button, localStyles.button, isFormDisabled && localStyles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isFormDisabled}
          >
            {isLoggingIn ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isBlocked ? `Bloqueado (${blockTimeLeft}s)` : "Iniciar sesión"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={localStyles.dividerContainer}>
            <View style={localStyles.divider} />
            <Text style={localStyles.dividerText}>O continúa con</Text>
            <View style={localStyles.divider} />
          </View>

          {/* Botón Login con Google */}
          <GoogleSignInButton disabled={isLoggingIn || isBlocked} />

          <View style={localStyles.registerContainer}>
            <Text style={localStyles.registerText}>¿No tienes una cuenta?</Text>
            <Link style={[localStyles.registerLink, isBlocked && localStyles.linkDisabled]} href="/(login)/register">
              Regístrate
            </Link>
          </View>
        </View>

        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const localStyles = StyleSheet.create({
  logo: {
    width: 120,
    height: 120,
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
  forgotPassword: {
    alignSelf: "flex-end",
    color: "#007AFF",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#999",
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  registerText: {
    color: "#666",
    fontSize: 16,
  },
  registerLink: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 5,
  },
  // Nuevos estilos para el sistema de bloqueo
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff2f2",
    borderWidth: 1,
    borderColor: "#ff6b6b",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: "#ff6b6b",
    fontWeight: "500",
    marginLeft: 8,
    fontSize: 14,
  },
  linkDisabled: {
    color: "#cccccc",
  },
})
