// src/api/index.ts
import axios from "axios";

const isSameAsBackend = import.meta.env.VITE_IS_SAME_AS_BACKEND === "true";

export const backendUrl = isSameAsBackend
  ? window.location.origin
  : `${import.meta.env.VITE_BACKEND_PROTOCOL}://${import.meta.env.VITE_BACKEND_HOST}:${import.meta.env.VITE_BACKEND_PORT}`;

export const api = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
});

// Prepend '/api' automatically if not already present
api.interceptors.request.use(
  (config) => {
    if (config.url && !config.url.startsWith("/api")) {
      config.url = `/api${config.url}`;
    }
    console.log("Sending request:", config.method, config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export interface ResponseMessage<T = any> {
  status: string;
  message: string;
  data: T;
}