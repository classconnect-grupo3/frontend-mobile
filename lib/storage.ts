import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export async function setItemAsync(key: string, value: string) {
  if (Platform.OS === "web") {
    try {
      return localStorage.setItem(key, value);
    } catch (e) {
      console.error("Local storage is unavailable:", e);
      throw e;
    }
  } else {
    return await SecureStore.setItemAsync(key, value);
  }
}

export async function deleteItemAsync(key: string) {
  if (Platform.OS === "web") {
    try {
      return localStorage.removeItem(key);
    } catch (e) {
      console.error("Local storage is unavailable:", e);
      throw e;
    }
  } else {
    return await SecureStore.deleteItemAsync(key);
  }
}

export async function getItemAsync(key: string) {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.error("Local storage is unavailable:", e);
      throw e;
    }
  }
  return await SecureStore.getItemAsync(key);
}
