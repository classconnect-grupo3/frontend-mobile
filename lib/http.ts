import axios from "axios";

export const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_COURSES_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// https://axios-http.com/docs/interceptors
//
// client.interceptors.request.use(
//   (config) => {
//     return config;
//   },
//   (error) => Promise.reject(error)
// );
