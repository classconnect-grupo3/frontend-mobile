import axios from "axios";

export const railwayClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_USERS_RAILWAY_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
