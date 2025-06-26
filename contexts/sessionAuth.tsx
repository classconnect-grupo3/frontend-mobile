"use client"

import React from "react"
import { useContext, createContext, type PropsWithChildren, useState, useEffect } from "react"
import { client } from "@/lib/http"
import { router } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { fetchProfileImage } from "@/firebaseConfig"
import axios from "axios"

type AuthState = {
  token: string | null
  authenticated: boolean
  location: string | null
  user: {
    id: string
    name: string
    surname: string
    profilePicUrl: string | null
  } | null
}

interface AuthContextType {
  authState: AuthState
  register: (name: string, surname: string, email: string, password: string) => Promise<any>
  login: (email: string, password: string) => Promise<any>
  loginWithGoogle(
    idToken: string, 
    userInfo: {
      uid: string
      name: string
      surname: string
      profilePicUrl: string | null
    }): Promise<any>
  logout: () => Promise<any>
  fetchUser: (token: string) => Promise<any>
  setProfilePicUrl: (url: string | null) => void
}

const TOKEN_KEY = "session"
const USER_ID_KEY = "user_id"
const USER_LOCATION_KEY = "user_location"
const USER_NAME_KEY = "user_name"
const USER_SURNAME_KEY = "user_surname"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    authenticated: false,
    location: null,
    user: null,
  })

  const fetchUser = async (token: string) => {
    try {
      const { data } = await client.get("/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("User data fetched:", data)

      const url = await fetchProfileImage(data.data.uid)

      const user = {
        id: data.data.uid,
        name: data.data.name,
        surname: data.data.surname,
        profilePicUrl: url,
      }

      console.log("User data for saved in fetchUser:", user)

      return user
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", {
          message: error.message,
          code: error.code,
          responseData: error.response?.data,
          responseStatus: error.response?.status,
          headers: error.response?.headers,
        })
      } else {
        console.error("Unexpected login error:", error)
      }
      throw error
    }
  }

  const setProfilePicUrl = (url: string | null) => {
    setAuthState((prevState) => {
      if (!prevState.user) return prevState
      return {
        ...prevState,
        user: {
          id: prevState.user.id,
          name: prevState.user.name,
          surname: prevState.user.surname,
          profilePicUrl: url,
        },
      }
    })
  }

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY)
        if (!token) return

        const user = await fetchUser(token)
        if (!user) {
          console.warn("❌ Invalid or expired token, logging out")
          await SecureStore.deleteItemAsync(TOKEN_KEY)
          return
        }

        client.defaults.headers.common["Authorization"] = `Bearer ${token}`

        const location = await SecureStore.getItemAsync(USER_LOCATION_KEY)

        console.log("TOKEN: ", token)
        console.log("USER: ", user)

        setAuthState({
          token,
          authenticated: true,
          user,
          location: location ?? null,
        })
      } catch (e) {
        console.error("Error loading auth state from SecureStore", e)
      }
    }

    loadToken()
  }, [])

  const register = async (name: string, surname: string, email: string, password: string) => {
    await client.post(`/register`, { email, password, name, surname })
    router.replace("/(login)")
  }

  const login = async (email: string, password: string) => {
    try {
      const { data } = await client.post("/login/email", { email, password })
      console.log("Login data: ", data)
      const token = data.id_token
      const user_info = data.user_info
      const url = await fetchProfileImage(user_info.uid)
      const user = {
        id: user_info.uid,
        name: user_info.name,
        surname: user_info.surname,
        profilePicUrl: url,
      }
      const location = "pending"

      await SecureStore.setItemAsync(TOKEN_KEY, token)
      await SecureStore.setItemAsync(USER_ID_KEY, user.id)
      await SecureStore.setItemAsync(USER_NAME_KEY, user.name)
      await SecureStore.setItemAsync(USER_SURNAME_KEY, user.surname)

      client.defaults.headers.common["Authorization"] = `Bearer ${token}`

      console.log("User data for saved in login:", user)

      setAuthState({ token, authenticated: true, location, user })

      router.replace("/(tabs)")
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", {
          message: error.message,
          code: error.code,
          responseData: error.response?.data,
          responseStatus: error.response?.status,
          headers: error.response?.headers,
        })
      } else {
        console.error("Unexpected login error:", error)
      }
      throw error
    }
  }

  const loginWithGoogle = async (
    idToken: string,
    userInfo: {
      uid: string,
      name: string
      surname: string
      profilePicUrl: string
    }) => {
    try {
      console.log("🔐 Starting Google login with token:", idToken.substring(0, 50) + "...")

      const { data } = await client.post("/login/google", {
        id_token: idToken,
      })

      console.log("✅ Google Login response:", data)

      const token = data.id_token

      const user = {
        id: userInfo.uid,
        name: userInfo.name,
        surname: userInfo.surname,
        profilePicUrl: userInfo.profilePicUrl,
      }

      // Store authentication data
      await SecureStore.setItemAsync(TOKEN_KEY, token)
      await SecureStore.setItemAsync(USER_ID_KEY, user.id)
      await SecureStore.setItemAsync(USER_NAME_KEY, user.name)
      await SecureStore.setItemAsync(USER_SURNAME_KEY, user.surname)
      //if (location) {
      //  await SecureStore.setItemAsync(USER_LOCATION_KEY, location)
      //}

      client.defaults.headers.common["Authorization"] = `Bearer ${token}`

      setAuthState({
        token,
        authenticated: true,
        location: "todo",
        user,
      })

      console.log("🎉 Google login successful, redirecting to tabs")
      router.replace("/(tabs)")
    } catch (error) {
      console.error("❌ Google login error:", error)
      if (axios.isAxiosError(error)) {
        console.error("Google login axios error:", {
          message: error.message,
          code: error.code,
          responseData: error.response?.data,
          responseStatus: error.response?.status,
        })
      }
      throw error
    }
  }

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    client.defaults.headers.common["Authorization"] = ""

    setAuthState({ token: null, authenticated: false, location: null, user: null })
    router.replace("/(login)")
  }

  const value = {
    authState,
    register,
    login,
    loginWithGoogle,
    logout,
    fetchUser,
    setProfilePicUrl,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
