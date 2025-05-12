import axios from "axios";

export const courseClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_COURSES_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
