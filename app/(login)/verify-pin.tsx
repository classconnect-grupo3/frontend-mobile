"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useAuth } from "@/contexts/sessionAuth"
import Toast from "react-native-toast-message"
import { MaterialIcons } from "@expo/vector-icons"
// Importamos el verificador de reCAPTCHA de Firebase para Expo
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha"
import { fbApp } from "@/firebaseConfig"
import React from "react"

export default function VerifyPinScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<any>()
  const auth = useAuth()
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null)

  const [phoneNumber, setPhoneNumber] = useState("")
  const [isPhoneSubmitted, setIsPhoneSubmitted] = useState(false)
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [pin, setPin] = useState(Array(6).fill(""))
  const pinInputs = useRef<(TextInput | null)[]>([])

  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [timer, setTimer] = useState(600) // 10 minutes in seconds

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPhoneSubmitted && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPhoneSubmitted, timer])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendCooldown])

  const handleSendPin = async () => {
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      Toast.show({
        type: "error",
        text1: "Número inválido",
        text2: "Usa el formato internacional (ej: +5491122334455).",
      })
      return
    }
    setLoading(true)
    try {
      if (auth && recaptchaVerifier.current) {
        const newVerificationId = await auth.sendVerificationPin(phoneNumber, recaptchaVerifier.current)
        setVerificationId(newVerificationId)
        setIsPhoneSubmitted(true)
        setTimer(600) // Reset timer
        setResendCooldown(60) // 60 seconds cooldown
        Toast.show({
          type: "success",
          text1: "PIN Enviado",
          text2: `Se envió un PIN a ${phoneNumber}`,
        })
      }
    //  if (auth ) {
    //     const newVerificationId = await auth.sendVerificationPin(phoneNumber, null)
    //     setVerificationId(newVerificationId)
    //     setIsPhoneSubmitted(true)
    //     setTimer(600) // Reset timer
    //     setResendCooldown(60) // 60 seconds cooldown
    //     Toast.show({
    //       type: "success",
    //       text1: "PIN Enviado",
    //       text2: `Se envió un PIN a ${phoneNumber}`,
    //     })
    //   }
    } catch (error: any) {
      console.error("Error sending PIN:", error)
      Toast.show({
        type: "error",
        text1: "Error al enviar PIN",
        text2: error.message || "No se pudo enviar el PIN. Intenta de nuevo.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPin = async () => {
    const enteredPin = pin.join("")
    if (enteredPin.length !== 6) {
      Toast.show({ type: "error", text1: "PIN incompleto" })
      return
    }
    if (!verificationId) {
      Toast.show({ type: "error", text1: "Error", text2: "ID de verificación no encontrado." })
      return
    }
    if (timer === 0) {
      Toast.show({ type: "error", text1: "PIN Expirado", text2: "Por favor, solicita un nuevo PIN." })
      return
    }

    setLoading(true)
    try {
      if (auth) {
        await auth.verifyPinAndCompleteRegistration(verificationId, enteredPin, params)
        Toast.show({
          type: "success",
          text1: "¡Registro Completo!",
          text2: "Tu cuenta ha sido activada.",
        })
        // El contexto se encargará de la redirección
      }
    } catch (error: any) {
      console.error("Error verifying PIN:", error)
      Toast.show({
        type: "error",
        text1: "PIN Inválido",
        text2: error.message || "El PIN es incorrecto o ha expirado.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePinChange = (text: string, index: number) => {
    const newPin = [...pin]
    newPin[index] = text
    setPin(newPin)

    if (text && index < 5) {
      pinInputs.current[index + 1]?.focus()
    }
  }

  const handleBackspace = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!pin[index] && index > 0) {
        pinInputs.current[index - 1]?.focus()
      }
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={fbApp.options}
          title="Verificación"
          cancelLabel="Cancelar"
        />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.title}>Verificación de Cuenta</Text>

        {!isPhoneSubmitted ? (
          <>
            <Text style={styles.subtitle}>Ingresa tu número de teléfono para enviarte un PIN de verificación.</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ej: +5491122334455"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoComplete="tel"
                placeholderTextColor="#999"
              />
            </View>
            <TouchableOpacity
              style={[styles.button, (loading || !phoneNumber) && styles.buttonDisabled]}
              onPress={handleSendPin}
              disabled={loading || !phoneNumber}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar PIN</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>Ingresa el PIN de 6 dígitos que enviamos a {phoneNumber}.</Text>
            <Text style={styles.timerText}>El PIN expira en: {formatTime(timer)}</Text>
            <View style={styles.pinContainer}>
              {pin.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (pinInputs.current[index] = ref)}
                  style={styles.pinInput}
                  value={digit}
                  onChangeText={(text) => handlePinChange(text, index)}
                  onKeyPress={(e) => handleBackspace(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                />
              ))}
            </View>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyPin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verificar y Registrar</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resendButton, resendCooldown > 0 && styles.buttonDisabled]}
              onPress={handleSendPin}
              disabled={resendCooldown > 0}
            >
              <Text style={styles.resendButtonText}>
                {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : "Reenviar PIN"}
              </Text>
            </TouchableOpacity>
          </>
        )}
        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    color: "#333",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingVertical: 16,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  pinInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#f5f5f5",
    color: "#333",
  },
  timerText: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 16,
    color: "#E53E3E",
    fontWeight: "600",
  },
  resendButton: {
    marginTop: 24,
    alignItems: "center",
  },
  resendButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
})
