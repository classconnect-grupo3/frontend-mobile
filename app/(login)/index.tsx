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
import Constants from "expo-constants"

import * as WebBrowser from "expo-web-browser"
import * as Google from "expo-auth-session/providers/google"
import { makeRedirectUri } from "expo-auth-session"
import { signInWithCredential, GoogleAuthProvider, fbAuth } from "@/firebaseConfig"
import React from "react"

// Importante: Completar la sesión de autenticación web
WebBrowser.maybeCompleteAuthSession()

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
  const fadeAnim = useRef(new Animated.Value(0)).current

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

  // ✅ FORZAR el uso del proxy de Expo para desarrollo
  const getRedirectUri = () => {
    return `https://auth.expo.io/@${Constants.expoConfig?.owner || "inakillorens"}/${Constants.expoConfig?.slug || "classconnect-frontend-mobile"}`
  }

  const redirectUri = getRedirectUri()

  // ✅ CONFIGURACIÓN CORREGIDA - Forzar HTTPS para desarrollo
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    // ✅ Web Client ID
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,

    // ✅ SOLUCIÓN: Usar URL HTTPS explícita para desarrollo
    redirectUri: redirectUri,

    scopes: ["openid", "profile", "email"],
    responseType: "id_token",
    extraParams: {
      prompt: "select_account",
    },
  })

  // 🔍 DEBUGGING: Ver la configuración
  console.log("🔍 DEBUGGING Google OAuth Config:")
  console.log("📋 Client ID:", process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.substring(0, 30) + "...")
  console.log("🌐 Redirect URI:", redirectUri)
  console.log("🏗️ Development mode:", __DEV__)

  useEffect(() => {
    const handleGoogleResponse = async () => {
      console.log("🔍 DEBUGGING: Response received:", response?.type)

      if (response?.type === "success") {
        console.log("✅ Google OAuth Success - Full response:", JSON.stringify(response, null, 2))
        const { id_token, access_token } = response.params

        console.log("🎫 ID Token present:", !!id_token)
        console.log("🔑 Access Token present:", !!access_token)
        console.log("🎫 ID Token (first 50 chars):", id_token?.substring(0, 50) + "...")

        if (!id_token) {
          console.error("❌ No ID token received from Google")
          Toast.show({
            type: "error",
            text1: "Error de autenticación",
            text2: "No se recibió token de Google",
          })
          return
        }

        if (!auth) {
          console.error("❌ Auth context not available")
          Toast.show({
            type: "error",
            text1: "Error de configuración",
            text2: "Contexto de autenticación no disponible",
          })
          return
        }

        try {
          setIsLoggingIn(true)
          console.log("🔐 Step 1: Creating Firebase credential...")

          // ✅ Crear credencial de Firebase con el ID token de Google
          const credential = GoogleAuthProvider.credential(id_token)
          console.log("✅ Step 1 Complete: Firebase credential created")

          console.log("🔐 Step 2: Signing in with Firebase...")
          // ✅ Autenticar con Firebase
          const firebaseUserCredential = await signInWithCredential(fbAuth, credential)
          console.log("✅ Step 2 Complete: Firebase authentication successful")
          console.log("👤 Firebase User ID:", firebaseUserCredential.user.uid)
          console.log("📧 Firebase User Email:", firebaseUserCredential.user.email)

          console.log("🔐 Step 3: Getting Firebase ID token...")
          // ✅ Obtener el ID token de Firebase (este es el que necesita tu backend)
          const firebaseIdToken = await firebaseUserCredential.user.getIdToken()
          console.log("✅ Step 3 Complete: Firebase ID token obtained")
          console.log("🎫 Firebase ID token (first 50 chars):", firebaseIdToken.substring(0, 50) + "...")

          console.log("🔐 Step 4: Sending to backend...")
          // ✅ Enviar el token de Firebase a tu backend
          await auth.loginWithGoogle(firebaseIdToken)
          console.log("✅ Step 4 Complete: Backend login successful")

          Toast.show({
            type: "success",
            text1: "¡Bienvenido!",
            text2: "Has iniciado sesión con Google exitosamente",
          })
        } catch (error: any) {
          console.error("❌ ERROR in Google login process:")
          console.error("❌ Error type:", typeof error)
          console.error("❌ Error message:", error?.message)
          console.error("❌ Error code:", error?.code)
          console.error("❌ Full error:", JSON.stringify(error, null, 2))

          // Manejo específico de errores
          let errorMessage = "Error desconocido"
          let errorTitle = "Error al iniciar sesión"

          if (error?.code === "auth/invalid-credential") {
            errorTitle = "Credenciales inválidas"
            errorMessage = "El token de Google no es válido"
          } else if (error?.code === "auth/network-request-failed") {
            errorTitle = "Error de conexión"
            errorMessage = "Verifica tu conexión a internet"
          } else if (error?.code === "auth/too-many-requests") {
            errorTitle = "Demasiados intentos"
            errorMessage = "Espera un momento antes de intentar de nuevo"
          } else if (error?.message?.includes("backend") || error?.response) {
            errorTitle = "Error del servidor"
            errorMessage = "Problema con el servidor. Intenta más tarde"
            console.error("❌ Backend error details:", error?.response?.data)
          } else if (error?.message) {
            errorMessage = error.message
          }

          Toast.show({
            type: "error",
            text1: errorTitle,
            text2: errorMessage,
          })
        } finally {
          setIsLoggingIn(false)
        }
      } else if (response?.type === "error") {
        console.error("❌ Google OAuth Error:")
        console.error("❌ Error type:", response.error?.type)
        console.error("❌ Error message:", response.error?.message)
        console.error("❌ Full error:", JSON.stringify(response.error, null, 2))

        Toast.show({
          type: "error",
          text1: "Error de autenticación",
          text2: response.error?.message || "No se pudo conectar con Google",
        })
      } else if (response?.type === "cancel") {
        console.log("⚠️ Google OAuth cancelled by user")
        Toast.show({
          type: "info",
          text1: "Autenticación cancelada",
          text2: "Has cancelado el inicio de sesión con Google",
        })
      } else if (response?.type === "dismiss") {
        console.log("⚠️ Google OAuth dismissed")
        // No mostrar toast para dismiss, es normal
      } else if (response) {
        console.log("🔍 Unknown response type:", response.type)
        console.log("🔍 Full response:", JSON.stringify(response, null, 2))
      }
    }

    if (response) {
      handleGoogleResponse()
    }
  }, [response, auth])

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoggingIn(true)
      if (auth) {
        await auth.login(data.email, data.password)
      } else {
        throw new Error("El contexto de autenticación no está disponible")
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Error al iniciar sesión",
        text2: e?.response?.data?.detail ?? e?.message ?? "Algo salió mal",
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      console.log("🚀 Starting Google Sign-In...")
      console.log("📋 Request ready:", !!request)
      console.log("🔧 Using redirect URI:", redirectUri)

      if (!request) {
        console.error("❌ Google request not ready")
        Toast.show({
          type: "error",
          text1: "Error de configuración",
          text2: "Google Sign-In no está configurado correctamente",
        })
        return
      }

      console.log("📱 Prompting Google Auth...")
      const result = await promptAsync()
      console.log("📋 Google Auth Result:", JSON.stringify(result, null, 2))
    } catch (error) {
      console.error("❌ Error starting Google Sign-In:", error)
      Toast.show({
        type: "error",
        text1: "Error al iniciar sesión",
        text2: "No se pudo iniciar el proceso de autenticación con Google",
      })
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
          <Image source={require("@/assets/images/logo.png")} style={[styles.image, localStyles.logo]} />
          <Text style={localStyles.welcomeText}>¡Bienvenido de nuevo!</Text>
        </Animated.View>

        <View style={styles.form}>
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

          <Link style={localStyles.forgotPassword} href="/(login)/forgot-password">
            ¿Olvidaste tu contraseña?
          </Link>

          <TouchableOpacity
            style={[styles.button, localStyles.button, (!isValid || isLoggingIn) && localStyles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isLoggingIn}
          >
            {isLoggingIn ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <View style={localStyles.dividerContainer}>
            <View style={localStyles.divider} />
            <Text style={localStyles.dividerText}>O continúa con</Text>
            <View style={localStyles.divider} />
          </View>

          <TouchableOpacity
            style={[localStyles.googleButton, (!request || isLoggingIn) && localStyles.googleButtonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={!request || isLoggingIn}
          >
            {isLoggingIn ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <>
                <Image
                  source={require("@/assets/images/google-logo.png")}
                  style={localStyles.googleIcon}
                  resizeMode="contain"
                />
                <Text style={localStyles.googleButtonText}>Continuar con Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={localStyles.registerContainer}>
            <Text style={localStyles.registerText}>¿No tienes una cuenta?</Text>
            <Link style={localStyles.registerLink} href="/(login)/register">
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
})
