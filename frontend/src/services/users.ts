// src/api/users.tsx
import { api } from "./base";
import type { ResponseMessage } from "./base";

// Types
export interface User {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  profile_picture?: string | null;
}

// AuthService object
export const AuthService = {
  login: async (email: string, password: string): Promise<ResponseMessage> => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },

  logout: async (): Promise<ResponseMessage> => {
    const res = await api.post("/auth/logout");
    return res.data;
  },

  generateOtp: async (email: string): Promise<ResponseMessage> => {
    const res = await api.post("/auth/otp/generate", null, { params: { email } });
    return res.data;
  },

  verifyOtp: async (email: string, code: string, password: string): Promise<ResponseMessage> => {
    const res = await api.post("/auth/otp/verify", null, { params: { email, code, password } });
    return res.data;
  },

  getCurrentUser: async (): Promise<ResponseMessage<User>> => {
    const res = await api.get("/auth/me");
    return res.data;
  },

  updateProfilePicture: async (file: File): Promise<ResponseMessage> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/auth/me/profile-picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};
