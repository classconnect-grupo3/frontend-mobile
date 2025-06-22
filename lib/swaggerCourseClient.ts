import axios from "axios";

export const swaggerCourseClient = axios.create({
  baseURL: "courses-service-production.up.railway.app",
  headers: {
    "Content-Type": "application/json",
  },
});
