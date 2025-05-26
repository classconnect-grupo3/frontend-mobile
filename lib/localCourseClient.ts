import axios from "axios";

// on localhost:9090
// 192.168.0.88
export const localCourseClient = axios.create({
  baseURL: "http://192.168.0.88:9090",
  headers: {
    "Content-Type": "application/json",
  },
});
