"use client"

import React from "react"
import { useState } from "react"
import { TouchableOpacity, Text, Image, ActivityIndicator } from "react-native"
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin"
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth"
import { auth } from "@/firebaseConfig"
import { useAuth } from "@/contexts/sessionAuth"
import Toast from "react-native-toast-message"
import { ButtonStyles, Typography } from "@/styles/shared"

interface GoogleSignInButtonProps {
  onPress?: () => void
  disabled?: boolean
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onPress, disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false)
  const authContext = useAuth()

  const configureGoogleSignIn = () => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      scopes: ["openid", "profile", "email"],
      offlineAccess: true,
    })
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      onPress?.()

      // Configure Google Sign-In
      configureGoogleSignIn()

      // Check if device supports Google Play Services (Android only)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      })

      // Sign out any existing user first to ensure clean state
      await GoogleSignin.signOut()

      // Perform sign-in
      const result = await GoogleSignin.signIn()
      const { data } = result
      console.log("Google Sign-In data:", data?.user)

      // Get the ID token from the result
      const tokens = await GoogleSignin.getTokens()

      if (!tokens.idToken) {
        throw new Error("No se pudo obtener el token de Google")
      }

      console.log("Google ID Token obtained:", tokens.idToken.substring(0, 50) + "...")

      // Create Firebase credential with Google tokens
      const credential = GoogleAuthProvider.credential(tokens.idToken, tokens.accessToken)

      // Sign in to Firebase with the credential
      const firebaseResult = await signInWithCredential(auth, credential)

      // Get Firebase ID token (this is what your backend expects)
      const firebaseIdToken = await firebaseResult.user.getIdToken()

      console.log("Firebase ID Token obtained:", firebaseIdToken.substring(0, 50) + "...")

      // Send Firebase ID token to your backend
      if (authContext) {
        await authContext.loginWithGoogle(firebaseIdToken, {
            uid: data?.user.id ?? "",
            name: data?.user.givenName ?? "",
            surname: data?.user.familyName ?? "",
            profilePicUrl: data?.user.photo ?? "",
        })
        Toast.show({
          type: "success",
          text1: "Inicio de sesión exitoso",
          text2: "Bienvenido a ClassConnect",
        })
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error)

      let errorMessage = "Error al iniciar sesión con Google"

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = "Inicio de sesión cancelado"
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = "Inicio de sesión en progreso"
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = "Google Play Services no disponible"
      } else if (error.code === statusCodes.SIGN_IN_REQUIRED) {
        errorMessage = "Se requiere iniciar sesión"
      } else if (error.message) {
        errorMessage = error.message
      }

      Toast.show({
        type: "error",
        text1: "Error de autenticación",
        text2: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TouchableOpacity
      style={[
        ButtonStyles.outline,
        ButtonStyles.large,
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
          borderColor: "#dadce0",
          borderWidth: 1,
        },
        disabled && { opacity: 0.6 },
      ]}
      onPress={handleGoogleSignIn}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#4285f4" />
      ) : (
        <>
          <Image
            source={require("@/assets/images/google-logo.png")}
            style={{ width: 20, height: 20, marginRight: 12 }}
            resizeMode="contain"
          />
          <Text style={[Typography.body1, { color: "#3c4043", fontWeight: "500" }]}>
            Continuar con Google
          </Text>
        </>
      )}
    </TouchableOpacity>
  )
}
